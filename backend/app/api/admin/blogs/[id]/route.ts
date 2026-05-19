import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    const existing = await db.select().from(blogs).where(eq(blogs.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;

    const [updated] = await db.update(blogs).set(updateData).where(eq(blogs.id, id)).returning();
    return NextResponse.json({ blog: updated });
  } catch (error) {
    console.error("Admin Blogs PUT error:", error);
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await db.delete(blogs).where(eq(blogs.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Blogs DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}
