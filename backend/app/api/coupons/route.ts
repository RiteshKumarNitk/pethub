import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderTotal } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: "This coupon is no longer active" }, { status: 400 });
    }

    if ((coupon.maxUses ?? 0) > 0 && coupon.usedCount >= (coupon.maxUses ?? 0)) {
      return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
    }

    const minAmount = parseFloat(coupon.minOrderAmount?.toString() || "0");
    const orderAmt = parseFloat(orderTotal || "0");
    if (orderAmt < minAmount) {
      return NextResponse.json({
        error: `Minimum order amount of ₹${minAmount.toLocaleString("en-IN")} required`,
      }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.discountPercent && coupon.discountPercent > 0) {
      discountAmount = Math.round(orderAmt * (coupon.discountPercent / 100) * 100) / 100;
    }
    const flatDiscount = parseFloat(coupon.discountFlat?.toString() || "0");
    if (flatDiscount > 0) {
      discountAmount = flatDiscount;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        discountFlat: parseFloat(coupon.discountFlat?.toString() || "0"),
      },
      discountAmount,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
