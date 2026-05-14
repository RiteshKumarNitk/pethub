"use client";

import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Scissors,
  Home,
  Activity,
  Heart
} from "lucide-react";

export default function AdminBookings() {
  const bookings = [
    { id: 1, type: "Grooming", user: "Ritesh Singh", pet: "Max (Beagle)", date: "Apr 15, 2:00 PM", status: "Upcoming", icon: Scissors, color: "text-orange-500", bg: "bg-orange-50" },
    { id: 2, type: "Boarding", user: "Vikram Raj", pet: "Leo (Labrador)", date: "Apr 18 - 22", status: "Upcoming", icon: Home, color: "text-blue-500", bg: "bg-blue-50" },
    { id: 3, type: "Vet Visit", user: "Sneha Patil", pet: "Bella (Siamese)", date: "Apr 12, 11:30 AM", status: "Completed", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
    { id: 4, type: "Training", user: "Amit Sharma", pet: "Rocky (GSD)", date: "Apr 14, 9:00 AM", status: "Upcoming", icon: Activity, color: "text-green-500", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2">Service Bookings</h1>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Monitor all professional pet care appointments</p>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {bookings.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-xl transition-all"
            >
               <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className={`w-20 h-20 ${booking.bg} ${booking.color} rounded-3xl flex items-center justify-center shrink-0`}>
                     <booking.icon className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{booking.type}</span>
                     <h3 className="text-xl font-black text-[hsl(var(--secondary))]">{booking.pet}</h3>
                     <p className="text-xs font-bold text-gray-400">Parent: {booking.user}</p>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row items-center gap-12 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-3">
                     <Calendar className="w-5 h-5 text-gray-300" />
                     <span className="text-sm font-black text-[hsl(var(--secondary))] uppercase tracking-tighter">{booking.date}</span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        booking.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                     }`}>
                        {booking.status}
                     </span>
                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-[hsl(var(--secondary))] hover:text-white transition-all">
                           <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                           <XCircle className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
         ))}
      </div>
    </div>
  );
}
