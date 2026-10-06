import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { ShelfTile } from "@/components/product/ShelfTile/ShelfTile";
import { Plate } from "@/components/ui/Plate";
import type { HomeProduct } from "./types";

export async function TopShelf({ ranked, products }: { ranked: boolean; products: HomeProduct[] }) {
  if (products.length === 0) return null;
  const t = await getTranslations("home.topShelf");
  const [featured, ...rest] = products;

  return (
    <section aria-labelledby="top-shelf-title" data-shelf-section="top" data-reveal="shelf" className="pb-20 pt-16">
      <div className="mx-auto max-w-container px-gutter">
        <div className="[overflow-x:clip] @container/top">
          <div className="grid grid-cols-1 [--shelf-col-gap:24px] lg:grid-cols-[5fr_7fr] lg:grid-rows-[calc((100cqw-24px)*5/12*1.25-((100cqw-24px)*7/12-72px)/4)_auto] lg:gap-x-[var(--shelf-col-gap)] lg:[&_.shelf-continuous_[data-shelf]]:-mx-[calc(var(--shelf-col-gap)/2)]">
            <div className="pb-10 lg:col-start-2 lg:row-start-1 lg:pb-0 lg:pl-2 lg:pt-2">
              <Plate>{t("plate")}</Plate>
              <h2 id="top-shelf-title" className="m-0 mt-4 max-w-[14ch] text-step-3 leading-[1.12] tracking-[-0.005em] lg:text-step-4 lg:leading-[1.08]">
                {ranked ? t("titleRanked") : t("title")}
              </h2>
            </div>
            <ShelfTile
              product={featured}
              variant="featured"
              headingLevel={3}
              specLine={featured.shortDescription}
              sizes="(min-width: 1024px) 520px, 100vw"
              className="lg:col-start-1 lg:row-span-2 lg:row-start-1"
            />
            {rest.length > 0 ? (
              <ul className="m-0 mt-12 grid list-none grid-cols-2 gap-x-[var(--shelf-col-gap)] gap-y-10 p-0 [--shelf-col-gap:12px] sm:[--shelf-col-gap:24px] lg:col-start-2 lg:row-start-2 lg:mt-0 lg:grid-cols-4 [&_.shelf-continuous_[data-shelf]]:-mx-[calc(var(--shelf-col-gap)/2)]">
                {rest.map((product, index) => (
                  <li key={product.id} style={{ "--i": (index % 4) + 1 } as CSSProperties} className="min-w-0">
                    <ShelfTile product={product} headingLevel={3} sizes="(min-width: 1024px) 180px, 50vw" />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
