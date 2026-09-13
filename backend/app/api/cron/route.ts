import { NextRequest, NextResponse } from "next/server";
import { processDueSubscriptions, sendBookingReminders } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron
 * Scheduled jobs: due subscription cycles + T-24h booking reminders.
 * Protect with CRON_SECRET env: /api/cron?secret=... or Authorization: Bearer ...
 * Without CRON_SECRET set, the endpoint is disabled (never open in prod).
 */
async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)" }, { status: 503 });
  }
  const provided =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const [cycles, remindersSent] = await Promise.all([
    processDueSubscriptions(null),
    sendBookingReminders(),
  ]);

  return NextResponse.json({
    ok: true,
    ranInMs: Date.now() - started,
    subscriptionCycles: {
      processed: cycles.length,
      byStatus: cycles.reduce<Record<string, number>>((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}),
      details: cycles,
    },
    bookingRemindersSent: remindersSent,
  });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
