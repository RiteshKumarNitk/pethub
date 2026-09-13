import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders, orderItems, products, productVariants, carts, cartItems,
} from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { logAudit } from "@/lib/utils";

const MAX_QTY_PER_LINE = 20;

/** POST /api/orders/reorder — body: { orderId }. Adds the order's items to the current cart. */
export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;

    // Ownership: the order must belong to the signed-in user.
    // Guest visitors never own orders (guest orders have userId = null), so
    // reorder is a signed-in feature by design — matches the audit's risk note.
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to reorder from your history" },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const prevItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    if (prevItems.length === 0) {
      return NextResponse.json({ error: "This order has no items" }, { status: 400 });
    }

    // Resolve/create the caller's cart
    let [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (!cart) {
      [cart] = await db.insert(carts).values({ userId, guestToken: null }).returning();
    }

    const added: string[] = [];
    const skipped: { name: string; reason: string }[] = [];

    for (const it of prevItems) {
      const displayName = it.variantName ? `${it.productName} (${it.variantName})` : it.productName;

      if (!it.productId) {
        skipped.push({ name: displayName, reason: "No longer available" });
        continue;
      }

      const [product] = await db.select().from(products).where(eq(products.id, it.productId)).limit(1);
      if (!product || !product.active) {
        skipped.push({ name: displayName, reason: "No longer available" });
        continue;
      }

      // Variant must still exist and belong to the product
      if (it.variantId) {
        const [variant] = await db
          .select()
          .from(productVariants)
          .where(and(eq(productVariants.id, it.variantId), eq(productVariants.productId, product.id)))
          .limit(1);
        if (!variant) {
          skipped.push({ name: displayName, reason: "Variant no longer available" });
          continue;
        }
      }

      const stock = it.variantId
        ? (await db.select().from(productVariants).where(eq(productVariants.id, it.variantId)).limit(1))[0]?.stock ?? 0
        : product.stock;
      if (stock <= 0) {
        skipped.push({ name: displayName, reason: "Out of stock" });
        continue;
      }

      // Merge with an existing line for the same product+variant
      const [existing] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cart.id),
            eq(cartItems.productId, product.id),
            it.variantId ? eq(cartItems.variantId, it.variantId) : isNull(cartItems.variantId)
          )
        )
        .limit(1);

      const wanted = Math.min(it.qty, stock, MAX_QTY_PER_LINE);
      const mergedQty = Math.min((existing?.qty ?? 0) + wanted, stock, MAX_QTY_PER_LINE);

      if (existing) {
        if (existing.qty >= mergedQty) {
          // Cart already holds the max — treat as added (idempotent repeat reorders)
          added.push(displayName);
        } else {
          await db.update(cartItems).set({ qty: mergedQty }).where(eq(cartItems.id, existing.id));
          added.push(displayName);
        }
      } else {
        await db.insert(cartItems).values({
          cartId: cart.id,
          productId: product.id,
          variantId: it.variantId ?? null,
          qty: wanted,
        });
        added.push(displayName);
      }
    }

    if (added.length === 0) {
      return NextResponse.json(
        { error: "None of these items are currently available", skipped },
        { status: 409 }
      );
    }

    await logAudit(userId, "order.reorder", "order", order.id, { added: added.length });

    return NextResponse.json({
      success: true,
      added,
      skipped,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
