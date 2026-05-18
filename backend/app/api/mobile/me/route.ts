import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userIdHeader = request.headers.get("x-user-id");
    
    if (!userIdHeader) {
      return NextResponse.json({ authenticated: false });
    }

    const userId = parseInt(userIdHeader);

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 404 });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Mobile Me GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
