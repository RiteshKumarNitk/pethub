import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, petListings, listingMedia, services, blogs, banners, faqs, reviews, users } from "@/db/schema";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getSettings();

    const [featured, bestSellers, cats, newestPets, serviceRows, blogRows, bannerRows, faqRows, testimonialRows] = await Promise.all([
      db
        .select({
          id: products.id, slug: products.slug, name: products.name, price: products.price,
          mrp: products.mrp, imageUrl: products.imageUrl, stock: products.stock,
        })
        .from(products)
        .where(and(eq(products.active, true), eq(products.isFeatured, true)))
        .orderBy(desc(products.createdAt))
        .limit(8),
      db
        .select({
          id: products.id, slug: products.slug, name: products.name, price: products.price,
          mrp: products.mrp, imageUrl: products.imageUrl, stock: products.stock,
        })
        .from(products)
        .where(and(eq(products.active, true), eq(products.isBestSeller, true)))
        .limit(8),
      db
        .select({ id: categories.id, name: categories.name, slug: categories.slug, icon: categories.icon, petType: categories.petType })
        .from(categories)
        .where(eq(categories.active, true))
        .orderBy(asc(categories.sortOrder))
        .limit(12),
      db
        .select({
          id: petListings.id, slug: petListings.slug, name: petListings.name, species: petListings.species,
          breed: petListings.breed, ageText: petListings.ageText, price: petListings.price,
          priceType: petListings.priceType, listingType: petListings.listingType, isVerified: petListings.isVerified, city: petListings.city,
        })
        .from(petListings)
        .where(eq(petListings.status, "approved"))
        .orderBy(desc(petListings.createdAt))
        .limit(8),
      db
        .select({
          id: services.id, slug: services.slug, name: services.name, price: services.price,
          imageUrl: services.imageUrl, durationMinutes: services.durationMinutes, priceNote: services.priceNote,
        })
        .from(services)
        .where(eq(services.active, true))
        .orderBy(asc(services.sortOrder))
        .limit(6),
      db
        .select({ title: blogs.title, slug: blogs.slug, excerpt: blogs.excerpt, thumbnailUrl: blogs.thumbnailUrl, readMinutes: blogs.readMinutes, createdAt: blogs.createdAt })
        .from(blogs)
        .where(eq(blogs.isPublished, true))
        .orderBy(desc(blogs.createdAt))
        .limit(3),
      db.select().from(banners).where(and(eq(banners.active, true), eq(banners.placement, "hero"))).orderBy(asc(banners.sortOrder)),
      db.select().from(faqs).where(eq(faqs.active, true)).orderBy(asc(faqs.sortOrder)).limit(6),
      db
        .select({ rating: reviews.rating, comment: reviews.comment, userName: users.name, createdAt: reviews.createdAt })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(and(eq(reviews.targetType, "product"), eq(reviews.status, "approved"), sql`${reviews.rating} >= 4`))
        .orderBy(desc(reviews.createdAt))
        .limit(4),
    ]);

    // Attach primary images to pets
    const petsWithMedia = await Promise.all(
      newestPets.map(async (l) => {
        const [media] = await db
          .select({ url: listingMedia.url })
          .from(listingMedia)
          .where(eq(listingMedia.listingId, l.id))
          .orderBy(asc(listingMedia.sortOrder))
          .limit(1);
        return { ...l, primaryImage: media?.url ?? null };
      })
    );

    return NextResponse.json({
      settings: {
        storeName: settings.storeName,
        tagline: settings.tagline,
        storePhone: settings.storePhone,
        whatsappNumber: settings.whatsappNumber,
        storeAddress: settings.storeAddress,
        storeHours: settings.storeHours,
        freeShippingAbove: settings.freeShippingAbove,
      },
      heroBanners: bannerRows,
      categories: cats,
      featuredProducts: featured,
      bestSellers,
      pets: petsWithMedia,
      services: serviceRows,
      articles: blogRows,
      faqs: faqRows,
      testimonials: testimonialRows,
    });
  } catch (error) {
    console.error("Home API error:", error);
    return NextResponse.json({ error: "Failed to load home data" }, { status: 500 });
  }
}
