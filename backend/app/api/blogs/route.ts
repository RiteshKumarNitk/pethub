import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, blogCategories } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    
    if (categorySlug && categorySlug !== "All") {
      const matchedBlogs = await db
        .select({
          blog: blogs,
          category: blogCategories
        })
        .from(blogs)
        .innerJoin(blogCategories, eq(blogs.categoryId, blogCategories.id))
        .where(and(eq(blogs.isPublished, true), eq(blogCategories.slug, categorySlug)))
        .orderBy(desc(blogs.createdAt));
      
      const results = matchedBlogs.map(row => ({
        ...row.blog,
        category: row.category
      }));
      return NextResponse.json({ blogs: results });
    } else {
      const allBlogs = await db
        .select()
        .from(blogs)
        .where(eq(blogs.isPublished, true))
        .orderBy(desc(blogs.createdAt));
      
      const categories = await db.select().from(blogCategories);
      const results = allBlogs.map(blog => ({
        ...blog,
        category: categories.find(c => c.id === blog.categoryId)
      }));
      
      return NextResponse.json({ blogs: results });
    }
  } catch (error) {
    console.error("Get blogs error:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}
