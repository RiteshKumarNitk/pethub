import { NextResponse } from "next/server";
import { db } from "@/db";
import { adoptionInterests, users, petListings } from "@/db/schema";
import { getTokenFromCookies } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getTokenFromCookies();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leads = await db
      .select({
        id: adoptionInterests.id,
        status: adoptionInterests.status,
        notes: adoptionInterests.notes,
        createdAt: adoptionInterests.createdAt,
        userName: users.name,
        userPhone: users.phone,
        petBreed: petListings.breed,
        petId: petListings.id,
      })
      .from(adoptionInterests)
      .innerJoin(users, eq(adoptionInterests.userId, users.id))
      .innerJoin(petListings, eq(adoptionInterests.listingId, petListings.id))
      .orderBy(desc(adoptionInterests.createdAt));

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Failed to fetch leads", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
