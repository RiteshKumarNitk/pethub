import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners, faqs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { logAudit } from "@/lib/utils";

/** GET /api/admin/banners — banners + faqs */
export async function GET() {
  const [bannerRows, faqRows] = await Promise.all([
    db.select().from(banners).orderBy(asc(banners.sortOrder)),
    db.select().from(faqs).orderBy(asc(faqs.sortOrder)),
  ]);
  return NextResponse.json({ banners: bannerRows, faqs: faqRows });
}

/** POST — create banner or faq: { type: "banner" | "faq", ... } */
export async function POST(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const { type, ...rest } = body;

    if (type === "banner") {
      if (!rest.title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
      const [banner] = await db
        .insert(banners)
        .values({
          title: rest.title,
          subtitle: rest.subtitle || null,
          description: rest.description || null,
          ctaLabel: rest.ctaLabel || null,
          ctaLink: rest.ctaLink || null,
          imageUrl: rest.imageUrl || null,
          placement: rest.placement || "hero",
          sortOrder: parseInt(rest.sortOrder) || 0,
        })
        .returning();
      await logAudit(adminId, "banner.create", "banner", banner.id);
      return NextResponse.json({ banner }, { status: 201 });
    }

    if (type === "faq") {
      if (!rest.question || !rest.answer) return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
      const [faq] = await db
        .insert(faqs)
        .values({
          question: rest.question,
          answer: rest.answer,
          category: rest.category || "general",
          sortOrder: parseInt(rest.sortOrder) || 0,
        })
        .returning();
      await logAudit(adminId, "faq.create", "faq", faq.id);
      return NextResponse.json({ faq }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Banner/FAQ create error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

/** PUT — update banner or faq */
export async function PUT(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const { type, id, active, sortOrder, ...rest } = await request.json();
    if (!id || !type) return NextResponse.json({ error: "id and type required" }, { status: 400 });

    if (type === "banner") {
      const patch: Record<string, unknown> = {};
      for (const k of ["title", "subtitle", "description", "ctaLabel", "ctaLink", "imageUrl", "placement"]) {
        if (rest[k] !== undefined) patch[k] = rest[k];
      }
      if (active !== undefined) patch.active = !!active;
      if (sortOrder !== undefined) patch.sortOrder = parseInt(sortOrder) || 0;
      await db.update(banners).set(patch).where(eq(banners.id, id));
      await logAudit(adminId, "banner.update", "banner", id);
      return NextResponse.json({ success: true });
    }

    if (type === "faq") {
      const patch: Record<string, unknown> = {};
      for (const k of ["question", "answer", "category"]) {
        if (rest[k] !== undefined) patch[k] = rest[k];
      }
      if (active !== undefined) patch.active = !!active;
      if (sortOrder !== undefined) patch.sortOrder = parseInt(sortOrder) || 0;
      await db.update(faqs).set(patch).where(eq(faqs.id, id));
      await logAudit(adminId, "faq.update", "faq", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Banner/FAQ update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/** DELETE ?type=&id= */
export async function DELETE(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = parseInt(searchParams.get("id") || "");
    if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

    if (type === "banner") await db.delete(banners).where(eq(banners.id, id));
    else if (type === "faq") await db.delete(faqs).where(eq(faqs.id, id));
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    await logAudit(adminId, `${type}.delete`, type, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Banner/FAQ delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
