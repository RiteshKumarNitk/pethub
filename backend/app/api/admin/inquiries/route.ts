import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries, inquiryMessages, users, petListings, products, services } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logAudit } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

/** GET /api/admin/inquiries?status= */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const rows = await db
      .select({
        inquiry: inquiries,
        userName: users.name,
        userPhone: users.phone,
      })
      .from(inquiries)
      .leftJoin(users, eq(inquiries.userId, users.id))
      .where(status && status !== "all" ? eq(inquiries.status, status) : undefined)
      .orderBy(desc(inquiries.createdAt))
      .limit(200);

    const enriched = await Promise.all(
      rows.map(async (r) => {
        const messages = await db
          .select()
          .from(inquiryMessages)
          .where(eq(inquiryMessages.inquiryId, r.inquiry.id))
          .orderBy(inquiryMessages.createdAt);

        // Resolve related entity display name
        let relatedName: string | null = null;
        if (r.inquiry.relatedListingId) {
          const [l] = await db.select({ name: petListings.name }).from(petListings).where(eq(petListings.id, r.inquiry.relatedListingId)).limit(1);
          relatedName = l?.name ?? null;
        } else if (r.inquiry.relatedProductId) {
          const [p] = await db.select({ name: products.name }).from(products).where(eq(products.id, r.inquiry.relatedProductId)).limit(1);
          relatedName = p?.name ?? null;
        } else if (r.inquiry.relatedServiceId) {
          const [s] = await db.select({ name: services.name }).from(services).where(eq(services.id, r.inquiry.relatedServiceId)).limit(1);
          relatedName = s?.name ?? null;
        }

        return {
          ...r.inquiry,
          userName: r.userName,
          userPhone: r.userPhone,
          relatedName,
          messages,
        };
      })
    );

    return NextResponse.json({ inquiries: enriched });
  } catch (error) {
    console.error("Admin inquiries GET error:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}

/** POST /api/admin/inquiries — reply to an inquiry */
export async function POST(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const { inquiryId, message, close } = body;

    if (!inquiryId || !message) {
      return NextResponse.json({ error: "inquiryId and message are required" }, { status: 400 });
    }

    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, inquiryId)).limit(1);
    if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });

    await db.insert(inquiryMessages).values({
      inquiryId,
      sender: "admin",
      senderName: "Shop Team",
      message,
    });

    await db
      .update(inquiries)
      .set({ status: close ? "closed" : "responded", updatedAt: new Date() })
      .where(eq(inquiries.id, inquiryId));

    if (inquiry.userId) {
      await createNotification({
        userId: inquiry.userId,
        type: "inquiry",
        title: "Response to your inquiry",
        body: `We replied to "${inquiry.subject}".`,
        link: "/account",
      });
    }

    await logAudit(adminId, "inquiry.reply", "inquiry", inquiryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin inquiry reply error:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}

/** PATCH /api/admin/inquiries — update status */
export async function PATCH(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const { id, status } = await request.json();
    if (!id || !["open", "responded", "closed"].includes(status)) {
      return NextResponse.json({ error: "Valid id and status required" }, { status: 400 });
    }
    await db.update(inquiries).set({ status, updatedAt: new Date() }).where(eq(inquiries.id, id));
    await logAudit(adminId, "inquiry.status", "inquiry", id, { status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin inquiry status error:", error);
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
