import type { Metadata } from "next";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "PawStore | Premium Pet Supplies & Care",
  description: "Your one-stop shop for premium pet food, accessories, and care products. Expert pet care guides and tips.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <FloatingActions />
        <Footer />
      </body>
    </html>
  );
}
