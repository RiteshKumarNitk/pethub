"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Sparkles, 
  ShoppingBag, 
  ChevronRight,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

const fallbackProducts = [
  { id: 1, name: "Royal Canin Maxi Puppy Kibble", price: 1599, category: "Food", imageUrl: "/images/food.png" },
  { id: 2, name: "Whiskas Wet Cat Food (12 Pack)", price: 480, category: "Food", imageUrl: "/images/food.png" },
  { id: 3, name: "Premium Retractable Dog Leash (5m)", price: 899, category: "Accessories", imageUrl: "/images/hero.png" },
  { id: 4, name: "Organic Aloe Vera Dog Shampoo (500ml)", price: 450, category: "Care & Hygiene", imageUrl: "/images/grooming.png" },
  { id: 5, name: "Self-Cleaning Deshedding Grooming Brush", price: 599, category: "Care & Hygiene", imageUrl: "/images/grooming.png" },
  { id: 6, name: "Interactive Wobble Treat Dispensing Toy", price: 699, category: "Toys", imageUrl: "/images/adoption.png" },
  { id: 9, name: "BarkOut Multivitamin Tablets for Dogs", price: 799, category: "Health", imageUrl: "/images/grooming.png" }
];

const fallbackBlogs = [
  {
    title: "The Ultimate Beagle Puppy Diet Chart & Nutrition Guide",
    slug: "beagle-puppy-diet-chart",
    content: `<h3>Understanding Beagle Nutritional Needs</h3><p>Beagles are active, energetic, and highly food-motivated dogs. Because of their enthusiastic appetite, Beagles are prone to obesity. Providing a balanced diet with controlled portions is critical for their health and longevity.</p><h4>Puppy Stage (2 to 6 Months)</h4><p>At this stage, your Beagle puppy is growing rapidly and requires nutrient-dense food rich in protein (26-28%) and healthy fats. Feed them 3 to 4 times a day with high-quality puppy kibble.</p><ul><li><strong>Daily Calories:</strong> Approximately 600 - 800 kcal</li><li><strong>Feeding Frequency:</strong> 3-4 meals per day</li><li><strong>Meal Portion:</strong> 1/2 to 3/4 cup per meal</li></ul><h4>Adult Stage (1 Year & Beyond)</h4><p>Transition your Beagle to adult food at around 10-12 months. Adult Beagles should be fed twice a day to maintain steady energy levels and avoid bloating or overeating.</p><blockquote><strong>Tip:</strong> Always measure food portions with a cup. Avoid free-feeding (leaving food out all day) as Beagles will eat until they are sick!</blockquote>`,
    thumbnailUrl: "/images/dog.png",
    category: { name: "Nutrition & Diet", slug: "nutrition-diet" },
    createdAt: new Date().toISOString()
  },
  {
    title: "Persian Cat Grooming at Home: A Step-by-Step Walkthrough",
    slug: "persian-cat-grooming-guide",
    content: `<h3>Why Persian Cats Need Daily Grooming</h3><p>With their luxurious long coats, flat faces, and sweet temperaments, Persian cats are beloved worldwide. However, their magnificent fur easily mats, tangles, and traps dirt. Daily grooming is not optional—it is a vital part of keeping a Persian cat healthy and comfortable.</p><h4>Step 1: Daily Combing</h4><p>Use a high-quality metal comb with wide-spaced teeth on one side and fine-spaced teeth on the other. Start from the head and work your way down the back, belly, and legs. Always comb in the direction of hair growth.</p><h4>Step 2: Managing Tear Staining</h4><p>Persian cats often suffer from excessive tear production due to their facial structure. Clean their eyes daily with a cotton pad moistened with warm water or dedicated cat eye wipes to prevent dark brown tear stains and infections.</p><h4>Step 3: Bathing (Every 4-6 Weeks)</h4><p>Bathe your Persian cat in warm water using a soap-free, cat-safe oatmeal shampoo. Make sure to dry their coat thoroughly with a towel or a pet-safe hairdryer on a low-heat setting to avoid deep mats.</p>`,
    thumbnailUrl: "/images/grooming.png",
    category: { name: "Grooming & Hygiene", slug: "grooming-hygiene" },
    createdAt: new Date().toISOString()
  },
  {
    title: "5 Golden Rules for Crate Training Your Puppy Successfully",
    slug: "crate-training-puppy-rules",
    content: `<h3>Crate Training: A Safe Haven, Not a Prison</h3><p>Crate training is one of the most effective ways to housebreak your puppy and provide them with a secure, stress-free space of their own. When done correctly, the crate becomes your puppy's cozy den, not a place of punishment.</p><h4>Rule 1: Choose the Right Crate Size</h4><p>The crate should be large enough for your puppy to stand up, turn around, and lie down comfortably. If the crate is too large, they might use one corner as a bathroom and the other as a bed.</p><h4>Rule 2: Make the Crate Inviting</h4><p>Place a soft blanket, safe chew toys, and a treat-dispensing puzzle toy inside. Feed your puppy their meals inside the crate to build a positive association with the space.</p><h4>Rule 3: Never Use the Crate for Punishment</h4><p>If you put your puppy in the crate when they misbehave, they will begin to associate it with fear and isolation, which completely ruins the training progress.</p>`,
    thumbnailUrl: "/images/hero.png",
    category: { name: "Training & Behaviour", slug: "training-behaviour" },
    createdAt: new Date().toISOString()
  },
  {
    title: "How to Identify and Treat Tick Fever in Dogs",
    slug: "tick-fever-dogs-treatment",
    content: `<h3>What is Tick Fever?</h3><p>Tick fever (e.g., Ehrlichiosis, Babesiosis) is a serious, potentially life-threatening infectious disease transmitted to dogs through tick bites. It affects blood platelets and red blood cells, causing severe internal distress if left untreated.</p><h4>Recognizing the Key Symptoms</h4><p>Symptoms can develop weeks after a tick bite and can be subtle initially. Watch out for:</p><ul><li>High fever and lethargy</li><li>Loss of appetite and rapid weight loss</li><li>Swollen lymph nodes and joint pain</li><li>Spontaneous bleeding (nosebleeds, blood in urine/stool)</li><li>Pale gums (anemia)</li></ul><h4>Medical Diagnosis & Treatment</h4><p>If you suspect tick fever, consult a vet immediately. They will perform a blood test (CBC and PCR test) to check platelet levels and identify the pathogen. Treatment typically includes a 3-to-4 week course of antibiotics (like Doxycycline), alongside multivitamins and iron supplements to aid blood recovery.</p><blockquote><strong>Prevention is Key:</strong> Use monthly tick-and-flea spot-on treatments, tick collars, or oral chewables, especially during warm and humid monsoon seasons.</blockquote>`,
    thumbnailUrl: "/images/dog.png",
    category: { name: "Health & Wellness", slug: "health-wellness" },
    createdAt: new Date().toISOString()
  }
];

export default function BlogDetailPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchBlogDetail = async () => {
      try {
        const res = await fetch(`/api/blogs/${slug}`);
        const data = await res.json();
        
        if (data.blog) {
          setBlog(data.blog);
          getRelatedProducts(data.blog.category?.slug);
        } else {
          // Check fallbacks
          const found = fallbackBlogs.find(b => b.slug === slug);
          if (found) {
            setBlog(found);
            getRelatedProducts(found.category?.slug);
          }
        }
      } catch (err) {
        console.error("Failed to load blog details, using fallback", err);
        const found = fallbackBlogs.find(b => b.slug === slug);
        if (found) {
          setBlog(found);
          getRelatedProducts(found.category?.slug);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogDetail();
  }, [slug]);

  // Dynamically select cross-sell items based on article category
  const getRelatedProducts = (catSlug: string) => {
    let related: any[] = [];
    if (catSlug === "nutrition-diet") {
      related = fallbackProducts.filter(p => p.category === "Food").slice(0, 2);
    } else if (catSlug === "grooming-hygiene") {
      related = fallbackProducts.filter(p => p.category === "Care & Hygiene").slice(0, 2);
    } else if (catSlug === "health-wellness") {
      related = fallbackProducts.filter(p => p.category === "Health").slice(0, 2);
    } else {
      related = fallbackProducts.filter(p => p.category === "Toys").slice(0, 2);
    }
    setRelatedProducts(related);
  };

  if (loading) {
    return (
      <div className="pt-48 pb-20 flex justify-center items-center bg-[#FDFBF7] min-h-screen">
         <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Care Guide...</p>
         </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="pt-48 pb-20 text-center bg-[#FDFBF7] min-h-screen space-y-6">
         <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">⚠️</div>
         <h2 className="text-2xl font-black text-[hsl(var(--secondary))]">Article Not Found</h2>
         <Link href="/blog" className="btn-primary inline-flex">Go to Hub</Link>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 bg-[#FDFBF7] min-h-screen">
      <div className="container mx-auto px-6 max-w-6xl space-y-12">
        
        {/* Back Link */}
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[hsl(var(--primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Advisory Center
        </Link>

        {/* Hero Section of Article */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-gray-100 pb-12">
           <div className="lg:col-span-7 space-y-6">
              <span className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-100 inline-block">
                 {blog.category?.name || "Care Advice"}
              </span>

              <h1 className="text-4xl md:text-5xl font-black text-[hsl(var(--secondary))] tracking-tight leading-tight">
                 {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                 <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-orange-500" /> By {blog.author?.name || "Dr. Ritesh Kumar"}</span>
                 <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-500" /> {new Date(blog.createdAt).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</span>
                 <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> 5 Min Read</span>
              </div>
           </div>

           <div className="relative aspect-[16/10] lg:col-span-5 rounded-[3rem] overflow-hidden bg-gray-100 shadow-xl border border-white/80">
              <Image 
                src={blog.thumbnailUrl || "/images/dog.png"} 
                alt={blog.title} 
                fill 
                className="object-cover"
              />
           </div>
        </div>

        {/* Main Content Layout: Left TOC + Middle Content + Right Cross-sell */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           
           {/* Left Table of Contents */}
           <aside className="hidden lg:block lg:col-span-3 shrink-0 h-fit sticky top-28 space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-widest text-[hsl(var(--secondary))] flex items-center gap-2">
                 <BookOpen className="w-4 h-4 text-red-500" /> Contents
              </h4>
              <nav className="flex flex-col gap-3.5 text-xs text-gray-400 font-bold">
                 <a href="#intro" className="hover:text-red-500 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-red-500" /> Introduction</a>
                 <a href="#guide" className="hover:text-red-500 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-red-500" /> Complete Guide</a>
                 <a href="#tips" className="hover:text-red-500 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-red-500" /> Veterinarian Advice</a>
              </nav>
           </aside>

           {/* Middle Editorial Content */}
           <article className="lg:col-span-6 space-y-8 bg-white p-8 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-sm">
              <div id="intro" className="scroll-mt-28"></div>
              
              <div 
                className="prose max-w-none text-gray-600 font-bold text-sm md:text-base leading-relaxed space-y-6
                  prose-headings:text-[hsl(var(--secondary))] prose-headings:font-black prose-headings:tracking-tight 
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                  prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                  prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                  prose-strong:font-black prose-strong:text-[hsl(var(--secondary))]
                  prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:my-6 prose-blockquote:bg-orange-50/50 prose-blockquote:py-4 prose-blockquote:rounded-r-2xl"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              <div id="guide" className="scroll-mt-28"></div>
              <div id="tips" className="scroll-mt-28"></div>

              {/* Verified Badge */}
              <div className="flex items-center gap-4 bg-green-50/50 border border-green-100 p-6 rounded-2xl mt-12">
                 <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl shrink-0">🩺</div>
                 <div>
                    <h5 className="font-black text-green-900 text-sm">Medical & Nutritional Accuracy Checked</h5>
                    <p className="text-green-700/80 font-bold text-xs leading-normal">
                       This article is verified by PawStore&apos;s elite veterinarian board and aligns with clinical standards for healthy puppy growth.
                    </p>
                 </div>
              </div>
           </article>

           {/* Right Cross-Selling Store Widget */}
           <aside className="lg:col-span-3 space-y-8 shrink-0 h-fit lg:sticky lg:top-28">
              {relatedProducts.length > 0 && (
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="space-y-1">
                       <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest block">Cross-Promotion</span>
                       <h4 className="text-xs font-black uppercase tracking-widest text-[hsl(var(--secondary))] flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-orange-500" /> Recommended Store Items
                       </h4>
                    </div>

                    <div className="flex flex-col gap-6">
                       {relatedProducts.map((prod) => (
                          <div key={prod.id} className="group flex gap-4 pb-4 border-b border-gray-50 last:border-none last:pb-0 items-center">
                             <div className="relative w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-50">
                                <Image src={prod.imageUrl} alt={prod.name} fill className="object-contain p-2" />
                             </div>
                             <div className="space-y-1 flex-1">
                                <h5 className="text-[11px] font-black text-[hsl(var(--secondary))] tracking-tight line-clamp-1 group-hover:text-orange-500 transition-colors leading-tight">
                                   {prod.name}
                                </h5>
                                <div className="text-[10px] font-black text-orange-500">₹{prod.price}</div>
                                <Link 
                                  href={`/shop`}
                                  className="text-[9px] font-black text-gray-400 hover:text-orange-500 transition-all uppercase tracking-widest flex items-center gap-0.5"
                                >
                                   Buy Now <ChevronRight className="w-3 h-3" />
                                </Link>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </aside>

        </div>
      </div>
    </div>
  );
}
