"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  BookOpen, 
  Calendar, 
  Search, 
  ArrowRight, 
  Loader2, 
  Clock, 
  User, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { name: "All", slug: "All" },
  { name: "Nutrition & Diet", slug: "nutrition-diet" },
  { name: "Grooming & Hygiene", slug: "grooming-hygiene" },
  { name: "Health & Wellness", slug: "health-wellness" },
  { name: "Training & Behaviour", slug: "training-behaviour" }
];

const fallbackBlogs = [
  {
    id: 1,
    title: "The Ultimate Beagle Puppy Diet Chart & Nutrition Guide",
    slug: "beagle-puppy-diet-chart",
    content: "<h3>Understanding Beagle Nutritional Needs</h3><p>Beagles are active, energetic, and highly food-motivated dogs. Because of their enthusiastic appetite, Beagles are prone to obesity. Providing a balanced diet with controlled portions is critical for their health and longevity.</p>",
    thumbnailUrl: "/images/dog.png",
    category: { name: "Nutrition & Diet", slug: "nutrition-diet" },
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Persian Cat Grooming at Home: A Step-by-Step Walkthrough",
    slug: "persian-cat-grooming-guide",
    content: "<h3>Why Persian Cats Need Daily Grooming</h3><p>With their luxurious long coats, flat faces, and sweet temperaments, Persian cats are beloved worldwide. However, their magnificent fur easily mats, tangles, and traps dirt.</p>",
    thumbnailUrl: "/images/grooming.png",
    category: { name: "Grooming & Hygiene", slug: "grooming-hygiene" },
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "5 Golden Rules for Crate Training Your Puppy Successfully",
    slug: "crate-training-puppy-rules",
    content: "<h3>Crate Training: A Safe Haven, Not a Prison</h3><p>Crate training is one of the most effective ways to housebreak your puppy and provide them with a secure, stress-free space of their own.</p>",
    thumbnailUrl: "/images/hero.png",
    category: { name: "Training & Behaviour", slug: "training-behaviour" },
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    title: "How to Identify and Treat Tick Fever in Dogs",
    slug: "tick-fever-dogs-treatment",
    content: "<h3>What is Tick Fever?</h3><p>Tick fever (e.g., Ehrlichiosis, Babesiosis) is a serious, potentially life-threatening infectious disease transmitted to dogs through tick bites.</p>",
    thumbnailUrl: "/images/dog.png",
    category: { name: "Health & Wellness", slug: "health-wellness" },
    createdAt: new Date().toISOString()
  }
];

function BlogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";

  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const url = selectedCategory === "All" 
          ? "/api/blogs" 
          : `/api/blogs?category=${selectedCategory}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.blogs && data.blogs.length > 0) {
          setBlogsList(data.blogs);
        } else {
          // If filtering "All", use fallback
          if (selectedCategory === "All") {
            setBlogsList(fallbackBlogs);
          } else {
            // Filter fallback local list
            setBlogsList(fallbackBlogs.filter(b => b.category.slug === selectedCategory));
          }
        }
      } catch (err) {
        console.error("Failed to load blogs, using fallback", err);
        if (selectedCategory === "All") {
          setBlogsList(fallbackBlogs);
        } else {
          setBlogsList(fallbackBlogs.filter(b => b.category.slug === selectedCategory));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [selectedCategory]);

  // Sync category from URL if changed
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  const filteredBlogs = blogsList.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticle = filteredBlogs.length > 0 ? filteredBlogs[0] : null;
  const standardArticles = filteredBlogs.length > 1 ? filteredBlogs.slice(1) : [];

  return (
    <div className="pt-28 pb-24 bg-[#FDFBF7] min-h-screen">
      <div className="container mx-auto px-6 max-w-6xl space-y-16">
        
        {/* Magazine Editorial Title Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
           <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-500 rounded-full text-[9px] font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-red-400 animate-spin" /> Expert Pet Advisory Center
           </span>
           <h1 className="text-5xl md:text-7xl font-black text-[hsl(var(--secondary))] tracking-tighter leading-none">
              Pet Information & <br />Care Guides
           </h1>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] max-w-md mx-auto leading-relaxed">
              Step-by-step grooming walkthroughs, veterinarian diet guidelines, and behavioral training tips.
           </p>
           <div className="w-12 h-1.5 bg-red-500 mx-auto rounded-full mt-6"></div>
        </div>

        {/* Filter Pills and Search bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
           {/* Categories Pills */}
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
              {categories.map(cat => (
                 <button
                   key={cat.slug}
                   onClick={() => setSelectedCategory(cat.slug)}
                   className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer ${
                     selectedCategory === cat.slug
                       ? "bg-red-500 text-white shadow-lg shadow-red-500/15"
                       : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                   }`}
                 >
                   {cat.name}
                 </button>
              ))}
           </div>

           {/* Search Input */}
           <div className="relative w-full md:w-72 shrink-0">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-[hsl(var(--secondary))]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
           </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-40">
              <Loader2 className="w-10 h-10 animate-spin text-red-500" />
           </div>
        ) : filteredBlogs.length === 0 ? (
           <div className="bg-white rounded-[3rem] border border-gray-100 py-32 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-2xl">📚</div>
              <h3 className="text-lg font-black text-[hsl(var(--secondary))] tracking-tight">No Articles Found</h3>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Try searching another topic or changing the category.</p>
           </div>
        ) : (
           <div className="space-y-16">
              
              {/* Feature Article Cover Card */}
              {featuredArticle && (
                 <motion.div
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="group bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 grid grid-cols-1 lg:grid-cols-12 gap-8 p-8"
                 >
                    <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-7 bg-gray-100 rounded-[2rem] overflow-hidden">
                       <Image 
                         src={featuredArticle.thumbnailUrl || "/images/dog.png"} 
                         alt={featuredArticle.title} 
                         fill 
                         className="object-cover transition-transform duration-1000 group-hover:scale-103"
                       />
                       <span className="absolute top-6 left-6 px-4 py-2 bg-white/95 backdrop-blur-md rounded-xl text-[9px] font-black text-red-600 uppercase tracking-widest shadow-md">
                          Featured: {featuredArticle.category?.name || "Care"}
                       </span>
                    </div>

                    <div className="lg:col-span-5 flex flex-col justify-between py-4 space-y-6">
                       <div className="space-y-4">
                          <div className="flex items-center gap-4 text-gray-300 font-black text-[10px] uppercase tracking-widest">
                             <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(featuredArticle.createdAt).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</span>
                             <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 5 Min Read</span>
                          </div>
                          
                          <h2 className="text-3xl md:text-4xl font-black text-[hsl(var(--secondary))] group-hover:text-red-500 transition-colors tracking-tight leading-tight">
                             {featuredArticle.title}
                          </h2>
                          
                          <p className="text-gray-400 text-sm font-bold leading-relaxed line-clamp-4">
                             {featuredArticle.content.replace(/<[^>]*>/g, '')}
                          </p>
                       </div>

                       <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                             <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400 uppercase">🐾</div>
                             <span className="text-xs font-black text-[hsl(var(--secondary))]">{featuredArticle.author?.name || "PawStore Doctor"}</span>
                          </div>

                          <Link 
                            href={`/blog/${featuredArticle.slug}`}
                            className="btn-primary !px-8 !py-3.5 !rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-500/10"
                          >
                             Read Guide <ArrowRight className="w-4 h-4" />
                          </Link>
                       </div>
                    </div>
                 </motion.div>
              )}

              {/* Standard Articles Grid */}
              {standardArticles.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                    {standardArticles.map((article, idx) => (
                       <Link 
                         key={article.id} 
                         href={`/blog/${article.slug}`} 
                         className="group bg-[#FDFBF7] hover:bg-white rounded-[2.5rem] p-6 border border-gray-100 hover:border-red-100 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between min-h-[380px]"
                       >
                          <div>
                             <div className="relative aspect-[16/10] bg-gray-100 rounded-[2rem] overflow-hidden mb-6">
                                <Image src={article.thumbnailUrl || "/images/dog.png"} alt={article.title} fill className="object-cover transition-transform duration-700 group-hover:scale-106" />
                                <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-xl text-[9px] font-black text-red-600 uppercase tracking-widest shadow-sm">{article.category?.name || "Care"}</span>
                             </div>
                             <h3 className="text-xl font-black text-[hsl(var(--secondary))] tracking-tight mb-3 group-hover:text-red-500 transition-colors line-clamp-2 leading-snug">
                               {article.title}
                             </h3>
                             <p className="text-gray-400 text-xs font-bold leading-relaxed line-clamp-3 mb-6">
                               {article.content.replace(/<[^>]*>/g, '')}
                             </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 5 Min Read</span>
                             <span className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Read Guide <ArrowRight className="w-3.5 h-3.5" /></span>
                          </div>
                       </Link>
                    ))}
                 </div>
              )}
           </div>
        )}

      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="pt-40 text-center font-bold text-gray-400 uppercase tracking-widest text-xs">Loading Advisory Center...</div>}>
      <BlogContent />
    </Suspense>
  );
}
