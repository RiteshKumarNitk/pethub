"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dog, ShoppingBag, ShieldCheck, ArrowRight, CheckCircle2, IndianRupee, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [featuredPets, setFeaturedPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch("/api/listings");
        const data = await res.json();
        if (data.listings) {
          setFeaturedPets(data.listings.filter((l: any) => l.isApproved === "true").slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch featured pets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center pt-28 overflow-hidden bg-white">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="z-10 space-y-10">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-orange-50 rounded-full border border-orange-100">
              <span className="w-2.5 h-2.5 bg-[hsl(var(--primary))] rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-[hsl(var(--primary))] uppercase tracking-[0.2em]">Verified Pet Hub India</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] text-[hsl(var(--secondary))] tracking-tighter">
              Where Your <br /> Pets Are <span className="text-[hsl(var(--primary))] underline decoration-8 decoration-orange-500/20 underline-offset-8">Family</span>
            </h1>
            <p className="text-xl text-gray-400 font-bold max-w-lg leading-relaxed uppercase tracking-widest text-xs">
              join our community for verified adoption, <br /> premium supplies, and expert vet care.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <Link href="/marketplace" className="btn-primary flex items-center gap-3 !px-12 !py-6">
                Browse Adoption <ArrowRight className="w-6 h-6" />
              </Link>
              <Link href="/services" className="px-10 py-6 rounded-[2rem] border-4 border-gray-50 text-[hsl(var(--secondary))] font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">
                Our Services
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="relative h-[700px] w-full rounded-[4rem] overflow-hidden shadow-3xl border-8 border-white group">
              <Image 
                src="/images/hero.png" 
                alt="Happy pets" 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--secondary))]/20 to-transparent"></div>
            </div>
            
            {/* Contextual Stats */}
            <div className="absolute top-12 -left-12 glass-morphism p-6 rounded-[2.5rem] shadow-2xl animate-bounce duration-[4000ms] border-white/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trust Score</p>
                  <p className="text-lg font-black text-[hsl(var(--secondary))]">100% Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Added Section - ADDRESSING USER FEEDBACK ABOUT PRICE CONSISTENCY */}
      <section className="py-32 bg-gray-50/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
            <div className="max-w-xl">
               <h2 className="text-4xl md:text-5xl font-black text-[hsl(var(--secondary))] tracking-tighter mb-4">Latest Additions</h2>
               <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Waiting for their forever homes</p>
            </div>
            <Link href="/marketplace" className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all pb-2">
               View Full Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
             {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-80 bg-white rounded-[3rem] animate-pulse"></div>)
             ) : featuredPets.length > 0 ? (
                featuredPets.map((pet, i) => (
                  <Link key={pet.id} href={`/marketplace/${pet.id}`} className="group bg-white rounded-[3rem] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/5 transition-all">
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6">
                       <Image src={pet.images?.[0] || "/images/dog.png"} alt={pet.breed} fill className="object-cover transition-transform group-hover:scale-110" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-[hsl(var(--secondary))] tracking-tight mb-2">{pet.breed}</h3>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-300 uppercase underline decoration-orange-500/30 underline-offset-4">{pet.ageMonths} Months</span>
                          <div className="flex items-center gap-0.5 font-black text-[hsl(var(--primary))]">
                             {pet.showPrice ? (
                               <><IndianRupee className="w-3 h-3" /> {pet.price}</>
                             ) : (
                               <span className="text-[10px] uppercase tracking-widest text-gray-300">Contact</span>
                             )}
                          </div>
                       </div>
                    </div>
                  </Link>
                ))
             ) : (
                <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs">
                  No active listings yet
                </div>
             )}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[hsl(var(--secondary))] tracking-tighter mb-4">Complete Pet ecosystem</h2>
            <div className="w-16 h-2 bg-[hsl(var(--primary))] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { id: 'adoption', title: 'Adoption', desc: 'Verified Interest leads', color: 'bg-orange-50', text: 'text-orange-600', icon: '🐾', href: '/marketplace' },
              { id: 'shop', title: 'Pet Shop', desc: 'Premium Supplies', color: 'bg-blue-50', text: 'text-blue-600', icon: '🛒', href: '/shop' },
              { id: 'grooming', title: 'Expert Care', desc: 'Vet & Grooming', color: 'bg-green-50', text: 'text-green-600', icon: '🏥', href: '/services' },
            ].map((cat) => (
              <Link key={cat.id} href={cat.href} className={`group ${cat.color} p-12 rounded-[4rem] flex flex-col items-center justify-center space-y-6 transition-all hover:-translate-y-2`}>
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-4xl shadow-xl shadow-black/5 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <div>
                   <h3 className={`text-2xl font-black ${cat.text} tracking-tight`}>{cat.title}</h3>
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 bg-gray-50/30">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
             <div className="p-16 bg-[hsl(var(--secondary))] rounded-[4rem] text-white relative overflow-hidden flex flex-col justify-center min-h-[500px]">
                <div className="relative z-10 space-y-8">
                   <h2 className="text-5xl font-black leading-tight tracking-tight">Verified by <br /> professionals. <br /> Loved by pets.</h2>
                   <p className="text-white/40 font-bold uppercase tracking-widest text-xs leading-loose">
                     Every listing is verified manually by our admin team before connecting you with the owner. Safety is our hub's heart.
                   </p>
                   <Link href="/about" className="btn-primary inline-flex mt-8 !px-10">Our Philosophy</Link>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
             </div>

             <div className="space-y-12">
                {[
                  { title: "Admin-Mediated", desc: "We don't just list, we verify. Every interest is handled personally by our admins." },
                  { title: "Pure Adoption", desc: "No cart, no complex sales. Just heart-to-heart pet adoption leads." },
                  { title: "Transparency", desc: "Controlled price visibility based on the listing's necessity." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-8 group">
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center font-black text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight mb-2">{item.title}</h4>
                      <p className="text-gray-400 font-bold leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
