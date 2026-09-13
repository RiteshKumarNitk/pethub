"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShoppingBag, Star, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Search, Package, Loader2, Check, Heart,
} from "lucide-react";
import { useCart } from "@/components/Navbar";

interface Product {
  id: number; slug: string; name: string; shortDescription: string | null;
  price: string; mrp: string | null; stock: number; storeStock: number; imageUrl: string | null;
  categoryName: string | null; brandName: string | null; rating: number; reviewCount: number;
}
interface Category { id: number; name: string; slug: string; children?: { id: number; name: string; slug: string }[] }
interface Brand { id: number; name: string; slug: string }
interface Need { id: number; name: string; slug: string }

const petTypes = [
  { value: "all", label: "All Pets" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "small_pet", label: "Small Pets" },
];
const sorts = [
  { value: "new", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [addedId, setAddedId] = useState<number | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [wishMsg, setWishMsg] = useState("");

  const category = searchParams.get("category") || "all";
  const petType = searchParams.get("petType") || "all";
  const brand = searchParams.get("brand") || "all";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "new";
  const inStock = searchParams.get("inStock") === "true";
  const inStore = searchParams.get("inStore") === "true";
  const need = searchParams.get("need") || "";
  const lifeStage = searchParams.get("lifeStage") || "all";
  const page = parseInt(searchParams.get("page") || "1");

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/shop?${params.toString()}`);
  };

  useEffect(() => {
    fetch("/api/categories?withNeeds=true")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setBrands(d.brands || []);
        setNeeds(d.needs || []);
      })
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (petType !== "all") params.set("petType", petType);
    if (brand !== "all") params.set("brand", brand);
    if (search) params.set("search", search);
    if (inStock) params.set("inStock", "true");
    if (inStore) params.set("inStore", "true");
    if (need) params.set("need", need);
    if (lifeStage !== "all") params.set("lifeStage", lifeStage);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, petType, brand, search, sort, inStock, inStore, need, lifeStage, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => (r.ok ? r.json() : { productIds: [] }))
      .then((d) => setWishlist(d.productIds || []))
      .catch(() => {});
  }, []);

  const toggleWishlist = async (productId: number) => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) {
      setWishMsg("Sign in to save favourites");
      setTimeout(() => setWishMsg(""), 2000);
      return;
    }
    const data = await res.json();
    setWishlist((prev) => data.inWishlist ? [...prev, productId] : prev.filter((id) => id !== productId));
  };

  const addToCart = async (productId: number) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty: 1 }),
    });
    if (res.ok) {
      setAddedId(productId);
      refresh();
      setTimeout(() => setAddedId(null), 1500);
    }
  };

  const hasActiveFilters = category !== "all" || petType !== "all" || brand !== "all" || search || inStock || inStore || need || lifeStage !== "all";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            {search
              ? `Results for "${search}"`
              : need
                ? needs.find((n) => n.slug === need)?.name || "Shop"
                : category !== "all"
                  ? categories.find((c) => c.slug === category)?.name || "Shop"
                  : "All Products"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} product{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-orange-300"
          >
            {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 text-sm font-semibold border border-gray-200 rounded-lg px-4 py-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className={`w-64 flex-shrink-0 space-y-6 ${showFilters ? "fixed inset-y-0 left-0 z-50 bg-white p-5 overflow-y-auto shadow-xl" : "hidden"} lg:block lg:static lg:bg-transparent lg:p-0 lg:shadow-none`}>
          {showFilters && (
            <div className="flex items-center justify-between lg:hidden">
              <h3 className="font-bold">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
          )}

          <FilterGroup title="Pet Type">
            {petTypes.map((pt) => (
              <button
                key={pt.value}
                onClick={() => setParam("petType", pt.value)}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${petType === pt.value ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {pt.label}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup title="Shop by Need">
            {need && (
              <button
                onClick={() => setParam("need", "")}
                className="block w-full text-left px-3 py-1.5 rounded-lg text-sm text-teal-700 font-semibold hover:bg-teal-50"
              >
                × Clear need: {needs.find((n) => n.slug === need)?.name}
              </button>
            )}
            <div className="flex flex-wrap gap-1.5 px-1 py-1">
              {needs.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => setParam("need", need === n.slug ? "" : n.slug)}
                  className={`text-xs font-semibold rounded-full px-2.5 py-1 border transition-colors ${need === n.slug ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"}`}
                >
                  {n.name}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Life Stage">
            {["all", "puppy", "adult", "senior"].map((ls) => (
              <button
                key={ls}
                onClick={() => setParam("lifeStage", ls)}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm capitalize ${lifeStage === ls ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {ls === "all" ? "All Life Stages" : ls}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup title="Category">
            <button
              onClick={() => setParam("category", "all")}
              className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${category === "all" ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <div key={c.id}>
                <button
                  onClick={() => setParam("category", c.slug)}
                  className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm font-semibold ${category === c.slug ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {c.name}
                </button>
                {c.children && c.children.length > 0 && (
                  <div className="ml-3 border-l border-gray-100 pl-2">
                    {c.children.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => setParam("category", ch.slug)}
                        className={`block w-full text-left px-2.5 py-1 rounded-lg text-[13px] ${category === ch.slug ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-500 hover:bg-gray-50"}`}
                      >
                        {ch.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </FilterGroup>

          <FilterGroup title="Brand">
            <button
              onClick={() => setParam("brand", "all")}
              className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${brand === "all" ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
            >
              All Brands
            </button>
            {brands.slice(0, 12).map((b) => (
              <button
                key={b.id}
                onClick={() => setParam("brand", b.slug)}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${brand === b.slug ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {b.name}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup title="Availability">
            <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setParam("inStock", e.target.checked ? "true" : "")}
                className="accent-orange-500"
              />
              In stock online
            </label>
            <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={inStore}
                onChange={(e) => setParam("inStore", e.target.checked ? "true" : "")}
                className="accent-teal-600"
              />
              Available at our store
            </label>
          </FilterGroup>

          {hasActiveFilters && (
            <button onClick={() => router.push("/shop")} className="text-sm text-red-500 hover:underline px-3">
              Clear all filters
            </button>
          )}
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {wishMsg && (
            <div className="mb-4 bg-blue-50 text-blue-700 text-sm rounded-lg px-4 py-2.5">{wishMsg}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700">No products found</h3>
              <p className="text-sm text-gray-500 mt-1">Try removing some filters or a different search term.</p>
              <button onClick={() => router.push("/shop")} className="mt-4 text-sm font-bold text-orange-600 hover:underline">
                Browse all products
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p) => {
                  const price = parseFloat(p.price);
                  const mrp = p.mrp ? parseFloat(p.mrp) : null;
                  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
                  return (
                    <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                      <div className="aspect-square bg-gray-50 relative">
                        <Link href={`/shop/${p.slug}`}>
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="300px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                          )}
                        </Link>
                        {off > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">{off}% OFF</span>}
                        {p.storeStock > 0 && <span className="absolute bottom-2 left-2 bg-teal-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-md">At our store</span>}
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow"
                          aria-label="Toggle wishlist"
                        >
                          <Heart className={`w-4 h-4 ${wishlist.includes(p.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                        </button>
                        {p.stock === 0 && (
                          <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-bold text-gray-500">Out of stock</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">{p.brandName || p.categoryName}</p>
                        <Link href={`/shop/${p.slug}`} className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-orange-600 min-h-[40px]">{p.name}</Link>
                        {p.reviewCount > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs text-gray-500">{p.rating} ({p.reviewCount})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-extrabold text-gray-900">₹{price.toFixed(0)}</span>
                          {mrp && mrp > price && <span className="text-xs text-gray-400 line-through">₹{mrp.toFixed(0)}</span>}
                        </div>
                        <button
                          onClick={() => addToCart(p.id)}
                          disabled={p.stock === 0}
                          className={`w-full mt-2 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${p.stock === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : addedId === p.id ? "bg-teal-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
                        >
                          {p.stock === 0 ? "Out of stock" : addedId === p.id ? <><Check className="w-3.5 h-3.5" /> Added</> : <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setParam("page", String(page - 1))}
                    disabled={page <= 1}
                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 px-3">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setParam("page", String(page + 1))}
                    disabled={page >= totalPages}
                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">{title}</h4>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
