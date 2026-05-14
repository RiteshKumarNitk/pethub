"use client";

import { useState } from "react";
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
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutPage() {
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    // Simulate Razorpay processing
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
  const grandTotal = subtotal + shipping;

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
               Thank you for your purchase. We've sent a confirmation to your email. Max will have his food soon!
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
             <Link href="/dashboard" className="btn-primary w-full py-5 block text-lg">Go to Dashboard</Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Forms */}
            <div className="lg:col-span-8 space-y-8">
               {/* Shipping Info */}
               <div className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-[hsl(var(--secondary))]">Shipping Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input type="text" placeholder="John Doe" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone (+91)</label>
                        <input type="tel" placeholder="9988776655" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold" />
                     </div>
                     <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                        <input type="text" placeholder="Apartment, House No, Area..." className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                        <input type="text" placeholder="Mumbai" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                        <input type="text" placeholder="400001" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold" />
                     </div>
                  </div>
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

                  <div className="pt-8 border-t border-gray-50 space-y-4">
                     <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-[hsl(var(--secondary))]">₹{subtotal}</span>
                     </div>
                     <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-400">Shipping</span>
                        <span className="text-[hsl(var(--secondary))]">₹{shipping}</span>
                     </div>
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
