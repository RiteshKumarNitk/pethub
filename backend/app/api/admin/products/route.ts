import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));
    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error("Admin Products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, stock, imageUrl, active } = body;

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 });
    }

    const [newProduct] = await db.insert(products).values({
      name,
      description,
      price: price.toString(),
      category,
      stock: stock || 0,
      imageUrl,
      active: active !== false,
    }).returning();

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Admin Products POST error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
