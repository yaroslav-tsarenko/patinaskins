"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CartItem } from "@/types/cart";
import type { Totals } from "@/lib/pricing";

export interface ClientQuote {
  currency: string;
  discount: { type: "welcome" | "newsletter"; percent: number; code: string; source: "auto" | "code" } | null;
  codeRejected: boolean;
  lines: { productId: string; name: string; variantName: string | null; quantity: number; unit: number; total: number }[];
  totals: Totals;
}

export interface QuoteProblem {
  code: string;
  name?: string | null;
  available?: number;
  max?: number;
}

export function quotePayloadItems(items: CartItem[]) {
  return items.map((item) => ({ productId: item.productId, quantity: item.quantity, variantName: item.variantName ?? null }));
}

export function useCheckoutQuote(items: CartItem[], currency: string, discountCode: string | null, enabled: boolean) {
  const [quote, setQuote] = useState<ClientQuote | null>(null);
  const [problem, setProblem] = useState<QuoteProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const signature = JSON.stringify([quotePayloadItems(items), currency, discountCode]);

  useEffect(() => {
    const [payloadItems, payloadCurrency, payloadCode] = JSON.parse(signature) as [ReturnType<typeof quotePayloadItems>, string, string | null];
    if (!enabled || payloadItems.length === 0) return;
    const timer = window.setTimeout(() => {
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      setLoading(true);
      fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems, currency: payloadCurrency, discountCode: payloadCode }),
        signal: ctrl.signal,
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({ code: "SERVER_ERROR" }));
          if (ctrl.signal.aborted) return;
          if (res.ok) {
            setQuote(data as ClientQuote);
            setProblem(null);
          } else {
            setProblem(data as QuoteProblem);
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setProblem({ code: "NETWORK" });
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [signature, enabled, tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  return { quote, setQuote, problem, loading, refresh };
}
