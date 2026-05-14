"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Dog, 
  Clock, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminInterestsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/interests");
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.petBreed.toLowerCase().includes(search.toLowerCase()) ||
    l.userName.toLowerCase().includes(search.toLowerCase()) ||
    l.userPhone.includes(search)
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tight">Adoption Leads</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Verify users and facilitate connections</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search leads, users or pets..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-orange-500/5 transition-all outline-none font-bold text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : filteredLeads.length > 0 ? (
          filteredLeads.map((lead, idx) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-10"
            >
              {/* User Identity */}
              <div className="flex items-center gap-6 md:w-1/4">
                 <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center font-black text-[hsl(var(--primary))] text-2xl">
                    {lead.userName[0]}
                 </div>
                 <div>
                    <h3 className="font-black text-[hsl(var(--secondary))] text-lg">{lead.userName}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                       <Phone className="w-3 h-3" /> {lead.userPhone}
                    </p>
                 </div>
              </div>

              {/* Adoption Interest */}
              <div className="flex items-center gap-6 md:w-1/4">
                 <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Dog className="w-8 h-8 text-[hsl(var(--secondary))]" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Interested In</p>
                    <h3 className="font-black text-[hsl(var(--secondary))] text-lg">{lead.petBreed}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">ID: #{lead.petId}</p>
                 </div>
              </div>

              {/* Lead Details */}
              <div className="flex-1">
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Message/Notes</p>
                 <p className="text-sm font-bold text-gray-500 line-clamp-2 italic">"{lead.notes || 'No notes provided.'}"</p>
              </div>

              {/* Actions & Status */}
              <div className="flex items-center gap-4 shrink-0">
                 <div className="text-right mr-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Received</p>
                    <p className="text-xs font-bold text-[hsl(var(--secondary))]">{new Date(lead.createdAt).toLocaleDateString()}</p>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button className="p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-all" title="Mark as Contacted">
                       <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <button className="p-4 bg-blue-50 text-[hsl(var(--secondary))] rounded-2xl hover:bg-blue-100 transition-all" title="Call User">
                       <Phone className="w-6 h-6" />
                    </button>
                    <button className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all" title="Reject Lead">
                       <XCircle className="w-6 h-6" />
                    </button>
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 text-center flex flex-col items-center justify-center space-y-4">
             <Users className="w-16 h-16 text-gray-100" />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No adoption inquiries yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
