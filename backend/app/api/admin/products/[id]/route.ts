import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

/** PUT /api/admin/products/[id] — field-level update with the tree taxonomy. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();

    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription;
    if (body.price !== undefined) updateData.price = body.price.toString();
    if (body.mrp !== undefined) updateData.mrp = body.mrp ? body.mrp.toString() : null;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId ? parseInt(body.categoryId) : null;
    if (body.brandId !== undefined) updateData.brandId = body.brandId ? parseInt(body.brandId) : null;
    if (body.petType !== undefined) updateData.petType = body.petType;
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock) || 0;
    if (body.storeStock !== undefined) updateData.storeStock = parseInt(body.storeStock) || 0;
    if (body.subscriptionEligible !== undefined) updateData.subscriptionEligible = body.subscriptionEligible === true || body.subscriptionEligible === "true";
    if (body.lifeStages !== undefined) updateData.lifeStages = Array.isArray(body.lifeStages) ? body.lifeStages : [];
    if (body.needSlugs !== undefined) updateData.needSlugs = Array.isArray(body.needSlugs) ? body.needSlugs : [];
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(body.lowStockThreshold) || 5;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isFeatured !== undefined) updateData.isFeatured = !!body.isFeatured;
    if (body.isBestSeller !== undefined) updateData.isBestSeller = !!body.isBestSeller;
    if (body.active !== undefined) updateData.active = !!body.active;

    const [updated] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("Admin Products PUT error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/products/[id] — hard delete when nothing references the
 * product; otherwise deactivate (order history must keep its snapshots).
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    try {
      await db.delete(products).where(eq(products.id, id));
      return NextResponse.json({ success: true, deleted: true });
    } catch (err) {
      if ((err as { code?: string }).code === "23503") {
        await db.update(products).set({ active: false, updatedAt: new Date() }).where(eq(products.id, id));
        return NextResponse.json({ success: true, deleted: false, deactivated: true });
      }
      throw err;
    }
  } catch (error) {
    console.error("Admin Products DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
