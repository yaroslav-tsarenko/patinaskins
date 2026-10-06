"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { CartItem } from "@/components/cart/CartItem/CartItem";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { TotalsList } from "@/components/checkout/TotalsList";
import { MerchantInfo } from "@/components/checkout/MerchantInfo";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { SkeletonBar } from "@/components/ui/ShelfLoader";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { useAuth } from "@/providers/AuthProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { STORE_POLICY } from "@/config/store-policy";

const EMPTY_LINKS = [
  { href: "/catalog/cookware", key: "cookware" },
  { href: "/catalog/tableware", key: "tableware" },
  { href: "/catalog/glassware-drinkware", key: "glassware" },
] as const;

export function CartView() {
  const t = useTranslations("cart");
  const nav = useTranslations("nav");
  const { cart, displayTotals, isHydrated, removeItem } = useCart();
  const { currency } = useCurrency();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const count = cart.itemCount;

  const saveForLater = async (productId: string, variantId?: string) => {
    if (!wishlist.isSaved(productId)) await wishlist.toggle(productId);
    removeItem(productId, variantId);
  };

  return (
    <div className="mx-auto max-w-container px-gutter pb-28 lg:pb-24">
      <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: t("title") }]} withJsonLd={false} />
      <div className="flex flex-wrap items-center gap-4 pb-8 pt-2">
        <h1 className="m-0 text-step-4 leading-[1.05] text-ink">{t("title")}</h1>
        {isHydrated && count > 0 ? (
          <Plate variant="neutral" aria-label={t("itemCount", { count })}>
            {count}
          </Plate>
        ) : null}
      </div>

      {!isHydrated ? (
        <div aria-busy="true" className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-6 border-b border-line pb-6">
                <span className="block size-[120px] shrink-0 bg-surface-2" />
                <span className="flex flex-1 flex-col gap-3">
                  <SkeletonBar className="w-2/3" />
                  <SkeletonBar className="w-1/3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : cart.items.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          subtitle={t("empty.subtitle")}
          actionLabel={t("empty.action")}
          actionHref="/catalog"
          align="start"
          className="px-0 py-10"
        >
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {EMPTY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
                  {t(`empty.links.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-10">
          <section aria-label={t("itemsLabel")} className="min-w-0 lg:col-span-8">
            <ul className="m-0 list-none divide-y divide-line border-t border-line p-0">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  size="full"
                  actions={
                    user ? (
                      <button
                        type="button"
                        onClick={() => saveForLater(item.productId, item.variantId)}
                        disabled={wishlist.pending(item.productId)}
                        className="inline-flex min-h-9 cursor-pointer items-center text-ui-sm text-ink-muted underline decoration-1 underline-offset-4 hover-device:hover:text-ink"
                      >
                        {t("saveForLater")}
                        <span className="sr-only"> {item.name}</span>
                      </button>
                    ) : null
                  }
                />
              ))}
            </ul>
            <span aria-hidden="true" className="shelf-rule" />
            {displayTotals.amountToFreeShipping > 0 ? (
              <p className="meta m-0 mt-5 text-ink-muted">
                {t("freeDeliveryRemaining", {
                  amount: formatPrice(displayTotals.amountToFreeShipping, currency),
                  threshold: formatPrice(STORE_POLICY.shipping.freeThreshold, STORE_POLICY.currency),
                })}
              </p>
            ) : (
              <p className="meta m-0 mt-5 text-ink-muted">{t("freeDeliveryReached")}</p>
            )}
            <p className="meta m-0 mt-1 text-ink-muted">{t("limits", { perItem: STORE_POLICY.limits.maxQtyPerItem, perOrder: STORE_POLICY.limits.maxItemsPerOrder })}</p>
          </section>

          <aside aria-labelledby="cart-counter-title" className="lg:sticky lg:top-28 lg:col-span-4">
            <div className="border border-line bg-raised p-6">
              <h2 id="cart-counter-title" className="m-0 mb-5 text-step-2 leading-none text-ink">
                {t("summary")}
              </h2>
              <TotalsList totals={displayTotals} currency={currency} />
              <p className="meta m-0 mt-3 text-ink-muted">{t("discountNote")}</p>
              <Button as={Link} href="/checkout" size="lg" fullWidth className="mt-6">
                {t("checkout")}
              </Button>
              <div className="mt-3 flex justify-center">
                <Button as={Link} href="/catalog" variant="ghost">
                  {t("continueShopping")}
                </Button>
              </div>
              <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5">
                <PaymentLogos height={24} />
                <MerchantInfo variant="line" />
              </div>
            </div>
          </aside>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-raised px-gutter py-3 lg:hidden">
            <Button as={Link} href="/checkout" size="lg" fullWidth>
              {t("checkoutWithTotal", { total: formatPrice(displayTotals.total, currency) })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
