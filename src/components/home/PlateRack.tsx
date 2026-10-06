import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { SectionLink } from "./Furniture";
import type { HomeCategory, HomeProduct } from "./types";

const SLAT_X = Array.from({ length: 8 }, (_, i) => 14 + i * 28);

function Slats() {
  return (
    <svg aria-hidden="true" data-rack-slats="" data-depth="1" className="absolute inset-0 size-full overflow-hidden text-ink-subtle">
      {SLAT_X.map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="100%" stroke="currentColor" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

export async function PlateRack({ category, products }: { category: HomeCategory | null; products: HomeProduct[] }) {
  if (!category || products.length < 3) return null;
  const t = await getTranslations("home.rack");

  return (
    <section aria-labelledby="rack-title" data-pin="rack" className="bg-surface-1 [container-type:inline-size] [overflow-x:clip]">
      <div data-rack-pin="" style={{ "--rack-count": products.length + 1 } as CSSProperties}>
        <div data-rack-stage="" className="py-20">
          <div className="mx-auto max-w-container px-gutter">
            <h2 id="rack-title" className="m-0 max-w-[16ch] text-step-3 leading-[1.12] tracking-[-0.005em]">
              {t("title")}
            </h2>
          </div>
          <div className="mx-auto mt-10 max-w-container lg:px-gutter">
            <div
              role="region"
              aria-labelledby="rack-title"
              tabIndex={0}
              data-rack-scroller=""
              className="no-scrollbar snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-px-gutter px-gutter outline-offset-[-2px] lg:px-0"
            >
              <ul data-rack-track="" className="m-0 grid w-max list-none auto-cols-[196px] grid-flow-col grid-rows-[1fr_auto_auto] border-x-[1.5px] border-shelf p-0 ">
                {products.map((product, index) => (
                  <li key={product.id} data-rack-item="" style={{ "--i": index } as CSSProperties} className="row-span-3 grid snap-start grid-rows-subgrid">
                    <div className="relative px-3.5 pt-14">
                      <Slats />
                      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-shelf" />
                      <Link href={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true" data-depth="2" className="group relative block">
                        <Cubby src={product.images[0]?.url} alt="" shelf={false} lift sizes="168px" />
                      </Link>
                    </div>
                    <span aria-hidden="true" className="shelf-rule" />
                    <div className="px-3.5 pb-1 pt-3">
                      <h3 className="m-0 font-sans text-step-0 font-medium leading-[1.4] tracking-normal">
                        <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-[2.8em] text-ink hover-device:hover:underline hover-device:hover:decoration-1 hover-device:hover:underline-offset-4">
                          {product.name}
                        </Link>
                      </h3>
                      <PriceDisplay price={Number(product.price)} comparePrice={product.comparePrice ? Number(product.comparePrice) : null} size="sm" className="mt-1" />
                    </div>
                  </li>
                ))}
                <li className="row-span-3 grid snap-start grid-rows-subgrid">
                  <div className="relative flex items-center justify-center px-3.5 pt-14">
                    <Slats />
                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-shelf" />
                    <SectionLink href={`/catalog/${category.slug}`} className="relative bg-surface-1 px-3">
                      {t("all", { category: category.name.toLowerCase() })}
                    </SectionLink>
                  </div>
                  <span aria-hidden="true" className="shelf-rule" />
                  <span aria-hidden="true" />
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div aria-hidden="true" data-rack-spacer="" />
      </div>
    </section>
  );
}
