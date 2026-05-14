import { NextResponse } from "next/server";
import { db } from "@/db";
import { adoptionInterests } from "@/db/schema";
import { getTokenFromCookies } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getTokenFromCookies();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId, notes } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const [interest] = await db
      .insert(adoptionInterests)
      .values({
        userId: user.userId,
        listingId: parseInt(listingId),
        notes: notes || "",
        status: "pending",
      })
      .returning();

    return NextResponse.json({ success: true, interest });
  } catch (error) {
    console.error("Failed to record interest", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
