"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { Plate } from "@/components/ui/Plate";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";
import type { CartItem } from "@/types/cart";
import type { Totals } from "@/lib/pricing";
import type { ClientQuote } from "./useCheckoutQuote";
import { TotalsList } from "./TotalsList";

interface CheckoutCounterProps {
  items: CartItem[];
  totals: Totals;
  currency: string;
  quote: ClientQuote | null;
  deliveryPending: boolean;
  discountCode: string | null;
  onApplyCode: (code: string | null) => void;
  loading?: boolean;
  headingLevel?: 2 | 3;
  className?: string;
}

export const POLICY_LINKS = [
  { href: "/policies/terms", key: "terms" },
  { href: "/policies/returns", key: "returns" },
  { href: "/policies/shipping", key: "delivery" },
  { href: "/policies/privacy", key: "privacy" },
] as const;

export function CheckoutCounter({ items, totals, currency, quote, deliveryPending, discountCode, onApplyCode, loading, headingLevel = 2, className }: CheckoutCounterProps) {
  const t = useTranslations("checkout.counter");
  const tp = useTranslations("checkout.policies");
  const promoId = useId();
  const [draft, setDraft] = useState("");
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const appliedCode = quote?.discount?.source === "code" ? quote.discount.code : null;
  const autoDiscount = quote?.discount?.source === "auto" ? quote.discount : null;
  const rejected = Boolean(discountCode) && quote?.codeRejected;

  return (
    <div className={cn("flex flex-col gap-6", className)} aria-busy={loading || undefined}>
      <div className="flex items-baseline justify-between gap-4">
        <Heading className="m-0 text-step-2 leading-none text-ink">{t("title")}</Heading>
        <Link href="/cart" className="text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
          {t("editBag")}
        </Link>
      </div>

      <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
        {items.map((item, index) => {
          const line = quote && quote.currency === currency ? quote.lines[index] : null;
          const lineTotal = line?.total ?? totals.lines[index]?.total ?? 0;
          return (
            <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0">
              <Cubby src={item.imageUrl} alt="" size="compact" sizes="56px" className="w-14 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="m-0 line-clamp-2 text-ui-sm font-medium leading-[1.4] text-ink">{item.name}</p>
                {item.variantName ? <p className="meta m-0 text-ink-muted">{item.variantName}</p> : null}
                <p className="meta m-0 text-ink-muted">{t("quantity", { count: item.quantity })}</p>
              </div>
              <p className="tabular m-0 shrink-0 text-ui-sm text-ink">{formatPrice(lineTotal, currency)}</p>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-line pt-5">
        {appliedCode ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Plate variant="brass">{appliedCode}</Plate>
              <span className="meta text-ink-muted">{t("codeApplied", { percent: quote?.discount?.percent ?? 0 })}</span>
            </span>
            <Button variant="ghost" size="sm" onPress={() => onApplyCode(null)}>
              {t("removeCode")}
            </Button>
          </div>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const value = draft.trim().toUpperCase();
              if (value) onApplyCode(value);
            }}
          >
            <Input
              id={promoId}
              label={t("promoLabel")}
              size="sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
              error={rejected ? t("codeRejected") : undefined}
              wrapperClassName="flex-1"
            />
            <Button type="submit" variant="outline" size="sm" isDisabled={!draft.trim()} className={rejected ? "mb-[calc(1.5rem+6px)]" : undefined}>
              {t("apply")}
            </Button>
          </form>
        )}
        {autoDiscount ? (
          <p className="meta m-0 mt-3 text-ink-muted">
            {autoDiscount.type === "welcome" ? t("welcomeApplied", { percent: autoDiscount.percent }) : t("newsletterApplied", { percent: autoDiscount.percent })}
          </p>
        ) : null}
      </div>

      <TotalsList totals={totals} currency={currency} deliveryPending={deliveryPending} />

      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 border-t border-line p-0 pt-4">
        {POLICY_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} target="_blank" className="meta text-ink-muted underline underline-offset-4 hover-device:hover:text-ink">
              {tp(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
