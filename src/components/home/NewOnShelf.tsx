import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { ShelfGrid, ShelfTile } from "@/components/product/ShelfTile/ShelfTile";
import { cn } from "@/lib/utils/cn";
import { SectionLink } from "./Furniture";
import type { HomeProduct } from "./types";

export async function NewOnShelf({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null;
  const t = await getTranslations("home.newest");

  return (
    <section aria-labelledby="newest-title" data-reveal="shelf" className="pb-16 pt-24">
      <div className="mx-auto max-w-container px-gutter">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 id="newest-title" className="m-0 text-step-3 leading-[1.12] tracking-[-0.005em]">
            {t("title")}
          </h2>
          <SectionLink href="/catalog?sort=newest">{t("link")}</SectionLink>
        </div>
        <ShelfGrid className="mt-10">
          {products.map((product, i) => (
            <div key={product.id} style={{ "--i": i % 4 } as CSSProperties} className={cn("min-w-0", i >= 6 && "lg:max-xl:hidden")}>
              <ShelfTile product={product} headingLevel={3} />
            </div>
          ))}
        </ShelfGrid>
      </div>
    </section>
  );
}
