import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, bookingBlockouts } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getSettings } from "@/lib/settings";

/**
 * GET /api/bookings/slots?date=YYYY-MM-DD&serviceId=1&bookingId=123
 * Returns available slot times for a date, computed from:
 *   store working hours + slot length (settings)
 *   − blockouts (full-day or per-slot)
 *   − already-booked slots (excludes the booking being rescheduled)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const bookingId = parseInt(searchParams.get("bookingId") || "0") || null;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Valid date is required (YYYY-MM-DD)" }, { status: 400 });
    }

    const settings = await getSettings();

    // Closed on this weekday?
    const dayOfWeek = new Date(date + "T00:00:00").getDay();
    if (!settings.bookingOpenDays.includes(dayOfWeek)) {
      return NextResponse.json({ date, slots: [], closed: true, reason: "We're closed on this day" });
    }

    // Full-day blockout?
    const blockouts = await db
      .select()
      .from(bookingBlockouts)
      .where(eq(bookingBlockouts.date, date));
    if (blockouts.some((b) => b.slotTime === null)) {
      return NextResponse.json({ date, slots: [], closed: true, reason: blockouts.find((b) => b.slotTime === null)?.reason || "Closed on this date" });
    }

    // Generate slot grid
    const toMinutes = (hhmm: string) => parseInt(hhmm.split(":")[0]) * 60 + parseInt(hhmm.split(":")[1] || "0");
    const slotLen = settings.bookingSlotMinutes;
    const open = toMinutes(settings.bookingOpenTime);
    const close = toMinutes(settings.bookingCloseTime);

    const allSlots: string[] = [];
    for (let t = open; t + slotLen <= close; t += slotLen) {
      allSlots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
    }

    // Booked slots for this date
    const takenRows = await db
      .select({ slotTime: bookings.slotTime })
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingDate, date),
          ne(bookings.status, "cancelled"),
          bookingId ? ne(bookings.id, bookingId) : undefined
        )
      );
    const taken = new Set(takenRows.map((r) => String(r.slotTime).slice(0, 5)));
    const blockedSlots = new Set(
      blockouts.filter((b) => b.slotTime !== null).map((b) => String(b.slotTime).slice(0, 5))
    );

    const now = new Date();
    const minLeadMs = settings.bookingMinLeadHours * 60 * 60 * 1000;

    const slots = allSlots.map((time) => {
      const slotDateTime = new Date(`${date}T${time}:00`);
      const isPast = slotDateTime.getTime() < now.getTime() + minLeadMs;
      return {
        time,
        available: !taken.has(time) && !blockedSlots.has(time) && !isPast,
        reason: taken.has(time) ? "Booked" : blockedSlots.has(time) ? "Unavailable" : isPast ? "Too close" : null,
      };
    });

    return NextResponse.json({
      date,
      slots,
      openTime: settings.bookingOpenTime,
      closeTime: settings.bookingCloseTime,
    });
  } catch (error) {
    console.error("Slots error:", error);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}
