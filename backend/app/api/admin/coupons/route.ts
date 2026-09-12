import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logAudit } from "@/lib/utils";

export async function GET() {
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return NextResponse.json({ coupons: rows });
}

export async function POST(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const { code, description, discountPercent, discountFlat, maxDiscount, minOrderAmount, maxUses, expiresAt } = body;

    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
    const pct = parseInt(discountPercent) || 0;
    const flat = parseFloat(discountFlat) || 0;
    if (pct <= 0 && flat <= 0) {
      return NextResponse.json({ error: "Provide a percentage or flat discount" }, { status: 400 });
    }

    const [coupon] = await db
      .insert(coupons)
      .values({
        code: String(code).toUpperCase().trim(),
        description: description || null,
        discountPercent: pct,
        discountFlat: flat ? String(flat) : "0",
        maxDiscount: maxDiscount ? String(maxDiscount) : null,
        minOrderAmount: String(minOrderAmount || "0"),
        maxUses: parseInt(maxUses) || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      })
      .returning();

    await logAudit(adminId, "coupon.create", "coupon", coupon.id, { code: coupon.code });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }
    console.error("Coupon create error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const { id, active, expiresAt } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (active !== undefined) patch.active = !!active;
    if (expiresAt !== undefined) patch.expiresAt = expiresAt ? new Date(expiresAt) : null;

    await db.update(coupons).set(patch).where(eq(coupons.id, id));
    await logAudit(adminId, "coupon.update", "coupon", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}
