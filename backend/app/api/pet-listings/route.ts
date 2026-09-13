import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { petListings, listingMedia } from "@/db/schema";
import { eq, and, or, ilike, count, desc, asc, sql } from "drizzle-orm";

/**
 * GET /api/pet-listings — public browse. Only approved listings are public.
 * Query: type (business|community|all), species, search, page, limit, sort
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const type = searchParams.get("type");
    const species = searchParams.get("species");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "new";
    const featured = searchParams.get("featured");

    const filters = [eq(petListings.status, "approved")];

    if (type && type !== "all") {
      filters.push(eq(petListings.listingType, type));
    }
    if (species && species !== "all") {
      filters.push(eq(petListings.species, species));
    }
    if (search) {
      const pattern = `%${search}%`;
      filters.push(
        or(
          ilike(petListings.name, pattern),
          ilike(petListings.breed, pattern),
          ilike(petListings.description, pattern)
        )!
      );
    }
    if (featured === "true") {
      filters.push(eq(petListings.featured, true));
    }

    const where = and(...filters)!;

    const [totalRow] = await db.select({ total: count() }).from(petListings).where(where);
    const total = totalRow?.total ?? 0;

    const orderBy =
      sort === "oldest"
        ? asc(petListings.createdAt)
        : sort === "price_asc"
          ? asc(petListings.price)
          : sort === "price_desc"
            ? desc(petListings.price)
            : desc(petListings.createdAt);

    const rows = await db
      .select({
        id: petListings.id,
        slug: petListings.slug,
        listingType: petListings.listingType,
        name: petListings.name,
        species: petListings.species,
        breed: petListings.breed,
        gender: petListings.gender,
        ageText: petListings.ageText,
        ageMonths: petListings.ageMonths,
        price: petListings.price,
        priceType: petListings.priceType,
        intent: petListings.intent,
        city: petListings.city,
        vaccinated: petListings.vaccinated,
        isVerified: petListings.isVerified,
        featured: petListings.featured,
        createdAt: petListings.createdAt,
      })
      .from(petListings)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset((page - 1) * limit);

    // Primary image per listing
    const withMedia = await Promise.all(
      rows.map(async (l) => {
        const [media] = await db
          .select({ url: listingMedia.url, type: listingMedia.type })
          .from(listingMedia)
          .where(eq(listingMedia.listingId, l.id))
          .orderBy(asc(listingMedia.sortOrder))
          .limit(1);
        return { ...l, primaryImage: media?.url ?? null };
      })
    );

    return NextResponse.json({
      listings: withMedia,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Pet listings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
