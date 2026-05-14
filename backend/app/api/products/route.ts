import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    
    let query = db.select().from(products).where(eq(products.active, true));
    
    if (category) {
      query = db
        .select()
        .from(products)
        .where(and(eq(products.active, true), eq(products.category, category)));
    }
    
    const allProducts = await query;
    
    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
