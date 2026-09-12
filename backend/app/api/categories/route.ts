import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, brands, products } from "@/db/schema";
import { eq, asc, count } from "drizzle-orm";

export async function GET() {
  try {
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    const brandRows = await db
      .select()
      .from(brands)
      .where(eq(brands.active, true))
      .orderBy(asc(brands.name));

    const productCounts = await db
      .select({ categoryId: products.categoryId, cnt: count() })
      .from(products)
      .where(eq(products.active, true))
      .groupBy(products.categoryId);

    const counts = new Map(productCounts.map((c) => [c.categoryId, c.cnt]));

    return NextResponse.json({
      categories: cats.map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 })),
      brands: brandRows,
    });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
