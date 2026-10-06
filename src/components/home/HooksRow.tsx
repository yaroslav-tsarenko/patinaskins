import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { cn } from "@/lib/utils/cn";
import { SectionLink } from "./Furniture";
import type { HomeCategory, HomeProduct } from "./types";

const HANG_WIDTH = ["w-32 lg:w-40", "w-28 lg:w-32", "w-36 lg:w-44", "w-28 lg:w-36", "w-32 lg:w-40", "w-28 lg:w-32", "w-36 lg:w-44", "w-28 lg:w-36"];

function SHook({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 40" width="20" height="40" className={cn("relative block text-shelf", className)} fill="none">
      <path d="M6 8a4 4 0 1 1 8 0v22a4 4 0 1 1-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export async function HooksRow({ categories, products }: { categories: HomeCategory[]; products: HomeProduct[] }) {
  if (products.length < 3) return null;
  const t = await getTranslations("home.hooks");

  return (
    <section aria-labelledby="hooks-title" data-scene="hooks" className="py-12">
      <div className="mx-auto max-w-container px-gutter">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="hooks-title" className="m-0 text-step-3 leading-[1.12] tracking-[-0.005em]">
              {t("title")}
            </h2>
            <p className="m-0 mt-2 text-step-0 text-ink-muted">{t("lead")}</p>
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-x-6 p-0">
            {categories.map((c) => (
              <li key={c.slug}>
                <SectionLink href={`/catalog/${c.slug}`}>{c.name}</SectionLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-container lg:px-gutter">
        <div role="region" aria-labelledby="hooks-title" tabIndex={0} className="no-scrollbar snap-x overflow-x-auto scroll-px-gutter px-gutter pb-2 outline-offset-[-2px] lg:overflow-visible lg:px-0">
          <div className="relative w-max min-w-full pt-[3px]">
            <span aria-hidden="true" data-hook-rail="" data-depth="3" className="absolute inset-x-0 top-[3px] h-[2px] bg-shelf" />
            <ul className="m-0 flex list-none items-start justify-between gap-6 p-0 lg:gap-4">
              {products.map((product, i) => (
                <li key={product.id} className={cn("flex shrink-0 snap-start flex-col items-center", HANG_WIDTH[i % HANG_WIDTH.length])}>
                  <div data-hang="" data-depth="2" className="flex w-full origin-top flex-col items-center">
                    <SHook className="-mt-[7px]" />
                    <div className="-mt-1 w-full">
                      <Link href={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true" className="group relative block">
                        <Cubby src={product.images[0]?.url} alt="" shelf={false} lift sizes="176px" />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 w-full">
                    <h3 className="m-0 font-sans text-ui-sm font-medium leading-[1.4] tracking-normal">
                      <Link href={`/product/${product.slug}`} className="line-clamp-3 text-ink hover-device:hover:underline hover-device:hover:decoration-1 hover-device:hover:underline-offset-4">
                        {product.name}
                      </Link>
                    </h3>
                    <PriceDisplay price={Number(product.price)} comparePrice={product.comparePrice ? Number(product.comparePrice) : null} size="sm" className="mt-1" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
