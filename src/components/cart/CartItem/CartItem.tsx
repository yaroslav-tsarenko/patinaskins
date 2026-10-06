"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/shared/QuantitySelector/QuantitySelector";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { cartItemCap, useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { roundMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
  size?: "compact" | "full";
  onNavigate?: () => void;
  actions?: ReactNode;
}

export function CartItem({ item, size = "compact", onNavigate, actions }: CartItemProps) {
  const { updateQuantity, removeItem, itemCount } = useCart();
  const { convert, currency } = useCurrency();
  const lineTotal = roundMoney(convert(item.price) * item.quantity);
  const [removing, setRemoving] = useState(false);
  const full = size === "full";

  const remove = () => {
    setRemoving(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => removeItem(item.productId, item.variantId), reduced ? 0 : 260);
  };

  return (
    <li
      data-shelf-item=""
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-[260ms] ease-[var(--ease-furniture)]",
        removing ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn("flex gap-4 py-5", full && "sm:gap-6")}>
          <Cubby src={item.imageUrl} alt="" size="compact" sizes={full ? "120px" : "72px"} className={cn("shrink-0", full ? "w-[72px] sm:w-[120px]" : "w-[72px]")} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/product/${item.slug}`} onClick={onNavigate} className="line-clamp-2 text-ui-sm font-medium leading-[1.4] text-ink hover-device:hover:underline">
                {item.name}
              </Link>
              <span className="tabular shrink-0 font-display text-step-1 leading-[1.1] text-ink">{formatPrice(lineTotal, currency)}</span>
            </div>
            {item.variantName ? <p className="meta text-ink-muted">{item.variantName}</p> : null}
            {full && item.quantity > 1 ? (
              <p className="meta tabular text-ink-muted">
                {item.quantity} × {formatPrice(convert(item.price), currency)}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <QuantitySelector
                quantity={item.quantity}
                maxQuantity={cartItemCap(item, itemCount)}
                showStockHint={cartItemCap(item, itemCount) >= item.maxQuantity}
                size={full ? "md" : "compact"}
                label={`Quantity of ${item.name}`}
                onChange={(qty) => updateQuantity(item.productId, qty, item.variantId)}
              />
              <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {actions}
              <button
                type="button"
                onClick={remove}
                disabled={removing}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-ui-sm text-ink-muted underline decoration-1 underline-offset-4 hover-device:hover:text-ink"
              >
                <Trash2 size={16} aria-hidden="true" />
                Remove<span className="sr-only"> {item.name}</span>
              </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
