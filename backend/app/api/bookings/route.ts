import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    
    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.userId, userId));
    
    return NextResponse.json({ bookings: userBookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    
    const { petId, service, date, timeSlot, notes } = body;
    
    if (!service || !date || !timeSlot) {
      return NextResponse.json(
        { error: "Service, date, and time slot are required" },
        { status: 400 }
      );
    }
    
    const [newBooking] = await db
      .insert(bookings)
      .values({
        userId,
        petId,
        service,
        date,
        timeSlot,
        notes,
        status: "confirmed",
      })
      .returning();
    
    const shopWhatsApp = process.env.SHOP_WHATSAPP_NUMBER || "919876543210";
    const message = encodeURIComponent(
      `New Booking Request!\n\nService: ${service}\nDate: ${date}\nTime: ${timeSlot}\nNotes: ${notes || "None"}`
    );
    const waDeeplink = `https://wa.me/${shopWhatsApp}?text=${message}`;
    
    return NextResponse.json({
      booking: newBooking,
      whatsappLink: waDeeplink,
    }, { status: 201 });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
