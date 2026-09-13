import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { products, categories, brands, reviews } from "@/db/schema";
import { and, eq, or, inArray, sql, count, desc, asc } from "drizzle-orm";
import { Package, ChevronRight, Star } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string; petType?: string }>;
}

const PER_PAGE = 12;

async function getCategory(slug: string) {
  const [cat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.active, true)))
    .limit(1);
  return cat ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug).catch(() => null);
  if (!cat) return { title: "Category not found | PawStore" };
  const petLabel = cat.petType === "dog" ? "Dogs" : cat.petType === "cat" ? "Cats" : cat.petType === "small_pet" ? "Small Pets" : "Pets";
  const title = `${cat.name} for ${petLabel} | Buy Online & In Store | PawStore`;
  const description =
    cat.description ||
    `Shop ${cat.name.toLowerCase()} for ${petLabel.toLowerCase()} at PawStore — genuine products, curated by our pet-care shop. Order online or visit our store.`;
  return {
    title,
    description,
    alternates: { canonical: `/c/${cat.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort = "new", page: pageParam, petType: petTypeParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1"));

  const cat = await getCategory(slug).catch(() => null);
  if (!cat) notFound();

  // A group includes its leaf categories; a leaf is just itself
  const children = await db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.parentId, cat.id));
  const catIds = [cat.id, ...children.map((c) => c.id)];

  const petFilter =
    petTypeParam && petTypeParam !== "all"
      ? or(eq(products.petType, petTypeParam), eq(products.petType, "all"))!
      : undefined;

  const where = and(eq(products.active, true), inArray(products.categoryId, catIds), petFilter);

  const orderBy = sort === "price_asc" ? asc(products.price) : sort === "price_desc" ? desc(products.price) : desc(products.createdAt);

  const [totalRow] = await db.select({ total: count() }).from(products).where(where);
  const total = totalRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const rows = await db
    .select({
      id: products.id, slug: products.slug, name: products.name, price: products.price, mrp: products.mrp,
      imageUrl: products.imageUrl, stock: products.stock, storeStock: products.storeStock,
      brandName: brands.name,
      rating: sql<string>`COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.target_type = 'product' AND r.target_id = ${products.id} AND r.status = 'approved'), 0)`,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(where)
    .orderBy(orderBy)
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

  const petLabel = cat.petType === "dog" ? "Dogs" : cat.petType === "cat" ? "Cats" : cat.petType === "small_pet" ? "Small Pets" : "Pets";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "/shop" },
      { "@type": "ListItem", position: 3, name: cat.name, item: `/c/${cat.slug}` },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/shop" className="hover:text-orange-600">Shop</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600">{cat.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">{cat.name}</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {total} product{total !== 1 ? "s" : ""} for {petLabel.toLowerCase()} — available online, most also at our store.
        </p>
      </div>

      {/* Sub-category chips */}
      {children.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          {children.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="text-sm font-semibold bg-white border border-gray-200 rounded-full px-4 py-2 text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-colors">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Product grid */}
      {rows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">Nothing here yet</p>
          <p className="text-gray-400 text-sm mt-1">New stock lands every week — check back or ask us on WhatsApp.</p>
          <Link href="/shop" className="mt-5 inline-block bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl">Browse all products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map((p) => {
            const price = parseFloat(p.price);
            const mrp = p.mrp ? parseFloat(p.mrp) : null;
            const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
            const rating = Math.round(parseFloat(p.rating) * 10) / 10;
            return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <Link href={`/shop/${p.slug}`} className="relative aspect-square bg-gray-50 block">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-200" /></div>
                  )}
                  {off > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">{off}% OFF</span>}
                  {p.storeStock > 0 && (
                    <span className="absolute bottom-2 left-2 bg-teal-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-md">At our store</span>
                  )}
                </Link>
                <div className="p-3 flex flex-col flex-1">
                  {p.brandName && <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">{p.brandName}</p>}
                  <Link href={`/shop/${p.slug}`} className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-orange-600">{p.name}</Link>
                  {rating > 0 && (
                    <span className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-700">{rating}</span>
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-base font-black text-gray-900">₹{price.toFixed(0)}</span>
                    {mrp && mrp > price && <span className="text-xs text-gray-400 line-through">₹{mrp.toFixed(0)}</span>}
                  </div>
                  <div className="mt-auto pt-2.5">
                    <AddToCartButton productId={p.id} disabled={p.stock === 0} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/c/${cat.slug}?page=${n}&sort=${sort}`}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold ${n === page ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"}`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
