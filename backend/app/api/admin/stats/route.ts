import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, orders } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const [totalUsers] = await db.select({ val: count() }).from(users);
    const [totalProducts] = await db.select({ val: count() }).from(products);
    const [totalOrders] = await db.select({ val: count() }).from(orders);

    const revenueResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${orders.total})::numeric, 0)`,
      })
      .from(orders)
      .where(sql`${orders.status} != 'cancelled'`);

    const pendingOrders = await db
      .select({ val: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));

    const shippedOrders = await db
      .select({ val: count() })
      .from(orders)
      .where(eq(orders.status, "shipped"));

    const deliveredOrders = await db
      .select({ val: count() })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    return NextResponse.json({
      totalUsers: totalUsers.val,
      totalProducts: totalProducts.val,
      totalOrders: totalOrders.val,
      totalRevenue: parseFloat(revenueResult[0]?.total || "0"),
      pendingOrders: pendingOrders[0].val,
      shippedOrders: shippedOrders[0].val,
      deliveredOrders: deliveredOrders[0].val,
    });
  } catch (error) {
    console.error("Admin Stats GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
