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
        email: users.email,
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

/** PUT — update profile (name, email) */
export async function PUT(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const patch: Record<string, string | null> = {};
    if (body.name !== undefined) patch.name = body.name?.trim() || null;
    if (body.email !== undefined) patch.email = body.email?.trim() || null;

    const [updated] = await db.update(users).set(patch).where(eq(users.id, userId)).returning();

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Mobile Me PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
