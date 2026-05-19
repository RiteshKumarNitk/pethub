import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price.toString();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.active !== undefined) updateData.active = body.active;

    const [updated] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("Admin Products PUT error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Products DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
