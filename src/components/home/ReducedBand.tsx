import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { Plate } from "@/components/ui/Plate";
import { getDiscountPercent } from "@/lib/homepage-products";
import { SectionLink } from "./Furniture";
import type { HomeProduct } from "./types";

export async function ReducedBand({ products }: { products: HomeProduct[] }) {
  if (products.length === 0) return null;
  const t = await getTranslations("home.reduced");

  return (
    <section aria-labelledby="reduced-title" data-reveal="shelf" className="on-paint bg-paint pb-24 pt-20 text-on-paint">
      <div className="mx-auto max-w-container px-gutter">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h2 id="reduced-title" className="m-0 text-step-4 leading-[1.08]">
              {t("title")}
            </h2>
            <p className="m-0 mt-3 max-w-[52ch] text-step-1 leading-[1.5] text-on-paint-muted">{t("lead")}</p>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <SectionLink href="/catalog?onSale=true" tone="on-paint">
              {t("all")}
            </SectionLink>
          </div>
        </div>

        <ul className="m-0 mt-10 grid list-none grid-cols-2 gap-x-3 gap-y-10 p-0 sm:gap-x-6 lg:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.id} style={{ "--i": index % 4 } as CSSProperties} className="min-w-0">
              <article className="group relative flex flex-col">
                <Cubby src={product.images[0]?.url} alt={product.images[0]?.alt || product.name} lift sizes="(min-width: 1024px) 300px, 50vw" />
                <div className="mt-3 flex">
                  <Plate>{t("plate", { percent: getDiscountPercent(product) })}</Plate>
                </div>
                <h3 className="m-0 mt-2 font-sans text-step-0 font-medium leading-[1.4] tracking-normal">
                  <Link href={`/product/${product.slug}`} className="line-clamp-2 min-h-[2.8em] text-on-paint after:absolute after:inset-0 hover-device:hover:underline hover-device:hover:underline-offset-4">
                    {product.name}
                  </Link>
                </h3>
                <PriceDisplay price={Number(product.price)} comparePrice={product.comparePrice ? Number(product.comparePrice) : null} size="sm" tone="on-paint" className="mt-2" />
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
