"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag, Calendar, Dog, Tag, Heart, ChevronRight, Loader2,
  Package, Clock, BadgeCheck,
} from "lucide-react";
import { StatusPill } from "@/components/StatusPill";

export default function AccountOverview() {
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/orders?limit=3").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/pets").then((r) => r.json()),
      fetch("/api/pet-listings/mine").then((r) => r.json()),
    ]).then(([o, b, p, l]) => {
      if (o.status === "fulfilled") setOrders(o.value.orders || []);
      if (b.status === "fulfilled") setBookings(b.value.bookings || []);
      if (p.status === "fulfilled") setPets(p.value.pets || []);
      if (l.status === "fulfilled") setListings(l.value.listings || []);
      setLoading(false);
    });
  }, []);

  const upcomingBookings = bookings.filter((b) =>
    ["pending", "confirmed"].includes(b.status) &&
    new Date(`${b.bookingDate}T${b.slotTime}`) >= new Date()
  );

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Orders", value: orders.length > 0 ? `${orders.length}+` : "0", icon: ShoppingBag, href: "/account/orders", color: "text-orange-500 bg-orange-50" },
          { label: "Upcoming visits", value: String(upcomingBookings.length), icon: Calendar, href: "/account/bookings", color: "text-teal-600 bg-teal-50" },
          { label: "My pets", value: String(pets.length), icon: Dog, href: "/account/pets", color: "text-blue-500 bg-blue-50" },
          { label: "My listings", value: String(listings.length), icon: Tag, href: "/account/listings", color: "text-pink-500 bg-pink-50" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <Card title="Upcoming Appointments" href="/account/bookings">
          {upcomingBookings.slice(0, 3).map((b) => (
            <div key={b.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{b.serviceName}</p>
                <p className="text-xs text-gray-500">{b.petName} · {b.bookingDate} at {String(b.slotTime).slice(0, 5)}</p>
              </div>
              <StatusPill status={b.status} />
            </div>
          ))}
        </Card>
      )}

      {/* Recent orders */}
      <Card title="Recent Orders" href="/account/orders" emptyText="No orders yet — start shopping!">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{o.orderNumber}</p>
              <p className="text-xs text-gray-500">
                {new Date(o.createdAt).toLocaleDateString()} · ₹{parseFloat(o.total).toFixed(0)} · {o.items?.length ?? 0} item(s)
              </p>
            </div>
            <StatusPill status={o.status} />
          </div>
        ))}
      </Card>

      {/* My pets strip */}
      <Card title="My Pets" href="/account/pets" emptyText="Add a pet profile for faster bookings and personalized care.">
        <div className="flex gap-3 overflow-x-auto py-1">
          {pets.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-28 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-50 border-2 border-white shadow flex items-center justify-center overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Dog className="w-7 h-7 text-orange-400" />
                )}
              </div>
              <p className="text-xs font-bold text-gray-800 mt-1.5 truncate">{p.name}</p>
              <p className="text-[10px] text-gray-400">{p.species}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Book grooming", href: "/services", icon: Calendar },
          { label: "Sell / rehome", href: "/sell-rehome", icon: Tag },
          { label: "Explore pets", href: "/pets", icon: Heart },
          { label: "Shop products", href: "/shop", icon: ShoppingBag },
        ].map((a) => (
          <Link key={a.label} href={a.href} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:border-orange-200 hover:text-orange-600 transition-colors">
            <a.icon className="w-4 h-4" /> {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Card({ title, href, children, emptyText }: { title: string; href: string; children: React.ReactNode; emptyText?: string }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-gray-900">{title}</h2>
        <Link href={href} className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-0.5">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {hasChildren ? children : <p className="text-sm text-gray-400 py-4">{emptyText}</p>}
    </div>
  );
}
