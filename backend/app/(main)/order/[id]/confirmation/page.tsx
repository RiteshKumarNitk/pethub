"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Package, Loader2, Truck, Phone } from "lucide-react";

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.orders || []).find((o: any) => o.id === parseInt(id));
        setOrder(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-teal-600" />
      </div>
      <h1 className="text-3xl font-black text-gray-900">Thank you for your order!</h1>
      {order ? (
        <>
          <p className="text-gray-500 mt-3">
            Order <strong className="text-gray-900">{order.orderNumber}</strong> is confirmed. We'll notify you when it ships.
          </p>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mt-8 text-left">
            <div className="space-y-2.5">
              {order.items?.map((it: any) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{it.productName} × {it.qty}</span>
                  <span className="font-semibold text-gray-900">₹{parseFloat(it.subtotal).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between font-black text-gray-900">
              <span>Total paid</span>
              <span>₹{parseFloat(order.total).toFixed(0)}</span>
            </div>
            {order.shippingAddress && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <p className="font-bold text-gray-700 mb-0.5 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Delivering to</p>
                {[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip].filter(Boolean).join(", ")}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-gray-500 mt-3">Your payment was successful. Check your orders for details.</p>
      )}
      <div className="flex gap-3 mt-8 justify-center">
        <Link href="/account/orders" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2">
          <Package className="w-4 h-4" /> Track Order
        </Link>
        <Link href="/shop" className="border border-gray-200 font-bold px-6 py-3 rounded-xl text-gray-700">Continue Shopping</Link>
      </div>
      <p className="text-xs text-gray-400 mt-8">
        Questions? Call us — we're a real shop and we answer.
      </p>
    </div>
  );
}
