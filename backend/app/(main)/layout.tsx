import type { Metadata } from "next";
import "../globals.css";
import Navbar, { CartProvider } from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: {
    default: "PawStore — Everything Your Pet Needs in One Place",
    template: "%s | PawStore",
  },
  description:
    "Shop pet products, meet pets from our shop and trusted community listings, book grooming and care services, and get expert pet-care advice.",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
        <CartProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <FloatingActions />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
