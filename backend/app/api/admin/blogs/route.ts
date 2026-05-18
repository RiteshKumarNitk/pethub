import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, blogCategories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allBlogs = await db.query.blogs.findMany({
      with: {
        category: true,
      },
      orderBy: [desc(blogs.createdAt)],
    });
    return NextResponse.json({ blogs: allBlogs });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, slug, content, categoryId, thumbnailUrl } = body;

    const newBlog = await db.insert(blogs).values({
      title,
      slug,
      content,
      categoryId,
      thumbnailUrl,
      isPublished: true,
    }).returning();

    return NextResponse.json({ success: true, blog: newBlog[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
