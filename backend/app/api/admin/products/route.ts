import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, brands, productImages, productVariants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { slugify, logAudit } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const [product] = await db.select().from(products).where(eq(products.id, parseInt(id))).limit(1);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      const [images, variants] = await Promise.all([
        db.select().from(productImages).where(eq(productImages.productId, product.id)),
        db.select().from(productVariants).where(eq(productVariants.productId, product.id)),
      ]);
      return NextResponse.json({ product: { ...product, images, variants } });
    }

    const allProducts = await db
      .select({
        product: products,
        categoryName: categories.name,
        brandName: brands.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .orderBy(desc(products.createdAt));

    return NextResponse.json({
      products: allProducts.map((r) => ({ ...r.product, categoryName: r.categoryName, brandName: r.brandName })),
    });
  } catch (error) {
    console.error("Admin Products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id") || "0");
    const body = await request.json();
    const {
      id, name, description, shortDescription, price, mrp, categoryId, brandId,
      petType, stock, storeStock, lifeStages, needSlugs, lowStockThreshold, subscriptionEligible,
      imageUrl, images, specifications, weightGrams, isFeatured, isBestSeller,
      taxRatePercent, active,
    } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const base = {
      name,
      description: description || null,
      shortDescription: shortDescription || null,
      price: String(price),
      mrp: mrp ? String(mrp) : null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      brandId: brandId ? parseInt(brandId) : null,
      petType: petType || "all",
      stock: parseInt(stock) || 0,
      storeStock: storeStock !== undefined ? parseInt(storeStock) || 0 : 0,
      subscriptionEligible: subscriptionEligible === true || subscriptionEligible === "true",
      lifeStages: Array.isArray(lifeStages) ? lifeStages : [],
      needSlugs: Array.isArray(needSlugs) ? needSlugs : [],
      lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) || 5 : 5,
      imageUrl: imageUrl || null,
      specifications: specifications || {},
      weightGrams: weightGrams ? parseInt(weightGrams) : null,
      isFeatured: !!isFeatured,
      isBestSeller: !!isBestSeller,
      taxRatePercent: taxRatePercent ? String(taxRatePercent) : "0",
      active: active !== false,
    };

    if (id) {
      await db
        .update(products)
        .set({ ...base, updatedAt: new Date() })
        .where(eq(products.id, id));
      if (Array.isArray(images)) {
        await db.delete(productImages).where(eq(productImages.productId, id));
        if (images.length) {
          await db.insert(productImages).values(
            images.map((url: string, idx: number) => ({ productId: id, url, sortOrder: idx }))
          );
        }
      }
      await logAudit(adminId, "product.update", "product", id);
      return NextResponse.json({ success: true, id });
    }

    const [newProduct] = await db
      .insert(products)
      .values({ ...base, slug: `${slugify(name)}-${Date.now().toString(36)}` })
      .returning();

    if (Array.isArray(images) && images.length) {
      await db.insert(productImages).values(
        images.map((url: string, idx: number) => ({ productId: newProduct.id, url, sortOrder: idx }))
      );
    }

    await logAudit(adminId, "product.create", "product", newProduct.id);
    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Admin Products POST error:", error);
    return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id") || "0");
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Soft delete to preserve order history integrity
    await db.update(products).set({ active: false, updatedAt: new Date() }).where(eq(products.id, id));
    await logAudit(adminId, "product.deactivate", "product", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Products DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
