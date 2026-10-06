"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SkeletonBar } from "@/components/ui/ShelfLoader";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { formatPrice } from "@/lib/utils/format-price";
import type { OrderView } from "@/lib/orders";
import { AccountPageHeader } from "../AccountSidebar/AccountSidebar";
import { useAccountData } from "../useAccountData";
import { LoadError } from "../LoadError";
import { formatOrderDate } from "../format";
import { OrderStatus } from "./OrderStatus";

export function OrderHistory() {
  const t = useTranslations("account.orders");
  const { data, error, loading, reload } = useAccountData<{ orders: OrderView[] }>("/api/account/orders");
  const orders = data?.orders ?? [];
  const itemCount = (order: OrderView) => order.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div>
      <AccountPageHeader title={t("title")} />
      {loading ? (
        <div aria-busy="true" className="flex flex-col gap-4 border-t border-line pt-5">
          {[0, 1, 2].map((i) => (
            <SkeletonBar key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState title={t("emptyTitle")} subtitle={t("emptyBody")} actionLabel={t("browse")} actionHref="/catalog" align="start" className="border-t border-line px-0 py-10" />
      ) : (
        <>
          <table className="hidden w-full border-collapse text-left md:table">
            <caption className="sr-only">{t("caption")}</caption>
            <thead>
              <tr className="border-b-2 border-shelf">
                {(["order", "date", "items", "status", "total"] as const).map((key) => (
                  <th key={key} scope="col" className={`eyebrow pb-3 font-semibold text-ink-muted ${key === "total" ? "text-right" : ""}`}>
                    {t(`columns.${key}`)}
                  </th>
                ))}
                <th scope="col" className="pb-3">
                  <span className="sr-only">{t("columns.action")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="h-14 border-b border-line">
                  <th scope="row" className="font-mono text-ui-md font-normal text-ink">
                    {order.number}
                  </th>
                  <td className="text-ui-sm text-ink-muted">{formatOrderDate(order.createdAt)}</td>
                  <td className="tabular text-ui-sm text-ink-muted">{itemCount(order)}</td>
                  <td>
                    <OrderStatus state={order.state} />
                  </td>
                  <td className="tabular text-right text-ui-md text-ink">{formatPrice(order.totals.total, order.currency)}</td>
                  <td className="text-right">
                    <Link href={`/account/orders/${order.id}`} className="inline-flex min-h-11 items-center pl-4 text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
                      {t("view")}
                      <span className="sr-only"> {order.number}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="m-0 flex list-none flex-col p-0 md:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/account/orders/${order.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 py-4">
                  <span className="font-mono text-ui-md text-ink">{order.number}</span>
                  <span className="tabular justify-self-end text-ui-md text-ink">{formatPrice(order.totals.total, order.currency)}</span>
                  <span className="meta text-ink-muted">{t("mobileMeta", { date: formatOrderDate(order.createdAt), count: itemCount(order) })}</span>
                  <OrderStatus state={order.state} className="justify-self-end" />
                </Link>
                <span aria-hidden="true" className="shelf-rule" />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
