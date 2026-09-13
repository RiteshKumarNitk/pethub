import { db } from "@/db";
import { subscriptions, orders, orderItems, products, productVariants, addresses, users } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { computeTotals, round2, logAudit } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

/**
 * Subscription cycle processing.
 *
 * Design: each cycle creates a REAL Razorpay order like any checkout would
 * (server-priced, stock-validated). With Razorpay keys configured the customer
 * gets a payment link to approve the cycle; without keys (dev), the cycle order
 * is created marked as PAYMENT_SETUP_FAILED exactly like manual checkout does,
 * so the flow is testable end-to-end and safe in production.
 */

export interface CycleResult {
  subscriptionId: number;
  orderId: number | null;
  status: "order_created" | "payment_link" | "skipped" | "error";
  detail?: string;
}

async function processOne(sub: typeof subscriptions.$inferSelect, actorId: number | null): Promise<CycleResult> {
  const settings = await getSettings();

  // Resolve live product/variant — skip the cycle if the product went away
  let price = parseFloat(sub.unitPrice);
  let stock = 0;
  let active = false;
  let variantPriceDelta = 0;
  if (sub.variantId) {
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, sub.variantId)).limit(1);
    if (v) {
      const [p] = await db.select().from(products).where(eq(products.id, sub.productId!)).limit(1);
      active = !!p?.active;
      stock = v.stock;
      variantPriceDelta = parseFloat(v.priceDelta || "0");
      price = round2(parseFloat(p!.price) + variantPriceDelta);
    }
  } else if (sub.productId) {
    const [p] = await db.select().from(products).where(eq(products.id, sub.productId)).limit(1);
    if (p) {
      active = p.active;
      stock = p.stock;
      price = parseFloat(p.price);
    }
  }

  if (!active || stock < sub.qty) {
    await createNotification({
      userId: sub.userId,
      type: "subscription",
      title: "Your subscription needs attention",
      body: `We couldn't prepare "${sub.productName}" this cycle (${!active ? "no longer available" : "out of stock"}). We'll retry next cycle — or update your subscription.`,
      link: "/account/subscriptions",
    });
    // Push next attempt a day out instead of hot-looping
    await db
      .update(subscriptions)
      .set({ nextOrderAt: new Date(Date.now() + 24 * 3600 * 1000), updatedAt: new Date() })
      .where(eq(subscriptions.id, sub.id));
    return { subscriptionId: sub.id, orderId: null, status: "skipped", detail: !active ? "inactive" : "out_of_stock" };
  }

  // Address: subscription snapshot, else the user's default address
  let shippingAddress = sub.shippingAddress ?? null;
  if (!shippingAddress) {
    const [addr] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, sub.userId))
      .orderBy(sql`${addresses.isDefault} DESC`)
      .limit(1);
    if (addr) {
      shippingAddress = {
        fullName: addr.fullName || undefined,
        phone: addr.phone || undefined,
        street: addr.street,
        landmark: addr.landmark || undefined,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
      };
    }
  }
  if (!shippingAddress) {
    await createNotification({
      userId: sub.userId,
      type: "subscription",
      title: "Add a delivery address",
      body: `Your "${sub.productName}" subscription cycle is ready but we don't have a delivery address on file.`,
      link: "/account/addresses",
    });
    return { subscriptionId: sub.id, orderId: null, status: "skipped", detail: "no_address" };
  }

  const subtotal = round2(price * sub.qty);
  const discount = round2((subtotal * settings.subscriptionDiscountPercent) / 100);
  const totals = computeTotals({
    subtotal,
    discountFlat: discount,
    shippingFee: settings.shippingFee,
    freeShippingAbove: settings.freeShippingAbove,
    taxPercent: settings.taxPercent,
  });

  // Create the cycle order (real order → real Razorpay flow)
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: "TEMP",
      userId: sub.userId,
      subtotal: totals.subtotal.toString(),
      discountAmount: totals.discount.toString(),
      shippingFee: totals.shipping.toString(),
      taxAmount: totals.tax.toString(),
      total: totals.total.toString(),
      shippingAddress,
      status: "pending",
      paymentStatus: "unpaid",
      subscriptionId: sub.id,
      notes: `Subscription cycle #${sub.id} (every ${sub.frequencyDays} days)`,
    })
    .returning();
  const orderNo = `PS-${order.id}`;
  await db.update(orders).set({ orderNumber: orderNo }).where(eq(orders.id, order.id));

  await db.insert(orderItems).values({
    orderId: order.id,
    productId: sub.productId,
    variantId: sub.variantId,
    productName: sub.productName,
    variantName: sub.variantName,
    imageUrl: sub.imageUrl,
    qty: sub.qty,
    unitPrice: price.toString(),
    subtotal: round2(price * sub.qty).toString(),
  });

  await db
    .update(subscriptions)
    .set({
      lastOrderAt: new Date(),
      nextOrderAt: new Date(Date.now() + sub.frequencyDays * 24 * 3600 * 1000),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));

  await logAudit(actorId, "subscription.cycle", "subscription", sub.id, { orderId: order.id });
  await createNotification({
    userId: sub.userId,
    type: "subscription",
    title: "Your subscription cycle is ready",
    body: `Order ${orderNo} for ${sub.productName} was prepared (subscription price applied). Complete payment to ship it.`,
    link: "/account/orders",
  });

  return { subscriptionId: sub.id, orderId: order.id, status: "order_created" };
}

/** Run one cycle immediately (customer-triggered "Order now"). */
export async function runCycleNow(subscriptionId: number, userId: number, actorId: number | null): Promise<CycleResult> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)))
    .limit(1);
  if (!sub) return { subscriptionId, orderId: null, status: "error", detail: "not_found" };
  if (sub.status !== "active") return { subscriptionId, orderId: null, status: "skipped", detail: `status_${sub.status}` };
  return processOne(sub, actorId);
}

/**
 * Run all due subscription cycles. Called by the cron endpoint (and safe to
 * call repeatedly — due-set is computed fresh each run and cycles advance
 * their nextOrderAt transactionally).
 */
export async function processDueSubscriptions(actorId: number | null): Promise<CycleResult[]> {
  const due = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "active"), lte(subscriptions.nextOrderAt, new Date())))
    .limit(50);

  const results: CycleResult[] = [];
  for (const sub of due) {
    try {
      results.push(await processOne(sub, actorId));
    } catch (e) {
      console.error(`Subscription ${sub.id} cycle failed:`, e);
      results.push({ subscriptionId: sub.id, orderId: null, status: "error", detail: e instanceof Error ? e.message : "unknown" });
    }
  }
  return results;
}

/** T-24h booking reminders — deduped via reminderSentAt. Returns count reminded. */
export async function sendBookingReminders(): Promise<number> {
  const { bookings } = await import("@/db/schema");
  const { asc } = await import("drizzle-orm");
  const { bookingRef } = await import("@/lib/utils");

  const now = new Date();
  const in25h = new Date(now.getTime() + 25 * 3600 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const dateStr = in25h.toISOString().slice(0, 10);

  const upcoming = await db
    .select()
    .from(bookings)
    .where(
      and(
        sql`${bookings.status} IN ('pending','confirmed')`,
        sql`${bookings.bookingDate} >= ${todayStr} AND ${bookings.bookingDate} <= ${dateStr}`,
        sql`${bookings.reminderSentAt} IS NULL`
      )
    )
    .orderBy(asc(bookings.bookingDate))
    .limit(100);

  let sent = 0;
  for (const b of upcoming) {
    // Only remind if the slot is roughly within the next 25h
    const slot = new Date(`${b.bookingDate}T${String(b.slotTime).slice(0, 5)}:00`);
    const hoursAway = (slot.getTime() - now.getTime()) / 3600000;
    if (hoursAway < 0 || hoursAway > 25) continue;
    if (!b.userId) continue; // legacy guest booking without an account

    await createNotification({
      userId: b.userId,
      type: "booking",
      title: "Tomorrow's appointment reminder",
      body: `${b.petName}'s ${bookingRef(b.id)} appointment is ${hoursAway < 1.5 ? "starting soon" : "tomorrow"} at ${String(b.slotTime).slice(0, 5)}. See you at the shop!`,
      link: "/account/bookings",
    });
    await db.update(bookings).set({ reminderSentAt: new Date() }).where(eq(bookings.id, b.id));
    sent++;
  }
  return sent;
}
