import { NextRequest, NextResponse } from "next/server";
import { runCycleNow } from "@/lib/subscriptions";
import { logAudit } from "@/lib/utils";

/**
 * POST /api/subscriptions/order-now — body: { id }
 * Customer-triggered immediate cycle: creates a real order at subscription
 * pricing (server-authoritative), advances the schedule.
 */
export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  try {
    const body = await request.json();
    const id = parseInt(body?.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const result = await runCycleNow(id, userId, userId);
    if (result.status === "error") {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    if (result.status === "skipped") {
      const messages: Record<string, string> = {
        out_of_stock: "This item is currently out of stock — the cycle was skipped and will retry.",
        inactive: "This product is no longer available — the cycle was skipped.",
        no_address: "Add a delivery address to your account first, then order this cycle.",
      };
      const label = result.detail && messages[result.detail] ? result.detail : "skipped";
      return NextResponse.json(
        { error: messages[label] ?? "This cycle could not be ordered right now." },
        { status: 409 }
      );
    }

    await logAudit(userId, "subscription.order_now", "subscription", id, { orderId: result.orderId });
    return NextResponse.json({ ok: true, orderId: result.orderId });
  } catch (e) {
    console.error("Order-now failed:", e);
    return NextResponse.json({ error: "Could not order this cycle" }, { status: 500 });
  }
}
