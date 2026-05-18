import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, blogCategories, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 });
    }

    const matchedBlogs = await db
      .select()
      .from(blogs)
      .where(and(eq(blogs.slug, slug), eq(blogs.isPublished, true)))
      .limit(1);

    if (matchedBlogs.length === 0) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const blog = matchedBlogs[0];

    // Fetch author details
    let author = null;
    if (blog.authorId) {
      const matchedAuthors = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, blog.authorId))
        .limit(1);
      if (matchedAuthors.length > 0) {
        author = matchedAuthors[0];
      }
    }

    // Fetch category details
    let category = null;
    if (blog.categoryId) {
      const matchedCategories = await db
        .select()
        .from(blogCategories)
        .where(eq(blogCategories.id, blog.categoryId))
        .limit(1);
      if (matchedCategories.length > 0) {
        category = matchedCategories[0];
      }
    }

    return NextResponse.json({
      blog: {
        ...blog,
        author,
        category,
      },
    });
  } catch (error) {
    console.error("Get blog detail error:", error);
    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 });
  }
}
