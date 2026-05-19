"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Send,
  User,
  Shield,
} from "lucide-react";

interface Ticket {
  id: number;
  userId: number;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userPhone: string | null;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets");
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (ticketId: number, action: "reply" | "close") => {
    setReplying(true);
    try {
      const body: Record<string, any> = {};
      if (action === "reply" && replyText.trim()) {
        body.adminReply = replyText.trim();
      }
      if (action === "close") {
        body.status = "closed";
      }

      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchTickets();
        setReplyText("");
        setExpandedId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  const filtered = tickets.filter((t) =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.userName?.toLowerCase().includes(search.toLowerCase()) ||
    t.userPhone?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-[hsl(var(--secondary))] mb-2 tracking-tighter">Support Tickets</h1>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em]">
          {tickets.length} total tickets
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search tickets..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 py-24 text-center shadow-sm space-y-4">
          <MessageCircle className="w-16 h-16 text-gray-200 mx-auto" />
          <h3 className="text-lg font-black text-[hsl(var(--secondary))]">No tickets found</h3>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            {search ? "Try a different search term" : "No support tickets yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ticket, i) => (
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
                    ticket.status === "open" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                  }`}>
                    {ticket.status === "open" ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-[hsl(var(--secondary))] truncate">{ticket.subject}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${
                        ticket.status === "open" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {ticket.userName || ticket.userPhone || "Unknown"} · {new Date(ticket.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                {expandedId === ticket.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-4" />
                )}
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
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            From: {ticket.userName || ticket.userPhone || "Unknown"}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[hsl(var(--secondary))]">{ticket.message}</p>
                      </div>

                      {ticket.adminReply && (
                        <div className="p-4 bg-[hsl(var(--secondary))]/5 rounded-2xl border border-[hsl(var(--secondary))]/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-[hsl(var(--primary))]" />
                            <span className="text-[9px] font-black text-[hsl(var(--primary))] uppercase tracking-widest">Previous Reply</span>
                          </div>
                          <p className="text-sm font-medium text-[hsl(var(--secondary))]">{ticket.adminReply}</p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <textarea
                          rows={3}
                          placeholder="Write your reply..."
                          className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-medium resize-none"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReply(ticket.id, "reply")}
                            disabled={replying || !replyText.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                          >
                            {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Reply
                          </button>
                          {ticket.status === "open" && (
                            <button
                              onClick={() => handleReply(ticket.id, "close")}
                              disabled={replying}
                              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Close Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
