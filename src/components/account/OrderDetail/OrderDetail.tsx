"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, FileDown } from "lucide-react";
import { ShelfLoader } from "@/components/ui/ShelfLoader";
import { Button } from "@/components/ui/Button";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { TotalsList } from "@/components/checkout/TotalsList";
import { formatPrice } from "@/lib/utils/format-price";
import { addressLines, type OrderView } from "@/lib/orders";
import { cn } from "@/lib/utils/cn";
import { AccountPageHeader } from "../AccountSidebar/AccountSidebar";
import { OrderStatus } from "../OrderHistory/OrderStatus";
import { useAccountData } from "../useAccountData";
import { LoadError } from "../LoadError";
import { formatOrderDate } from "../format";

type Milestone = { key: "placed" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded"; reached: boolean; date: string | null };

function milestones(order: OrderView): Milestone[] {
  const paid = order.paymentStatus === "PAID" || order.state === "refunded" || Boolean(order.paidAt);
  const shipped = order.state === "shipped" || order.state === "delivered";
  const list: Milestone[] = [
    { key: "placed", reached: true, date: order.createdAt },
    { key: "paid", reached: paid, date: order.paidAt },
  ];
  if (order.state === "cancelled") return [...list, { key: "cancelled", reached: true, date: null }];
  if (order.state === "refunded") return [...list, { key: "refunded", reached: true, date: null }];
  return [...list, { key: "shipped", reached: shipped, date: null }, { key: "delivered", reached: order.state === "delivered", date: null }];
}

export function OrderDetail({ id }: { id: string }) {
  const t = useTranslations("account.order");
  const { data, error, loading, reload } = useAccountData<{ order: OrderView }>(`/api/account/orders/${encodeURIComponent(id)}`);
  const order = data?.order;

  if (loading) return <ShelfLoader block label={t("loading")} />;
  if (error || !order) {
    return (
      <div>
        <AccountPageHeader title={t("notFoundTitle")} />
        {error ? <LoadError onRetry={reload} /> : null}
        <EmptyState title={t("notFoundTitle")} subtitle={t("notFoundBody")} actionLabel={t("backToOrders")} actionHref="/account/orders" align="start" headingLevel={2} className="px-0" />
      </div>
    );
  }

  const steps = milestones(order);

  return (
    <div>
      <AccountPageHeader title={t("title", { number: order.number })} aside={<OrderStatus state={order.state} />}>
        <p className="m-0 text-ink-muted">{t("placedOn", { date: formatOrderDate(order.createdAt, true) })}</p>
      </AccountPageHeader>

      <section aria-labelledby="order-progress" className="mb-12">
        <h2 id="order-progress" className="sr-only">
          {t("progressTitle")}
        </h2>
        <ol className="m-0 grid list-none grid-cols-1 border-t border-line p-0 sm:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.key}
              data-drawer=""
              aria-current={step.reached && steps.filter((s) => s.reached).at(-1) === step ? "step" : undefined}
              className={cn("flex min-h-16 items-center gap-3 border-b border-line py-3 sm:flex-col sm:items-start sm:gap-1 sm:border-b-0 sm:pr-4", !step.reached && "text-ink-subtle")}
            >
              <span className="flex items-center gap-2 text-step-0 font-medium">
                {step.reached ? <Check size={16} aria-hidden="true" /> : <span aria-hidden="true" className="inline-block size-4" />}
                {t(`steps.${step.key}`)}
              </span>
              <span className="meta text-ink-muted">
                {step.date ? formatOrderDate(step.date) : step.reached ? "" : step.key === "paid" ? t("steps.awaitingPayment") : t("steps.notYet")}
              </span>
              {!step.reached ? <span className="sr-only">{t("steps.notReached")}</span> : null}
            </li>
          ))}
        </ol>
        <span aria-hidden="true" className="shelf-rule" />
        {order.trackingNumber ? (
          <p className="m-0 mt-4 text-ui-sm text-ink">
            {t("tracking")} <span className="font-mono">{order.trackingNumber}</span>
          </p>
        ) : null}
      </section>

      <section aria-labelledby="order-items" className="mb-12">
        <h2 id="order-items" className="m-0 mb-4 text-step-2 leading-none text-ink">
          {t("itemsTitle")}
        </h2>
        <ul className="m-0 flex list-none flex-col divide-y divide-line border-t border-line p-0">
          {order.lines.map((line) => (
            <li key={line.id} className="flex gap-4 py-4 sm:gap-6">
              <Cubby src={line.imageUrl} alt="" size="compact" sizes="96px" className="w-[72px] shrink-0 sm:w-24" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {line.slug ? (
                  <Link href={`/product/${line.slug}`} className="line-clamp-2 text-ui-sm font-medium text-ink hover-device:hover:underline">
                    {line.name}
                  </Link>
                ) : (
                  <p className="m-0 line-clamp-2 text-ui-sm font-medium text-ink">{line.name}</p>
                )}
                {line.variantName ? <p className="meta m-0 text-ink-muted">{line.variantName}</p> : null}
                <p className="meta tabular m-0 text-ink-muted">{t("lineQty", { count: line.quantity, unit: formatPrice(line.unit, order.currency) })}</p>
              </div>
              <p className="tabular m-0 shrink-0 font-display text-step-1 text-ink">{formatPrice(line.total, order.currency)}</p>
            </li>
          ))}
        </ul>
        <span aria-hidden="true" className="shelf-rule" />
      </section>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-1">
          <section aria-labelledby="order-delivery">
            <h2 id="order-delivery" className="eyebrow m-0 mb-2 text-ink-muted">
              {t("deliveryTitle")}
            </h2>
            <p className="m-0 text-ui-sm leading-[1.6] text-ink">
              {addressLines(order.delivery).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </section>
          <section aria-labelledby="order-billing">
            <h2 id="order-billing" className="eyebrow m-0 mb-2 text-ink-muted">
              {t("billingTitle")}
            </h2>
            <p className="m-0 text-ui-sm leading-[1.6] text-ink">
              {addressLines(order.billing ?? order.delivery).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="meta m-0 mt-3 text-ink-muted">{t("paymentMethod")}</p>
          </section>
        </div>
        <section aria-labelledby="order-totals" className="border border-line bg-raised p-6">
          <h2 id="order-totals" className="m-0 mb-5 text-step-2 leading-none text-ink">
            {t("totalsTitle")}
          </h2>
          <TotalsList totals={order.totals} currency={order.currency} showCurrencyCode totalSize="md" />
          {order.invoiceAvailable ? (
            <Button
              as="a"
              href={`/api/account/orders/${encodeURIComponent(order.id)}/invoice`}
              download
              variant="outline"
              size="sm"
              startContent={<FileDown size={16} aria-hidden="true" />}
              className="mt-6"
            >
              {t("invoiceDownload")}
            </Button>
          ) : null}
        </section>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8">
        <h2 className="m-0 text-step-2 leading-none text-ink">{t("helpTitle")}</h2>
        <p className="m-0 text-ink-muted">{t("helpBody")}</p>
        <Button as={Link} href={`/contact?order=${encodeURIComponent(order.number)}`} variant="outline" className="mt-2 self-start">
          {t("helpAction")}
        </Button>
      </div>
    </div>
  );
}
