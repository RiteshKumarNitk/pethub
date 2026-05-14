import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, petListings, bookings } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const [totalUsers] = await db.select({ val: count() }).from(users);
    const [totalListings] = await db.select({ val: count() }).from(petListings);
    const [pendingListings] = await db
      .select({ val: count() })
      .from(petListings)
      .where(eq(petListings.isApproved, "false"));
    const [totalBookings] = await db.select({ val: count() }).from(bookings);

    return NextResponse.json({
      totalUsers: totalUsers.val,
      totalListings: totalListings.val,
      pendingListings: pendingListings.val,
      totalBookings: totalBookings.val,
    });
  } catch (error) {
    console.error("Admin Stats GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
