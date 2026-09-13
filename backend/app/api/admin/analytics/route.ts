import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, categories, subscriptions, loyaltyLedger, bookings } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function dayStart(offsetDays: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d;
}

/**
 * GET /api/admin/analytics — v2 dashboard metrics.
 * Query: ?days=30 (default 30)
 * - timeseries: per-day revenue + orders (paid only)
 * - topProducts / topCategories by revenue (paid orders)
 * - subscriptions + loyalty program summaries
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = Math.max(1, Math.min(365, parseInt(url.searchParams.get("days") || "30") || 30));
  const since = dayStart(days - 1);

  // ---- Timeseries: per-day revenue + order count (paid orders only) ----
  const series = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`COALESCE(SUM(${orders.total}), 0)::float`,
      orders: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since)))
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

  // Fill zero-days so charts don't skip
  const byDay = new Map(series.map((r) => [r.day, r]));
  const timeseries = Array.from({ length: days }, (_, i) => {
    const d = dayStart(days - 1 - i);
    const key = d.toISOString().slice(0, 10);
    const row = byDay.get(key);
    return { day: key, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
  });

  const totals = timeseries.reduce(
    (acc, r) => ({ revenue: acc.revenue + r.revenue, orders: acc.orders + r.orders }),
    { revenue: 0, orders: 0 }
  );

  // ---- Top products by revenue (paid orders, window) ----
  const topProducts = await db
    .select({
      productId: orderItems.productId,
      name: orderItems.productName,
      qty: sql<number>`SUM(${orderItems.qty})::int`,
      revenue: sql<number>`SUM(${orderItems.subtotal})::float`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since)))
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(sql`SUM(${orderItems.subtotal}) DESC`)
    .limit(8);

  // ---- Top categories by revenue (join product -> category) ----
  const topCategories = await db
    .select({
      category: categories.name,
      slug: categories.slug,
      revenue: sql<number>`SUM(${orderItems.subtotal})::float`,
      qty: sql<number>`SUM(${orderItems.qty})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since)))
    .groupBy(categories.name, categories.slug)
    .orderBy(sql`SUM(${orderItems.subtotal}) DESC`)
    .limit(6);

  // ---- Subscriptions summary ----
  const [subCounts] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      active: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'active')::int`,
      paused: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'paused')::int`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'cancelled')::int`,
      mrr: sql<number>`COALESCE(SUM(CASE WHEN ${subscriptions.status} = 'active' THEN ${subscriptions.unitPrice} * ${subscriptions.qty} * (30.0 / GREATEST(${subscriptions.frequencyDays}, 1)) ELSE 0 END), 0)::float`,
    })
    .from(subscriptions);

  // ---- Loyalty summary ----
  const [loyalty] = await db
    .select({
      members: sql<number>`COUNT(DISTINCT ${loyaltyLedger.userId})::int`,
      pointsIssued: sql<number>`COALESCE(SUM(${loyaltyLedger.points}) FILTER (WHERE ${loyaltyLedger.points} > 0), 0)::int`,
      pointsOutstanding: sql<number>`COALESCE(SUM(${loyaltyLedger.points}), 0)::int`,
    })
    .from(loyaltyLedger);

  // ---- Bookings summary (window) ----
  const [bookingStats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} = 'pending')::int`,
      confirmed: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} = 'confirmed')::int`,
      completed: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} = 'completed')::int`,
    })
    .from(bookings)
    .where(gte(bookings.createdAt, since));

  return NextResponse.json({
    window: { days },
    totals,
    timeseries,
    topProducts,
    topCategories,
    subscriptions: subCounts,
    loyalty,
    bookings: bookingStats,
  });
}
