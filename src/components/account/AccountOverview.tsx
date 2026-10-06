"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { SkeletonBar } from "@/components/ui/ShelfLoader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { formatPrice } from "@/lib/utils/format-price";
import type { OrderView } from "@/lib/orders";
import { AccountPageHeader } from "./AccountSidebar/AccountSidebar";
import { OrderStatus } from "./OrderHistory/OrderStatus";
import { useAccountData } from "./useAccountData";
import { LoadError } from "./LoadError";
import { formatOrderDate } from "./format";

export function AccountOverview() {
  const t = useTranslations("account.overview");
  const { user } = useAuth();
  const welcome = useSearchParams().get("welcome") === "1";
  const { data, error, loading, reload } = useAccountData<{ orders: OrderView[] }>("/api/account/orders");
  const latest = data?.orders[0];
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "";

  return (
    <div>
      <AccountPageHeader title={firstName ? t("title", { name: firstName }) : t("titleNoName")}>
        <p className="m-0 text-ink-muted">{t("signedInAs", { email: user?.email ?? "" })}</p>
      </AccountPageHeader>

      {welcome ? <Alert tone="success" title={t("welcomeTitle")} className="mb-8">{t("welcomeBody")}</Alert> : null}

      <section aria-labelledby="latest-order" className="mb-12">
        <h2 id="latest-order" className="m-0 mb-4 text-step-2 leading-none text-ink">
          {t("latestTitle")}
        </h2>
        {loading ? (
          <div aria-busy="true" className="flex flex-col gap-3 border-t border-line py-5">
            <SkeletonBar className="w-1/3" />
            <SkeletonBar className="w-1/2" />
          </div>
        ) : error ? (
          <LoadError onRetry={reload} />
        ) : latest ? (
          <div className="border-t border-line">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 py-5 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <div className="min-w-0">
                <p className="m-0 font-mono text-ui-md text-ink">{latest.number}</p>
                <p className="meta m-0 text-ink-muted">{t("placed", { date: formatOrderDate(latest.createdAt), count: latest.lines.reduce((n, l) => n + l.quantity, 0) })}</p>
              </div>
              <OrderStatus state={latest.state} className="justify-self-end sm:justify-self-auto" />
              <p className="tabular m-0 font-display text-step-1 text-ink">{formatPrice(latest.totals.total, latest.currency)}</p>
              <Link href={`/account/orders/${latest.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
                {t("view")}
                <span className="sr-only"> {latest.number}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <span aria-hidden="true" className="shelf-rule" />
            {data && data.orders.length > 1 ? (
              <Link href="/account/orders" className="mt-4 inline-flex min-h-11 items-center text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4">
                {t("allOrders", { count: data.orders.length })}
              </Link>
            ) : null}
          </div>
        ) : (
          <EmptyState title={t("noOrdersTitle")} subtitle={t("noOrdersBody")} actionLabel={t("browse")} actionHref="/catalog" headingLevel={3} align="start" className="border-t border-line px-0 py-8" />
        )}
      </section>

      <section aria-labelledby="quick-links">
        <h2 id="quick-links" className="m-0 mb-4 text-step-2 leading-none text-ink">
          {t("linksTitle")}
        </h2>
        <ul className="m-0 grid list-none grid-cols-1 border-t border-line p-0 sm:grid-cols-2 sm:gap-x-10">
          {(["addresses", "profile", "saved", "orders"] as const).map((key) => (
            <li key={key} className="border-b border-line">
              <Link href={key === "saved" ? "/account/wishlist" : `/account/${key}`} className="flex min-h-14 flex-col justify-center py-3 hover-device:hover:[&>span:first-child]:underline">
                <span className="text-step-0 font-medium text-ink underline-offset-4">{t(`links.${key}.title`)}</span>
                <span className="meta text-ink-muted">{t(`links.${key}.body`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
