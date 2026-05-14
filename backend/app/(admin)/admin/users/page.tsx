"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Phone, 
  Shield, 
  ShieldAlert, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  UserMinus
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.phone?.includes(search)
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2">User Directory</h1>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Manage platform access and roles</p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </div>

      <div className="bg-white rounded-[3.5rem] overflow-hidden border border-gray-50 shadow-sm relative min-h-[400px]">
         {loading ? (
           <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
             <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
           </div>
         ) : null}

         <table className="w-full text-left">
            <thead>
               <tr className="bg-gray-50/50">
                  <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">Joined</th>
                  <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                     <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] rounded-xl flex items-center justify-center font-black text-lg">
                              {user.name?.[0] || 'U'}
                           </div>
                           <div>
                              <p className="font-bold text-[hsl(var(--secondary))]">{user.name || 'Anonymous User'}</p>
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">UID: #{user.id}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-10 py-8">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                           <Phone className="w-4 h-4 text-gray-300" />
                           {user.phone}
                        </div>
                     </td>
                     <td className="px-10 py-8 text-sm font-bold text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                     </td>
                     <td className="px-10 py-8">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                           user.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                           {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                           {user.role}
                        </div>
                     </td>
                     <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm">
                              <UserCheck className="w-5 h-5" />
                           </button>
                           <button className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                              <UserMinus className="w-5 h-5" />
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         
         {!loading && filteredUsers.length === 0 && (
           <div className="py-20 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-gray-200 mx-auto" />
              <p className="text-gray-400 font-bold">No users matches your search.</p>
           </div>
         )}
      </div>
    </div>
  );
}
