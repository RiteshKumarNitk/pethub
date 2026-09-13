import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders, orderItems, products, productVariants, coupons,
  addresses, carts, cartItems, payments,
} from "@/db/schema";
import { eq, and, desc, count, isNull, sql } from "drizzle-orm";
import { createRazorpayOrder } from "@/lib/razorpay";
import { computeTotals, orderNumber, round2, logAudit } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { createNotification } from "@/lib/notifications";
import { getBalance, validateRedemption, recordRedemption, reverseRedemption } from "@/lib/loyalty";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const [totalResult] = await db
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.userId, userId));

    const total = totalResult?.total ?? 0;

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * Body: { addressId?, address? {…}, couponCode?, notes? }
 * Reads the server-side cart, recomputes ALL totals server-side, creates the order
 * and a Razorpay order. Stock is validated but decremented only after payment capture.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const body = await request.json();
    const { addressId, address: inlineAddress, couponCode, notes, loyaltyPointsToRedeem } = body;

    // 1. Resolve cart (user cart, or guest cart via cart_token cookie)
    let cart: typeof carts.$inferSelect | undefined;
    if (userId) {
      [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    }
    if (!cart) {
      const guestToken = request.cookies.get("cart_token")?.value;
      if (guestToken) {
        [cart] = await db.select().from(carts).where(eq(carts.guestToken, guestToken)).limit(1);
      }
    }
    if (!cart) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        qty: cartItems.qty,
        name: products.name,
        imageUrl: products.imageUrl,
        price: products.price,
        active: products.active,
        variantName: productVariants.name,
        variantPriceDelta: productVariants.priceDelta,
        variantStock: productVariants.stock,
        stock: products.stock,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cart.id));

    const validItems = items.filter((it) => it.active && it.qty > 0);
    if (validItems.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    // 2. Validate stock before creating order
    for (const it of validItems) {
      const stock = it.variantId ? (it.variantStock ?? 0) : it.stock;
      if (stock < it.qty) {
        return NextResponse.json(
          { error: `Only ${stock} left of "${it.name}". Please update your cart.` },
          { status: 409 }
        );
      }
    }

    // 3. Address (saved address or inline)
    let shippingAddress: {
      fullName?: string; phone?: string; label?: string; street: string; landmark?: string;
      city: string; state: string; zip: string;
    } | null = null;

    if (addressId && userId) {
      const [addr] = await db
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
        .limit(1);
      if (!addr) return NextResponse.json({ error: "Address not found" }, { status: 404 });
      shippingAddress = {
        fullName: addr.fullName || undefined, phone: addr.phone || undefined, label: addr.label,
        street: addr.street, landmark: addr.landmark || undefined, city: addr.city, state: addr.state, zip: addr.zip,
      };
    } else if (inlineAddress?.street && inlineAddress?.city && inlineAddress?.state && inlineAddress?.zip) {
      shippingAddress = inlineAddress;
    }
    if (!shippingAddress) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    // 4. Compute totals server-side (coupon validated here, never trusted from client)
    const subtotal = round2(
      validItems.reduce(
        (s, it) => s + (parseFloat(it.price) + parseFloat(it.variantPriceDelta || "0")) * it.qty,
        0
      )
    );

    let coupon: typeof coupons.$inferSelect | undefined;
    if (couponCode) {
      [coupon] = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, String(couponCode).toUpperCase()))
        .limit(1);
      const now = new Date();
      const usable =
        coupon &&
        coupon.active &&
        (!coupon.expiresAt || new Date(coupon.expiresAt) > now) &&
        ((coupon.maxUses ?? 0) === 0 || coupon.usedCount < (coupon.maxUses ?? 0)) &&
        subtotal >= parseFloat(coupon.minOrderAmount?.toString() || "0");
      if (!usable) {
        return NextResponse.json({ error: "Coupon is invalid or not applicable to this order" }, { status: 400 });
      }
    }

    const settings = await getSettings();

    // 4b. Loyalty redemption — validated server-side against the live balance
    let pointsRedeemed = 0;
    if (userId && loyaltyPointsToRedeem && Number(loyaltyPointsToRedeem) > 0) {
      const balance = await getBalance(userId);
      const check = validateRedemption(Number(loyaltyPointsToRedeem), balance, subtotal, settings);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      pointsRedeemed = check.value; // 1 point = ₹1
    }

    const totals = computeTotals({
      subtotal,
      discountPercent: coupon?.discountPercent ?? 0,
      discountFlat: parseFloat(coupon?.discountFlat?.toString() || "0"),
      maxDiscount: parseFloat(coupon?.maxDiscount?.toString() || "0") || undefined,
      extraDiscountFlat: pointsRedeemed,
      shippingFee: settings.shippingFee,
      freeShippingAbove: settings.freeShippingAbove,
      taxPercent: settings.taxPercent,
    });

    // 5. Create order + items in a transaction
    const created = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: "TEMP",
          userId,
          subtotal: totals.subtotal.toString(),
          discountAmount: totals.discount.toString(),
          shippingFee: totals.shipping.toString(),
          taxAmount: totals.tax.toString(),
          total: totals.total.toString(),
          couponId: coupon?.id ?? null,
          couponCode: coupon?.code ?? null,
          loyaltyPointsRedeemed: pointsRedeemed,
          shippingAddress,
          status: "pending",
          paymentStatus: "unpaid",
          notes: notes || null,
        })
        .returning();

      const orderNo = orderNumber(order.id);
      await tx.update(orders).set({ orderNumber: orderNo }).where(eq(orders.id, order.id));

      for (const it of validItems) {
        const unitPrice = round2(parseFloat(it.price) + parseFloat(it.variantPriceDelta || "0"));
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: it.productId,
          variantId: it.variantId ?? null,
          productName: it.name,
          variantName: it.variantName ?? null,
          imageUrl: it.imageUrl ?? null,
          qty: it.qty,
          unitPrice: unitPrice.toString(),
          subtotal: round2(unitPrice * it.qty).toString(),
        });
      }

      // Ledger the redemption inside the same transaction as the order
      if (pointsRedeemed > 0) {
        await recordRedemption(userId!, pointsRedeemed, order.id);
      }

      // Clear cart
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart!.id));

      return { ...order, orderNumber: orderNo };
    });

    // 6. Razorpay order
    let razorpayOrderId: string | null = null;
    try {
      const rzp = await createRazorpayOrder(totals.total, `ord_${created.id}`);
      razorpayOrderId = rzp.id;
      await db.update(orders).set({ razorpayOrderId }).where(eq(orders.id, created.id));
      await db.insert(payments).values({
        orderId: created.id,
        provider: "razorpay",
        razorpayOrderId,
        amount: totals.total.toString(),
        status: "created",
      });
    } catch (e) {
      console.error("Razorpay order creation failed:", e);
      // Order exists but payment can't proceed — mark it so admin can see
      await db.update(orders).set({ notes: `PAYMENT_SETUP_FAILED: ${e instanceof Error ? e.message : "unknown"}` }).where(eq(orders.id, created.id));
      return NextResponse.json(
        { error: "Payment gateway is not configured. Order saved but cannot be paid yet.", orderId: created.id },
        { status: 502 }
      );
    }

    if (userId) {
      await createNotification({
        userId,
        type: "order",
        title: "Order placed",
        body: `Order ${created.orderNumber} has been placed. Complete payment to confirm.`,
        link: "/account/orders",
      });
    }
    await logAudit(userId, "order.create", "order", created.id, { total: totals.total });

    return NextResponse.json(
      {
        orderId: created.id,
        orderNumber: created.orderNumber,
        amount: totals.total,
        currency: settings.currency,
        razorpayOrderId,
        totals,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

/** Cancel a pending/unpaid order */
export async function DELETE(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    const { orderId } = await request.json();

    const [existing] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!["pending", "paid"].includes(existing.status)) {
      return NextResponse.json({ error: "This order can no longer be cancelled online. Contact support." }, { status: 400 });
    }

    await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Return redeemed points if the order never got fulfilled
    await reverseRedemption(orderId);

    // Restock if it was paid
    if (existing.paymentStatus === "paid") {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      for (const it of items) {
        if (it.variantId) {
          await db
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${it.qty}` })
            .where(eq(productVariants.id, it.variantId));
        } else if (it.productId) {
          await db
            .update(products)
            .set({ stock: sql`${products.stock} + ${it.qty}` })
            .where(eq(products.id, it.productId));
        }
      }
      await db.update(orders).set({ paymentStatus: "refunded" }).where(eq(orders.id, orderId));
    }

    await createNotification({
      userId,
      type: "order",
      title: "Order cancelled",
      body: `Order ${existing.orderNumber} has been cancelled.`,
      link: "/account/orders",
    });
    await logAudit(userId, "order.cancel", "order", orderId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
