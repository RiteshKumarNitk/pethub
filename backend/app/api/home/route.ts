import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const featuredProducts = await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.id))
      .limit(10);
    
    return NextResponse.json({
      featuredProducts,
    });
  } catch (error) {
    console.error("Home data error:", error);
    return NextResponse.json({ error: "Failed to fetch home data" }, { status: 500 });
  }
}
