import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { petListings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = parseInt(params.id);
    const body = await request.json();
    const { isApproved, showPrice } = body;

    const updateData: any = {};
    if (typeof isApproved === "string") updateData.isApproved = isApproved;
    if (typeof showPrice === "boolean") updateData.showPrice = showPrice;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No update data provided" }, { status: 400 });
    }

    const [updatedListing] = await db
      .update(petListings)
      .set(updateData)
      .where(eq(petListings.id, listingId))
      .returning();

    if (!updatedListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      listing: updatedListing,
      message: `Listing status updated to ${isApproved}`
    });
  } catch (error) {
    console.error("Admin Listing PATCH error:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listingId = parseInt(params.id);

    const [deletedListing] = await db
      .delete(petListings)
      .where(eq(petListings.id, listingId))
      .returning();

    if (!deletedListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("Admin Listing DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
