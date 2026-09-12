import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { logAudit } from "@/lib/utils";

/** GET /api/admin/reviews?status= */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const rows = await db
      .select({
        review: reviews,
        userName: users.name,
        userPhone: users.phone,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(status && status !== "all" ? eq(reviews.status, status) : undefined)
      .orderBy(desc(reviews.createdAt))
      .limit(200);

    return NextResponse.json({
      reviews: rows.map((r) => ({ ...r.review, userName: r.userName, userPhone: r.userPhone })),
    });
  } catch (error) {
    console.error("Admin reviews GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

/** PATCH /api/admin/reviews — approve/reject */
export async function PATCH(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const { id, status } = await request.json();
    if (!id || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Valid id and status required" }, { status: 400 });
    }

    await db.update(reviews).set({ status }).where(eq(reviews.id, id));
    await logAudit(adminId, `review.${status}`, "review", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin reviews PATCH error:", error);
    return NextResponse.json({ error: "Failed to moderate review" }, { status: 500 });
  }
}
