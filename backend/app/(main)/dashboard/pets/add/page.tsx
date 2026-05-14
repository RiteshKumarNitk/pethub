"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Dog, 
  ChevronLeft, 
  Upload, 
  Plus, 
  Info, 
  CheckCircle2, 
  Loader2,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AddPetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    age: "",
    gender: "male",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/pets"), 2000);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <Link 
        href="/dashboard/pets" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-[hsl(var(--primary))] font-bold text-sm mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Pets
      </Link>

      <div className="bg-white rounded-[3rem] p-12 border border-gray-50 shadow-sm relative overflow-hidden">
        <AnimatePresence>
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-[hsl(var(--secondary))] mb-2">Pet Added Successfully!</h2>
              <p className="text-gray-500 font-medium tracking-tight">Redirecting you back to your workspace...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="flex items-center gap-6 mb-2">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[hsl(var(--secondary))]">Add New Family Member</h1>
                  <p className="text-gray-500 font-medium">Tell us more about your pet.</p>
                </div>
              </div>

              {/* Photo Upload Placeholder */}
              <div className="space-y-4">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pet Photo</label>
                 <div className="relative group cursor-pointer">
                    <div className="h-48 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-gray-50 group-hover:bg-orange-50 group-hover:border-[hsl(var(--primary))] transition-all overflow-hidden relative">
                       <Upload className="w-8 h-8 text-gray-300 group-hover:text-[hsl(var(--primary))] mb-2 transition-all" />
                       <span className="text-sm font-bold text-gray-400 group-hover:text-[hsl(var(--primary))]">Click to upload photo</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pet Name</label>
                    <div className="relative">
                       <Dog className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                       <input 
                         required
                         type="text" 
                         placeholder="e.g. Max"
                         className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-medium transition-all"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Breed</label>
                    <select 
                       className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-medium appearance-none"
                       value={formData.breed}
                       onChange={(e) => setFormData({...formData, breed: e.target.value})}
                    >
                       <option value="">Select breed</option>
                       <option>Golden Retriever</option>
                       <option>Persian Cat</option>
                       <option>German Shepherd</option>
                       <option>Other</option>
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 text-gray-400">Age Display</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                       <input 
                         required
                         type="text" 
                         placeholder="e.g. 2 years"
                         className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-medium"
                         value={formData.age}
                         onChange={(e) => setFormData({...formData, age: e.target.value})}
                       />
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                    <div className="flex gap-4">
                       {['male', 'female'].map(g => (
                         <button 
                           key={g}
                           type="button"
                           onClick={() => setFormData({...formData, gender: g})}
                           className={`flex-1 py-4 rounded-2xl font-bold capitalize transition-all ${
                             formData.gender === g 
                               ? 'bg-[hsl(var(--secondary))] text-white shadow-xl shadow-blue-900/20' 
                               : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                           }`}
                         >
                           {g}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Special Notes / Medical History</label>
                 <div className="relative">
                    <Info className="absolute left-4 top-6 text-gray-300 w-5 h-5" />
                    <textarea 
                      placeholder="e.g. Vaccinations up to date, allergies..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-[2.5rem] border-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-medium h-32"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                 </div>
              </div>

              <button 
                disabled={loading}
                className="w-full btn-primary py-5 text-lg font-black flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>Add to My Family <Plus className="w-6 h-6" /></>
                )}
              </button>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
