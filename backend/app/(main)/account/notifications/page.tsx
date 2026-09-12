"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, Check, ShoppingBag, Calendar, Tag, MessageCircle } from "lucide-react";

const TYPE_ICONS: Record<string, typeof Bell> = {
  order: ShoppingBag,
  booking: Calendar,
  listing: Tag,
  inquiry: MessageCircle,
  system: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markOne = async (id: number) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-black text-gray-900 text-lg">Notifications {unread > 0 && <span className="text-orange-500 text-sm">({unread} new)</span>}</h2>
        {unread > 0 && (
          <button onClick={markAll} className="text-sm font-bold text-teal-700 hover:underline flex items-center gap-1">
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">No notifications</h3>
          <p className="text-sm text-gray-500 mt-1">Order, booking and listing updates will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-2xl p-4 border transition-colors ${
                  n.isRead ? "bg-white border-gray-100" : "bg-orange-50/50 border-orange-100"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.isRead ? "bg-gray-50 text-gray-400" : "bg-orange-100 text-orange-600"}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? "font-semibold text-gray-700" : "font-bold text-gray-900"}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                  {n.link && (
                    <Link href={n.link} onClick={() => markOne(n.id)} className="text-xs font-bold text-teal-700 hover:underline mt-1 inline-block">
                      View →
                    </Link>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
