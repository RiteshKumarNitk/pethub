import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, pets, petListings } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userIdHeader = request.headers.get("x-user-id");
    
    if (!userIdHeader) {
      return NextResponse.json({ authenticated: false });
    }

    const userId = parseInt(userIdHeader);

    // Fetch User Profile
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

    // Fetch Counts for Mobile Dashboard
    const [petCountRes] = await db
      .select({ val: count() })
      .from(pets)
      .where(eq(pets.userId, userId));

    const [listingCountRes] = await db
      .select({ val: count() })
      .from(petListings)
      .where(eq(petListings.userId, userId));

    return NextResponse.json({
      authenticated: true,
      user,
      stats: {
        pets: petCountRes.val,
        listings: listingCountRes.val,
      }
    });
  } catch (error) {
    console.error("Mobile Me GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
