import Link from "next/link";
import { PawPrint, Phone, Mail, MapPin, ShieldCheck, Clock } from "lucide-react";

const shopLinks = [
  { label: "All Products", href: "/shop" },
  { label: "Dog Supplies", href: "/shop?petType=dog" },
  { label: "Cat Supplies", href: "/shop?petType=cat" },
  { label: "Best Sellers", href: "/shop?sort=popular" },
  { label: "Brands", href: "/shop" },
];

const petLinks = [
  { label: "Explore Pets", href: "/pets" },
  { label: "Business-Verified Pets", href: "/pets?type=business" },
  { label: "Community Listings", href: "/pets?type=community" },
  { label: "Sell / Rehome Your Pet", href: "/sell-rehome" },
];

const serviceLinks = [
  { label: "All Services", href: "/services" },
  { label: "Grooming", href: "/services" },
  { label: "Book an Appointment", href: "/services" },
  { label: "My Bookings", href: "/account/bookings" },
];

const learnLinks = [
  { label: "Pet Care Guides", href: "/pet-care" },
  { label: "Nutrition", href: "/pet-care" },
  { label: "Grooming Tips", href: "/pet-care" },
  { label: "New Pet-Parent Guide", href: "/pet-care" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Trust & Safety", href: "/about#trust" },
  { label: "Terms of Use", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Shipping & Returns", href: "/legal/shipping-policy" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span className="font-medium">Verified Listings</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Phone className="w-5 h-5 text-orange-400" />
            <span className="font-medium">Real Shop Support</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="font-medium">Open 7 Days</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <PawPrint className="w-5 h-5 text-pink-400" />
            <span className="font-medium">Pet-Parent Trusted</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold">
              Paw<span className="text-orange-400">Store</span>
            </span>
          </Link>
          <p className="text-sm text-gray-400 mb-4 max-w-xs">
            Your trusted local pet-care destination — shop products, meet pets, book services, and find expert care advice.
          </p>
          <div className="space-y-1.5 text-sm text-gray-400">
            <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-white">
              <Phone className="w-3.5 h-3.5 text-orange-400" /> +91 98765 43210
            </a>
            <a href="mailto:hello@pawstore.in" className="flex items-center gap-2 hover:text-white">
              <Mail className="w-3.5 h-3.5 text-orange-400" /> hello@pawstore.in
            </a>
            <span className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
              123 Pet Street, Mumbai 400001 · Mon–Sun 9AM–8PM
            </span>
          </div>
        </div>

        <FooterCol title="Shop" links={shopLinks} />
        <FooterCol title="Pets" links={petLinks} />
        <FooterCol title="Services" links={serviceLinks} />
        <FooterCol title="Learn" links={[...learnLinks, ...companyLinks]} />
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} PawStore. All rights reserved.</span>
          <span className="max-w-xl text-center md:text-right">
            Pets are living beings. Every community listing is reviewed by our team — always meet pets and verify health records before completing any transaction.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
