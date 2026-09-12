import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logAudit } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

/** DELETE /api/bookings/[id] — customer cancels their own booking */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    const { id } = await params;
    const bookingId = parseInt(id);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (["completed", "cancelled", "no_show"].includes(booking.status)) {
      return NextResponse.json({ error: "This booking can no longer be cancelled" }, { status: 400 });
    }

    await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "Cancelled by customer",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    await createNotification({
      userId,
      type: "booking",
      title: "Booking cancelled",
      body: `Your booking ${booking.bookingRef} was cancelled.`,
      link: "/account/bookings",
    });
    await logAudit(userId, "booking.cancel", "booking", bookingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
