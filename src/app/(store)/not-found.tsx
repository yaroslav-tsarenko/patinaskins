import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { NAV_CATEGORIES } from "@/config/navigation";

function EmptyCubbies() {
  return (
    <svg viewBox="0 0 480 220" aria-hidden="true" className="h-auto w-full max-w-[480px] text-shelf" fill="none">
      <rect x="0.75" y="0.75" width="478.5" height="196" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
      <path d="M160 1v196M320 1v196" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
      <path d="M58 70h44M62 70l-6 84a6 6 0 0 0 6 6h36a6 6 0 0 0 6-6l-6-84" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M104 92c14 0 18 10 18 22s-6 22-18 22" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
      <ellipse cx="80" cy="163" rx="34" ry="3.5" fill="var(--shadow-contact)" />
      <path d="M352 150h96M356 141h88M360 132h80" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M366 132c0-26 16-44 34-44s34 18 34 44" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
      <ellipse cx="400" cy="163" rx="40" ry="3.5" fill="var(--shadow-contact)" />
      <rect x="0" y="197" width="480" height="2" fill="currentColor" />
      <rect x="0" y="202" width="480" height="1" fill="var(--color-shelf-hairline)" />
    </svg>
  );
}

export default async function NotFound() {
  const t = await getTranslations("errors");
  const nav = await getTranslations("nav");

  return (
    <div className="mx-auto max-w-container px-gutter pb-24 pt-12 lg:pt-20">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-x-6">
        <figure data-shelf="" className="m-0 lg:col-span-5 lg:pt-4">
          <EmptyCubbies />
          <figcaption className="mt-4 flex w-full max-w-[480px] justify-center">
            <Plate variant="brass" size="lg" className="tabular">
              404
            </Plate>
          </figcaption>
        </figure>

        <div className="lg:col-span-6 lg:col-start-7">
          <h1 className="m-0 font-display text-step-4 leading-[1.08] tracking-[-0.01em] text-ink">{t("notFound")}</h1>
          <p className="measure mt-4 text-step-1 leading-[1.5] text-ink-muted">{t("notFoundSubtitle")}</p>

          <form action="/search" method="get" role="search" className="mt-8 flex max-w-[34rem] items-end gap-3">
            <Input
              name="q"
              type="search"
              label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              wrapperClassName="flex-1"
              autoComplete="off"
            />
            <Button type="submit" variant="outline" className="h-12 shrink-0" startContent={<Search aria-hidden="true" />}>
              {t("searchSubmit")}
            </Button>
          </form>

          <nav aria-labelledby="nf-categories" className="mt-12 border-t border-line pt-6">
            <h2 id="nf-categories" className="eyebrow m-0 text-ink-muted">
              {t("categoriesTitle")}
            </h2>
            <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-x-6 gap-y-1 p-0">
              {NAV_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/catalog/${cat.slug}`}
                    className="inline-flex min-h-11 items-center text-step-0 text-ink underline-offset-4 decoration-1 hover-device:hover:underline"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-ui-md font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2"
            >
              {t("backHome")}
            </Link>
            <span className="mx-4 text-ink-subtle" aria-hidden="true">
              /
            </span>
            <Link
              href="/catalog"
              className="inline-flex min-h-11 items-center text-ui-md font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2"
            >
              {nav("allCategories")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
