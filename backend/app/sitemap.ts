import { MetadataRoute } from "next";
import { db } from "@/db";
import { categories, products, petListings, services, blogs } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://pawstore.in";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/store`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pets`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/services`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/sell-rehome`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pet-care`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/shipping-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/refund-policy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [catRows, productRows, listingRows, serviceRows, blogRows] = await Promise.all([
      db.select({ slug: categories.slug, updatedAt: categories.createdAt }).from(categories).where(eq(categories.active, true)).limit(300),
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.active, true)).limit(1000),
      db.select({ slug: petListings.slug, updatedAt: petListings.updatedAt }).from(petListings).where(eq(petListings.status, "approved")).limit(500),
      db.select({ slug: services.slug }).from(services).where(eq(services.active, true)),
      db.select({ slug: blogs.slug, updatedAt: blogs.updatedAt }).from(blogs).where(eq(blogs.isPublished, true)).limit(500),
    ]);

    return [
      ...staticRoutes,
      ...catRows.map((c) => ({ url: `${base}/c/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...productRows.map((p) => ({ url: `${base}/shop/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...listingRows.map((l) => ({ url: `${base}/pets/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
      ...serviceRows.map((s) => ({ url: `${base}/services/${s.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...blogRows.map((b) => ({ url: `${base}/pet-care/${b.slug}`, lastModified: b.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
  } catch {
    return staticRoutes;
  }
}
