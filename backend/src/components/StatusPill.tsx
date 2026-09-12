export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-blue-50 text-blue-700",
    confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-indigo-50 text-indigo-700",
    shipped: "bg-purple-50 text-purple-700",
    delivered: "bg-teal-50 text-teal-700",
    completed: "bg-teal-50 text-teal-700",
    cancelled: "bg-red-50 text-red-600",
    rejected: "bg-red-50 text-red-600",
    no_show: "bg-gray-100 text-gray-500",
    approved: "bg-teal-50 text-teal-700",
    pending_review: "bg-amber-50 text-amber-700",
    sold: "bg-gray-100 text-gray-600",
    adopted: "bg-pink-50 text-pink-600",
    closed: "bg-gray-100 text-gray-500",
    suspended: "bg-red-50 text-red-600",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
