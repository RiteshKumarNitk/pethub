import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { products, productImages, productVariants, categories, brands, reviews, users } from "@/db/schema";
import { eq, and, or, ne, sql, count, desc, inArray } from "drizzle-orm";
import { Star, ChevronRight, Store, PhoneCall, PawPrint, Package } from "lucide-react";
import ProductBuyBox from "@/components/ProductBuyBox";
import { whatsappLink, whatsappNumber } from "@/lib/contact";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const [row] = await db
    .select({
      product: products,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryParentId: categories.parentId,
      brandName: brands.name,
      brandSlug: brands.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.slug, slug))
    .limit(1);
  if (!row || !row.product.active) return null;

  const p = row.product;

  const [images, variants, reviewRows, ratingRow, related] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, p.id)).orderBy(productImages.sortOrder),
    db.select().from(productVariants).where(and(eq(productVariants.productId, p.id), eq(productVariants.active, true))),
    db
      .select({
        id: reviews.id, rating: reviews.rating, title: reviews.title, comment: reviews.comment,
        createdAt: reviews.createdAt, userName: users.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.targetType, "product"), eq(reviews.targetId, p.id), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt))
      .limit(20),
    db
      .select({ avg: sql<string>`COALESCE(AVG(${reviews.rating})::numeric, 0)`, cnt: count() })
      .from(reviews)
      .where(and(eq(reviews.targetType, "product"), eq(reviews.targetId, p.id), eq(reviews.status, "approved"))),
    // Related: siblings → parent group → same pet type
    (async () => {
      let relatedCatIds: number[] = [];
      if (p.categoryId) {
        relatedCatIds = [p.categoryId];
        if (row.categoryParentId) relatedCatIds.push(row.categoryParentId);
        else {
          const children = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, p.categoryId));
          relatedCatIds.push(...children.map((c) => c.id));
        }
      }
      return db
        .select({ id: products.id, slug: products.slug, name: products.name, price: products.price, mrp: products.mrp, imageUrl: products.imageUrl })
        .from(products)
        .where(
          and(
            eq(products.active, true),
            ne(products.id, p.id),
            relatedCatIds.length > 0
              ? or(inArray(products.categoryId, relatedCatIds), eq(products.petType, p.petType))!
              : eq(products.petType, p.petType)
          )
        )
        .limit(6);
    })(),
  ]);

  // Taxonomy breadcrumb trail: leaf → parent group → pet-type family label
  let parent: { name: string; slug: string } | null = null;
  if (row.categoryParentId) {
    const [pr] = await db
      .select({ name: categories.name, slug: categories.slug, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.id, row.categoryParentId))
      .limit(1);
    if (pr) parent = { name: pr.name, slug: pr.slug };
  }
  const petFamily = p.petType === "dog" ? "Dog" : p.petType === "cat" ? "Cat" : p.petType === "small_pet" ? "Small Pets" : null;

  return {
    p,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    parent,
    petFamily,
    brandName: row.brandName,
    images,
    variants,
    reviews: reviewRows,
    rating: ratingRow[0] ? Math.round(parseFloat(ratingRow[0].avg) * 10) / 10 : 0,
    reviewCount: ratingRow[0]?.cnt ?? 0,
    related,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug).catch(() => null);
  if (!data) return { title: "Product not found" };
  const name = `${data.p.name}${data.brandName ? ` — ${data.brandName}` : ""} | PawStore`;
  const description =
    data.p.shortDescription ||
    (data.p.description ? data.p.description.slice(0, 155) : `Buy ${data.p.name} at PawStore.`);
  return {
    title: name,
    description,
    alternates: { canonical: `/shop/${data.p.slug}` },
    openGraph: {
      title: name,
      description,
      type: "website",
      images: data.p.imageUrl ? [{ url: data.p.imageUrl }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getProduct(slug).catch(() => null);
  if (!data) notFound();

  const { p, categoryName, categorySlug, parent, petFamily, brandName, images, variants, reviews, related } = data;
  const price = parseFloat(p.price);
  const mrp = p.mrp ? parseFloat(p.mrp) : null;
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const gallery = [...(p.imageUrl ? [{ id: 0, url: p.imageUrl, alt: p.name }] : []), ...images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? p.name }))];
  const inStore = p.storeStock > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription || p.description || undefined,
    image: gallery.map((g) => g.url),
    brand: brandName ? { "@type": "Brand", name: brandName } : undefined,
    sku: `PS-${p.id}`,
    aggregateRating:
      data.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: data.rating, reviewCount: data.reviewCount }
        : undefined,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "INR",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/shop/${p.slug}`,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumbs: Home / {Pet family} / {Parent group} / {Leaf} / Product */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        {petFamily && (
          <>
            <Link href={`/shop?petType=${p.petType}`} className="hover:text-orange-600">{petFamily}</Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        {parent && (
          <>
            <Link href={`/c/${parent.slug}`} className="hover:text-orange-600">{parent.name}</Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        {categorySlug && (
          <>
            <Link href={`/c/${categorySlug}`} className="hover:text-orange-600">{categoryName}</Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-gray-600 truncate max-w-[220px]">{p.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100">
            {gallery[0] ? (
              <Image src={gallery[0].url} alt={p.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-gray-200" /></div>
            )}
            {off > 0 && <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">{off}% OFF</span>}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {gallery.map((img) => (
                <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                  <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buy box (client island) */}
        <ProductBuyBox
          product={{
            id: p.id,
            name: p.name,
            price: p.price,
            mrp: p.mrp,
            stock: p.stock,
            lowStockThreshold: p.lowStockThreshold,
            imageUrl: p.imageUrl,
            shortDescription: p.shortDescription,
            petType: p.petType,
            lifeStages: p.lifeStages,
            needSlugs: p.needSlugs,
            specifications: p.specifications ?? {},
            subscriptionEligible: p.subscriptionEligible,
          }}
          brandName={brandName}
          variants={variants.map((v) => ({ id: v.id, name: v.name, priceDelta: v.priceDelta, stock: v.stock }))}
          storeStock={p.storeStock}
        />
      </div>

      {/* Store availability strip — the physical-shop signal (DECISION: separate pool) */}
      <div className={`mt-8 rounded-2xl border p-5 flex flex-col md:flex-row md:items-center gap-4 ${inStore ? "border-teal-200 bg-teal-50/60" : "border-gray-200 bg-gray-50"}`}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Store className={`w-5 h-5 ${inStore ? "text-teal-600" : "text-gray-400"}`} />
            <p className={`font-bold ${inStore ? "text-teal-800" : "text-gray-700"}`}>
              {inStore ? "In stock at our store" : "Online only"}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            {inStore
              ? "Visit us to see it, touch it, and take it home today — or order online."
              : "This item ships from our online warehouse. Questions? Call the shop and we'll help."}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <a href="tel:+919876543210" className="flex items-center gap-1.5 text-sm font-bold text-gray-700 border border-gray-200 bg-white rounded-xl px-4 py-2.5 hover:border-gray-300">
            <PhoneCall className="w-4 h-4" /> Call the shop
          </a>
          <a href={whatsappLink(whatsappNumber, `Hi! Is ${p.name} available at the store?`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-white bg-[#25D366] rounded-xl px-4 py-2.5 hover:opacity-90">
            Ask on WhatsApp
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-3">Description</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{p.description || p.shortDescription || "No description available."}</p>
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900 mb-3">Specifications</h2>
          {Object.keys(p.specifications ?? {}).length > 0 ? (
            <dl className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {Object.entries(p.specifications!).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 text-sm">
                  <dt className="px-4 py-2.5 bg-gray-50 font-semibold text-gray-600">{k}</dt>
                  <dd className="px-4 py-2.5 col-span-2 text-gray-800">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gray-400">No specifications listed.</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      {data.reviewCount > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-black text-gray-900">Customer Reviews</h2>
            <span className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-700">{data.rating}</span>
            </span>
            <span className="text-sm text-gray-500">{data.reviewCount} review{data.reviewCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}</div>
                  <span className="text-sm font-bold text-gray-900">{r.userName || "Customer"}</span>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.title && <p className="font-semibold text-gray-800 text-sm">{r.title}</p>}
                <p className="text-sm text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-black text-gray-900 mb-5">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((r) => (
              <Link key={r.id} href={`/shop/${r.slug}`} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-square bg-gray-50 relative">
                  {r.imageUrl ? (
                    <Image src={r.imageUrl} alt={r.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="200px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2">{r.name}</p>
                  <p className="text-sm font-extrabold text-gray-900 mt-1">₹{parseFloat(r.price).toFixed(0)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
