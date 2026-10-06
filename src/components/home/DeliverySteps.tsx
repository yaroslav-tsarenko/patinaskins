import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { STORE_POLICY } from "@/config/store-policy";

const STEPS = ["account", "tradeUrl", "pay", "accept"] as const;

export async function DeliverySteps() {
  const t = await getTranslations("home.delivery");
  const d = STORE_POLICY.delivery;
  return (
    <section aria-labelledby="delivery-title" data-section="how-delivery-works" className="mx-auto max-w-container px-gutter py-16">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="flex flex-col gap-3">
          <h2 id="delivery-title" className="m-0 text-step-3 leading-[1.12] text-ink">
            {t("title")}
          </h2>
          <p className="m-0 text-ui-md text-ink-muted">{t("lead", { method: d.method })}</p>
          <Link href="/policies/shipping" className="text-ui-md font-semibold text-ink underline decoration-1 underline-offset-4">
            {t("policyLink")}
          </Link>
        </div>
        <ol className="m-0 grid list-none grid-cols-1 gap-0 border-t border-line p-0 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step} data-step={step} className="flex gap-4 border-b border-line py-5 sm:pr-6">
              <span className="tabular font-mono text-ui-sm text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <h3 className="m-0 text-step-0 font-semibold text-ink">{t(`${step}.title`)}</h3>
                <p className="m-0 text-ui-sm text-ink-muted">
                  {t(`${step}.body`, { usual: d.usualTime, protection: d.tradeProtectionDays, hold: d.tradeHoldMaxDays, deadline: d.deadlineHours })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
