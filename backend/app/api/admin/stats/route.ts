import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, orders } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const [totalUsers] = await db.select({ val: count() }).from(users);
    const [totalProducts] = await db.select({ val: count() }).from(products);
    const [totalOrders] = await db.select({ val: count() }).from(orders);

    return NextResponse.json({
      totalUsers: totalUsers.val,
      totalProducts: totalProducts.val,
      totalOrders: totalOrders.val,
    });
  } catch (error) {
    console.error("Admin Stats GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
