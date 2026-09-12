import type { Metadata } from "next";
import Link from "next/link";
import { Heart, ShieldCheck, Users, Store, BadgeCheck, MapPin, Clock, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — A Real Shop for Real Pet Parents",
  description:
    "PawStore is a physical pet-care shop and trusted online destination. Learn who we are, how we verify listings, and why pet parents trust us.",
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 rounded-full mb-6 px-4 py-2 font-extrabold text-xs uppercase tracking-[0.15em]">
          <Heart className="w-4 h-4" /> Our Story
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
          A real shop, behind every listing.
        </h1>
        <p className="text-lg text-gray-500 mt-5 leading-relaxed">
          PawStore started as a neighbourhood pet-care shop — the kind where groomers know every dog by name.
          We built this platform to bring that same trust online: honest products, verified pets, and care
          advice you can actually use.
        </p>
      </div>

      {/* What we do */}
      <div className="grid md:grid-cols-4 gap-4 mb-14">
        {[
          { icon: Store, title: "Physical shop", desc: "Visit us, meet pets in person, get face-to-face advice." },
          { icon: BadgeCheck, title: "Verified pets", desc: "Every pet from our shop is health-checked by us." },
          { icon: ShieldCheck, title: "Moderated listings", desc: "Community listings are reviewed before going live." },
          { icon: Users, title: "Community rehoming", desc: "Helping pets find homes — responsibly and safely." },
        ].map((v) => (
          <div key={v.title} className="bg-white border border-gray-100 rounded-2xl p-5">
            <v.icon className="w-7 h-7 text-orange-500 mb-3" />
            <h3 className="font-bold text-gray-900 text-sm">{v.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Trust & Safety */}
      <div id="trust" className="bg-teal-50 border border-teal-100 rounded-3xl p-8 mb-14">
        <h2 className="text-2xl font-black text-teal-900 flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-teal-700" /> Trust &amp; Safety
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mt-5 text-sm text-teal-900/80">
          <div className="space-y-3">
            <p><strong className="text-teal-900">Business vs community — always clear.</strong> Pets from our shop are badged "Verified by our shop". Community listings are labelled and never presented as verified by us.</p>
            <p><strong className="text-teal-900">Manual review.</strong> Every community listing is reviewed by our team before publication — with photos, vaccination claims and pricing checked for basic legitimacy.</p>
          </div>
          <div className="space-y-3">
            <p><strong className="text-teal-900">Report and act.</strong> Every listing has a report button. Reports are reviewed by humans, and listings with repeated welfare or fraud concerns are suspended.</p>
            <p><strong className="text-teal-900">Animal welfare first.</strong> We reject listings involving prohibited species or signs of poor welfare, and we encourage in-person meetings before any transaction.</p>
          </div>
        </div>
      </div>

      {/* Visit */}
      <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-10 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-black mb-4">Come say hello 🐾</h2>
          <div className="space-y-2.5 text-sm text-gray-300">
            <p className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-orange-400" /> 123 Pet Street, Mumbai 400001</p>
            <p className="flex items-center gap-2.5"><Clock className="w-4 h-4 text-orange-400" /> Mon–Sun, 9:00 AM – 8:00 PM</p>
            <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-orange-400" /> +91 98765 43210</p>
          </div>
        </div>
        <div className="flex md:justify-end gap-3">
          <Link href="/services" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl">Book a Service</Link>
          <Link href="/contact" className="bg-white/10 hover:bg-white/20 border border-white/20 font-bold px-6 py-3 rounded-xl">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
