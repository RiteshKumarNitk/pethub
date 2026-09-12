import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products, productVariants } from "@/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { computeTotals } from "@/lib/utils";
import { getSettings } from "@/lib/settings";

const GUEST_COOKIE = "cart_token";

function getGuestToken(request: NextRequest): string | null {
  return request.cookies.get(GUEST_COOKIE)?.value || null;
}

function newGuestToken(): string {
  return `g_${crypto.randomUUID()}`;
}

function withGuestCookie(response: NextResponse, token: string | null): NextResponse {
  if (token) {
    response.cookies.set(GUEST_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
  }
  return response;
}

/** Get the cart for this user, or guest token. Creates one if none exists. */
async function resolveCart(userId: number | null, guestToken: string | null) {
  if (userId) {
    const [existing] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (existing) return existing;
    // Adopt guest cart contents on login
    if (guestToken) {
      const [guestCart] = await db.select().from(carts).where(eq(carts.guestToken, guestToken)).limit(1);
      if (guestCart && guestCart.userId === null) {
        // Merge: keep the guest cart, attach the user; if a user cart already exists above we wouldn't be here.
        const [adopted] = await db
          .update(carts)
          .set({ userId, guestToken: null })
          .where(eq(carts.id, guestCart.id))
          .returning();
        return adopted;
      }
    }
    const [created] = await db.insert(carts).values({ userId, guestToken: null }).returning();
    return created;
  }
  if (guestToken) {
    const [existing] = await db.select().from(carts).where(eq(carts.guestToken, guestToken)).limit(1);
    if (existing) return existing;
  }
  const [created] = await db.insert(carts).values({ userId: null, guestToken }).returning();
  return created;
}

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const guestToken = getGuestToken(request);
    const cart = await resolveCart(userId, guestToken);

    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        qty: cartItems.qty,
        name: products.name,
        slug: products.slug,
        imageUrl: products.imageUrl,
        price: products.price,
        mrp: products.mrp,
        stock: products.stock,
        active: products.active,
        variantName: productVariants.name,
        variantPriceDelta: productVariants.priceDelta,
        variantStock: productVariants.stock,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cart.id))
      .orderBy(cartItems.id);

    const lines = items
      .filter((it) => it.active)
      .map((it) => {
        const unitPrice = parseFloat(it.price) + parseFloat(it.variantPriceDelta || "0");
        const availableStock = it.variantId ? (it.variantStock ?? 0) : it.stock;
        return {
          id: it.id,
          productId: it.productId,
          variantId: it.variantId,
          name: it.name,
          slug: it.slug,
          imageUrl: it.imageUrl,
          variantName: it.variantName,
          unitPrice,
          mrp: it.mrp ? parseFloat(it.mrp) : null,
          qty: it.qty,
          stock: availableStock,
          lineTotal: Math.round(unitPrice * it.qty * 100) / 100,
        };
      });

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const settings = await getSettings();
    const totals = computeTotals({
      subtotal,
      shippingFee: settings.shippingFee,
      freeShippingAbove: settings.freeShippingAbove,
      taxPercent: settings.taxPercent,
    });

    const response = NextResponse.json({ cartId: cart.id, items: lines, totals, itemCount: lines.reduce((s, l) => s + l.qty, 0) });
    return withGuestCookie(response, userId ? null : cart.guestToken);
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const guestToken = getGuestToken(request) || newGuestToken();
    const body = await request.json();
    const { productId, variantId, qty } = body;

    const quantity = Math.max(1, parseInt(qty) || 1);
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product || !product.active) {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }

    let variant = null;
    if (variantId) {
      [variant] = await db
        .select()
        .from(productVariants)
        .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)))
        .limit(1);
      if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const stock = variant ? variant.stock : product.stock;
    const cart = await resolveCart(userId, guestToken);

    // Merge with existing line for same product+variant
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId), variantId ? eq(cartItems.variantId, variantId) : isNull(cartItems.variantId)))
      .limit(1);

    const newQty = Math.min((existingItem?.qty || 0) + quantity, stock, 20);
    if (stock <= 0) {
      return NextResponse.json({ error: "Out of stock" }, { status: 409 });
    }

    if (existingItem) {
      await db.update(cartItems).set({ qty: newQty }).where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        qty: Math.min(quantity, stock, 20),
      });
    }

    const response = NextResponse.json({ success: true, cartId: cart.id });
    return withGuestCookie(response, userId ? null : cart.guestToken);
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const guestToken = getGuestToken(request);
    const body = await request.json();
    const { itemId, qty } = body;

    const cart = await resolveCart(userId, guestToken);
    const quantity = parseInt(qty);

    if (quantity <= 0) {
      await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    } else {
      // Validate stock again
      const [item] = await db
        .select({ productId: cartItems.productId, variantId: cartItems.variantId })
        .from(cartItems)
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
        .limit(1);
      if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      let stock = 0;
      if (item.variantId) {
        const [v] = await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1);
        stock = v?.stock ?? 0;
      } else {
        const [p] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId)).limit(1);
        stock = p?.stock ?? 0;
      }
      if (quantity > stock) {
        return NextResponse.json({ error: `Only ${stock} left in stock` }, { status: 409 });
      }
      await db.update(cartItems).set({ qty: Math.min(quantity, 20) }).where(eq(cartItems.id, itemId));
    }

    const response = NextResponse.json({ success: true });
    return withGuestCookie(response, userId ? null : cart.guestToken);
  } catch (error) {
    console.error("Cart PUT error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const guestToken = getGuestToken(request);
    const { searchParams } = new URL(request.url);
    const itemId = parseInt(searchParams.get("itemId") || "");

    const cart = await resolveCart(userId, guestToken);
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));

    const response = NextResponse.json({ success: true });
    return withGuestCookie(response, userId ? null : cart.guestToken);
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
