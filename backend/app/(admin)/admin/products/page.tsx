"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Loader2,
  Edit3,
  Trash2,
  X,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

interface Cat { id: number; name: string; slug: string; petType: string; parentId: number | null; active: boolean }
interface Brand { id: number; name: string }
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  mrp: string | null;
  categoryId: number | null;
  categoryName?: string | null;
  brandId: number | null;
  petType: string;
  stock: number;
  storeStock: number;
  lifeStages: string[];
  imageUrl: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  subscriptionEligible: boolean;
  active: boolean;
}

const emptyForm = {
  name: "", description: "", price: "", mrp: "", categoryId: "", brandId: "",
  petType: "all", stock: 0, storeStock: 0, lifeStages: [] as string[],
  imageUrl: "", isFeatured: false, isBestSeller: false, subscriptionEligible: false, active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [brandList, setBrandList] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.products) setProducts(data.products);
      const taxRes = await fetch("/api/admin/categories");
      const taxData = await taxRes.json();
      if (taxData.categories) setCats(taxData.categories);
      if (taxData.brands) setBrandList(taxData.brands);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      mrp: product.mrp || "",
      categoryId: product.categoryId ? String(product.categoryId) : "",
      brandId: product.brandId ? String(product.brandId) : "",
      petType: product.petType || "all",
      stock: product.stock,
      storeStock: product.storeStock ?? 0,
      lifeStages: product.lifeStages ?? [],
      imageUrl: product.imageUrl || "",
      isFeatured: !!product.isFeatured,
      isBestSeller: !!product.isBestSeller,
      subscriptionEligible: !!product.subscriptionEligible,
      active: product.active,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, categoryId: form.categoryId || null, brandId: form.brandId || null }),
        });
        if (res.ok) {
          await fetchProducts();
          setShowModal(false);
        }
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, categoryId: form.categoryId || null, brandId: form.brandId || null }),
        });
        if (res.ok) {
          await fetchProducts();
          setShowModal(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) await fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !product.active }),
      });
      await fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoryName || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCats = cats.filter((c) => c.active);
  const catGroups = activeCats.filter((c) => c.parentId === null);
  const toggleLifeStage = (ls: string) => {
    setForm((f) => ({
      ...f,
      lifeStages: f.lifeStages.includes(ls) ? f.lifeStages.filter((x) => x !== ls) : [...f.lifeStages, ls],
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tighter">Products</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">
            {products.length} products in catalog
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-3 px-6 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 py-24 text-center shadow-sm space-y-4">
          <Package className="w-16 h-16 text-gray-200 mx-auto" />
          <h3 className="text-lg font-black text-[hsl(var(--secondary))]">No products found</h3>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            {search ? "Try a different search term" : "Click 'Add Product' to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-[2rem] p-6 border border-gray-50 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-2" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-black text-[hsl(var(--secondary))] text-lg truncate">{product.name}</h3>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${product.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                      {product.active ? "Active" : "Inactive"}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-50 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      {product.categoryName || "Uncategorized"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 font-medium truncate">{product.description || "No description"}</p>
                  <div className="flex items-center gap-6 mt-2">
                    <span className="flex items-center gap-1 text-lg font-black text-[hsl(var(--secondary))]">
                      <IndianRupee className="w-4 h-4" />
                      {parseFloat(product.price).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      Online: {product.stock} · Store: {product.storeStock ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(product)}
                    className={`p-3 rounded-xl transition-all ${product.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(product)}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-[2.5rem] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">
                {editingProduct ? "Edit Product" : "New Product"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">MRP (₹, optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                  <select
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value="">— Select category —</option>
                    {catGroups.map((g) => (
                      <optgroup key={g.id} label={g.name}>
                        <option value={g.id}>{g.name} (whole group)</option>
                        {activeCats
                          .filter((c) => c.parentId === g.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Brand</label>
                  <select
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.brandId}
                    onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  >
                    <option value="">— No brand —</option>
                    {brandList.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pet Type</label>
                  <select
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.petType}
                    onChange={(e) => setForm({ ...form, petType: e.target.value })}
                  >
                    <option value="all">All pets</option>
                    <option value="dog">Dogs</option>
                    <option value="cat">Cats</option>
                    <option value="small_pet">Small Pets</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Life Stages</label>
                  <div className="flex gap-4 px-1 py-3">
                    {["puppy", "adult", "senior"].map((ls) => (
                      <label key={ls} className="flex items-center gap-1.5 text-sm text-gray-600 capitalize cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.lifeStages.includes(ls)}
                          onChange={() => toggleLifeStage(ls)}
                          className="accent-orange-500"
                        />
                        {ls}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock (online)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Store stock (physical shop)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.storeStock}
                    onChange={(e) => setForm({ ...form, storeStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-6 px-1 py-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-orange-500" />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={form.isBestSeller} onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })} className="accent-orange-500" />
                    Best seller
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image URL</label>
                  <input
                    type="text"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.subscriptionEligible}
                  onChange={(e) => setForm({ ...form, subscriptionEligible: e.target.checked })}
                  className="w-5 h-5 accent-teal-500"
                />
                <span className="text-sm font-bold text-gray-500">Subscription eligible (auto-ship food &amp; consumables)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-5 h-5 accent-orange-500"
                />
                <span className="text-sm font-bold text-gray-500">Active (visible in shop)</span>
              </label>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="flex-1 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
