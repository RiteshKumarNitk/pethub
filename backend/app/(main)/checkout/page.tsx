"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, MapPin, CreditCard, ShieldCheck, CheckCircle2, Loader2,
  Home, Plus, Tag, X, ShoppingBag, Truck, AlertTriangle,
} from "lucide-react";

interface CartLine {
  id: number; productId: number; name: string; slug: string; imageUrl: string | null;
  variantName: string | null; unitPrice: number; qty: number; lineTotal: number;
}
interface Totals { subtotal: number; discount: number; shipping: number; tax: number; total: number }
interface Address { id: number; label: string; fullName: string | null; phone: string | null; street: string; landmark: string | null; city: string; state: string; zip: string; isDefault: boolean }

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartLine[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  // Auth
  const [user, setUser] = useState<{ id: number; name?: string | null; phone?: string } | null>(null);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [guestAddress, setGuestAddress] = useState({ fullName: "", phone: "", street: "", landmark: "", city: "", state: "", zip: "" });
  const [savingAddress, setSavingAddress] = useState(false);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: number; code: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const loadCart = useCallback(async () => {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setItems(data.items || []);
    setTotals(data.totals || null);
    if (!data.items || data.items.length === 0) {
      // nothing to checkout
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/cart").then((r) => r.json()),
      fetch("/api/mobile/me").then((r) => r.json()),
    ]).then(async ([cartData, meData]) => {
      setItems(cartData.items || []);
      setTotals(cartData.totals || null);
      if (meData.authenticated) {
        setUser(meData.user);
        const addrRes = await fetch("/api/addresses");
        const addrData = await addrRes.json();
        const list: Address[] = addrData.addresses || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddressId(def.id);
        else if (list.length === 0) setShowAddressForm(true);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...guestAddress, label: "Home" }),
      });
      if (res.ok) {
        const d = await res.json();
        setAddresses((prev) => [...prev, d.address]);
        setSelectedAddressId(d.address.id);
        setShowAddressForm(false);
      }
    } finally {
      setSavingAddress(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !totals) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, orderTotal: totals.subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponDiscount(data.discountAmount || 0);
        setCouponCode("");
      } else {
        setCouponError(data.error || "Invalid coupon");
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError("");
  };

  const placeOrder = async () => {
    setError("");

    // Validate address selection
    const hasAddress = user ? selectedAddressId !== null : (guestAddress.street && guestAddress.city && guestAddress.state && guestAddress.zip);
    if (!hasAddress) {
      setError("Please choose or enter a delivery address.");
      return;
    }

    setPlacing(true);
    try {
      // 1. Create order server-side
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: user ? selectedAddressId : undefined,
          address: user ? undefined : guestAddress,
          couponCode: appliedCoupon?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create order");
        setPlacing(false);
        return;
      }

      // 2. Open Razorpay checkout
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load payment gateway"));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay!({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(data.amount * 100),
        currency: data.currency || "INR",
        name: "PawStore",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: user?.name || guestAddress.fullName || "",
          contact: user?.phone || guestAddress.phone || "",
        },
        theme: { color: "#f97316" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 3. Verify payment
          const verifyRes = await fetch("/api/orders/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            router.push(`/order/${data.orderId}/confirmation`);
          } else {
            setError("Payment succeeded but verification failed. Contact support with your order number.");
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            setError("Payment was not completed. Your order is saved — you can retry from Orders.");
          },
        },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900">Nothing to check out</h1>
        <p className="text-gray-500 mt-2">Your cart is empty.</p>
        <Link href="/shop" className="mt-6 inline-block bg-orange-500 text-white font-bold px-6 py-3 rounded-xl">Browse Products</Link>
      </div>
    );
  }

  const finalTotal = totals ? Math.max(0, totals.total - (appliedCoupon ? couponDiscount : 0)) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-600 font-semibold mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to cart
      </Link>
      <h1 className="text-2xl font-black text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: address + payment */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step 1: Address */}
          <section className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-orange-500 text-white text-xs font-black rounded-full flex items-center justify-center">1</span>
              Delivery Address
            </h2>

            {user ? (
              <>
                <div className="space-y-2.5">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedAddressId === addr.id ? "border-orange-400 bg-orange-50/50" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-orange-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{addr.label}</span>
                          {addr.isDefault && <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded uppercase">Default</span>}
                        </div>
                        <p className="text-sm text-gray-600">{addr.street}{addr.landmark ? `, ${addr.landmark}` : ""}</p>
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.zip}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {!showAddressForm ? (
                  <button onClick={() => setShowAddressForm(true)} className="mt-3 flex items-center gap-2 text-sm font-bold text-orange-600 hover:underline">
                    <Plus className="w-4 h-4" /> Add new address
                  </button>
                ) : (
                  <AddressForm form={guestAddress} setForm={setGuestAddress} onSave={saveAddress} saving={savingAddress} onCancel={() => setShowAddressForm(false)} />
                )}
                {addresses.length === 0 && !showAddressForm && (
                  <p className="text-sm text-amber-600 mt-3">Add an address to continue.</p>
                )}
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Checking out as guest.{" "}
                  <Link href="/login" className="text-orange-600 font-bold hover:underline">Sign in</Link> to use saved addresses.
                </p>
                <AddressForm form={guestAddress} setForm={setGuestAddress} onSave={() => {}} saving={false} onCancel={undefined} inline />
              </div>
            )}
          </section>

          {/* Step 2: Payment */}
          <section className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <span className="w-6 h-6 bg-orange-500 text-white text-xs font-black rounded-full flex items-center justify-center">2</span>
              Payment
            </h2>
            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-orange-400 bg-orange-50/50">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">Pay Online</p>
                <p className="text-xs text-gray-500">Secure payment via Razorpay — UPI, cards, netbanking, wallets</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Right: summary */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:sticky lg:top-24">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden relative flex-shrink-0">
                    {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />}
                    <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">{item.qty}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                    {item.variantName && <p className="text-[10px] text-gray-400">{item.variantName}</p>}
                  </div>
                  <p className="text-xs font-bold text-gray-900">₹{item.lineTotal.toFixed(0)}</p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-gray-100 pt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-teal-50 rounded-lg px-3 py-2.5">
                  <span className="text-xs font-bold text-teal-700 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {appliedCoupon.code} applied</span>
                  <button onClick={removeCoupon} className="text-teal-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:border-orange-300"
                    />
                    <button onClick={applyCoupon} disabled={applyingCoupon} className="bg-gray-900 text-white text-xs font-bold px-4 rounded-lg disabled:opacity-60">
                      {applyingCoupon ? "…" : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
                </>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 mt-4 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{totals?.subtotal.toFixed(0)}</span></div>
              {appliedCoupon && couponDiscount > 0 && (
                <div className="flex justify-between text-teal-600"><span>Coupon discount</span><span>−₹{couponDiscount.toFixed(0)}</span></div>
              )}
              {totals && totals.shipping === 0 ? (
                <div className="flex justify-between text-teal-600"><span>Shipping</span><span>FREE</span></div>
              ) : (
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>₹{totals?.shipping.toFixed(0)}</span></div>
              )}
              {totals && totals.tax > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span>₹{totals.tax.toFixed(0)}</span></div>}
              <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100"><span>To Pay</span><span>₹{finalTotal.toFixed(0)}</span></div>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full mt-5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {placing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><ShieldCheck className="w-4 h-4" /> Pay ₹{finalTotal.toFixed(0)}</>}
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-3">
              By placing this order you agree to our <Link href="/legal/terms" className="underline">terms</Link> and{" "}
              <Link href="/legal/shipping-policy" className="underline">shipping policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressForm({
  form, setForm, onSave, saving, onCancel, inline = false,
}: {
  form: { fullName: string; phone: string; street: string; landmark: string; city: string; state: string; zip: string };
  setForm: (f: { fullName: string; phone: string; street: string; landmark: string; city: string; state: string; zip: string }) => void;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
  onCancel?: () => void;
  inline?: boolean;
}) {
  const input = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-300";
  return (
    <form onSubmit={onSave} className={`space-y-2.5 ${inline ? "" : "mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100"}`}>
      <div className="grid grid-cols-2 gap-2.5">
        <input required placeholder="Full name *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={input} />
        <input required placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
      </div>
      <input required placeholder="Street address *" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className={input} />
      <input placeholder="Landmark (optional)" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className={input} />
      <div className="grid grid-cols-3 gap-2.5">
        <input required placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} />
        <input required placeholder="State *" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={input} />
        <input required placeholder="ZIP *" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={input} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Save Address</>}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cancel</button>
        )}
      </div>
    </form>
  );
}
