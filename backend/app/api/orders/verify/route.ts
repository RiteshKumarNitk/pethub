import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, productVariants, coupons, payments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { logAudit } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const body = await request.json();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      await db.update(payments).set({ status: "failed", updatedAt: new Date() })
        .where(eq(payments.razorpayOrderId, razorpay_order_id));
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, razorpay_order_id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ownership check — a signed-in user may only confirm their own order
    if (userId && order.userId !== userId) {
      return NextResponse.json({ error: "You are not allowed to confirm this order" }, { status: 403 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ success: true, alreadyProcessed: true, order });
    }

    // Capture payment + decrement stock + increment coupon usage atomically
    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "captured",
          updatedAt: new Date(),
        })
        .where(eq(payments.razorpayOrderId, razorpay_order_id));

      await tx
        .update(orders)
        .set({ status: "paid", paymentStatus: "paid", updatedAt: new Date() })
        .where(eq(orders.id, order.id));

      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      for (const it of items) {
        if (it.variantId) {
          await tx
            .update(productVariants)
            .set({ stock: sql`GREATEST(${productVariants.stock} - ${it.qty}, 0)` })
            .where(eq(productVariants.id, it.variantId));
        } else if (it.productId) {
          await tx
            .update(products)
            .set({ stock: sql`GREATEST(${products.stock} - ${it.qty}, 0)` })
            .where(eq(products.id, it.productId));
        }
      }

      if (order.couponId) {
        await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(eq(coupons.id, order.couponId));
      }
    });

    if (order.userId) {
      await createNotification({
        userId: order.userId,
        type: "order",
        title: "Payment confirmed",
        body: `Payment for order ${order.orderNumber} was successful. We're preparing your order.`,
        link: "/account/orders",
      });
    }
    await logAudit(userId, "payment.captured", "order", order.id, { razorpay_payment_id });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
