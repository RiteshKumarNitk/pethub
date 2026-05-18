"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Package,
  Phone,
  MapPin,
  Heart,
  Mail,
  Plus,
  Check
} from "lucide-react";

const fallbackProducts = [
  { id: 1, name: "Royal Canin Maxi Puppy Kibble (4kg)", price: 1599, originalPrice: 1999, category: "Food", imageUrl: "/images/food.png", rating: 4.8, reviews: 120, discount: "20% OFF" },
  { id: 2, name: "Premium Retractable Dog Leash (5m)", price: 899, originalPrice: 1199, category: "Accessories", imageUrl: "/images/hero.png", rating: 4.9, reviews: 85, discount: "25% OFF" },
  { id: 3, name: "Organic Aloe Vera Dog Shampoo (500ml)", price: 450, originalPrice: 599, category: "Care & Hygiene", imageUrl: "/images/grooming.png", rating: 4.7, reviews: 210, discount: "25% OFF" },
  { id: 4, name: "Interactive Wobble Treat Dispenser Toy", price: 699, originalPrice: 899, category: "Toys", imageUrl: "/images/adoption.png", rating: 4.6, reviews: 56, discount: "22% OFF" },
  { id: 5, name: "Orthopedic Memory Foam Pet Bed (Large)", price: 3499, originalPrice: 4499, category: "Accessories", imageUrl: "/images/hero.png", rating: 4.7, reviews: 210, discount: "22% OFF" },
  { id: 6, name: "Self-Cleaning Deshedding Brush", price: 599, originalPrice: 799, category: "Care & Hygiene", imageUrl: "/images/grooming.png", rating: 4.6, reviews: 60, discount: "25% OFF" },
  { id: 7, name: "Whiskas Adult Cat Food (1.2kg)", price: 349, originalPrice: 449, category: "Food", imageUrl: "/images/food.png", rating: 4.5, reviews: 340, discount: "22% OFF" },
  { id: 8, name: "KONG Classic Dog Toy (Medium)", price: 1299, originalPrice: 1599, category: "Toys", imageUrl: "/images/adoption.png", rating: 4.9, reviews: 95, discount: "19% OFF" },
];

const fallbackBlogs = [
  {
    title: "The Ultimate Beagle Puppy Diet Chart & Nutrition Guide",
    slug: "beagle-puppy-diet-chart",
    content: "Complete breakdown of a Beagle's daily calorie requirements, feeding frequency, and top nutritional recommendations from veterinarians.",
    thumbnailUrl: "/images/dog.png",
    category: { name: "Nutrition & Diet" }
  },
  {
    title: "Persian Cat Grooming at Home: A Step-by-Step Walkthrough",
    slug: "persian-cat-grooming-guide",
    content: "Learn how to comb, bathe, and eliminate tear stains for your long-haired Persian cat without stressful trips to the salon.",
    thumbnailUrl: "/images/grooming.png",
    category: { name: "Grooming & Hygiene" }
  },
  {
    title: "5 Golden Rules for Crate Training Your Puppy Successfully",
    slug: "crate-training-puppy-rules",
    content: "Transform the crate into a cozy, secure den using positive reinforcement. Complete housebreaking instructions included.",
    thumbnailUrl: "/images/hero.png",
    category: { name: "Training & Behaviour" }
  }
];

const breeds = [
  { name: "Labrador", image: "/images/dog.png", color: "bg-yellow-100" },
  { name: "Beagle", image: "/images/hero.png", color: "bg-orange-100" },
  { name: "Golden Retriever", image: "/images/dog.png", color: "bg-amber-100" },
  { name: "German Shepherd", image: "/images/hero.png", color: "bg-teal-100" },
  { name: "Persian Cat", image: "/images/grooming.png", color: "bg-purple-100" },
  { name: "Siamese Cat", image: "/images/adoption.png", color: "bg-pink-100" },
];

const brands = [
  "Royal Canin", "Whiskas", "Pedigree", "Trixie", "KONG", "Orijen",
  "Acana", "Hills", "Farmina", "Nulo", "Merrick", "Blue Buffalo"
];

const concerns = [
  { name: "Shedding & Hairfall", icon: "🔄" },
  { name: "Dental Care", icon: "🦷" },
  { name: "Skin & Coat", icon: "✨" },
  { name: "Hairball Control", icon: "🫧" },
  { name: "Weight Management", icon: "⚖️" },
  { name: "Joint Pain", icon: "🦴" },
  { name: "Digestive Health", icon: "💚" },
  { name: "Anxiety & Stress", icon: "🧘" },
];

const faqs = [
  {
    q: "What is the delivery time for orders?",
    a: "We deliver within 2-5 business days across India. Metro cities typically receive orders within 2-3 days. Free delivery on orders above ₹499."
  },
  {
    q: "Are the products 100% genuine?",
    a: "Yes, we source directly from brand-authorized distributors. Every product comes with brand warranty and manufacturer guarantee."
  },
  {
    q: "Can I return or exchange a product?",
    a: "We offer 7-day easy returns on unopened products. For damaged or defective items, we provide immediate replacement or full refund."
  },
  {
    q: "Do you have a pet store near me?",
    a: "We have stores in Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, and Kolkata. Visit our Store Locator page for the nearest location."
  },
  {
    q: "How do I choose the right food for my pet?",
    a: "Check our Pet Care Guides section for detailed breed-specific diet charts. You can also contact our WhatsApp support for personalized recommendations."
  },
];

const reviews = [
  { quote: "The organic aloe vera shampoo solved my Beagle's itchy skin completely. Fast delivery and genuine products. Highly recommend PawStore!", parent: "Rajesh & Rocky (Beagle)", rating: 5 },
  { quote: "Royal Canin kibble from PawStore at the best price. My lab Max loves it. The free delivery above ₹499 is a great bonus!", parent: "Amit & Max (Labrador)", rating: 5 },
  { quote: "Bought the orthopedic bed for my senior cat. She sleeps through the night now without any joint pain. Thank you PawStore!", parent: "Priya & Mimi (Cat)", rating: 5 },
  { quote: "Excellent variety of toys and grooming products. My Shih Tzu absolutely loves the wobble treat dispenser. Will shop again!", parent: "Neha & Bruno (Shih Tzu)", rating: 5 },
];

export default function Home() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [featuredBlogs, setFeaturedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeBrandTab, setActiveBrandTab] = useState<"popular" | "emerging">("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const heroTimer = useRef<NodeJS.Timeout | null>(null);

  const heroBanners = [
    {
      title: "Premium Pet Food",
      subtitle: "Up to 30% Off on Top Brands",
      description: "Royal Canin, Whiskas, Pedigree & more. Nutrition that your pet deserves.",
      cta: "Shop Food",
      link: "/shop?category=Food",
      bg: "from-orange-50 to-teal-50",
      accent: "bg-orange-500"
    },
    {
      title: "Grooming Essentials",
      subtitle: "Keep Your Pet Fresh & Clean",
      description: "Shampoos, brushes, nail clippers & more. Free delivery on orders above ₹499.",
      cta: "Shop Grooming",
      link: "/shop?category=Care%20%26%20Hygiene",
      bg: "from-teal-50 to-blue-50",
      accent: "bg-teal-600"
    },
    {
      title: "Fun Toys & Accessories",
      subtitle: "Engage & Entertain Your Pet",
      description: "Interactive toys, beds, leashes, collars & more to keep your pet happy.",
      cta: "Shop Toys",
      link: "/shop?category=Toys",
      bg: "from-amber-50 to-orange-50",
      accent: "bg-amber-500"
    },
  ];

  const startHeroTimer = useCallback(() => {
    if (heroTimer.current) clearInterval(heroTimer.current);
    heroTimer.current = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
  }, [heroBanners.length]);

  useEffect(() => {
    startHeroTimer();
    return () => {
      if (heroTimer.current) clearInterval(heroTimer.current);
    };
  }, [startHeroTimer]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, blogRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/blogs")
        ]);
        const prodData = await prodRes.json();
        const blogData = await blogRes.json();

        if (prodData.products && prodData.products.length > 0) {
          const enriched = prodData.products.slice(0, 8).map((p: any) => ({
            ...p,
            price: parseFloat(p.price) || 0,
            originalPrice: Math.round((parseFloat(p.price) || 0) * 1.25),
            discount: "20% OFF"
          }));
          setFeaturedProducts(enriched);
        } else {
          setFeaturedProducts(fallbackProducts);
        }

        if (blogData.blogs && blogData.blogs.length > 0) {
          setFeaturedBlogs(blogData.blogs.slice(0, 3));
        } else {
          setFeaturedBlogs(fallbackBlogs);
        }
      } catch (err) {
        console.error("Failed to fetch homepage data", err);
        setFeaturedProducts(fallbackProducts);
        setFeaturedBlogs(fallbackBlogs);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/shop");
    }
  };

  const handleAddToCart = (product: any) => {
    try {
      const stored = localStorage.getItem("pawstore_cart");
      const cart = stored ? JSON.parse(stored) : [];
      const existing = cart.findIndex((item: any) => item.id === product.id);
      if (existing >= 0) {
        cart[existing].quantity = (cart[existing].quantity || 1) + 1;
      } else {
        cart.push({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity: 1 });
      }
      localStorage.setItem("pawstore_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Add to cart error", err);
    }
  };

  const popularBrands = brands.slice(0, 6);
  const emergingBrands = brands.slice(6);

  return (
    <div className="flex flex-col bg-white min-h-screen">

      {/* ========== HERO CAROUSEL ========== */}
      <section className="relative pt-36 pb-12 md:pt-40 md:pb-16 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-xl bg-gray-50">
            {heroBanners.map((banner, idx) => (
              <div
                key={idx}
                className={`transition-opacity duration-500 ${idx === heroSlide ? "opacity-100" : "opacity-0 absolute inset-0"}`}
              >
                <div className={`bg-gradient-to-br ${banner.bg} p-8 md:p-12 lg:p-16`}>
                  <div className="max-w-xl">
                    <span className={`inline-block px-3 py-1 text-white text-xs font-bold uppercase tracking-wider rounded ${banner.accent} mb-4`}>
                      {banner.subtitle}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                      {banner.title}
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base mb-6 leading-relaxed">
                      {banner.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <Link
                        href={banner.link}
                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
                      >
                        {banner.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg text-sm font-semibold border border-gray-200 transition-colors"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Carousel Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
              {heroBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setHeroSlide(idx); startHeroTimer(); }}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    idx === heroSlide ? "bg-gray-900 w-6" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => { setHeroSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length); startHeroTimer(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-colors cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => { setHeroSlide((prev) => (prev + 1) % heroBanners.length); startHeroTimer(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 transition-colors cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* ========== TRUST STRIP ========== */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Truck className="w-4 h-4 text-teal-600" /> Free Delivery above ₹499</div>
            <div className="flex items-center gap-2 text-gray-600"><Package className="w-4 h-4 text-teal-600" /> Genuine Products</div>
            <div className="flex items-center gap-2 text-gray-600"><ShieldCheck className="w-4 h-4 text-teal-600" /> Secure Payment</div>
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-teal-600" /> WhatsApp Support</div>
          </div>
        </div>
      </section>

      {/* ========== PET TYPE / CATEGORY CIRCLES ========== */}
      <section className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {[
              { label: "Dogs", icon: "🐕", link: "/shop?category=Food" },
              { label: "Cats", icon: "🐈", link: "/shop?category=Food" },
              { label: "Small Pets", icon: "🐹", link: "/shop" },
              { label: "Grooming", icon: "✂️", link: "/shop?category=Care%20%26%20Hygiene" },
              { label: "Toys", icon: "🧸", link: "/shop?category=Toys" },
              { label: "Blog", icon: "📖", link: "/blog" },
            ].map((item, idx) => (
              <Link key={idx} href={item.link} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 group-hover:bg-orange-50 rounded-full flex items-center justify-center text-2xl md:text-3xl border border-gray-100 group-hover:border-orange-200 transition-all">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-orange-600 uppercase tracking-wider">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BREED READY PICKS ========== */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Breed Ready Picks</h2>
              <p className="text-gray-500 text-sm mt-1">Curated products for your pet&apos;s breed</p>
            </div>
            <Link href="/shop" className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {breeds.map((breed, idx) => (
              <Link key={idx} href="/shop" className="bg-white rounded-xl p-4 border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all text-center group">
                <div className={`w-16 h-16 mx-auto rounded-full ${breed.color} flex items-center justify-center mb-3`}>
                  <Image src={breed.image} alt={breed.name} width={40} height={40} className="rounded-full object-cover" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-orange-600">{breed.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOT PICKS / PRODUCTS ========== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Hot Picks</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Trending Products</h2>
            </div>
            <Link href="/shop" className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl animate-pulse">
                  <div className="aspect-square rounded-t-xl bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : featuredProducts.slice(0, 4).map((product) => (
              <div key={product.id} className="group bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all overflow-hidden">
                <Link href="/shop" className="block">
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {product.discount && (
                      <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {product.discount}
                      </span>
                    )}
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl text-gray-300">📦</div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold text-gray-700">{product.rating || "4.8"}</span>
                    <span className="text-xs text-gray-400">({product.reviews || "0"})</span>
                  </div>
                  <Link href="/shop" className="block text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2 hover:text-orange-600 transition-colors min-h-[2.5rem]">
                    {product.name}
                  </Link>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div>
                      <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through ml-1.5">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-9 h-9 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SHOP BY CATEGORY ========== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-gray-500 text-sm mt-1">Everything your pet needs, all in one place</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Pet Food", img: "/images/food.png", count: "24+ Products", link: "/shop?category=Food" },
              { name: "Accessories", img: "/images/hero.png", count: "18+ Products", link: "/shop?category=Accessories" },
              { name: "Grooming", img: "/images/grooming.png", count: "15+ Products", link: "/shop?category=Care%20%26%20Hygiene" },
              { name: "Toys", img: "/images/adoption.png", count: "12+ Products", link: "/shop?category=Toys" },
            ].map((cat, idx) => (
              <Link key={idx} href={cat.link} className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all">
                <div className="aspect-[4/3] bg-gray-50 relative">
                  <Image src={cat.img} alt={cat.name} fill className="object-contain p-6 group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BRAND SHOWCASE ========== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Shop Top Brands</h2>
            <p className="text-gray-500 text-sm mt-1">We partner with the best pet brands globally</p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveBrandTab("popular")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeBrandTab === "popular" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Popular Brands
            </button>
            <button
              onClick={() => setActiveBrandTab("emerging")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeBrandTab === "emerging" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Emerging Brands
            </button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {(activeBrandTab === "popular" ? popularBrands : emergingBrands).map((brand, idx) => (
              <Link key={idx} href="/shop" className="bg-gray-50 hover:bg-orange-50 rounded-xl px-4 py-6 border border-gray-100 hover:border-orange-200 transition-all text-center group">
                <div className="w-12 h-12 mx-auto rounded-full bg-white border border-gray-100 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-gray-400 group-hover:text-orange-500">{brand.charAt(0)}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-orange-600">{brand}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CARE BY CONCERN ========== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Care by Concern</h2>
            <p className="text-gray-500 text-sm mt-1">Find products tailored to your pet&apos;s needs</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {concerns.map((concern, idx) => (
              <Link key={idx} href="/shop" className="bg-white rounded-xl p-5 border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all group flex items-center gap-4">
                <span className="text-2xl">{concern.icon}</span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">{concern.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEW ARRIVALS ========== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">New Arrivals</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Just Landed</h2>
            </div>
            <Link href="/shop" className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl animate-pulse">
                  <div className="aspect-square rounded-t-xl bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : featuredProducts.slice(4, 8).length > 0 ? featuredProducts.slice(4, 8).map((product) => (
              <div key={product.id} className="group bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all overflow-hidden">
                <Link href="/shop" className="block">
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {product.discount && (
                      <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {product.discount}
                      </span>
                    )}
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl text-gray-300">📦</div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold text-gray-700">{product.rating || "4.8"}</span>
                    <span className="text-xs text-gray-400">({product.reviews || "0"})</span>
                  </div>
                  <Link href="/shop" className="block text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2 hover:text-orange-600 transition-colors min-h-[2.5rem]">
                    {product.name}
                  </Link>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div>
                      <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through ml-1.5">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-9 h-9 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              featuredProducts.slice(4, 8).length === 0 && featuredProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="group bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all overflow-hidden">
                  <Link href="/shop" className="block">
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {product.discount && (
                        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {product.discount}
                        </span>
                      )}
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-4xl text-gray-300">📦</div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold text-gray-700">{product.rating || "4.8"}</span>
                      <span className="text-xs text-gray-400">({product.reviews || "0"})</span>
                    </div>
                    <Link href="/shop" className="block text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2 hover:text-orange-600 transition-colors min-h-[2.5rem]">
                      {product.name}
                    </Link>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <div>
                        <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through ml-1.5">₹{product.originalPrice}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-9 h-9 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ========== BLOG SECTION ========== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Pet Care Guides</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Expert Advice & Tips</h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl animate-pulse">
                  <div className="aspect-[16/10] rounded-t-xl bg-gray-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-5 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : featuredBlogs.map((blog, idx) => (
              <Link key={idx} href={`/blog/${blog.slug}`} className="group bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all overflow-hidden">
                <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
                  <Image src={blog.thumbnailUrl || "/images/dog.png"} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  {blog.category?.name && (
                    <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded uppercase tracking-wider">
                      {blog.category.name}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                    {blog.content?.replace(/<[^>]*>/g, "").slice(0, 120)}...
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">5 min read</span>
                    <span className="text-xs font-semibold text-orange-600 group-hover:gap-1 transition-all flex items-center gap-0.5">
                      Read More <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">What Pet Parents Say</h2>
            <p className="text-gray-500 text-sm mt-1">Join 10,000+ happy pet parents who trust PawStore</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">&ldquo;{review.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm">
                    🐾
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{review.parent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ SECTION ========== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-sm mt-1">Everything you need to know about shopping at PawStore</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                  <span className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ml-4 ${openFaq === idx ? "rotate-45" : ""}`}>
                    <Plus className="w-4 h-4" />
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEWSLETTER ========== */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Mail className="w-8 h-8 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Stay in the Paw Loop</h2>
          <p className="text-gray-400 text-sm mb-6">Get exclusive offers, pet care tips, and new product alerts straight to your inbox.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Subscribe
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* ========== CTA BANNER ========== */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-teal-700 rounded-xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Download the PawStore App</h2>
            <p className="text-teal-100 text-sm mb-6 max-w-lg mx-auto">Get exclusive app-only offers, order tracking, and WhatsApp support at your fingertips.</p>
            <div className="flex items-center justify-center gap-4">
              <div className="bg-white/10 hover:bg-white/20 rounded-lg px-6 py-3 border border-white/20 transition-colors cursor-pointer">
                <span className="text-sm font-semibold">App Store</span>
              </div>
              <div className="bg-white/10 hover:bg-white/20 rounded-lg px-6 py-3 border border-white/20 transition-colors cursor-pointer">
                <span className="text-sm font-semibold">Google Play</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
