"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Scissors, 
  Home, 
  Activity, 
  Heart, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const services = [
  { 
    id: "grooming", 
    title: "Expert Grooming", 
    desc: "Full haircut, bath, and nail trimming by certified professionals.", 
    price: "From ₹45", 
    icon: Scissors, 
    color: "bg-orange-100 text-orange-600" 
  },
  { 
    id: "boarding", 
    title: "Luxury Boarding", 
    desc: "Safe, clean, and fun environments for your pets staycation.", 
    price: "From ₹30/night", 
    icon: Home, 
    color: "bg-blue-100 text-blue-600" 
  },
  { 
    id: "training", 
    title: "Expert Training", 
    desc: "Positive reinforcement training for behavioral excellence.", 
    price: "From ₹60/sess", 
    icon: Activity, 
    color: "bg-green-100 text-green-600" 
  },
  { 
    id: "vet", 
    title: "Tele-Health", 
    desc: "24/7 online consultation with senior veterinarians.", 
    price: "From ₹25", 
    icon: Heart, 
    color: "bg-red-100 text-red-600" 
  },
];

export default function ServicesPage() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const handleBook = (service: any) => {
    setSelectedService(service);
    setBookingOpen(true);
  };

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-6">
        {/* Services Header */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
           <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full mb-6 font-bold text-xs uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" /> Trusted Healthcare
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-[hsl(var(--secondary))] mb-8 leading-tight">
                Premium Wellness for Your <span className="text-[hsl(var(--primary))]">Loved Ones</span>
              </h1>
              <p className="text-lg text-gray-500 mb-10 leading-relaxed font-medium">
                From grooming to veterinary visits, we provide the best professional care for your pets. 
                Our experts ensure your furry friends are healthy, happy, and well-behaved.
              </p>
              <div className="flex gap-4">
                 <div className="flex -space-x-3">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden bg-gray-100">
                       <Image src={`/images/dog.png`} alt="Client" width={48} height={48} className="object-cover" />
                     </div>
                   ))}
                 </div>
                 <div>
                   <p className="text-sm font-bold text-[hsl(var(--secondary))]">1200+ Bookings</p>
                   <p className="text-xs text-gray-400 font-medium">This month in your city</p>
                 </div>
              </div>
           </div>
           
           <div className="relative h-[600px] rounded-[3.5rem] overflow-hidden shadow-2xl border-8 border-white">
              <Image src="/images/grooming.png" alt="Grooming" fill className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/60 to-transparent">
                 <div className="glass-morphism p-6 rounded-3xl text-white">
                    <p className="text-sm font-bold uppercase tracking-widest text-orange-400 mb-2">Featured Service</p>
                    <h3 className="text-2xl font-bold mb-4">Complete Summer Spa Package</h3>
                    <div className="flex items-center justify-between">
                       <span className="text-3xl font-black">₹79.00</span>
                       <button className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm">Book Now</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group p-8 bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-500/5 transition-all"
              >
                <div className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[hsl(var(--secondary))] mb-4">{service.title}</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">{service.desc}</p>
                <div className="flex items-center justify-between mt-auto">
                   <span className="font-bold text-[hsl(var(--secondary))]">{service.price}</span>
                   <button 
                     onClick={() => handleBook(service)}
                     className="w-10 h-10 bg-gray-50 text-[hsl(var(--secondary))] rounded-xl flex items-center justify-center group-hover:bg-[hsl(var(--secondary))] group-hover:text-white transition-all shadow-sm"
                   >
                     <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white z-[70] shadow-2xl rounded-[3rem] overflow-hidden"
            >
              <div className="relative p-12">
                <button 
                  onClick={() => setBookingOpen(false)}
                  className="absolute top-8 right-8 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-6 mb-12">
                   <div className={`w-16 h-16 ${selectedService?.color} rounded-2xl flex items-center justify-center`}>
                      <selectedService.icon className="w-8 h-8" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-bold text-[hsl(var(--secondary))]">Book {selectedService?.title}</h2>
                      <p className="text-gray-400 font-medium">Professional pet care at your doorstep</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                         <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <CalendarIcon className="w-3 h-3 text-[hsl(var(--primary))]" /> Select Date
                         </label>
                         <input type="date" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <Clock className="w-3 h-3 text-[hsl(var(--primary))]" /> Select Time
                         </label>
                         <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold appearance-none">
                            <option>09:00 AM</option>
                            <option>11:00 AM</option>
                            <option>02:00 PM</option>
                            <option>04:00 PM</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Special Instructions</label>
                      <textarea 
                        placeholder="Tell us about your pet's specific needs..."
                        className="w-full p-6 bg-gray-50 border-none rounded-[2rem] h-32 focus:ring-2 focus:ring-[hsl(var(--primary))] font-medium"
                      ></textarea>
                   </div>

                   <button className="w-full btn-primary py-5 text-lg">Confirm Booking</button>
                   <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest">Pay after service at your location</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
