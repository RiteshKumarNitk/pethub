import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, orders, bookings, petListings, inquiries, reviews, auditLog } from "@/db/schema";
import { count, eq, sql, desc, and, lte } from "drizzle-orm";

export async function GET() {
  try {
    const [
      [totalUsers], [totalOrders], [pendingOrders],
      [revenueRow], [todayBookings], [pendingListingsRow],
      [activeListingsRow], [openInquiriesRow], [pendingReviewsRow],
    ] = await Promise.all([
      db.select({ val: count() }).from(users).where(eq(users.role, "user")),
      db.select({ val: count() }).from(orders),
      db.select({ val: count() }).from(orders).where(eq(orders.status, "pending")),
      db
        .select({ total: sql<string>`COALESCE(SUM(${orders.total})::numeric, 0)` })
        .from(orders)
        .where(eq(orders.paymentStatus, "paid")),
      db
        .select({ val: count() })
        .from(bookings)
        .where(and(eq(bookings.bookingDate, new Date().toISOString().slice(0, 10)), sql`${bookings.status} IN ('pending','confirmed')`)),
      db.select({ val: count() }).from(petListings).where(eq(petListings.status, "pending_review")),
      db.select({ val: count() }).from(petListings).where(eq(petListings.status, "approved")),
      db.select({ val: count() }).from(inquiries).where(eq(inquiries.status, "open")),
      db.select({ val: count() }).from(reviews).where(eq(reviews.status, "pending")),
    ]);

    // Low stock products
    const lowStock = await db
      .select({ id: products.id, name: products.name, stock: products.stock, threshold: products.lowStockThreshold })
      .from(products)
      .where(and(eq(products.active, true), sql`${products.stock} <= ${products.lowStockThreshold}`))
      .limit(10);

    // Booking stats
    const [pendingBookings] = await db
      .select({ val: count() })
      .from(bookings)
      .where(eq(bookings.status, "pending"));

    const [upcomingBookings] = await db
      .select({ val: count() })
      .from(bookings)
      .where(and(
        sql`${bookings.bookingDate} >= ${new Date().toISOString().slice(0, 10)}`,
        sql`${bookings.status} IN ('pending','confirmed')`
      ));

    // Recent activity
    const recentActivity = await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(15);

    // Orders by status
    const ordersByStatus = await db
      .select({ status: orders.status, cnt: count() })
      .from(orders)
      .groupBy(orders.status);

    const [deliveredRevenue] = await db
      .select({ total: sql<string>`COALESCE(SUM(${orders.total})::numeric, 0)` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), eq(orders.status, "delivered")));

    return NextResponse.json({
      totalUsers: totalUsers.val,
      totalOrders: totalOrders.val,
      pendingOrders: pendingOrders.val,
      totalRevenue: parseFloat(revenueRow.total),
      deliveredRevenue: parseFloat(deliveredRevenue.total),
      todayBookings: todayBookings.val,
      pendingBookings: pendingBookings.val,
      upcomingBookings: upcomingBookings.val,
      pendingListings: pendingListingsRow.val,
      activeListings: activeListingsRow.val,
      openInquiries: openInquiriesRow.val,
      pendingReviews: pendingReviewsRow.val,
      lowStock,
      recentActivity,
      ordersByStatus,
    });
  } catch (error) {
    console.error("Admin Stats GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
