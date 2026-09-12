import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listingReports, petListings } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limiter";

const VALID_REASONS = [
  "inappropriate_content",
  "suspected_scam",
  "animal_welfare",
  "prohibited_species",
  "wrong_information",
  "already_sold",
  "other",
];

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const body = await request.json();
    const { listingId, reason, details } = body;

    if (!listingId || !reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "Valid listingId and reason are required" }, { status: 400 });
    }

    const [listing] = await db
      .select({ id: petListings.id })
      .from(petListings)
      .where(eq(petListings.id, listingId))
      .limit(1);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Rate limit: 5 reports per user (or IP-less guest) per hour
    const key = `report:${userId ?? request.headers.get("x-forwarded-for") ?? "anon"}`;
    const rl = checkRateLimit(key, 5, 60 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many reports. Please try later." }, { status: 429 });
    }

    await db.insert(listingReports).values({
      listingId,
      userId,
      reason,
      details: details || null,
    });

    await db
      .update(petListings)
      .set({ reportCount: sql`${petListings.reportCount} + 1` })
      .where(eq(petListings.id, listingId));

    // Auto-suspend when reports exceed threshold (admin still reviews)
    const [updated] = await db
      .select({ reportCount: petListings.reportCount })
      .from(petListings)
      .where(eq(petListings.id, listingId))
      .limit(1);
    if ((updated?.reportCount ?? 0) >= 3) {
      await db
        .update(petListings)
        .set({ status: "suspended" })
        .where(and(eq(petListings.id, listingId), eq(petListings.status, "approved")));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report listing error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
