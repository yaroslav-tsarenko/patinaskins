"use client";

import { formatPrice } from "@/lib/utils/format-price";
import { useCurrency } from "@/providers/CurrencyProvider";
import { cn } from "@/lib/utils/cn";

interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "on-paint";
  className?: string;
}

const PRICE_SIZE = {
  sm: "text-step-1 leading-[1.1]",
  md: "text-step-2 leading-[1.1]",
  lg: "text-step-3 leading-[1.05]",
};

export function PriceDisplay({ price, comparePrice, size = "md", tone = "default", className }: PriceDisplayProps) {
  const { currency, convert } = useCurrency();
  const isOnSale = Boolean(comparePrice && comparePrice > price);

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "tabular font-display",
          PRICE_SIZE[size],
          isOnSale ? (tone === "on-paint" ? "text-brass-on-paint" : "text-sale") : tone === "on-paint" ? "text-on-paint" : "text-ink",
        )}
      >
        {isOnSale ? <span className="sr-only">Now </span> : null}
        {formatPrice(convert(price), currency)}
      </span>
      {isOnSale && comparePrice ? (
        <s className={cn("tabular text-ui-sm", tone === "on-paint" ? "text-on-paint-muted" : "text-ink-muted")}>
          <span className="sr-only">Was </span>
          {formatPrice(convert(comparePrice), currency)}
        </s>
      ) : null}
    </span>
  );
}

export function discountPercent(price: number, comparePrice?: number | null): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.floor(((comparePrice - price) / comparePrice) * 100);
}
