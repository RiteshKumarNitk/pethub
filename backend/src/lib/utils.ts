import { db } from "@/db";
import { auditLog } from "@/db/schema";

export async function logAudit(
  actorId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: unknown
) {
  try {
    await db.insert(auditLog).values({
      actorId: actorId ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      details: (details ?? null) as never,
    });
  } catch (e) {
    console.error("audit log failed:", e);
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);
}

export function orderNumber(id: number): string {
  const d = new Date();
  return `PS-${d.getFullYear()}-${String(id).padStart(6, "0")}`;
}

export function bookingRef(id: number): string {
  return `BK-${String(id).padStart(6, "0")}`;
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{9,14}$/.test(phone);
}

export function money(n: number): string {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

/** Compute cart/checkout totals server-side. Single source of truth. */
export function computeTotals(opts: {
  subtotal: number;
  discountPercent?: number;
  discountFlat?: number;
  maxDiscount?: number;
  shippingFee: number;
  freeShippingAbove: number;
  taxPercent: number;
}) {
  const subtotal = round2(opts.subtotal);
  let discount = 0;
  if (opts.discountPercent && opts.discountPercent > 0) {
    discount = (subtotal * opts.discountPercent) / 100;
    if (opts.maxDiscount && opts.maxDiscount > 0) discount = Math.min(discount, opts.maxDiscount);
  }
  if (opts.discountFlat && opts.discountFlat > 0) {
    discount = Math.max(discount, opts.discountFlat);
  }
  discount = Math.min(round2(discount), subtotal);

  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount >= opts.freeShippingAbove ? 0 : opts.shippingFee;
  const tax = round2((afterDiscount * opts.taxPercent) / 100);
  const total = round2(afterDiscount + shipping + tax);

  return { subtotal, discount, shipping, tax, total };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
