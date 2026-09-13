"use client";

import { useState } from "react";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { useCart } from "@/components/Navbar";

export function AddToCartButton({ productId, disabled }: { productId: number; disabled?: boolean }) {
  const { refresh } = useCart();
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  const add = async () => {
    if (disabled || state === "adding") return;
    setState("adding");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty: 1 }),
      });
      if (res.ok) {
        refresh();
        setState("added");
        setTimeout(() => setState("idle"), 2000);
      }
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      onClick={add}
      disabled={disabled || state === "adding"}
      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
        disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : state === "added"
            ? "bg-teal-600 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
      }`}
    >
      {state === "adding" ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : state === "added" ? (
        <><Check className="w-3.5 h-3.5" /> Added</>
      ) : (
        <><ShoppingBag className="w-3.5 h-3.5" /> {disabled ? "Out of stock" : "Add to Cart"}</>
      )}
    </button>
  );
}
