import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { petListings, listingMedia } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";

/** GET /api/pet-listings/mine — the signed-in customer's own listings (all statuses) */
export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listings = await db
      .select({
        id: petListings.id,
        slug: petListings.slug,
        name: petListings.name,
        species: petListings.species,
        breed: petListings.breed,
        price: petListings.price,
        priceType: petListings.priceType,
        status: petListings.status,
        moderationNote: petListings.moderationNote,
        listingType: petListings.listingType,
        createdAt: petListings.createdAt,
      })
      .from(petListings)
      .where(eq(petListings.ownerId, userId))
      .orderBy(desc(petListings.createdAt));

    const withPrimary = await Promise.all(
      listings.map(async (l) => {
        const [media] = await db
          .select({ url: listingMedia.url })
          .from(listingMedia)
          .where(eq(listingMedia.listingId, l.id))
          .orderBy(asc(listingMedia.sortOrder))
          .limit(1);
        return { ...l, primaryImage: media?.url ?? null };
      })
    );

    return NextResponse.json({ listings: withPrimary });
  } catch (error) {
    console.error("My listings error:", error);
    return NextResponse.json({ error: "Failed to fetch your listings" }, { status: 500 });
  }
}

/** DELETE /api/pet-listings/mine?id= — owner closes their own listing */
export async function DELETE(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0");
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");
    if (!userId || !id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [listing] = await db
      .select()
      .from(petListings)
      .where(and(eq(petListings.id, id), eq(petListings.ownerId, userId)))
      .limit(1);
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    if (["sold", "adopted", "closed"].includes(listing.status)) {
      return NextResponse.json({ error: "Listing is already closed" }, { status: 400 });
    }

    await db.update(petListings).set({ status: "closed", updatedAt: new Date() }).where(eq(petListings.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Close listing error:", error);
    return NextResponse.json({ error: "Failed to close listing" }, { status: 500 });
  }
}
