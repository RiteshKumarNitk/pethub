import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, products, productVariants, addresses, productImages } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { logAudit } from "@/lib/utils";

const ALLOWED_FREQUENCIES = [7, 15, 30, 45, 60];

async function requireUserId(request: NextRequest): Promise<number | null> {
  return parseInt(request.headers.get("x-user-id") || "0") || null;
}

/** GET /api/subscriptions — the signed-in user's subscriptions with live product info. */
export async function GET(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const rows = await db
    .select({
      id: subscriptions.id,
      productName: subscriptions.productName,
      variantName: subscriptions.variantName,
      imageUrl: subscriptions.imageUrl,
      unitPrice: subscriptions.unitPrice,
      qty: subscriptions.qty,
      frequencyDays: subscriptions.frequencyDays,
      status: subscriptions.status,
      nextOrderAt: subscriptions.nextOrderAt,
      lastOrderAt: subscriptions.lastOrderAt,
      cancelReason: subscriptions.cancelReason,
      productId: subscriptions.productId,
      variantId: subscriptions.variantId,
      productSlug: products.slug,
      productActive: products.active,
      productStock: products.stock,
      productPrice: products.price,
      subscriptionEligible: products.subscriptionEligible,
    })
    .from(subscriptions)
    .leftJoin(products, eq(products.id, subscriptions.productId))
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.nextOrderAt);

  return NextResponse.json({ subscriptions: rows, eligibleFrequencies: ALLOWED_FREQUENCIES });
}

/** POST /api/subscriptions — create a subscription from a product (optionally variant). */
export async function POST(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  try {
    const body = await request.json();
    const productId = parseInt(body.productId);
    const variantId = body.variantId ? parseInt(body.variantId) : null;
    const qty = Math.max(1, Math.min(10, parseInt(body.qty) || 1));
    const frequencyDays = ALLOWED_FREQUENCIES.includes(parseInt(body.frequencyDays))
      ? parseInt(body.frequencyDays)
      : 30;

    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product || !product.active) return NextResponse.json({ error: "Product not available" }, { status: 404 });
    if (!product.subscriptionEligible) {
      return NextResponse.json({ error: "This product is not eligible for auto-ship" }, { status: 400 });
    }

    let variantName: string | null = null;
    let unitPrice: string;
    let stock: number;
    if (variantId) {
      const [v] = await db
        .select()
        .from(productVariants)
        .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)))
        .limit(1);
      if (!v) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
      variantName = v.name;
      unitPrice = v.priceDelta ? (parseFloat(product.price) + parseFloat(v.priceDelta)).toFixed(2) : product.price;
      stock = v.stock;
    } else {
      unitPrice = product.price;
      stock = product.stock;
    }
    if (stock < qty) return NextResponse.json({ error: "Not enough stock" }, { status: 409 });

    // Address snapshot: request body, else the user's default address
    let shippingAddress: {
      fullName?: string; phone?: string; street: string; landmark?: string;
      city: string; state: string; zip: string;
    } | null = null;
    const a = body.shippingAddress;
    if (a && typeof a === "object" && a.street && a.city && a.state && a.zip) {
      shippingAddress = {
        fullName: a.fullName || undefined,
        phone: a.phone || undefined,
        street: a.street,
        landmark: a.landmark || undefined,
        city: a.city,
        state: a.state,
        zip: a.zip,
      };
    }
    if (!shippingAddress) {
      const [addr] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(sql`${addresses.isDefault} DESC`)
        .limit(1);
      if (addr) {
        shippingAddress = {
          fullName: addr.fullName || undefined,
          phone: addr.phone || undefined,
          street: addr.street,
          landmark: addr.landmark || undefined,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        };
      }
    }

    // Snapshot the product image for the subscription card (gallery first, else hero)
    const [img] = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.id)
      .limit(1);

    const [created] = await db
      .insert(subscriptions)
      .values({
        userId,
        productId: product.id,
        variantId,
        productName: product.name,
        variantName,
        imageUrl: img?.url ?? product.imageUrl ?? null,
        unitPrice,
        qty,
        shippingAddress,
        frequencyDays,
        status: "active",
        nextOrderAt: new Date(Date.now() + frequencyDays * 24 * 3600 * 1000),
      })
      .returning();

    await logAudit(userId, "subscription.created", "subscription", created.id, {
      productId: product.id,
      frequencyDays,
    });

    return NextResponse.json({ subscription: created }, { status: 201 });
  } catch (e) {
    console.error("Create subscription failed:", e);
    return NextResponse.json({ error: "Could not create subscription" }, { status: 500 });
  }
}

/** PATCH /api/subscriptions — body: { id, action: pause|resume|cancel|frequency, frequencyDays?, cancelReason? } */
export async function PATCH(request: NextRequest) {
  const userId = await requireUserId(request);
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  try {
    const body = await request.json();
    const id = parseInt(body.id);
    const action = String(body.action || "");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .limit(1);
    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

    if (action === "pause" && sub.status === "active") {
      await db.update(subscriptions).set({ status: "paused", updatedAt: new Date() }).where(eq(subscriptions.id, id));
      return NextResponse.json({ ok: true, status: "paused" });
    }

    if (action === "resume" && sub.status === "paused") {
      // If the next cycle came due while paused, push it a full cycle out
      const next = sub.nextOrderAt.getTime() <= Date.now()
        ? new Date(Date.now() + sub.frequencyDays * 24 * 3600 * 1000)
        : sub.nextOrderAt;
      await db
        .update(subscriptions)
        .set({ status: "active", nextOrderAt: next, updatedAt: new Date() })
        .where(eq(subscriptions.id, id));
      return NextResponse.json({ ok: true, status: "active" });
    }

    if (action === "cancel") {
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          cancelReason: String(body.cancelReason || "user_cancelled").slice(0, 100),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, id));
      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    if (action === "frequency" && sub.status !== "cancelled") {
      const freq = parseInt(body.frequencyDays);
      if (!ALLOWED_FREQUENCIES.includes(freq)) {
        return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
      }
      // Preserve the remaining wait proportionally, at least 1 day out
      const remaining = sub.nextOrderAt.getTime() - Date.now();
      const next = new Date(Math.max(Date.now() + 24 * 3600 * 1000, Date.now() + (remaining / sub.frequencyDays) * freq));
      await db
        .update(subscriptions)
        .set({ frequencyDays: freq, nextOrderAt: next, updatedAt: new Date() })
        .where(eq(subscriptions.id, id));
      return NextResponse.json({ ok: true, status: sub.status, frequencyDays: freq });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("Patch subscription failed:", e);
    return NextResponse.json({ error: "Could not update subscription" }, { status: 500 });
  }
}
