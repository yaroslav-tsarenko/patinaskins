"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { Plate } from "@/components/ui/Plate";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";

export interface CategoryOpenerProps {
  name: string;
  description: string | null;
  artUrl: string | null;
  count: number;
  inStock: number;
  subCount: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export function CategoryOpener({ name, description, artUrl, count, inStock, subCount, minPrice, maxPrice }: CategoryOpenerProps) {
  const t = useTranslations("catalog");
  const { currency, convert } = useCurrency();
  const money = (n: number) => formatPrice(convert(n), currency);

  const range =
    minPrice === null || maxPrice === null
      ? null
      : minPrice === maxPrice
        ? t("introSinglePrice", { price: money(minPrice) })
        : t("introRange", { min: money(minPrice), max: money(maxPrice) });

  const sentence =
    count === 0
      ? null
      : [
          subCount > 1 ? t("introWithSubs", { count, subs: subCount }) : t("introCount", { count }),
          range,
          inStock < count ? t("introInStock", { count: inStock }) : null,
        ]
          .filter(Boolean)
          .join(" ");

  return (
    <header data-category-opener="" className="grid items-end gap-x-10 gap-y-6 pb-10 pt-2 lg:grid-cols-12 lg:pb-12">
      <div className="min-w-0 lg:col-span-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-step-4 leading-[1.05] text-ink">{name}</h1>
          {count > 0 ? (
            <Plate variant="neutral" size="lg">
              {t("items", { count })}
            </Plate>
          ) : null}
        </div>
        {description ? <p className="measure mt-4 text-step-1 leading-[1.5] text-ink-muted">{description}</p> : null}
        {sentence ? <p className="tabular measure mt-3 text-ui-sm text-ink">{sentence}</p> : null}
      </div>
      {artUrl ? (
        <div data-depth="1" className="hidden w-full max-w-[220px] justify-self-end lg:col-span-4 lg:col-start-9 lg:block">
          <span aria-hidden="true" className="shelf-rule-solid" />
          <Cubby src={artUrl} alt="" size="tile" sizes="240px" priority className="border-x border-line" />
        </div>
      ) : null}
    </header>
  );
}
