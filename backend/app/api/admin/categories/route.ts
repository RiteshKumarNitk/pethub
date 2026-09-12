import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, brands, products } from "@/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { slugify, logAudit } from "@/lib/utils";

export async function GET() {
  const [cats, brandRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(brands).orderBy(asc(brands.name)),
  ]);
  return NextResponse.json({ categories: cats, brands: brandRows });
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    const body = await request.json();
    const { type, name, petType, icon, sortOrder, logoUrl } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "type (category|brand) and name are required" }, { status: 400 });
    }

    if (type === "category") {
      const [created] = await db
        .insert(categories)
        .values({
          name,
          slug: slugify(name),
          petType: petType || "all",
          icon: icon || null,
          sortOrder: parseInt(sortOrder) || 0,
        })
        .returning();
      await logAudit(userId, "category.create", "category", created.id, { name });
      return NextResponse.json({ category: created }, { status: 201 });
    } else if (type === "brand") {
      const [created] = await db
        .insert(brands)
        .values({ name, slug: slugify(name), logoUrl: logoUrl || null })
        .returning();
      await logAudit(userId, "brand.create", "brand", created.id, { name });
      return NextResponse.json({ brand: created }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "A category/brand with this name already exists" }, { status: 409 });
    }
    console.error("Create category/brand error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    const body = await request.json();
    const { type, id, name, petType, icon, sortOrder, active, logoUrl } = body;
    if (!id || !type) return NextResponse.json({ error: "id and type required" }, { status: 400 });

    if (type === "category") {
      const [updated] = await db
        .update(categories)
        .set({
          ...(name ? { name, slug: slugify(name) } : {}),
          ...(petType ? { petType } : {}),
          ...(icon !== undefined ? { icon } : {}),
          ...(sortOrder !== undefined ? { sortOrder: parseInt(sortOrder) || 0 } : {}),
          ...(active !== undefined ? { active } : {}),
        })
        .where(eq(categories.id, id))
        .returning();
      await logAudit(userId, "category.update", "category", id, body);
      return NextResponse.json({ category: updated });
    } else if (type === "brand") {
      const [updated] = await db
        .update(brands)
        .set({
          ...(name ? { name, slug: slugify(name) } : {}),
          ...(logoUrl !== undefined ? { logoUrl } : {}),
          ...(active !== undefined ? { active } : {}),
        })
        .where(eq(brands.id, id))
        .returning();
      await logAudit(userId, "brand.update", "brand", id, body);
      return NextResponse.json({ brand: updated });
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Update category/brand error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

async function countProducts(column: "category" | "brand", id: number): Promise<number> {
  const [row] = await db
    .select({ cnt: count() })
    .from(products)
    .where(column === "category" ? eq(products.categoryId, id) : eq(products.brandId, id));
  return row?.cnt ?? 0;
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");
    const type = searchParams.get("type");
    if (!id || !type) return NextResponse.json({ error: "id and type required" }, { status: 400 });

    if (type === "category") {
      const cnt = await countProducts("category", id);
      if (cnt > 0) {
        return NextResponse.json(
          { error: `Cannot delete: ${cnt} product(s) use this category. Deactivate instead.` },
          { status: 409 }
        );
      }
      await db.delete(categories).where(eq(categories.id, id));
      await logAudit(userId, "category.delete", "category", id);
    } else if (type === "brand") {
      const cnt = await countProducts("brand", id);
      if (cnt > 0) {
        return NextResponse.json(
          { error: `Cannot delete: ${cnt} product(s) use this brand. Deactivate instead.` },
          { status: 409 }
        );
      }
      await db.delete(brands).where(eq(brands.id, id));
      await logAudit(userId, "brand.delete", "brand", id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category/brand error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
