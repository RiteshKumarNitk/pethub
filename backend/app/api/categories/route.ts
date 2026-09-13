import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, needs, brands } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * GET /api/categories
 * Returns the category tree (active only). Query:
 *  - petType=dog|cat|small_pet (filters groups to that pet type; "all"-petType groups are included)
 *  - withChildren=true (default) nests children under parents
 *  - withNeeds=true also returns shop-by-need facets
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const petType = searchParams.get("petType");
    const withChildren = searchParams.get("withChildren") !== "false";
    const withNeeds = searchParams.get("withNeeds") === "true";

    const all = await db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    let parents = all.filter((c) => c.parentId === null);
    if (petType && petType !== "all") {
      parents = parents.filter((c) => c.petType === petType || c.petType === "all");
    }

    let result = parents;
    if (withChildren) {
      result = parents.map((p) => ({
        ...p,
        children: all.filter((c) => c.parentId === p.id),
      }));
    }

    let needRows: (typeof needs.$inferSelect)[] | undefined;
    if (withNeeds) {
      needRows = await db
        .select()
        .from(needs)
        .where(eq(needs.active, true))
        .orderBy(asc(needs.sortOrder));
    }

    // Brands ride along for filter rails (kept for backward compatibility
    // with the shop page, which expects d.brands here)
    const brandRows = await db
      .select({ id: brands.id, name: brands.name, slug: brands.slug })
      .from(brands)
      .where(eq(brands.active, true))
      .orderBy(asc(brands.name));

    return NextResponse.json({ categories: result, needs: needRows ?? [], brands: brandRows });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
