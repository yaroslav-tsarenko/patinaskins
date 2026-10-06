"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckoutFooter } from "@/components/checkout/CheckoutFrame";
import { BRAND } from "@/lib/brand";
import { COMPANY } from "@/lib/company";
import { HELP_LINKS, NAV_CATEGORIES, POLICY_LINKS } from "@/config/navigation";
import { openCookieSettings } from "@/lib/consent";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/providers/AuthProvider";

const linkCls = "text-ui-sm text-on-paint underline-offset-4 decoration-1 hover-device:hover:underline";
const titleCls = "eyebrow mb-5 text-on-paint-muted";

const SOCIAL = [
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: "LinkedIn", href: process.env.NEXT_PUBLIC_LINKEDIN_URL },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
].filter((s): s is { label: string; href: string } => Boolean(s.href));

function ShopLinks() {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-3 p-0">
      {NAV_CATEGORIES.map((cat) => (
        <li key={cat.slug}>
          <Link href={`/catalog/${cat.slug}`} className={linkCls}>
            {cat.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HelpLinks() {
  const { user } = useAuth();
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {HELP_LINKS.map((link) => (
        <li key={link.label}>
          <Link href={user && link.signedInHref ? link.signedInHref : link.href} className={linkCls}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SmallPrintLinks() {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {POLICY_LINKS.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={linkCls}>
            {link.label}
          </Link>
        </li>
      ))}
      <li>
        <button type="button" onClick={openCookieSettings} className={cn(linkCls, "cursor-pointer text-left underline")}>
          Cookie settings
        </button>
      </li>
    </ul>
  );
}

export function CredentialPlaque({ stacked = false }: { stacked?: boolean } = {}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Company number", value: COMPANY.companyNumber },
    ...(COMPANY.vatRegistered ? [{ label: "VAT number", value: COMPANY.vatNumber }] : []),
    { label: "Registered office", value: COMPANY.registeredOffice },
    {
      label: "Email",
      value: (
        <a href={`mailto:${COMPANY.email}`} className="underline decoration-1 underline-offset-4 break-all">
          {COMPANY.email}
        </a>
      ),
    },
    ...(COMPANY.phone
      ? [
          {
            label: "Phone",
            value: (
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="underline decoration-1 underline-offset-4">
                {COMPANY.phone}
              </a>
            ),
          },
        ]
      : []),
    { label: "Support hours", value: COMPANY.supportHours },
  ];

  return (
    <section aria-label="Company details" data-plaque="credentials" className="bevel-lg px-6 py-6 text-on-brass before:bg-brass sm:px-8">
      <p className="font-display text-step-2 leading-[1.2]">{COMPANY.name}</p>
      <p className="mt-1 text-ui-sm">
        {BRAND.name} is a trading name of {COMPANY.name}.
      </p>
      <dl className={cn("m-0 mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2", !stacked && "lg:grid-cols-4")}>
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="eyebrow text-[0.75rem] opacity-80">{row.label}</dt>
            <dd className="m-0 mt-1.5 text-ui-sm">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function StoreFooter() {
  const year = new Date().getFullYear();

  return (
    <footer data-print-hide="" data-plinth="" className="on-paint mt-auto">
      <span aria-hidden="true" className="block h-[2px] bg-shelf" />
      <div className="bg-plinth text-on-paint">
        <div className="mx-auto max-w-wide px-gutter pt-12 lg:pt-16">
          <nav aria-label="Footer" className="hidden grid-cols-[1.4fr_1fr_1fr] lg:grid">
            <div className="pr-10">
              <h2 className={titleCls}>Shop</h2>
              <ShopLinks />
            </div>
            <div className="border-l border-on-paint-line px-10">
              <h2 className={titleCls}>Help</h2>
              <HelpLinks />
            </div>
            <div className="border-l border-on-paint-line pl-10">
              <h2 className={titleCls}>Small print</h2>
              <SmallPrintLinks />
            </div>
          </nav>

          <nav aria-label="Footer" className="lg:hidden">
            <Accordion tone="paint">
              <AccordionItem title="Shop" tone="paint" headingLevel={2} titleClassName="text-step-0">
                <ShopLinks />
              </AccordionItem>
              <AccordionItem title="Help" tone="paint" headingLevel={2} titleClassName="text-step-0">
                <HelpLinks />
              </AccordionItem>
              <AccordionItem title="Small print" tone="paint" headingLevel={2} titleClassName="text-step-0">
                <SmallPrintLinks />
              </AccordionItem>
            </Accordion>
          </nav>

          <div className="mt-10 lg:mt-14">
            <CredentialPlaque />
          </div>

          <div className="mt-10 flex flex-col items-center gap-5 border-t border-on-paint-line py-6 lg:flex-row lg:justify-between">
            <p className="meta order-last text-on-paint-muted lg:order-first">
              © {year} {BRAND.name}. All rights reserved.
            </p>
            {SOCIAL.length > 0 ? (
              <ul className="m-0 flex list-none gap-6 p-0">
                {SOCIAL.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            <PaymentLogos plaque height={28} className="max-lg:hidden" />
            <PaymentLogos plaque height={24} className="lg:hidden" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return <CheckoutFooter />;
  return <StoreFooter />;
}
