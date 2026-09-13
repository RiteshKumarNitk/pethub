import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export type NotificationInput = {
  userId: number;
  type: "order" | "booking" | "listing" | "inquiry" | "loyalty" | "subscription" | "system";
  title: string;
  body: string;
  link?: string;
};

export async function createNotification(input: NotificationInput) {
  try {
    await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link || null,
    });
  } catch (e) {
    // Never let notification failures break the primary workflow
    console.error("createNotification failed:", e);
  }
}

export async function listNotifications(userId: number, limit = 30) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function unreadCount(userId: number) {
  const [row] = await db
    .select({ val: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return row?.val ?? 0;
}
