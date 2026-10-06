"use client";

import { useTranslations } from "next-intl";
import { ShelfGrid, ShelfGridSkeleton, ShelfTile, type ShelfProduct } from "@/components/product/ShelfTile/ShelfTile";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { Plate } from "@/components/ui/Plate";
import { AccountPageHeader } from "./AccountSidebar/AccountSidebar";
import { useAccountData } from "./useAccountData";
import { LoadError } from "./LoadError";

export function SavedItems() {
  const t = useTranslations("account.saved");
  const { data, error, loading, reload } = useAccountData<{ product: ShelfProduct }[]>("/api/wishlist");
  const products = (data ?? []).map((item) => item.product).filter(Boolean);
  const count = loading ? null : products.length;

  return (
    <div>
      <AccountPageHeader title={t("title")} aside={count ? <Plate variant="neutral">{count}</Plate> : null} />
      {loading ? (
        <ShelfGridSkeleton count={3} dense />
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : products.length === 0 ? (
        <EmptyState title={t("emptyTitle")} subtitle={t("emptyBody")} actionLabel={t("browse")} actionHref="/catalog" align="start" className="border-t border-line px-0 py-10" />
      ) : (
        <ShelfGrid dense>
          {products.map((product) => (
            <ShelfTile key={product.id} product={product} headingLevel={2} />
          ))}
        </ShelfGrid>
      )}
    </div>
  );
}
