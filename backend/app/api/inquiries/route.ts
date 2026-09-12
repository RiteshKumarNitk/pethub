import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries, inquiryMessages, petListings, products, services } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { isValidPhone } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limiter";

const VALID_TYPES = ["pet", "product", "service", "booking", "general"];

/** GET /api/inquiries — signed-in customer's inquiries */
export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.userId, userId))
      .orderBy(desc(inquiries.createdAt));

    const withMessages = await Promise.all(
      rows.map(async (inq) => {
        const messages = await db
          .select()
          .from(inquiryMessages)
          .where(eq(inquiryMessages.inquiryId, inq.id))
          .orderBy(inquiryMessages.createdAt);
        return { ...inq, messages };
      })
    );

    return NextResponse.json({ inquiries: withMessages });
  } catch (error) {
    console.error("Inquiries GET error:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}

/**
 * POST /api/inquiries — create inquiry (works signed-in or as guest).
 * Body: { type, subject, message, relatedListingId?, relatedProductId?, relatedServiceId?,
 *         contactName?, contactPhone?, contactEmail? }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const body = await request.json();
    const {
      type, subject, message, relatedListingId, relatedProductId, relatedServiceId,
      contactName, contactPhone, contactEmail,
    } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Valid inquiry type is required" }, { status: 400 });
    }
    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message is too long (max 2000 characters)" }, { status: 400 });
    }
    if (contactPhone && !isValidPhone(String(contactPhone))) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Guests must provide contact info
    if (!userId && !contactPhone && !contactEmail) {
      return NextResponse.json({ error: "Please provide a phone number or email" }, { status: 400 });
    }

    const key = `inquiry:${userId ?? request.headers.get("x-forwarded-for") ?? "anon"}`;
    const rl = checkRateLimit(key, 10, 60 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many inquiries. Please try later." }, { status: 429 });
    }

    // Resolve subject context if a related entity is given
    let resolvedSubject = subject;
    if (relatedListingId) {
      const [l] = await db.select({ name: petListings.name }).from(petListings).where(eq(petListings.id, relatedListingId)).limit(1);
      if (l) resolvedSubject = `Enquiry: ${l.name}`;
    } else if (relatedProductId) {
      const [p] = await db.select({ name: products.name }).from(products).where(eq(products.id, relatedProductId)).limit(1);
      if (p) resolvedSubject = `Product enquiry: ${p.name}`;
    } else if (relatedServiceId) {
      const [s] = await db.select({ name: services.name }).from(services).where(eq(services.id, relatedServiceId)).limit(1);
      if (s) resolvedSubject = `Service enquiry: ${s.name}`;
    }

    const [inquiry] = await db
      .insert(inquiries)
      .values({
        userId,
        type,
        subject: resolvedSubject,
        message,
        relatedListingId: relatedListingId || null,
        relatedProductId: relatedProductId || null,
        relatedServiceId: relatedServiceId || null,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        status: "open",
      })
      .returning();

    await db.insert(inquiryMessages).values({
      inquiryId: inquiry.id,
      sender: "customer",
      senderName: contactName || null,
      message,
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error("Inquiry POST error:", error);
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}
