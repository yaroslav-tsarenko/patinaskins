import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { POLICY_SLUGS, policyHref } from "@/components/layout/PolicyLayout/policies";
import { POLICY_FACTS as F } from "@/lib/policy-facts";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policies");
  return pageMetadata({ title: t("indexTitle"), description: t("indexMetaDescription", { brand: F.brand }), path: "/policies" });
}

export default async function PoliciesIndexPage() {
  const t = await getTranslations("policies");
  const values = { brand: F.brand, company: F.company, days: F.withdrawalDays, months: F.warrantyMonths };

  return (
    <div className="mx-auto max-w-container px-gutter pb-24">
      <Breadcrumbs items={[{ label: t("home"), href: "/" }, { label: t("indexTitle") }]} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <header className="lg:sticky lg:top-[calc(var(--header-height-compact)+2rem)] lg:self-start">
          <h1 className="m-0 font-display text-step-5 leading-[1.02] tracking-[-0.01em] text-ink">{t("indexTitle")}</h1>
          <p className="measure mt-5 text-step-1 leading-[1.5] text-ink-muted">{t("indexLead", values)}</p>
          <p className="meta mt-6 text-ink-subtle">{t("lastUpdated", { date: F.lastUpdated })}</p>
        </header>

        <ol className="m-0 list-none border-t border-line p-0">
          {POLICY_SLUGS.map((slug) => (
            <li key={slug} data-drawer="" className="border-b border-line">
              <Link
                href={policyHref(slug)}
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1.5 py-6 sm:py-7"
              >
                <span className="font-display text-step-2 leading-[1.2] text-ink underline-offset-[6px] decoration-1 hover-device:group-hover:underline">
                  {t(`items.${slug}.title`)}
                </span>
                <ArrowRight
                  size={20}
                  aria-hidden="true"
                  className="row-span-2 text-ink-muted transition-transform duration-[160ms] ease-[var(--ease-furniture)] hover-device:group-hover:translate-x-1 hover-device:group-hover:text-ink"
                />
                <span className="text-ui-sm leading-[1.5] text-ink-muted">{t(`items.${slug}.scope`, values)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
