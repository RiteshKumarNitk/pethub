import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { petListings, listingMedia } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { slugify, logAudit, isValidPhone } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { getSettings } from "@/lib/settings";

const VALID_SPECIES = ["Dog", "Cat", "Bird", "Small Pet", "Other"];
const VALID_PRICE_TYPES = ["fixed", "negotiable", "free", "adoption_fee"];

/**
 * POST /api/pet-listings/submit — customer submits a community listing.
 * ALWAYS creates as pending_review; never auto-publishes.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id") || "0") || null;
    const body = await request.json();

    const {
      name, species, breed, gender, ageMonths, ageText, color, size,
      price, priceType, city, state, description, temperament, healthInfo,
      vaccinated, vaccinationDetails, videoUrl, images, contactName, contactPhone, contactPreference,
    } = body;

    // Validation
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ error: "Pet name is required" }, { status: 400 });
    }
    if (!species || !VALID_SPECIES.includes(species)) {
      return NextResponse.json({ error: "Please choose a valid pet type" }, { status: 400 });
    }
    if (priceType && !VALID_PRICE_TYPES.includes(priceType)) {
      return NextResponse.json({ error: "Invalid price type" }, { status: 400 });
    }
    const effectivePriceType = priceType || "fixed";
    if (["fixed", "negotiable", "adoption_fee"].includes(effectivePriceType) && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json({ error: "Please provide a valid price (or choose Free)" }, { status: 400 });
    }
    if (contactPhone && !isValidPhone(String(contactPhone))) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "At least one photo is required" }, { status: 400 });
    }
    if (images.length > 8) {
      return NextResponse.json({ error: "Maximum 8 photos allowed" }, { status: 400 });
    }
    if (userId) {
      // Rate limit per user: max 5 pending listings at once
      const pending = await db
        .select({ id: petListings.id })
        .from(petListings)
        .where(and(eq(petListings.ownerId, userId), eq(petListings.status, "pending_review")));
      if (pending.length >= 5) {
        return NextResponse.json(
          { error: "You already have 5 listings awaiting review. Please wait for them to be processed." },
          { status: 429 }
        );
      }
    }

    const settings = await getSettings();

    const [listing] = await db
      .insert(petListings)
      .values({
        slug: `${slugify(`${name}-${species}-${Date.now().toString(36)}`)}`,
        listingType: "community",
        ownerId: userId,
        name: String(name).trim(),
        species,
        breed: breed || null,
        gender: gender || null,
        ageMonths: ageMonths ? parseInt(ageMonths) : null,
        ageText: ageText || null,
        color: color || null,
        size: size || null,
        price: price ? parseFloat(price).toString() : null,
        priceType: effectivePriceType,
        city: city || null,
        state: state || null,
        description: description || null,
        temperament: temperament || null,
        healthInfo: healthInfo || null,
        vaccinated: !!vaccinated,
        vaccinationDetails: vaccinationDetails || null,
        videoUrl: videoUrl || null,
        status: "pending_review",
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        contactPreference: contactPreference || "platform",
      })
      .returning();

    // Save media
    await db.insert(listingMedia).values(
      images.slice(0, 8).map((url: string, idx: number) => ({
        listingId: listing.id,
        url,
        type: "image",
        sortOrder: idx,
      }))
    );

    if (userId) {
      await createNotification({
        userId,
        type: "listing",
        title: "Listing submitted",
        body: `Your listing for ${listing.name} was received and is awaiting review. We usually respond within 24 hours.`,
        link: "/account/listings",
      });
    }
    await logAudit(userId, "listing.submit", "pet_listing", listing.id, { name, species });

    return NextResponse.json(
      {
        listing,
        notice: settings.listingModerationNotice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Listing submit error:", error);
    return NextResponse.json({ error: "Failed to submit listing" }, { status: 500 });
  }
}
