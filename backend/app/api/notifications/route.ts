import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { listNotifications, unreadCount } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [items, unread] = await Promise.all([
      listNotifications(userId),
      unreadCount(userId),
    ]);

    return NextResponse.json({ notifications: items, unread });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/** POST /api/notifications — { id } marks one read; { all: true } marks all read */
export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    if (body.all) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, body.id), eq(notifications.userId, userId)));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Provide id or all:true" }, { status: 400 });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
