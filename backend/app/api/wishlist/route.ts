import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wishlistItems, products } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/** GET /api/wishlist — signed-in user's wishlist with product info */
export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select({
        id: wishlistItems.id,
        productId: products.id,
        slug: products.slug,
        name: products.name,
        price: products.price,
        mrp: products.mrp,
        imageUrl: products.imageUrl,
        stock: products.stock,
        addedAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId))
      .orderBy(desc(wishlistItems.createdAt));

    return NextResponse.json({ items: rows, productIds: rows.map((r) => r.productId) });
  } catch (error) {
    console.error("Wishlist GET error:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

/** POST /api/wishlist — toggle a product { productId, action: "add" | "remove" | "toggle" } */
export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) return NextResponse.json({ error: "Please sign in to save favourites" }, { status: 401 });

    const { productId, action = "toggle" } = await request.json();
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    const [existing] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
      .limit(1);

    if (existing && action !== "add") {
      await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
      return NextResponse.json({ success: true, inWishlist: false });
    }
    if (!existing) {
      await db.insert(wishlistItems).values({ userId, productId });
      return NextResponse.json({ success: true, inWishlist: true });
    }
    return NextResponse.json({ success: true, inWishlist: true });
  } catch (error) {
    console.error("Wishlist POST error:", error);
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}
