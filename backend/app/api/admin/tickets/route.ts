import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportTickets, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const tickets = await db
      .select({
        id: supportTickets.id,
        userId: supportTickets.userId,
        subject: supportTickets.subject,
        message: supportTickets.message,
        status: supportTickets.status,
        adminReply: supportTickets.adminReply,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        userName: users.name,
        userPhone: users.phone,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .orderBy(desc(supportTickets.createdAt));

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Admin tickets GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
