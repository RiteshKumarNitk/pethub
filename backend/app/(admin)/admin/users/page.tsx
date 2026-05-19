"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Loader2,
  Shield,
  User as UserIcon,
  Trash2,
  Crown,
} from "lucide-react";

interface AdminUser {
  id: number;
  name: string | null;
  phone: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

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

  const toggleRole = async (user: AdminUser) => {
    setUpdating(user.id);
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) await fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user permanently? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      u.phone.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tighter">Users</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">
            {users.length} registered users
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 py-24 text-center shadow-sm space-y-4">
          <Users className="w-16 h-16 text-gray-200 mx-auto" />
          <h3 className="text-lg font-black text-[hsl(var(--secondary))]">No users found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <div className="col-span-5">User</div>
            <div className="col-span-3">Phone</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50/50 transition-all"
              >
                <div className="col-span-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    user.role === "admin" ? "bg-orange-50 text-orange-500" : "bg-gray-50 text-gray-500"
                  }`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="font-black text-[hsl(var(--secondary))] text-sm">
                      {user.name || "Unnamed User"}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      UID #{user.id}
                    </p>
                  </div>
                </div>
                <div className="col-span-3">
                  <p className="font-bold text-sm text-[hsl(var(--secondary))]">{user.phone}</p>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    user.role === "admin"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-blue-50 text-blue-600"
                  }`}>
                    {user.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    {user.role}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    disabled={updating === user.id}
                    onClick={() => toggleRole(user)}
                    className={`p-2.5 rounded-xl transition-all ${
                      user.role === "admin"
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                    }`}
                    title={user.role === "admin" ? "Demote to User" : "Promote to Admin"}
                  >
                    {updating === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-sm">
        <p className="font-bold text-blue-800">
          <Shield className="w-4 h-4 inline mr-2" />
          Admin users have full access to the admin panel. Use the crown button to promote or demote users.
        </p>
      </div>
    </div>
  );
}
