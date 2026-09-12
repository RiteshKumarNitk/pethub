import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { petListings, listingMedia, users } from "@/db/schema";
import { eq, and, ne, asc, sql } from "drizzle-orm";

/**
 * GET /api/pet-listings/[slug] — public detail for approved listings.
 * Returns listing + media. Community listings expose only contact preference,
 * not raw contact details (inquiries are routed through the platform).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [listing] = await db
      .select()
      .from(petListings)
      .where(eq(petListings.slug, slug))
      .limit(1);

    if (!listing || listing.status !== "approved") {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Fire-and-forget view counter
    db.update(petListings)
      .set({ viewCount: sql`${petListings.viewCount} + 1` })
      .where(eq(petListings.id, listing.id))
      .catch(() => {});

    const media = await db
      .select()
      .from(listingMedia)
      .where(eq(listingMedia.listingId, listing.id))
      .orderBy(asc(listingMedia.sortOrder));

    const related = await db
      .select({
        id: petListings.id,
        slug: petListings.slug,
        name: petListings.name,
        species: petListings.species,
        breed: petListings.breed,
        ageText: petListings.ageText,
        price: petListings.price,
        listingType: petListings.listingType,
        isVerified: petListings.isVerified,
      })
      .from(petListings)
      .where(
        and(
          eq(petListings.status, "approved"),
          ne(petListings.id, listing.id),
          eq(petListings.species, listing.species)
        )
      )
      .limit(4);

    // Business name from settings for verified badge display
    let ownerName: string | null = null;
    if (listing.listingType === "community" && listing.ownerId) {
      const [owner] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, listing.ownerId))
        .limit(1);
      ownerName = owner?.name ?? null;
    }

    // Strip contact details for community listings — contact goes through inquiries
    const isCommunity = listing.listingType === "community";
    const contact = isCommunity
      ? { contactPreference: listing.contactPreference }
      : { contactPreference: "platform" };

    return NextResponse.json({
      listing: {
        ...listing,
        contactPhone: undefined,
        contactName: undefined,
      },
      media,
      ownerName,
      contact,
      related,
    });
  } catch (error) {
    console.error("Pet listing detail error:", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}
