import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetId = parseInt(id);

    const allReviews = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.targetId, targetId))
      .orderBy(desc(reviews.createdAt));

    const avgResult = await db
      .select({
        avg: sql<string>`COALESCE(AVG(${reviews.rating})::numeric, 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.targetId, targetId));

    return NextResponse.json({
      reviews: allReviews,
      averageRating: parseFloat(avgResult[0]?.avg || "0"),
      totalReviews: parseInt(avgResult[0]?.count?.toString() || "0"),
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetId = parseInt(id);
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const [review] = await db
      .insert(reviews)
      .values({
        userId,
        targetType: "product",
        targetId,
        rating,
        comment: comment || null,
      })
      .returning();

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
