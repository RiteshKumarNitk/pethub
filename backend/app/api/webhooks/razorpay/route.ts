import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { orders, orderItems, products, productVariants, coupons, payments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";
import { earnForOrder } from "@/lib/loyalty";

/**
 * Razorpay webhook — source of truth for payment events.
 * Configure in Razorpay dashboard: event `payment.captured` (and optionally `payment.failed`).
 * Set WEBHOOK_SECRET in env; Razorpay sends X-Razorpay-Signature (HMAC-SHA256 of raw body).
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const raw = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!secret || !signature) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(raw);
    const entity = event?.payload?.payment?.entity;
    if (!entity) return NextResponse.json({ ok: true });

    const rzpOrderId = entity.order_id;
    const paymentId = entity.id;
    const [order] = rzpOrderId
      ? await db.select().from(orders).where(eq(orders.razorpayOrderId, rzpOrderId)).limit(1)
      : [];

    if (event.event === "payment.captured" && order) {
      if (order.paymentStatus !== "paid") {
        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({ razorpayPaymentId: paymentId, status: "captured", raw: event, updatedAt: new Date() })
            .where(eq(payments.razorpayOrderId, rzpOrderId));
          await tx
            .update(orders)
            .set({ status: "paid", paymentStatus: "paid", updatedAt: new Date() })
            .where(eq(orders.id, order.id));

          const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
          for (const it of items) {
            if (it.variantId) {
              await tx.update(productVariants)
                .set({ stock: sql`GREATEST(${productVariants.stock} - ${it.qty}, 0)` })
                .where(eq(productVariants.id, it.variantId));
            } else if (it.productId) {
              await tx.update(products)
                .set({ stock: sql`GREATEST(${products.stock} - ${it.qty}, 0)` })
                .where(eq(products.id, it.productId));
            }
          }
          if (order.couponId) {
            await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, order.couponId));
          }
        });

        if (order.userId) {
          await createNotification({
            userId: order.userId,
            type: "order",
            title: "Payment confirmed",
            body: `Payment for order ${order.orderNumber} was successful.`,
            link: "/account/orders",
          });
        }
        // Award loyalty points for the paid order (idempotent, non-fatal)
        await earnForOrder(order.id);
      }
    } else if (event.event === "payment.failed" && order) {
      await db.update(payments).set({ status: "failed", raw: event, updatedAt: new Date() })
        .where(eq(payments.razorpayOrderId, rzpOrderId));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
