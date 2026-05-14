import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[hsl(var(--secondary))] text-white pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Pet<span className="text-[hsl(var(--primary))]">Hub</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Making pet care simpler, smarter, and more compassionate. Your pet's wellbeing is our top priority.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/marketplace" className="hover:text-white transition-colors">Adopt a Pet</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors">Pet Shop</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Pet Care Tips</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6">Connect</h4>
            <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[hsl(var(--primary))] transition-colors cursor-pointer">
                <span className="text-lg">f</span>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[hsl(var(--primary))] transition-colors cursor-pointer">
                <span className="text-lg">t</span>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[hsl(var(--primary))] transition-colors cursor-pointer">
                <span className="text-lg">i</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Subscribe to our newsletter for updates</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© 2026 PetHub. All rights reserved.</p>
          <p className="text-xs text-gray-500 flex gap-4">
            <span>Made with ❤️ for Pets</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
