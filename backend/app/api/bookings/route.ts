import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services, pets, bookingBlockouts } from "@/db/schema";
import { eq, and, ne, desc, or } from "drizzle-orm";
import { bookingRef, round2, isValidPhone, logAudit } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"];

/** GET /api/bookings — the signed-in customer's bookings */
export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select({
        booking: bookings,
        serviceName: services.name,
        serviceSlug: services.slug,
        serviceImage: services.imageUrl,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.bookingDate), desc(bookings.slotTime));

    return NextResponse.json({
      bookings: rows.map((r) => ({
        ...r.booking,
        serviceName: r.serviceName,
        serviceSlug: r.serviceSlug,
        serviceImage: r.serviceImage,
      })),
    });
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

/**
 * POST /api/bookings
 * Body: { serviceId, date, slotTime, petId?, petName, petSpecies, petBreed?, notes?, customerName, customerPhone }
 * Creates a booking with transactional double-booking prevention.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const body = await request.json();
    const { serviceId, date, slotTime, petId, petName, petSpecies, petBreed, notes, customerName, customerPhone } = body;

    // Validation
    if (!serviceId || !date || !slotTime) {
      return NextResponse.json({ error: "Service, date and time are required" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(slotTime)) {
      return NextResponse.json({ error: "Invalid time format" }, { status: 400 });
    }
    if (!petName || !petSpecies) {
      return NextResponse.json({ error: "Pet name and type are required" }, { status: 400 });
    }
    if (!customerName || !customerPhone || !isValidPhone(String(customerPhone))) {
      return NextResponse.json({ error: "Valid customer name and phone are required" }, { status: 400 });
    }

    const settings = await getSettings();

    // Max advance days
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + settings.bookingMaxAdvanceDays);
    if (new Date(date + "T23:59:59") > maxDate) {
      return NextResponse.json(
        { error: `Bookings open up to ${settings.bookingMaxAdvanceDays} days in advance` },
        { status: 400 }
      );
    }

    // Min lead time
    const slotDateTime = new Date(`${date}T${slotTime}:00`);
    if (slotDateTime.getTime() < Date.now() + settings.bookingMinLeadHours * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: `Please book at least ${settings.bookingMinLeadHours} hours ahead` },
        { status: 400 }
      );
    }

    // Service must exist and be active
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.active, true)))
      .limit(1);
    if (!service) {
      return NextResponse.json({ error: "Service not available" }, { status: 404 });
    }

    // Species supported?
    if (petSpecies && !(service.petTypes as string[]).includes("all") && !(service.petTypes as string[]).includes(petSpecies.toLowerCase().replace(" ", "_"))) {
      return NextResponse.json({ error: `This service doesn't cover ${petSpecies}s` }, { status: 400 });
    }

    // If petId provided, verify ownership
    if (petId && userId) {
      const [pet] = await db
        .select({ id: pets.id })
        .from(pets)
        .where(and(eq(pets.id, petId), eq(pets.userId, userId)))
        .limit(1);
      if (!pet) return NextResponse.json({ error: "Pet not found in your profile" }, { status: 404 });
    }

    // Date/slot not blockout?
    const blockouts = await db
      .select()
      .from(bookingBlockouts)
      .where(eq(bookingBlockouts.date, date));
    if (blockouts.some((b) => b.slotTime === null)) {
      return NextResponse.json({ error: "We're closed on this date" }, { status: 409 });
    }
    if (blockouts.some((b) => b.slotTime && String(b.slotTime).slice(0, 5) === slotTime)) {
      return NextResponse.json({ error: "That time is unavailable" }, { status: 409 });
    }

    // Within working hours?
    const toMinutes = (hhmm: string) => parseInt(hhmm.split(":")[0]) * 60 + parseInt(hhmm.split(":")[1] || "0");
    if (
      toMinutes(slotTime) < toMinutes(settings.bookingOpenTime) ||
      toMinutes(slotTime) + service.durationMinutes > toMinutes(settings.bookingCloseTime)
    ) {
      return NextResponse.json({ error: "Time is outside working hours" }, { status: 400 });
    }

    const amount = round2(parseFloat(service.price));

    // Create booking — double-booking safe: re-check slot inside transaction
    const created = await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.bookingDate, date),
            eq(bookings.slotTime, slotTime),
            ne(bookings.status, "cancelled")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { conflict: true as const };
      }

      const [booking] = await tx
        .insert(bookings)
        .values({
          bookingRef: "TEMP",
          userId,
          serviceId,
          petId: petId || null,
          petName,
          petSpecies,
          petBreed: petBreed || null,
          petNotes: notes || null,
          bookingDate: date,
          slotTime,
          status: "pending",
          customerName,
          customerPhone,
          notes: notes || null,
          amount: amount.toString(),
          paymentStatus: service.requiresDeposit ? "unpaid" : "not_required",
        })
        .returning();

      await tx.update(bookings).set({ bookingRef: bookingRef(booking.id) }).where(eq(bookings.id, booking.id));
      return { conflict: false as const, booking };
    });

    if (created.conflict) {
      return NextResponse.json(
        { error: "Sorry, that slot was just taken. Please choose another time." },
        { status: 409 }
      );
    }

    const booking = created.booking;

    if (userId) {
      await createNotification({
        userId,
        type: "booking",
        title: "Booking requested",
        body: `Your ${service.name} appointment for ${booking.petName} on ${date} at ${slotTime} was received. We'll confirm shortly.`,
        link: "/account/bookings",
      });
    }
    await logAudit(userId, "booking.create", "booking", booking.id, { serviceId, date, slotTime });

    return NextResponse.json(
      {
        booking,
        requiresDeposit: service.requiresDeposit,
        depositAmount: service.depositAmount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
