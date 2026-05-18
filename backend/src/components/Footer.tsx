import Link from "next/link";

const shopLinks = [
  { label: "Pet Food", href: "/shop?category=Food" },
  { label: "Accessories", href: "/shop?category=Accessories" },
  { label: "Grooming", href: "/shop?category=Care%20%26%20Hygiene" },
  { label: "Toys", href: "/shop?category=Toys" },
  { label: "Health Products", href: "/shop?category=Health" },
  { label: "All Products", href: "/shop" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
];

const usefulLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Store Locator", href: "/store-locator" },
  { label: "Pet Care Guides", href: "/blog" },
  { label: "FAQ", href: "/faq" },
];

const supportLinks = [
  { label: "WhatsApp: +91 98765 43210", href: "https://wa.me/919876543210" },
  { label: "Email: help@pawstore.in", href: "mailto:help@pawstore.in" },
  { label: "Call: +91 98765 43210", href: "tel:+919876543210" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-lg font-bold text-white">
                Paw<span className="text-orange-400">Store</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              India&apos;s trusted online pet store for premium food, accessories, and care products. Delivering happiness to pets and their parents.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                f
              </div>
              <div className="w-9 h-9 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                t
              </div>
              <div className="w-9 h-9 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                i
              </div>
              <div className="w-9 h-9 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                y
              </div>
            </div>
          </div>

          {/* Online Shopping */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Online Shopping</h4>
            <ul className="space-y-2.5">
              {shopLinks.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Policies */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Customer Policies</h4>
            <ul className="space-y-2.5">
              {policyLinks.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Useful Links</h4>
            <ul className="space-y-2.5">
              {usefulLinks.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Customer Care</h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">We Accept</h5>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-gray-800 text-gray-300 text-[10px] font-semibold px-3 py-1.5 rounded">Visa</span>
                <span className="bg-gray-800 text-gray-300 text-[10px] font-semibold px-3 py-1.5 rounded">Mastercard</span>
                <span className="bg-gray-800 text-gray-300 text-[10px] font-semibold px-3 py-1.5 rounded">UPI</span>
                <span className="bg-gray-800 text-gray-300 text-[10px] font-semibold px-3 py-1.5 rounded">COD</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© 2026 PawStore. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/sitemap" className="hover:text-gray-300 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
