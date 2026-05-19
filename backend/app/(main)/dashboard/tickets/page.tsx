"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Plus,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  User,
  Shield,
} from "lucide-react";

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ subject: "", message: "" });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchTickets();
        setShowModal(false);
        setForm({ subject: "", message: "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-3 tracking-tight flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-orange-500" />
            Support Tickets
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-6 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-16 border border-gray-50 shadow-sm text-center space-y-4"
        >
          <MessageCircle className="w-16 h-16 text-gray-200 mx-auto" />
          <h3 className="text-lg font-black text-[hsl(var(--secondary))]">No support tickets</h3>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Need help? Create a new ticket</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Ticket
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-[2rem] border border-gray-50 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 transition-all"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    ticket.status === "open"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-green-50 text-green-600"
                  }`}>
                    {ticket.status === "open" ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-[hsl(var(--secondary))] truncate">{ticket.subject}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${
                        ticket.status === "open"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-green-50 text-green-600"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium truncate">{ticket.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest hidden sm:block">
                    {new Date(ticket.createdAt).toLocaleDateString("en-IN")}
                  </span>
                  {expandedId === ticket.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedId === ticket.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Your Message</span>
                        </div>
                        <p className="text-sm font-medium text-[hsl(var(--secondary))]">{ticket.message}</p>
                      </div>

                      {ticket.adminReply && (
                        <div className="p-4 bg-[hsl(var(--secondary))]/5 rounded-2xl border border-[hsl(var(--secondary))]/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-[hsl(var(--primary))]" />
                            <span className="text-[9px] font-black text-[hsl(var(--primary))] uppercase tracking-widest">Admin Response</span>
                          </div>
                          <p className="text-sm font-medium text-[hsl(var(--secondary))]">{ticket.adminReply}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[hsl(var(--secondary))] tracking-tight">New Support Ticket</h2>
                <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subject</label>
                  <input
                    required
                    type="text"
                    placeholder="Brief title of your issue"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your issue in detail..."
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium resize-none"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={saving}
                    className="flex-1 py-4 bg-[hsl(var(--primary))] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit Ticket"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
