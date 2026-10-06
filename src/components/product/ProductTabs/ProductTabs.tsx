"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Tabs } from "@/components/ui/Tabs";
import { STORE_POLICY } from "@/config/store-policy";

export interface SpecRow {
  label: string;
  value: string;
  mono?: boolean;
}

interface ProductTabsProps {
  descriptionHtml: string;
  specs: SpecRow[];
}

const linkCls = "font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2";

function DeliveryReturns() {
  const t = useTranslations("product");
  const { delivery, returns } = STORE_POLICY;
  const rows: { term: string; detail: React.ReactNode }[] = [
    { term: t("drMethod"), detail: t("drMethodBody", { method: delivery.method, usual: delivery.usualTime }) },
    { term: t("drAccept"), detail: delivery.offerExpiryNote },
    { term: t("drProtection"), detail: t("drProtectionBody", { days: delivery.tradeProtectionDays, hold: delivery.tradeHoldMaxDays }) },
    { term: t("drRequirements"), detail: delivery.requirements.join("; ") + "." },
    { term: t("drGuarantee"), detail: t("drGuaranteeBody", { hours: delivery.deadlineHours, refundDays: returns.refundDays }) },
    { term: t("drWithdrawal"), detail: t("drWithdrawalBody", { days: returns.withdrawalDays }) },
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
          {t("guaranteeLink")}
        </Link>
      </p>
    </div>
  );
}

export function ProductTabs({ descriptionHtml, specs }: ProductTabsProps) {
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
    { id: "delivery", label: t("tabDelivery"), content: <DeliveryReturns /> },
  ].filter((item): item is { id: string; label: string; content: React.ReactElement } => Boolean(item));

  return <Tabs items={items} label={t("tabsLabel")} />;
}
