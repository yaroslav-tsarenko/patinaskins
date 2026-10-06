import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { Plate } from "@/components/ui/Plate";
import { Knob } from "./Furniture";
import type { HomeDrawer } from "./types";

export async function DrawerChest({ drawers, totalProducts }: { drawers: HomeDrawer[]; totalProducts: number }) {
  if (drawers.length === 0) return null;
  const t = await getTranslations("home.drawers");

  return (
    <section id="shop-drawers" aria-labelledby="drawers-title" data-scene="drawers" className="scroll-mt-24 pb-16 pt-16 lg:pt-24">
      <div className="mx-auto max-w-container px-gutter">
        <div className="grid gap-x-6 gap-y-3 lg:grid-cols-12 lg:items-end">
          <h2 id="drawers-title" className="m-0 text-step-3 leading-[1.12] tracking-[-0.005em] lg:col-span-7">
            {t("title")}
          </h2>
          <p className="m-0 text-step-1 leading-[1.5] text-ink-muted lg:col-span-5 lg:pb-1 lg:text-right">
            {t("lead", { products: totalProducts, drawers: drawers.length })}
          </p>
        </div>

        <ul className="m-0 mt-10 grid list-none grid-cols-1 gap-[1.5px] border-[1.5px] border-shelf bg-shelf p-0 sm:grid-cols-2 lg:grid-cols-5">
          {drawers.map((drawer, index) => (
            <li
              key={drawer.slug}
              data-drawer-slot=""
              style={{ "--i": index } as CSSProperties}
              className="min-w-0 bg-raised"
            >
              <Link
                href={`/catalog/${drawer.slug}`}
                className="group flex h-full flex-col outline-offset-[-3px]"
              >
                <span
                  data-drawer={drawer.slug}
                  data-depth="4"
                  className="relative z-[1] flex h-[72px] items-center gap-3 bg-raised px-4 transition-colors duration-[160ms] hover-device:group-hover:bg-brand-soft sm:h-[104px] sm:flex-col sm:items-start sm:justify-between sm:gap-2 sm:py-4"
                >
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-none">
                    <Plate className="max-w-full">{drawer.name}</Plate>
                    <span className="meta tabular text-ink-muted">{t("count", { count: drawer.count })}</span>
                  </span>
                  <Knob className="max-sm:hidden sm:absolute sm:bottom-5 sm:right-5" />
                  <span className="flex shrink-0 gap-1 sm:hidden" aria-hidden="true">
                    {drawer.products.slice(0, 2).map((p) => (
                      <Cubby key={p.id} src={p.images[0]?.url} alt="" size="compact" shelf={false} sizes="44px" className="w-11" />
                    ))}
                  </span>
                </span>
                {drawer.products.length > 0 ? (
                  <span
                    aria-hidden="true"
                    data-drawer-contents=""
                    data-depth="1"
                    className="hidden flex-1 bg-surface-2 px-3 pt-3 sm:block"
                  >
                    <span data-drawer-tray="" className="block">
                      <span className="grid grid-cols-3 gap-1.5">
                        {drawer.products.map((p) => (
                          <Cubby key={p.id} src={p.images[0]?.url} alt="" size="compact" shelf={false} sizes="96px" />
                        ))}
                      </span>
                      <span className="shelf-rule -mx-3 mt-0" />
                      <span className="block h-2" />
                    </span>
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
