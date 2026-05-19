import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addressId = parseInt(id);
    const userId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();

    const existing = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(addresses)
      .set({
        label: body.label,
        street: body.street,
        city: body.city,
        state: body.state,
        zip: body.zip,
      })
      .where(eq(addresses.id, addressId))
      .returning();

    return NextResponse.json({ address: updated });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addressId = parseInt(id);

    await db.delete(addresses).where(eq(addresses.id, addressId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
