import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, products, orders, bookings, services, petListings, inquiries, reviews, auditLog } from "@/db/schema";
import { count, eq, sql, desc, asc, and } from "drizzle-orm";

// Real-time operations feed — must never be served from Next's route cache
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats
 * Returns `attention` (the prioritized action queue for today) plus the
 * legacy totals metrics used by the dashboard.
 */
export async function GET() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // ---------- Attention queue ----------
    const [bookingsTodayRows, listingsPendingRows, inquiriesOpenRows, ordersPaidRows, lowStockRows, reviewsPendingRows] =
      await Promise.all([
        // Bookings today, earliest first
        db
          .select({
            id: bookings.id,
            bookingRef: bookings.bookingRef,
            slotTime: bookings.slotTime,
            status: bookings.status,
            petName: bookings.petName,
            petSpecies: bookings.petSpecies,
            customerName: bookings.customerName,
            customerPhone: bookings.customerPhone,
            serviceName: services.name,
          })
          .from(bookings)
          .innerJoin(services, eq(bookings.serviceId, services.id))
          .where(and(eq(bookings.bookingDate, todayStr), sql`${bookings.status} IN ('pending','confirmed')`))
          .orderBy(asc(bookings.slotTime))
          .limit(10),
        // Listings awaiting review
        db
          .select({
            id: petListings.id,
            name: petListings.name,
            species: petListings.species,
            breed: petListings.breed,
            intent: petListings.intent,
            listingType: petListings.listingType,
            createdAt: petListings.createdAt,
          })
          .from(petListings)
          .where(eq(petListings.status, "pending_review"))
          .orderBy(desc(petListings.createdAt))
          .limit(5),
        // Open inquiries
        db
          .select({
            id: inquiries.id,
            subject: inquiries.subject,
            type: inquiries.type,
            createdAt: inquiries.createdAt,
          })
          .from(inquiries)
          .where(eq(inquiries.status, "open"))
          .orderBy(desc(inquiries.createdAt))
          .limit(5),
        // Paid orders to process
        db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            total: orders.total,
            createdAt: orders.createdAt,
            itemCount: sql<number>`(SELECT COALESCE(SUM(oi.qty), 0) FROM order_items oi WHERE oi.order_id = ${orders.id})`,
          })
          .from(orders)
          .where(and(eq(orders.paymentStatus, "paid"), sql`${orders.status} IN ('paid','confirmed','processing')`))
          .orderBy(desc(orders.createdAt))
          .limit(5),
        // Low stock (online pool)
        db
          .select({ id: products.id, name: products.name, stock: products.stock, threshold: products.lowStockThreshold })
          .from(products)
          .where(and(eq(products.active, true), sql`${products.stock} <= ${products.lowStockThreshold}`))
          .orderBy(asc(products.stock))
          .limit(5),
        // Reviews awaiting moderation
        db
          .select({ id: reviews.id, rating: reviews.rating, title: reviews.title, targetType: reviews.targetType })
          .from(reviews)
          .where(eq(reviews.status, "pending"))
          .orderBy(desc(reviews.createdAt))
          .limit(5),
      ]);

    const [pendingListingsTotal] = await db
      .select({ val: count() })
      .from(petListings)
      .where(eq(petListings.status, "pending_review"));
    const [openInquiriesTotal] = await db.select({ val: count() }).from(inquiries).where(eq(inquiries.status, "open"));
    const [paidOrdersTotal] = await db
      .select({ val: count() })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), sql`${orders.status} IN ('paid','confirmed','processing')`));
    const [pendingReviewsTotal] = await db.select({ val: count() }).from(reviews).where(eq(reviews.status, "pending"));
    const [lowStockTotal] = await db
      .select({ val: count() })
      .from(products)
      .where(and(eq(products.active, true), sql`${products.stock} <= ${products.lowStockThreshold}`));

    const attention = {
      bookingsToday: { items: bookingsTodayRows, total: bookingsTodayRows.length },
      listingsPending: { items: listingsPendingRows, total: pendingListingsTotal?.val ?? 0 },
      inquiriesOpen: { items: inquiriesOpenRows, total: openInquiriesTotal?.val ?? 0 },
      ordersToProcess: { items: ordersPaidRows, total: paidOrdersTotal?.val ?? 0 },
      lowStock: { items: lowStockRows, total: lowStockTotal?.val ?? 0 },
      reviewsPending: { items: reviewsPendingRows, total: pendingReviewsTotal?.val ?? 0 },
    };

    // ---------- Legacy metrics (dashboard headline numbers) ----------
    const [
      [totalUsers], [totalOrders], [pendingOrders],
      [revenueRow], [todayBookings], [activeListingsRow],
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
        .where(and(eq(bookings.bookingDate, todayStr), sql`${bookings.status} IN ('pending','confirmed')`)),
      db.select({ val: count() }).from(petListings).where(eq(petListings.status, "approved")),
    ]);

    const [pendingBookings] = await db
      .select({ val: count() })
      .from(bookings)
      .where(eq(bookings.status, "pending"));

    const [upcomingBookings] = await db
      .select({ val: count() })
      .from(bookings)
      .where(and(sql`${bookings.bookingDate} >= ${todayStr}`, sql`${bookings.status} IN ('pending','confirmed')`));

    const recentActivity = await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(15);

    const ordersByStatus = await db
      .select({ status: orders.status, cnt: count() })
      .from(orders)
      .groupBy(orders.status);

    const [deliveredRevenue] = await db
      .select({ total: sql<string>`COALESCE(SUM(${orders.total})::numeric, 0)` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), eq(orders.status, "delivered")));

    return NextResponse.json({
      attention,
      totalUsers: totalUsers.val,
      totalOrders: totalOrders.val,
      pendingOrders: pendingOrders.val,
      totalRevenue: parseFloat(revenueRow.total),
      deliveredRevenue: parseFloat(deliveredRevenue.total),
      todayBookings: todayBookings.val,
      pendingBookings: pendingBookings.val,
      upcomingBookings: upcomingBookings.val,
      pendingListings: pendingListingsTotal?.val ?? 0,
      activeListings: activeListingsRow.val,
      openInquiries: openInquiriesTotal?.val ?? 0,
      pendingReviews: pendingReviewsTotal?.val ?? 0,
      recentActivity,
      ordersByStatus,
    });
  } catch (error) {
    console.error("Admin Stats GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
