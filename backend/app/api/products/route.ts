import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, or, ilike, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const category = searchParams.get("category");
    const petType = searchParams.get("petType");
    const search = searchParams.get("search");

    const filters = [eq(products.active, true)];

    if (category) {
      filters.push(eq(products.category, category));
    }

    if (petType && petType !== "all") {
      filters.push(eq(products.petType, petType));
    }

    if (search) {
      const pattern = `%${search}%`;
      filters.push(
        or(ilike(products.name, pattern), ilike(products.description, pattern))!
      );
    }

    const where = and(...filters)!;

    const [totalResult] = await db
      .select({ total: count() })
      .from(products)
      .where(where);

    const total = totalResult?.total ?? 0;

    const allProducts = await db
      .select()
      .from(products)
      .where(where)
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      products: allProducts,
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
