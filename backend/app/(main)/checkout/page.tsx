"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  CheckCircle2,
  IndianRupee,
  Lock,
  ArrowRight,
  Info,
  Loader2,
  Home,
  Building2,
  Plus,
  X,
  Tag,
  Percent,
  Minus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Home", street: "", city: "", state: "", zip: "", isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: number; code: string; discountPercent: number; discountFlat: number;
  } | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (data.addresses) {
        setAddresses(data.addresses);
        const defaultAddr = data.addresses.find((a: Address) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        else if (data.addresses.length > 0) setSelectedAddressId(data.addresses[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      if (res.ok) {
        await fetchAddresses();
        setShowAddressForm(false);
        setAddressForm({ label: "Home", street: "", city: "", state: "", zip: "", isDefault: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, orderTotal: subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount);
        setCouponCode("");
      } else {
        setCouponError(data.error || "Invalid coupon");
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    } catch (err) {
      setCouponError("Failed to validate coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  const orderItems = [
    { id: 1, name: "Premium Puppy Food", price: 450, qty: 1, image: "/images/food.png" },
    { id: 2, name: "Orthopedic Dog Bed", price: 655, qty: 1, image: "/images/hero.png" },
  ];

  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = 50;
  const grandTotal = subtotal + shipping - discountAmount;

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6">
        <Link 
          href="/shop" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[hsl(var(--primary))] font-bold text-sm mb-12 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Shop
        </Link>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto bg-white rounded-[3.5rem] p-16 text-center shadow-2xl shadow-orange-500/10 border border-gray-50"
          >
             <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
               <CheckCircle2 className="w-12 h-12" />
             </div>
             <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-4">Order Placed!</h1>
             <p className="text-gray-500 font-medium mb-10 leading-relaxed">
               Thank you for your purchase. We&apos;ve sent a confirmation to your email. Max will have his food soon!
             </p>
             <div className="p-6 bg-gray-50 rounded-3xl text-left space-y-3 mb-10">
                <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                   <span>Order ID</span>
                   <span className="text-[hsl(var(--secondary))]">#ORD-992381</span>
                </div>
                <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                   <span>Est. Delivery</span>
                   <span className="text-[hsl(var(--secondary))] text-green-600">3-4 Business Days</span>
                </div>
             </div>
              <Link href="/shop" className="btn-primary w-full py-5 block text-lg text-center">Continue Shopping</Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Forms */}
            <div className="lg:col-span-8 space-y-8">
                {/* Shipping Address */}
                <div className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                         <MapPin className="w-6 h-6" />
                       </div>
                       <h2 className="text-2xl font-bold text-[hsl(var(--secondary))]">Shipping Address</h2>
                     </div>
                     <button
                       onClick={() => setShowAddressForm(!showAddressForm)}
                       className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-xs font-black uppercase tracking-widest text-[hsl(var(--primary))] hover:bg-orange-50 transition-all"
                     >
                       {showAddressForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                       {showAddressForm ? "Cancel" : "Add New"}
                     </button>
                   </div>

                   {/* Saved Addresses */}
                   {addresses.length > 0 && !showAddressForm && (
                     <div className="space-y-3 mb-6">
                       {addresses.map((addr) => (
                         <label
                           key={addr.id}
                           className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                             selectedAddressId === addr.id
                               ? "border-[hsl(var(--primary))] bg-orange-50/30"
                               : "border-gray-100 bg-gray-50 hover:border-gray-200"
                           }`}
                         >
                           <input
                             type="radio"
                             name="address"
                             checked={selectedAddressId === addr.id}
                             onChange={() => setSelectedAddressId(addr.id)}
                             className="mt-1 accent-orange-500"
                           />
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                               {addr.label === "Home" ? <Home className="w-4 h-4 text-orange-500" /> : <Building2 className="w-4 h-4 text-blue-500" />}
                               <span className="font-black text-sm text-[hsl(var(--secondary))]">{addr.label}</span>
                               {addr.isDefault && (
                                 <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Default</span>
                               )}
                             </div>
                             <p className="text-sm font-medium text-gray-500">{addr.street}</p>
                             <p className="text-sm font-medium text-gray-500">{addr.city}, {addr.state} - {addr.zip}</p>
                           </div>
                         </label>
                       ))}
                     </div>
                   )}

                   {/* Add Address Form */}
                   {showAddressForm && (
                     <form onSubmit={handleAddAddress} className="space-y-4 mb-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Label</label>
                           <select
                             className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold text-sm"
                             value={addressForm.label}
                             onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                           >
                             <option value="Home">Home</option>
                             <option value="Work">Work</option>
                             <option value="Other">Other</option>
                           </select>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                           <input required type="text" placeholder="House No, Area..." className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold text-sm"
                             value={addressForm.street}
                             onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                           <input required type="text" placeholder="Mumbai" className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold text-sm"
                             value={addressForm.city}
                             onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
                           <input required type="text" placeholder="Maharashtra" className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold text-sm"
                             value={addressForm.state}
                             onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                           <input required type="text" placeholder="400001" className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold text-sm"
                             value={addressForm.zip}
                             onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                           />
                         </div>
                         <div className="flex items-end pb-2">
                           <label className="flex items-center gap-3 cursor-pointer">
                             <input
                               type="checkbox"
                               checked={addressForm.isDefault}
                               onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                               className="w-5 h-5 accent-orange-500"
                             />
                             <span className="text-xs font-bold text-gray-500">Set as default</span>
                           </label>
                         </div>
                       </div>
                       <button
                         type="submit"
                         disabled={savingAddress}
                         className="w-full py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-70"
                       >
                         {savingAddress ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Address"}
                       </button>
                     </form>
                   )}

                   {addresses.length === 0 && !showAddressForm && (
                     <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                       <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                       <p className="text-sm font-bold text-gray-400">No saved addresses</p>
                       <p className="text-[10px] font-medium text-gray-300 mt-1">Click &quot;Add New&quot; to add a shipping address</p>
                     </div>
                   )}
                </div>

               {/* Payment Info */}
               <div className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm opacity-50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-[hsl(var(--secondary))]">Payment</h2>
                  </div>
                  <p className="text-sm font-medium text-gray-500">Redirecting to Razorpay secure checkout...</p>
               </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
               <div className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm space-y-8">
                  <h3 className="text-xl font-bold text-[hsl(var(--secondary))]">Order Summary</h3>
                  
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                     {orderItems.map(item => (
                        <div key={item.id} className="flex gap-4">
                           <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                             <Image src={item.image} alt={item.name} width={80} height={80} className="object-cover h-full w-full" />
                           </div>
                           <div>
                              <h4 className="font-bold text-[hsl(var(--secondary))] text-xs leading-tight mb-1">{item.name}</h4>
                              <p className="text-xs text-gray-400 font-bold">Qty: {item.qty}</p>
                              <div className="flex items-center gap-0.5 mt-2">
                                <IndianRupee className="w-3 h-3 text-[hsl(var(--secondary))]" />
                                <span className="font-black text-sm text-[hsl(var(--secondary))]">{item.price}</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                   {/* Coupon Code */}
                   <div className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                         <Tag className="w-4 h-4 text-gray-400" />
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coupon Code</span>
                      </div>
                      {appliedCoupon ? (
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-green-600" />
                            <span className="font-black text-green-700 text-sm">{appliedCoupon.code}</span>
                            {appliedCoupon.discountPercent > 0 && (
                              <span className="text-xs font-bold text-green-600">{appliedCoupon.discountPercent}% OFF</span>
                            )}
                          </div>
                          <button
                            onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); }}
                            className="p-1.5 bg-white rounded-lg text-green-600 hover:text-red-500 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-bold uppercase"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={applyingCoupon || !couponCode.trim()}
                            className="px-5 py-3 bg-[hsl(var(--secondary))] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all disabled:opacity-50"
                          >
                            {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                          </button>
                        </div>
                      )}
                      {couponError && (
                        <p className="text-[10px] font-bold text-red-500">{couponError}</p>
                      )}
                   </div>

                   <div className="pt-4 border-t border-gray-50 space-y-4">
                      <div className="flex justify-between text-sm font-bold">
                         <span className="text-gray-400">Subtotal</span>
                         <span className="text-[hsl(var(--secondary))]">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                         <span className="text-gray-400">Shipping</span>
                         <span className="text-[hsl(var(--secondary))]">₹{shipping}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm font-bold">
                           <span className="text-green-600">Discount</span>
                           <span className="text-green-600">-₹{discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xl font-black pt-4 border-t border-dashed border-gray-100 italic">
                         <span className="text-[hsl(var(--secondary))]">Total</span>
                         <span className="text-[hsl(var(--primary))]">₹{grandTotal}</span>
                      </div>
                   </div>

                  <button 
                    disabled={loading}
                    onClick={handlePayment}
                    className="w-full btn-primary py-5 text-lg font-black flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>Pay Securely <ArrowRight className="w-6 h-6" /></>
                    )}
                  </button>

                  <div className="flex flex-col items-center gap-4 py-4 px-6 bg-gray-50 rounded-3xl">
                     <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                       <Lock className="w-3 h-3" /> SSL Secured Payment
                     </div>
                     <div className="flex items-center gap-4 opacity-30 grayscale">
                        <Image src="/images/hero.png" alt="Razorpay" width={60} height={15} className="object-contain" />
                        <Truck className="w-5 h-5 text-gray-400" />
                     </div>
                  </div>
               </div>

               <div className="mt-8 p-6 bg-blue-50/50 rounded-[2rem] flex items-start gap-4">
                  <Info className="w-5 h-5 text-blue-500 mt-1" />
                  <p className="text-[10px] text-blue-700/70 font-bold uppercase leading-relaxed tracking-wider">
                    Free returns within 7 days of delivery for all pet food and non-perishable items.
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
