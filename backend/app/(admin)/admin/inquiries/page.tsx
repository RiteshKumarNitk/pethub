"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageCircle, Loader2, Send, Phone, Mail, User, PawPrint,
  Package, Scissors, CheckCircle2,
} from "lucide-react";

function InquiriesContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState<Record<number, string>>({});
  const [sending, setSending] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/inquiries?status=${statusFilter}`)
      .then((r) => r.json())
      .then((d) => setInquiries(d.inquiries || []))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const sendReply = async (id: number, close = false) => {
    const message = reply[id]?.trim();
    if (!message) return;
    setSending(id);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: id, message, close }),
      });
      if (res.ok) {
        setReply((r) => ({ ...r, [id]: "" }));
        load();
      }
    } finally {
      setSending(null);
    }
  };

  const close = async (id: number) => {
    await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "closed" }),
    });
    load();
  };

  const typeIcon = (type: string) => {
    const map: Record<string, any> = { pet: PawPrint, product: Package, service: Scissors, booking: Scissors, general: MessageCircle };
    const Icon = map[type] || MessageCircle;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Inquiries</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pet enquiries, product questions and general contact messages.</p>
        </div>
        <div className="flex gap-1.5">
          {["all", "open", "responded", "closed"].map((s) => (
            <a
              key={s}
              href={`/admin/inquiries?status=${s}`}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize ${
                statusFilter === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {s}
            </a>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-700">No inquiries</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-50">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 flex-shrink-0">
                      {typeIcon(inq.type)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{inq.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="capitalize flex items-center gap-1">{typeIcon(inq.type)} {inq.type}{inq.relatedName ? `: ${inq.relatedName}` : ""}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {inq.userName || inq.contactName || "Guest"}</span>
                        {(inq.userPhone || inq.contactPhone) && (
                          <a href={`tel:${inq.userPhone || inq.contactPhone}`} className="flex items-center gap-1 text-teal-700 hover:underline"><Phone className="w-3 h-3" /> {inq.userPhone || inq.contactPhone}</a>
                        )}
                        {(inq.contactEmail || (inq.userId === null && inq.contactEmail)) && (
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {inq.contactEmail}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                      inq.status === "open" ? "bg-amber-50 text-amber-700"
                      : inq.status === "responded" ? "bg-blue-50 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                    }`}>{inq.status}</span>
                    {inq.status !== "closed" && (
                      <button onClick={() => close(inq.id)} className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Close
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Thread */}
              <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {inq.messages?.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : ""}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.sender === "admin" ? "bg-teal-600 text-white" : "bg-gray-50 text-gray-700"
                    }`}>
                      {m.senderName && m.sender !== "admin" && <p className="text-[10px] font-bold text-gray-400 mb-0.5">{m.senderName}</p>}
                      <p className="whitespace-pre-line">{m.message}</p>
                      <p className={`text-[9px] mt-1 ${m.sender === "admin" ? "text-white/60" : "text-gray-400"}`}>
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              {inq.status !== "closed" && (
                <div className="p-3 border-t border-gray-50 flex gap-2">
                  <input
                    value={reply[inq.id] || ""}
                    onChange={(e) => setReply((r) => ({ ...r, [inq.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") sendReply(inq.id); }}
                    placeholder="Type a reply… (customer gets a notification)"
                    className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400"
                  />
                  <button
                    onClick={() => sendReply(inq.id)}
                    disabled={sending === inq.id || !reply[inq.id]?.trim()}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 rounded-xl disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminInquiriesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <InquiriesContent />
    </Suspense>
  );
}
