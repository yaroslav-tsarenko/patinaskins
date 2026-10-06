"use client";

import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";
import type { Totals } from "@/lib/pricing";

interface TotalsListProps {
  totals: Totals;
  currency: string;
  deliveryPending?: boolean;
  showCurrencyCode?: boolean;
  totalSize?: "md" | "lg";
  className?: string;
}

export function TotalsList({ totals, currency, deliveryPending = false, showCurrencyCode = false, totalSize = "lg", className }: TotalsListProps) {
  const t = useTranslations("checkout.totals");
  const money = (amount: number) => formatPrice(amount, currency);
  const row = "flex items-baseline justify-between gap-4";
  const totalLabel = totals.vatRegistered && totals.vatIncluded ? t("totalInclVat") : t("total");
  return (
    <dl className={cn("m-0 flex flex-col gap-2.5", className)}>
      <div className={row}>
        <dt className="text-ui-sm text-ink-muted">{t("subtotal")}</dt>
        <dd className="tabular m-0 text-ui-sm text-ink">{money(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 ? (
        <div className={row}>
          <dt className="text-ui-sm text-ink-muted">{t("discount", { percent: totals.discountPercent })}</dt>
          <dd className="tabular m-0 text-ui-sm text-ink">−{money(totals.discount)}</dd>
        </div>
      ) : null}
      <div className={row}>
        <dt className="text-ui-sm text-ink-muted">{t("delivery")}</dt>
        <dd className="tabular m-0 text-ui-sm text-ink">
          {deliveryPending ? <span className="text-ink-muted">{t("deliveryNextStep")}</span> : totals.shipping === 0 && totals.itemCount > 0 ? t("free") : money(totals.shipping)}
        </dd>
      </div>
      {totals.vatRegistered && !totals.vatIncluded ? (
        <div className={row}>
          <dt className="text-ui-sm text-ink-muted">{t("vat", { rate: totals.vatRatePercent })}</dt>
          <dd className="tabular m-0 text-ui-sm text-ink">{money(totals.vat)}</dd>
        </div>
      ) : null}
      <div className={cn(row, "mt-1 border-t border-line pt-3")}>
        <dt className="text-step-0 font-medium text-ink">
          {totalLabel}
          {showCurrencyCode ? <span className="text-ink-muted"> ({currency})</span> : null}
        </dt>
        <dd className={cn("tabular m-0 font-display leading-none text-ink", totalSize === "lg" ? "text-step-3" : "text-step-2")}>{money(totals.total)}</dd>
      </div>
      {totals.vatRegistered && totals.vatIncluded ? (
        <div className={row}>
          <dt className="meta text-ink-muted">{t("vatIncluded", { rate: totals.vatRatePercent })}</dt>
          <dd className="tabular meta m-0 text-ink-muted">{money(totals.vat)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
