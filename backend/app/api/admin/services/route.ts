import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { slugify, logAudit } from "@/lib/utils";

export async function GET() {
  const rows = await db.select().from(services).orderBy(asc(services.sortOrder), asc(services.name));
  return NextResponse.json({ services: rows });
}

export async function POST(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const {
      name, description, longDescription, imageUrl, durationMinutes, price, priceNote,
      petTypes, depositAmount, requiresDeposit, active, sortOrder,
    } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const [service] = await db
      .insert(services)
      .values({
        slug: `${slugify(name)}-${Date.now().toString(36)}`,
        name,
        description: description || null,
        longDescription: longDescription || null,
        imageUrl: imageUrl || null,
        durationMinutes: parseInt(durationMinutes) || 60,
        price: String(price),
        priceNote: priceNote || null,
        petTypes: Array.isArray(petTypes) && petTypes.length ? petTypes : ["dog", "cat"],
        depositAmount: String(depositAmount || "0"),
        requiresDeposit: !!requiresDeposit,
        active: active !== false,
        sortOrder: parseInt(sortOrder) || 0,
      })
      .returning();

    await logAudit(adminId, "service.create", "service", service.id);
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Service create error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (rest.name !== undefined) patch.name = rest.name;
    if (rest.description !== undefined) patch.description = rest.description;
    if (rest.longDescription !== undefined) patch.longDescription = rest.longDescription;
    if (rest.imageUrl !== undefined) patch.imageUrl = rest.imageUrl;
    if (rest.durationMinutes !== undefined) patch.durationMinutes = parseInt(rest.durationMinutes) || 60;
    if (rest.price !== undefined) patch.price = String(rest.price);
    if (rest.priceNote !== undefined) patch.priceNote = rest.priceNote;
    if (rest.petTypes !== undefined) patch.petTypes = rest.petTypes;
    if (rest.depositAmount !== undefined) patch.depositAmount = String(rest.depositAmount);
    if (rest.requiresDeposit !== undefined) patch.requiresDeposit = !!rest.requiresDeposit;
    if (rest.active !== undefined) patch.active = !!rest.active;
    if (rest.sortOrder !== undefined) patch.sortOrder = parseInt(rest.sortOrder) || 0;

    await db.update(services).set(patch).where(eq(services.id, id));
    await logAudit(adminId, "service.update", "service", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Service update error:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Soft delete — bookings reference services
    await db.update(services).set({ active: false }).where(eq(services.id, id));
    await logAudit(adminId, "service.deactivate", "service", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Service delete error:", error);
    return NextResponse.json({ error: "Failed to deactivate service" }, { status: 500 });
  }
}
