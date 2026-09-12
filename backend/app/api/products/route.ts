import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, brands, reviews } from "@/db/schema";
import { eq, and, or, ilike, gte, lte, count, desc, asc, sql } from "drizzle-orm";

/**
 * GET /api/products
 * Query: page, limit, category (slug or id), petType, brand (slug or id), search,
 *        minPrice, maxPrice, inStock, sort (new|price_asc|price_desc|popular)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(60, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const category = searchParams.get("category");
    const petType = searchParams.get("petType");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const sort = searchParams.get("sort") || "new";
    const featured = searchParams.get("featured");
    const bestSeller = searchParams.get("bestSeller");

    const filters = [eq(products.active, true)];

    if (category && category !== "all") {
      const catId = parseInt(category);
      if (!isNaN(catId)) {
        filters.push(eq(products.categoryId, catId));
      } else {
        // Resolve slug
        const [cat] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, category))
          .limit(1);
        if (cat) filters.push(eq(products.categoryId, cat.id));
        else return NextResponse.json({ products: [], total: 0, page, limit, totalPages: 0 });
      }
    }

    if (petType && petType !== "all") {
      filters.push(
        or(eq(products.petType, petType), eq(products.petType, "all"))!
      );
    }

    if (brand && brand !== "all") {
      const brandId = parseInt(brand);
      if (!isNaN(brandId)) {
        filters.push(eq(products.brandId, brandId));
      } else {
        const [b] = await db
          .select({ id: brands.id })
          .from(brands)
          .where(eq(brands.slug, brand))
          .limit(1);
        if (b) filters.push(eq(products.brandId, b.id));
        else return NextResponse.json({ products: [], total: 0, page, limit, totalPages: 0 });
      }
    }

    if (search) {
      const pattern = `%${search}%`;
      filters.push(
        or(
          ilike(products.name, pattern),
          ilike(products.description, pattern),
          ilike(products.shortDescription, pattern)
        )!
      );
    }

    if (minPrice && !isNaN(parseFloat(minPrice))) {
      filters.push(gte(products.price, minPrice));
    }
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      filters.push(lte(products.price, maxPrice));
    }
    if (inStock === "true") {
      filters.push(sql`${products.stock} > 0`);
    }
    if (featured === "true") {
      filters.push(eq(products.isFeatured, true));
    }
    if (bestSeller === "true") {
      filters.push(eq(products.isBestSeller, true));
    }

    const where = and(...filters)!;

    const orderBy =
      sort === "price_asc"
        ? asc(products.price)
        : sort === "price_desc"
          ? desc(products.price)
          : sort === "popular"
            ? desc(products.isBestSeller)
            : desc(products.createdAt);

    const [totalResult] = await db
      .select({ total: count() })
      .from(products)
      .where(where);
    const total = totalResult?.total ?? 0;

    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        shortDescription: products.shortDescription,
        price: products.price,
        mrp: products.mrp,
        petType: products.petType,
        stock: products.stock,
        imageUrl: products.imageUrl,
        isFeatured: products.isFeatured,
        isBestSeller: products.isBestSeller,
        categoryName: categories.name,
        categorySlug: categories.slug,
        brandName: brands.name,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset((page - 1) * limit);

    const productsWithRating = await Promise.all(
      rows.map(async (p) => {
        const [r] = await db
          .select({
            avg: sql<string>`COALESCE(AVG(${reviews.rating})::numeric, 0)`,
            cnt: count(),
          })
          .from(reviews)
          .where(
            and(
              eq(reviews.targetType, "product"),
              eq(reviews.targetId, p.id),
              eq(reviews.status, "approved")
            )
          );
        return {
          ...p,
          rating: r ? Math.round(parseFloat(r.avg) * 10) / 10 : 0,
          reviewCount: r?.cnt ?? 0,
        };
      })
    );

    return NextResponse.json({
      products: productsWithRating,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
