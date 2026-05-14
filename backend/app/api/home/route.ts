import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, petListings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const featuredProducts = await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.id))
      .limit(10);
    
    const shopPets = await db
      .select()
      .from(petListings)
      .where(eq(petListings.source, "shop"))
      .orderBy(desc(petListings.createdAt))
      .limit(6);
    
    return NextResponse.json({
      featuredProducts,
      shopPets,
    });
  } catch (error) {
    console.error("Home data error:", error);
    return NextResponse.json({ error: "Failed to fetch home data" }, { status: 500 });
  }
}
