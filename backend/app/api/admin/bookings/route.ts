import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services, bookingBlockouts } from "@/db/schema";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";
import { logAudit } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

const ADMIN_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

/** GET /api/admin/bookings?date=&from=&to=&status= */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const filters = [];
    if (date) filters.push(eq(bookings.bookingDate, date));
    if (from) filters.push(gte(bookings.bookingDate, from));
    if (to) filters.push(lte(bookings.bookingDate, to));
    if (status && status !== "all") filters.push(eq(bookings.status, status));

    const rows = await db
      .select({
        booking: bookings,
        serviceName: services.name,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(bookings.bookingDate), asc(bookings.slotTime))
      .limit(200);

    const blockouts = await db.select().from(bookingBlockouts).orderBy(asc(bookingBlockouts.date));

    return NextResponse.json({
      bookings: rows.map((r) => ({ ...r.booking, serviceName: r.serviceName })),
      blockouts,
    });
  } catch (error) {
    console.error("Admin bookings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

/** PATCH /api/admin/bookings — status transitions + admin notes */
export async function PATCH(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const { id, action, adminNotes } = body;
    if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (action === "note") {
      await db.update(bookings).set({ adminNotes, updatedAt: new Date() }).where(eq(bookings.id, id));
      return NextResponse.json({ success: true });
    }

    const map: Record<string, string> = {
      confirm: "confirmed",
      complete: "completed",
      cancel: "cancelled",
      no_show: "no_show",
    };
    const newStatus = map[action];
    if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    if (!ADMIN_TRANSITIONS[booking.status]?.includes(newStatus)) {
      return NextResponse.json({ error: `Cannot move from ${booking.status} to ${newStatus}` }, { status: 400 });
    }

    await db
      .update(bookings)
      .set({
        status: newStatus,
        adminNotes: adminNotes ?? booking.adminNotes,
        cancelledAt: newStatus === "cancelled" ? new Date() : null,
        cancelReason: newStatus === "cancelled" ? "Cancelled by shop" : booking.cancelReason,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id));

    if (booking.userId) {
      const messages: Record<string, { title: string; body: string }> = {
        confirmed: { title: "Booking confirmed ✅", body: `Your ${booking.bookingRef} appointment on ${booking.bookingDate} at ${booking.slotTime} is confirmed. See you soon!` },
        completed: { title: "Visit completed", body: `Thanks for visiting! Your ${booking.bookingRef} appointment is complete. We'd love your feedback.` },
        cancelled: { title: "Booking cancelled", body: `Your booking ${booking.bookingRef} on ${booking.bookingDate} was cancelled by the shop. Contact us to reschedule.` },
        no_show: { title: "Missed appointment", body: `We marked booking ${booking.bookingRef} as missed. Contact us if this is a mistake.` },
      };
      const msg = messages[action];
      if (msg) {
        await createNotification({ userId: booking.userId, type: "booking", ...msg, link: "/account/bookings" });
      }
    }

    await logAudit(adminId, `booking.${action}`, "booking", id, { from: booking.status, to: newStatus });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin bookings PATCH error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

/** POST /api/admin/bookings — block dates/slots */
export async function POST(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const { date, slotTime, reason } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Valid date required" }, { status: 400 });
    }

    const [blockout] = await db
      .insert(bookingBlockouts)
      .values({ date, slotTime: slotTime || null, reason: reason || null })
      .returning();

    await logAudit(adminId, "booking.blockout", "blockout", blockout.id, { date, slotTime });
    return NextResponse.json({ blockout }, { status: 201 });
  } catch (error) {
    console.error("Blockout POST error:", error);
    return NextResponse.json({ error: "Failed to create blockout" }, { status: 500 });
  }
}

/** DELETE /api/admin/bookings?blockoutId= — remove a blockout */
export async function DELETE(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const { searchParams } = new URL(request.url);
    const blockoutId = parseInt(searchParams.get("blockoutId") || "");
    if (!blockoutId) return NextResponse.json({ error: "blockoutId required" }, { status: 400 });

    await db.delete(bookingBlockouts).where(eq(bookingBlockouts.id, blockoutId));
    await logAudit(adminId, "booking.unblock", "blockout", blockoutId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blockout DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove blockout" }, { status: 500 });
  }
}
