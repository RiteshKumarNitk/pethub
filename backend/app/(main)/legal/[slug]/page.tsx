import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, FileText } from "lucide-react";

const policies: Record<string, { title: string; description: string; sections: { heading: string; body: string[] }[] }> = {
  terms: {
    title: "Terms of Use",
    description: "Terms governing the use of PawStore's platform, products, services and pet listings.",
    sections: [
      {
        heading: "1. About PawStore",
        body: [
          "PawStore operates a physical pet-care shop and this website for selling pet products, publishing pet listings, and booking pet-care services.",
          "By using this platform you agree to these terms. If you do not agree, please do not use the platform.",
        ],
      },
      {
        heading: "2. Products & orders",
        body: [
          "Product listings are accurate to the best of our knowledge at the time of publication. Colours and packaging may vary slightly from photos.",
          "Orders are confirmed only after successful payment. Prices include applicable taxes unless stated otherwise.",
        ],
      },
      {
        heading: "3. Pet listings",
        body: [
          "Pets listed by our business are marked 'Verified by our shop' — we have seen these animals in person.",
          "Community listings are published by individual pet parents and reviewed by our team for basic legitimacy, but they are NOT verified by our business. We do not guarantee the accuracy of community listings.",
          "Always meet the pet and verify health records in person before completing any transaction. Never pay in advance for a community listing without due diligence.",
        ],
      },
      {
        heading: "4. Bookings",
        body: [
          "Service bookings are requests until confirmed by our team. Deposit amounts (where applicable) are adjusted against the final bill.",
          "Free cancellation up to 3 hours before the appointment unless stated otherwise. Repeated no-shows may result in booking restrictions.",
        ],
      },
      {
        heading: "5. Acceptable use",
        body: [
          "You may not submit false information, list prohibited species, or use the platform for fraud or spam.",
          "Listings violating animal-welfare principles or applicable law will be removed and may be reported to authorities.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "How PawStore collects, uses and protects your personal data.",
    sections: [
      {
        heading: "1. What we collect",
        body: [
          "Account data: your phone number, name and (optionally) email.",
          "Order & booking data: addresses, purchase history, appointment details.",
          "Pet data: pet profiles and listing information you choose to share, including photos and health notes.",
        ],
      },
      {
        heading: "2. How we use it",
        body: [
          "To fulfil orders, arrange bookings, respond to enquiries and notify you about your orders, bookings and listings.",
          "We never sell your personal data. Contact details from community listings are only shared with enquirers through the platform's inquiry flow.",
        ],
      },
      {
        heading: "3. Storage & your rights",
        body: [
          "Data is stored in encrypted cloud infrastructure (Neon Postgres). Payment data is handled by Razorpay; we do not store card details.",
          "You can request correction or deletion of your data anytime by contacting the shop.",
        ],
      },
    ],
  },
  "shipping-policy": {
    title: "Shipping & Delivery Policy",
    description: "Delivery timelines, charges and serviceability for PawStore orders.",
    sections: [
      {
        heading: "1. Charges",
        body: [
          "Free delivery on orders above ₹499. Below that, a flat ₹50 shipping fee applies (current rates are shown at checkout).",
        ],
      },
      {
        heading: "2. Timelines",
        body: [
          "Metro cities: 2–3 business days. Other locations: 3–6 business days.",
          "You receive notifications when your order is confirmed, shipped and delivered.",
        ],
      },
      {
        heading: "3. Damaged or missing items",
        body: [
          "Report issues within 48 hours of delivery with photos, and we'll replace the item or refund you in full.",
        ],
      },
    ],
  },
  "refund-policy": {
    title: "Returns & Refund Policy",
    description: "Return windows and refund processing for products, services and deposits.",
    sections: [
      {
        heading: "1. Products",
        body: [
          "7-day returns on unopened, unused products in original packaging. Opened food, treats and hygiene products cannot be returned for safety reasons.",
          "Refunds are processed to the original payment method within 5–7 business days of us receiving the return.",
        ],
      },
      {
        heading: "2. Services & bookings",
        body: [
          "Cancel up to 3 hours before your appointment for a full refund of any deposit. Later cancellations may forfeit the deposit.",
          "If you're unsatisfied with a grooming session, tell us before leaving — we'll make it right.",
        ],
      },
      {
        heading: "3. Pet listings",
        body: [
          "Rehoming a living animal is not a commercial return. We facilitate introductions; final decisions and any agreements happen between the parties in person, with animal welfare as the priority.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) return {};
  return { title: policy.title, description: policy.description };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2.5 mb-2">
        <FileText className="w-5 h-5 text-teal-700" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">PawStore Policies</span>
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-8">{policy.title}</h1>
      <div className="space-y-7">
        {policy.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-bold text-gray-900 mb-2">{s.heading}</h2>
            <div className="space-y-2">
              {s.body.map((p, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-10 bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-start gap-3 text-sm text-gray-600">
        <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <p>
          Questions about this policy? <Link href="/contact" className="font-bold text-teal-700 hover:underline">Contact us</Link> — we're a real shop and we answer.
        </p>
      </div>
    </div>
  );
}
