import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, users, products } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/admin/subscriptions — all subscriptions with customer info. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(200, parseInt(url.searchParams.get("limit") || "100") || 100);

  const where = status && ["active", "paused", "cancelled"].includes(status)
    ? eq(subscriptions.status, status)
    : undefined;

  const rows = await db
    .select({
      id: subscriptions.id,
      productName: subscriptions.productName,
      variantName: subscriptions.variantName,
      qty: subscriptions.qty,
      unitPrice: subscriptions.unitPrice,
      frequencyDays: subscriptions.frequencyDays,
      status: subscriptions.status,
      nextOrderAt: subscriptions.nextOrderAt,
      lastOrderAt: subscriptions.lastOrderAt,
      createdAt: subscriptions.createdAt,
      userName: users.name,
      userPhone: users.phone,
      productSlug: products.slug,
    })
    .from(subscriptions)
    .leftJoin(users, eq(users.id, subscriptions.userId))
    .leftJoin(products, eq(products.id, subscriptions.productId))
    .where(where)
    .orderBy(sql`CASE WHEN ${subscriptions.status} = 'active' THEN 0 WHEN ${subscriptions.status} = 'paused' THEN 1 ELSE 2 END, ${subscriptions.nextOrderAt}`)
    .limit(limit);

  const [counts] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      active: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'active')::int`,
      paused: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'paused')::int`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${subscriptions.status} = 'cancelled')::int`,
    })
    .from(subscriptions);

  return NextResponse.json({ subscriptions: rows, counts });
}
