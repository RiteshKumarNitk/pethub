import { NextResponse } from "next/server";
import { db } from "@/db";
import { petListings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const listing = await db.query.petListings.findFirst({
      where: eq(petListings.id, id),
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("Failed to fetch listing", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
