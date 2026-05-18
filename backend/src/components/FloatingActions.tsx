"use client";

import { MessageCircle, Phone, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingActions() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
      {/* WhatsApp Button */}
      <a
        href="https://wa.me/91XXXXXXXXXX"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group relative"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          WhatsApp Support
        </span>
      </a>

      {/* Call Button */}
      <a
        href="tel:+91XXXXXXXXXX"
        className="w-14 h-14 bg-[hsl(var(--primary))] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group relative"
      >
        <Phone className="w-7 h-7" />
        <span className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Direct Call
        </span>
      </a>

      {/* Scroll to Top */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="w-14 h-14 bg-[hsl(var(--secondary))] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
