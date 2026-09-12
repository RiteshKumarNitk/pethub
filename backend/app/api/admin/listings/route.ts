import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { petListings, listingMedia, users } from "@/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { logAudit } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["pending_review", "closed"],
  pending_review: ["approved", "rejected", "closed"],
  approved: ["sold", "adopted", "closed", "suspended"],
  rejected: ["pending_review", "closed"],
  suspended: ["approved", "closed"],
  sold: ["closed"],
  adopted: ["closed"],
  closed: [],
};

/** GET /api/admin/listings?status=&type= — moderation queue */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const slug = searchParams.get("slug");

    const filters = [];
    if (status && status !== "all") filters.push(eq(petListings.status, status));
    if (type && type !== "all") filters.push(eq(petListings.listingType, type));

    const rows = await db
      .select({
        listing: petListings,
        ownerName: users.name,
        ownerPhone: users.phone,
      })
      .from(petListings)
      .leftJoin(users, eq(petListings.ownerId, users.id))
        .where(filters.length ? and(...filters) : undefined)
      .orderBy(
        // Pending first, then newest
        desc(petListings.createdAt)
      )
      .limit(100);

    const withMedia = await Promise.all(
      rows.map(async (r) => {
        const media = await db
          .select()
          .from(listingMedia)
          .where(eq(listingMedia.listingId, r.listing.id))
          .orderBy(listingMedia.sortOrder);
        return { ...r.listing, ownerName: r.ownerName, ownerPhone: r.ownerPhone, media };
      })
    );

    const counts = await db
      .select({ status: petListings.status, cnt: count() })
      .from(petListings)
      .groupBy(petListings.status);
    return NextResponse.json({ listings: withMedia, counts });
  } catch (error) {
    console.error("Admin listings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

/** PATCH /api/admin/listings — moderate a listing: approve, reject, suspend, mark sold/adopted */
export async function PATCH(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const { id, action, moderationNote, isVerified, featured } = body;
    if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

    const [listing] = await db
      .select()
      .from(petListings)
      .where(eq(petListings.id, id))
      .limit(1);
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    let newStatus = listing.status;

    switch (action) {
      case "approve":
        if (!VALID_TRANSITIONS[listing.status]?.includes("approved")) {
          return NextResponse.json({ error: `Cannot approve from ${listing.status}` }, { status: 400 });
        }
        newStatus = "approved";
        break;
      case "reject":
        if (!VALID_TRANSITIONS[listing.status]?.includes("rejected")) {
          return NextResponse.json({ error: `Cannot reject from ${listing.status}` }, { status: 400 });
        }
        newStatus = "rejected";
        break;
      case "suspend":
        newStatus = "suspended";
        break;
      case "mark_sold":
        newStatus = "sold";
        break;
      case "mark_adopted":
        newStatus = "adopted";
        break;
      case "close":
        newStatus = "closed";
        break;
      case "feature":
        await db.update(petListings).set({ featured: !listing.featured, updatedAt: new Date() }).where(eq(petListings.id, id));
        return NextResponse.json({ success: true, featured: !listing.featured });
      case "verify":
        await db.update(petListings).set({ isVerified: !listing.isVerified, updatedAt: new Date() }).where(eq(petListings.id, id));
        return NextResponse.json({ success: true, isVerified: !listing.isVerified });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await db
      .update(petListings)
      .set({
        status: newStatus,
        moderationNote: moderationNote ?? (action === "reject" ? listing.moderationNote : null),
        reviewedBy: adminId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(petListings.id, id));

    // Notify owner on meaningful transitions
    if (listing.ownerId) {
      const messages: Record<string, { title: string; body: string }> = {
        approved: { title: "Listing approved 🎉", body: `Your listing for ${listing.name} is now live.` },
        rejected: {
          title: "Listing needs changes",
          body: `Your listing for ${listing.name} was not approved.${moderationNote ? ` Reason: ${moderationNote}` : ""}`,
        },
        sold: { title: "Listing marked as sold", body: `Your listing for ${listing.name} was marked as sold.` },
        adopted: { title: "Listing marked as adopted", body: `Your listing for ${listing.name} was marked as adopted.` },
      };
      const msg = messages[action];
      if (msg) {
        await createNotification({ userId: listing.ownerId, type: "listing", ...msg, link: "/account/listings" });
      }
    }

    await logAudit(adminId, `listing.${action}`, "pet_listing", id, { from: listing.status, to: newStatus });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Admin listings PATCH error:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

/** POST /api/admin/listings — create/edit business pet listings */
export async function POST(request: NextRequest) {
  try {
    const adminId = parseInt(request.headers.get("x-user-id")!);
    const body = await request.json();
    const {
      id, name, species, breed, gender, ageMonths, ageText, color, size,
      price, priceType, city, state, description, temperament, healthInfo,
      vaccinated, vaccinationDetails, videoUrl, images, status, featured, isVerified,
    } = body;

    if (!name || !species) {
      return NextResponse.json({ error: "Name and species are required" }, { status: 400 });
    }

    const base = {
      name,
      species,
      breed: breed || null,
      gender: gender || null,
      ageMonths: ageMonths ? parseInt(ageMonths) : null,
      ageText: ageText || null,
      color: color || null,
      size: size || null,
      price: price ? String(price) : null,
      priceType: priceType || "fixed",
      city: city || null,
      state: state || null,
      description: description || null,
      temperament: temperament || null,
      healthInfo: healthInfo || null,
      vaccinated: !!vaccinated,
      vaccinationDetails: vaccinationDetails || null,
      videoUrl: videoUrl || null,
      featured: !!featured,
      isVerified: isVerified !== false, // business listings verified by default
      status: status || "approved",
      updatedAt: new Date(),
    };

    if (id) {
      await db.update(petListings).set(base).where(eq(petListings.id, id));
      if (Array.isArray(images)) {
        await db.delete(listingMedia).where(eq(listingMedia.listingId, id));
        if (images.length) {
          await db.insert(listingMedia).values(images.map((url: string, idx: number) => ({
            listingId: id, url, type: "image", sortOrder: idx,
          })));
        }
      }
      await logAudit(adminId, "listing.update_business", "pet_listing", id);
      return NextResponse.json({ success: true, id });
    }

    const slug = `${slugify(name)}-${Date.now().toString(36)}`;
    const [listing] = await db
      .insert(petListings)
      .values({
        ...base,
        slug,
        listingType: "business",
        ownerId: null,
        status: status || "approved",
      })
      .returning();

    if (images?.length) {
      await db.insert(listingMedia).values(images.map((url: string, idx: number) => ({
        listingId: listing.id, url, type: "image", sortOrder: idx,
      })));
    }

    await logAudit(adminId, "listing.create_business", "pet_listing", listing.id);
    return NextResponse.json({ success: true, id: listing.id }, { status: 201 });
  } catch (error) {
    console.error("Admin listings POST error:", error);
    return NextResponse.json({ error: "Failed to save business listing" }, { status: 500 });
  }
}

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 70);
}
