"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Loader2, ChevronDown, ChevronUp, XCircle, Truck } from "lucide-react";

const STATUS_STEPS = ["pending", "paid", "processing", "shipped", "delivered"];
const STEP_LABELS: Record<string, string> = {
  pending: "Payment pending",
  paid: "Payment confirmed",
  processing: "Being prepared",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cancelOrder = async (orderId: number) => {
    if (!confirm("Cancel this order?")) return;
    const res = await fetch("/api/orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
    } else {
      const d = await res.json();
      alert(d.error || "Failed to cancel");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-bold text-gray-700">No orders yet</h3>
        <p className="text-sm text-gray-500 mt-1">Your order history will appear here.</p>
        <Link href="/shop" className="mt-5 inline-block bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const isOpen = expanded === o.id;
        const cancelled = o.status === "cancelled";
        const currentStep = STATUS_STEPS.indexOf(o.status);
        return (
          <div key={o.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : o.id)}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{o.orderNumber}</p>
                <p className="text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleDateString()} · {o.items?.length ?? 0} item(s) · ₹{parseFloat(o.total).toFixed(0)}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                cancelled ? "bg-red-50 text-red-600"
                : o.status === "delivered" ? "bg-teal-50 text-teal-700"
                : "bg-amber-50 text-amber-700"
              }`}>
                {o.status}
              </span>
              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                {/* Tracking timeline */}
                {!cancelled ? (
                  <div className="flex items-center mb-5">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            i <= currentStep ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-400"
                          }`}>
                            {i <= currentStep ? "✓" : i + 1}
                          </div>
                          <span className={`text-[9px] mt-1 font-semibold whitespace-nowrap ${i <= currentStep ? "text-teal-700" : "text-gray-400"}`}>
                            {STEP_LABELS[step]}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < currentStep ? "bg-teal-600" : "bg-gray-100"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-red-500 mb-4 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> This order was cancelled.</p>
                )}

                {/* Items */}
                <div className="space-y-2.5">
                  {o.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden relative flex-shrink-0">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="48px" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-400">Qty {item.qty} × ₹{parseFloat(item.unitPrice).toFixed(0)}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">₹{parseFloat(item.subtotal).toFixed(0)}</p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 pt-3 border-t border-gray-100 text-sm space-y-1">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{parseFloat(o.subtotal).toFixed(0)}</span></div>
                  {parseFloat(o.discountAmount) > 0 && (
                    <div className="flex justify-between text-teal-600"><span>Discount {o.couponCode ? `(${o.couponCode})` : ""}</span><span>−₹{parseFloat(o.discountAmount).toFixed(0)}</span></div>
                  )}
                  <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{parseFloat(o.shippingFee) === 0 ? "FREE" : `₹${parseFloat(o.shippingFee).toFixed(0)}`}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 pt-1"><span>Total</span><span>₹{parseFloat(o.total).toFixed(0)}</span></div>
                </div>

                {/* Address */}
                {o.shippingAddress && (
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                    <p className="font-bold text-gray-700 mb-0.5">Delivering to</p>
                    {[o.shippingAddress.street, o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.zip].filter(Boolean).join(", ")}
                  </div>
                )}

                {/* Cancel */}
                {["pending", "paid"].includes(o.status) && (
                  <button
                    onClick={() => cancelOrder(o.id)}
                    className="mt-4 text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Cancel order
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
