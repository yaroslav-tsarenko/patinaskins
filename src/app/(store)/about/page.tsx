import { Fragment, type CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CredentialPlaque } from "@/components/layout/Footer/Footer";
import { ElevationDrawing } from "@/components/home/ElevationDrawing";
import { LinkButton } from "@/components/home/LinkButton";
import { SectionLink } from "@/components/home/Furniture";
import { NAV_CATEGORIES } from "@/config/navigation";
import { BRAND } from "@/lib/brand";
import { POLICY_FACTS } from "@/lib/policy-facts";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  const title = t("metaTitle", { brand: BRAND.name });
  const description = t("metaDescription", { brand: BRAND.name, dispatchFrom: POLICY_FACTS.dispatchFrom });
  return pageMetadata({ title, description, path: "/about", absoluteTitle: true });
}

const LISTING_KEYS = ["new", "photo", "stock", "prices"] as const;
const NOT_SOLD_KEYS = ["electric", "knives", "food", "used"] as const;

export default async function AboutPage() {
  const t = await getTranslations("about");
  const f = POLICY_FACTS;

  const rows = [
    {
      key: "order",
      label: t("ordering.order.label"),
      lines: [{ text: t("ordering.order.body", { cardMethods: f.cardMethods, currencies: f.currencies }), href: "/policies/payment", link: t("ordering.order.link") }],
    },
    {
      key: "dispatch",
      label: t("ordering.dispatch.label"),
      lines: [{ text: t("ordering.dispatch.body", { dispatchFrom: f.dispatchFrom, processingDays: f.processingDays }), href: "/policies/shipping", link: t("ordering.dispatch.link") }],
    },
    {
      key: "delivery",
      label: t("ordering.delivery.label"),
      lines: [
        { text: t("ordering.delivery.delivery", { uk: f.deliveryUk, eu: f.deliveryEu, cost: f.deliveryCost, threshold: f.freeThreshold }), href: "/policies/shipping", link: t("ordering.delivery.deliveryLink") },
        { text: t("ordering.delivery.returns", { days: f.withdrawalDays }), href: "/policies/returns", link: t("ordering.delivery.returnsLink") },
        { text: t("ordering.delivery.warranty", { months: f.warrantyMonths }), href: "/policies/warranty", link: t("ordering.delivery.warrantyLink") },
      ],
    },
  ];

  return (
    <div data-page="about" data-landing="about">
      <div className="mx-auto max-w-container px-gutter">
        <Breadcrumbs items={[{ label: t("breadcrumbHome"), href: "/" }, { label: t("breadcrumb") }]} />
      </div>

      <section aria-labelledby="about-title" data-scene="elevation" className="mx-auto grid max-w-container items-end gap-x-6 gap-y-10 px-gutter pb-20 pt-6 lg:grid-cols-12 lg:pb-24 lg:pt-10">
        <div className="lg:col-span-6 lg:pb-16">
          <h1 id="about-title" data-anim="words" className="m-0 text-step-5 leading-[1.02]">
            {t("hero.title")
              .split(" ")
              .map((word, index, words) => (
                <Fragment key={`${word}-${index}`}>
                  <span data-word="" style={{ "--i": index } as CSSProperties} className="inline-block">
                    {word}
                  </span>
                  {index < words.length - 1 ? " " : null}
                </Fragment>
              ))}
          </h1>
          <p className="m-0 mt-6 measure text-step-1 leading-[1.5] text-ink-muted">
            {t("hero.lead", { brand: BRAND.name, countries: f.deliveryCountries })}
          </p>
        </div>
        <div className="mx-auto w-full max-w-[420px] lg:col-span-5 lg:col-start-8 lg:max-w-none">
          <ElevationDrawing />
        </div>
      </section>

      <section aria-labelledby="shelves-title" className="border-t border-line pb-16 pt-16">
        <div className="mx-auto max-w-container px-gutter">
          <h2 id="shelves-title" className="m-0 text-step-3 leading-[1.12] tracking-[-0.005em]">
            {t("shelves.title")}
          </h2>
          <div className="mt-10 grid gap-x-16 gap-y-12 lg:grid-cols-2">
            <div className="measure">
              <h3 className="m-0 text-step-2 leading-[1.2] tracking-normal">{t("shelves.rangeTitle")}</h3>
              <p className="m-0 mt-3 text-step-0 leading-[1.6] text-ink-muted">{t("shelves.rangeBody")}</p>
              <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-x-6 border-t border-line p-0 sm:grid-cols-2">
                {NAV_CATEGORIES.map((c) => (
                  <li key={c.slug} className="border-b border-line">
                    <Link href={`/catalog/${c.slug}`} className="flex min-h-11 items-center text-step-0 font-medium text-ink hover-device:hover:underline hover-device:hover:decoration-1 hover-device:hover:underline-offset-4">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="measure">
              <h3 className="m-0 text-step-2 leading-[1.2] tracking-normal">{t("shelves.listingTitle")}</h3>
              <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
                {LISTING_KEYS.map((key) => (
                  <li key={key} className="relative pl-6 text-step-0 leading-[1.6] text-ink-muted">
                    <span aria-hidden="true" className="bevel-xs absolute left-0 top-[0.6em] block size-2.5 before:bg-shelf" />
                    {t(`shelves.listing.${key}`, { currencies: f.currencies })}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="not-sold-title" className="bg-surface-1 py-16 lg:py-20">
        <div className="mx-auto grid max-w-container gap-x-6 gap-y-8 px-gutter lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="not-sold-title" className="m-0 text-step-3 leading-[1.12] tracking-[-0.005em]">
              {t("notSold.title")}
            </h2>
            <p className="m-0 mt-3 text-step-0 text-ink-muted">{t("notSold.lead")}</p>
          </div>
          <ul className="m-0 list-none p-0 lg:col-span-7 lg:col-start-6">
            {NOT_SOLD_KEYS.map((key) => (
              <li key={key} className="border-b border-line py-4 font-display text-step-2 leading-[1.2] first:border-t first:border-line">
                {t(`notSold.items.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="ordering-title" className="pb-16 pt-20">
        <div className="mx-auto max-w-container px-gutter">
          <h2 id="ordering-title" className="m-0 text-step-3 leading-[1.12] tracking-[-0.005em]">
            {t("ordering.title")}
          </h2>
          <ol className="m-0 mt-8 list-none border-t border-line p-0">
            {rows.map((row, index) => (
              <li key={row.key} data-row="" style={{ "--i": index } as CSSProperties} className="grid gap-x-6 gap-y-3 border-b border-line py-6 lg:grid-cols-12">
                <h3 className="m-0 text-step-2 leading-[1.2] tracking-normal lg:col-span-3">{row.label}</h3>
                <div className="flex flex-col gap-4 lg:col-span-8 lg:col-start-5">
                  {row.lines.map((line) => (
                    <div key={line.href + line.link} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                      <p className="m-0 max-w-[60ch] text-step-0 leading-[1.6] text-ink-muted">{line.text}</p>
                      <SectionLink href={line.href} className="shrink-0">
                        {line.link}
                      </SectionLink>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="company-title" className="pb-24 pt-8">
        <div className="mx-auto grid max-w-container gap-x-6 gap-y-10 px-gutter lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <h2 id="company-title" className="m-0 text-step-3 leading-[1.12] tracking-[-0.005em]">
              {t("company.title")}
            </h2>
            <div className="mt-8 hidden lg:block">
              <LinkButton href="/catalog" size="lg">
                {t("browse")}
              </LinkButton>
            </div>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <CredentialPlaque stacked />
          </div>
          <div className="lg:hidden">
            <LinkButton href="/catalog" size="lg">
              {t("browse")}
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
