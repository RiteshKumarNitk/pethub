"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search,
  Filter,
  IndianRupee,
  MoreVertical,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

export default function AdminListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      if (data.listings) setListings(data.listings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number, updates: any) => {
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      if (res.ok) fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredListings = listings.filter(l => 
    l.breed?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tight">Manage Listings</h1>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest leading-none">Control marketplace visibility and pricing</p>
         </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by breed..." 
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:ring-8 focus:ring-orange-500/5 font-black text-sm transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <div className="flex gap-4">
            <button className="px-8 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm font-black text-xs uppercase tracking-widest text-gray-400 flex items-center gap-3">
               <Filter className="w-5 h-5" /> Filter
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[3.5rem] overflow-hidden border border-gray-50 shadow-sm">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-gray-50/50">
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pet Details</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing Control</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Listing Date</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Approval</th>
                  <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Moderation</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredListings.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                     <td className="px-10 py-10">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                              {item.images?.[0] ? (
                                <img src={item.images[0]} alt={item.breed} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-6 h-6 text-gray-300 m-auto mt-5" />
                              )}
                           </div>
                           <div>
                              <p className="font-black text-[hsl(var(--secondary))] text-lg leading-none mb-2">{item.breed}</p>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black text-gray-400 uppercase tracking-widest">ID: #{item.id}</span>
                                <span className="text-[10px] font-bold text-gray-300">{item.ageMonths} Months</span>
                              </div>
                           </div>
                        </div>
                     </td>
                     <td className="px-10 py-10">
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1 font-black text-[hsl(var(--secondary))] text-lg">
                              <IndianRupee className="w-4 h-4" />
                              {item.price}
                           </div>
                           <button 
                             onClick={() => handleUpdate(item.id, { showPrice: !item.showPrice })}
                             className={`p-2.5 rounded-xl transition-all ${item.showPrice ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}
                             title={item.showPrice ? 'Price is Visible' : 'Price is Hidden'}
                           >
                             {item.showPrice ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                           </button>
                        </div>
                     </td>
                     <td className="px-10 py-10 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(item.createdAt).toLocaleDateString()}
                     </td>
                     <td className="px-10 py-10">
                        <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                           item.isApproved === 'true' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                           {item.isApproved === 'true' ? 'Published' : 'Under Review'}
                        </span>
                     </td>
                     <td className="px-10 py-10 text-right">
                        <div className="flex items-center justify-end gap-3">
                           {item.isApproved === 'false' && (
                              <button 
                                onClick={() => handleUpdate(item.id, { isApproved: "true" })}
                                className="px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-orange-500/20"
                              >
                                 Approve
                              </button>
                           )}
                           <button 
                             onClick={() => handleDelete(item.id)}
                             className="p-3.5 bg-gray-50 text-gray-300 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         {!loading && filteredListings.length === 0 && (
            <div className="py-40 text-center space-y-4">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                 <Search className="w-8 h-8 text-gray-200" />
               </div>
               <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No matching listings found.</p>
            </div>
         )}
      </div>
    </div>
  );
}
