import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, productVariants, categories, brands, reviews, users } from "@/db/schema";
import { eq, and, or, ne, sql, count, desc, inArray } from "drizzle-orm";

/**
 * GET /api/products/[id] — accepts numeric id or slug.
 * Returns product + images + variants + approved reviews + related products.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id);
    const isNumeric = !isNaN(numericId);

    const [product] = await db
      .select({
        product: products,
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryParentId: categories.parentId,
        brandName: brands.name,
        brandSlug: brands.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(isNumeric ? eq(products.id, numericId) : eq(products.slug, id))
      .limit(1);

    if (!product || !product.product.active) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const p = product.product;

    const [images, variants, reviewRows, ratingRow] = await Promise.all([
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, p.id))
        .orderBy(productImages.sortOrder),
      db
        .select()
        .from(productVariants)
        .where(and(eq(productVariants.productId, p.id), eq(productVariants.active, true))),
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          userName: users.name,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(
          and(
            eq(reviews.targetType, "product"),
            eq(reviews.targetId, p.id),
            eq(reviews.status, "approved")
          )
        )
        .orderBy(desc(reviews.createdAt))
        .limit(20),
      db
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
        ),
    ]);

    // Related products: prefer siblings in the same leaf category, then the
    // parent group, then same pet type — so the rail never comes up empty.
    let relatedCatIds: number[] = [];
    if (p.categoryId) {
      relatedCatIds = [p.categoryId];
      if (product.categoryParentId) relatedCatIds.push(product.categoryParentId);
      else {
        const children = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.parentId, p.categoryId));
        relatedCatIds.push(...children.map((c) => c.id));
      }
    }
    const related = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        price: products.price,
        mrp: products.mrp,
        imageUrl: products.imageUrl,
        stock: products.stock,
      })
      .from(products)
      .where(
        and(
          eq(products.active, true),
          ne(products.id, p.id),
          relatedCatIds.length > 0
            ? or(inArray(products.categoryId, relatedCatIds), eq(products.petType, p.petType))!
            : eq(products.petType, p.petType)
        )
      )
      .limit(6);

    return NextResponse.json({
      product: {
        ...p,
        categoryName: product.categoryName,
        categorySlug: product.categorySlug,
        categoryParentId: product.categoryParentId,
        brandName: product.brandName,
        brandSlug: product.brandSlug,
      },
      images,
      variants,
      reviews: reviewRows,
      rating: ratingRow[0] ? Math.round(parseFloat(ratingRow[0].avg) * 10) / 10 : 0,
      reviewCount: ratingRow[0]?.cnt ?? 0,
      related,
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
