"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Tabs } from "@/components/ui/Tabs";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { STORE_POLICY } from "@/config/store-policy";
import type { CareGuide } from "@/config/care";

export interface SpecRow {
  label: string;
  value: string;
  mono?: boolean;
}

interface ProductTabsProps {
  descriptionHtml: string;
  specs: SpecRow[];
  care: { guide: CareGuide | null; materials: { id: string; title: string; steps: string[] }[] };
}

const linkCls = "font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2";

function DeliveryReturns() {
  const t = useTranslations("product");
  const { currency, convert } = useCurrency();
  const money = (n: number) => formatPrice(convert(n), currency);
  const { shipping, returns, warranty } = STORE_POLICY;
  const rows: { term: string; detail: React.ReactNode }[] = [
    { term: t("drDispatch"), detail: t("drDispatchBody", { from: shipping.dispatchFrom, days: shipping.processingDays }) },
    { term: t("drUk"), detail: <>{t("drUkBody", { time: shipping.deliveryTimes.uk })} {shipping.ukImportNote}</> },
    { term: t("drEu"), detail: t("drEuBody", { time: shipping.deliveryTimes.eu }) },
    { term: t("drCost"), detail: t("drCostBody", { cost: money(shipping.standardCost), threshold: money(shipping.freeThreshold) }) },
    {
      term: t("drReturns"),
      detail: t("drReturnsBody", { days: returns.withdrawalDays, sendDays: returns.returnShipDays, refundDays: returns.refundDays }),
    },
    { term: t("drReturnCost"), detail: returns.returnShippingPaidBy === "customer" ? t("drReturnCostCustomer") : t("drReturnCostFree") },
    { term: t("drWarranty"), detail: t("drWarrantyBody", { months: warranty.months }) },
  ];
  return (
    <div className="max-w-[860px]">
      <dl className="m-0 border-t border-line">
        {rows.map((row) => (
          <div key={row.term} className="grid gap-1 border-b border-line py-3.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
            <dt className="text-ui-sm text-ink-muted">{row.term}</dt>
            <dd className="m-0 text-step-0 leading-[1.6] text-ink">{row.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-ui-sm">
        <Link href="/policies/shipping" className={linkCls}>
          {t("deliveryLink")}
        </Link>
        <Link href="/policies/returns" className={linkCls}>
          {t("returnsLink")}
        </Link>
        <Link href="/policies/warranty" className={linkCls}>
          {t("warrantyLink")}
        </Link>
      </p>
    </div>
  );
}

export function ProductTabs({ descriptionHtml, specs, care }: ProductTabsProps) {
  const t = useTranslations("product");

  const items = [
    descriptionHtml
      ? {
          id: "description",
          label: t("tabDescription"),
          content: (
            <div
              className="measure text-step-0 leading-[1.7] text-ink-muted [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-step-2 [&_h3]:text-ink [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-sans [&_h4]:text-step-0 [&_h4]:font-semibold [&_h4]:text-ink [&_li]:mb-1.5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ),
        }
      : null,
    specs.length
      ? {
          id: "specifications",
          label: t("tabSpecifications"),
          content: (
            <table className="w-full max-w-[860px] border-collapse border-t border-line">
              <caption className="sr-only">{t("tabSpecifications")}</caption>
              <tbody>
                {specs.map((row) => (
                  <tr key={row.label} className="border-b border-line">
                    <th scope="row" className="h-12 w-[40%] py-3 pr-6 text-left align-top text-ui-sm font-normal text-ink-muted sm:w-[240px]">
                      {row.label}
                    </th>
                    <td className={row.mono ? "py-3 font-mono text-ui-sm text-ink" : "py-3 text-step-0 text-ink"}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        }
      : null,
    care.guide
      ? {
          id: "care",
          label: t("tabCare"),
          content: (
            <div className="grid max-w-[1000px] gap-x-12 gap-y-8 md:grid-cols-2">
              <section>
                <h3 className="text-step-2 leading-[1.2] text-ink">{care.guide.title}</h3>
                <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-step-0 leading-[1.6] text-ink-muted">
                  {care.guide.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </section>
              {care.materials.length ? (
                <div className="flex flex-col gap-6">
                  {care.materials.map((m) => (
                    <section key={m.id}>
                      <h3 className="eyebrow text-ink">{m.title}</h3>
                      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-step-0 leading-[1.6] text-ink-muted">
                        {m.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : null}
              <p className="meta text-ink-muted md:col-span-2">{t("careNote")}</p>
            </div>
          ),
        }
      : null,
    { id: "delivery", label: t("tabDelivery"), content: <DeliveryReturns /> },
  ].filter((item): item is { id: string; label: string; content: React.ReactElement } => Boolean(item));

  return <Tabs items={items} label={t("tabsLabel")} />;
}
