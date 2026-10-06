"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Heart, Lock, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { PriceDisplay, discountPercent } from "@/components/shared/PriceDisplay/PriceDisplay";
import { QuantitySelector } from "@/components/shared/QuantitySelector/QuantitySelector";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { STORE_POLICY } from "@/config/store-policy";
import { VariantSelector, matchVariant, variantAxes, type ProductVariantOption } from "@/components/product/VariantSelector/VariantSelector";

export interface ProductInfoProps {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  quantity: number;
  trackInventory: boolean;
  lowStockAlert: number;
  summary: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  variants: ProductVariantOption[];
  breadcrumbs?: ReactNode;
}

function InfoRow({ icon, children, aside }: { icon: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <li className="flex min-h-12 items-start gap-3 border-b border-line py-3">
      <span className="mt-0.5 shrink-0 text-ink" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-ui-sm leading-[1.5] text-ink">{children}</div>
      {aside ? <div className="shrink-0 self-center">{aside}</div> : null}
    </li>
  );
}

const linkCls = "font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2";

export function ProductInfo({
  id,
  name,
  slug,
  sku,
  price,
  comparePrice,
  quantity,
  trackInventory,
  lowStockAlert,
  summary,
  categoryName,
  imageUrl,
  variants,
  breadcrumbs,
}: ProductInfoProps) {
  const t = useTranslations("product");
  const { addItem } = useCart();
  const { currency, convert } = useCurrency();
  const { isSaved, toggle, pending } = useWishlist();
  const [chosen, setChosen] = useState<Record<string, string>>(() => {
    const axes = variantAxes(variants);
    return Object.fromEntries(axes.filter((a) => a.values.length === 1).map((a) => [a.name, a.values[0]]));
  });
  const [qty, setQty] = useState(1);
  const [barVisible, setBarVisible] = useState(false);
  const addRowRef = useRef<HTMLDivElement>(null);

  const hasVariants = variants.length > 0;
  const variant = hasVariants ? matchVariant(variants, chosen) : null;
  const needsChoice = hasVariants && !variant;
  const firstMissing = hasVariants ? variantAxes(variants).find((a) => !chosen[a.name])?.name ?? null : null;

  const unitPrice = variant?.price ?? price;
  const stock = variant ? variant.quantity : quantity;
  const tracked = trackInventory || Boolean(variant);
  const soldOut = tracked && (hasVariants ? variants.every((v) => v.quantity <= 0) || (variant !== null && variant.quantity <= 0) : stock <= 0);
  const policyMax = STORE_POLICY.limits.maxQtyPerItem;
  const max = tracked ? Math.max(1, Math.min(stock, policyMax)) : policyMax;
  const stockLimited = tracked && stock < policyMax;
  const lowStock = tracked && !soldOut && stock > 0 && stock <= lowStockAlert;
  const pct = discountPercent(unitPrice, comparePrice);
  const saved = isSaved(id);

  useEffect(() => {
    setQty((q) => Math.min(q, max));
  }, [max]);

  useEffect(() => {
    const node = addRowRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const add = (source: HTMLElement | null) => {
    if (soldOut || needsChoice) return;
    addItem({
      productId: id,
      name,
      slug,
      sku: variant?.sku ?? sku,
      price: unitPrice,
      quantity: qty,
      imageUrl,
      variantId: variant?.id,
      variantName: variant?.name,
      maxQuantity: max,
    });
    window.dispatchEvent(new CustomEvent("brasmora:bag-add", { detail: { productId: id, source: source ?? document.querySelector("[data-gallery]") } }));
  };

  const availability = soldOut ? t("soldOut") : !tracked ? t("available") : lowStock ? t("onlyLeft", { count: stock }) : t("inStock");
  const addLabel = soldOut ? t("soldOut") : needsChoice ? t("chooseOption", { option: (firstMissing ?? "").toLowerCase() }) : t("addToBag");
  const money = (n: number) => formatPrice(convert(n), currency);
  const { shipping, returns, warranty } = STORE_POLICY;

  return (
    <div className="flex flex-col">
      {breadcrumbs}
      {categoryName ? (
        <div className="mb-4 flex">
          <Plate>{categoryName}</Plate>
        </div>
      ) : null}
      <h1 className="text-step-4 leading-[1.06] text-ink [overflow-wrap:anywhere]">{name}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <PriceDisplay price={unitPrice} comparePrice={comparePrice} size="lg" />
        {pct > 0 ? <Plate>{t("reducedBy", { percent: pct })}</Plate> : null}
      </div>

      {summary ? <p className="measure mt-5 text-step-0 leading-[1.65] text-ink-muted">{summary}</p> : null}

      {hasVariants ? (
        <div className="mt-6">
          <VariantSelector variants={variants} chosen={chosen} onChoose={(axis, value) => setChosen((c) => ({ ...c, [axis]: value }))} />
        </div>
      ) : null}

      <p className={cn("mt-6 flex items-center gap-2 text-ui-sm font-medium", soldOut ? "text-ink-muted" : lowStock ? "text-warning" : "text-success")}>
        <span aria-hidden="true" className={cn("size-2", soldOut ? "bg-ink-subtle" : lowStock ? "bg-warning" : "bg-success")} />
        {availability}
      </p>

      <div ref={addRowRef} data-add-row="" className="mt-4">
        {soldOut ? (
          <div className="flex flex-col gap-2">
            <Button size="lg" isDisabled fullWidth>
              {t("soldOut")}
            </Button>
            <p className="meta text-ink-muted">{t("checkBackLater")}</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-3">
            <div className="w-[148px] shrink-0">
              <QuantitySelector quantity={qty} maxQuantity={max} onChange={setQty} showStockHint={stockLimited} label={t("quantity")} />
              {!stockLimited && qty >= max ? <p className="meta mt-1.5 text-ink-muted">{t("maxPerOrder", { count: policyMax })}</p> : null}
            </div>
            <Button size="lg" className="min-w-[12rem] flex-1" isDisabled={needsChoice} onPress={() => add(null)}>
              {addLabel}
            </Button>
          </div>
        )}
        <button
          type="button"
          onClick={() => toggle(id)}
          disabled={pending(id)}
          aria-pressed={saved}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2 disabled:cursor-wait"
        >
          <Heart size={18} aria-hidden="true" fill={saved ? "currentColor" : "none"} />
          {saved ? t("savedToWishlist") : t("saveToWishlist")}
        </button>
      </div>

      <ul className="m-0 mt-6 list-none border-t border-line p-0">
        <InfoRow icon={<Truck size={18} />}>
          <p>{t("deliveryLine", { days: shipping.processingDays })}</p>
          <p className="text-ink-muted">{t("deliveryRegions", { uk: shipping.deliveryTimes.uk, eu: shipping.deliveryTimes.eu })}</p>
          <p className="text-ink-muted">
            {t("deliveryCost", { cost: money(shipping.standardCost), threshold: money(shipping.freeThreshold) })}{" "}
            <Link href="/policies/shipping" className={linkCls}>
              {t("deliveryLink")}
            </Link>
          </p>
        </InfoRow>
        <InfoRow icon={<RotateCcw size={18} />}>
          <p>
            {t("returnsLine", { days: returns.withdrawalDays })}{" "}
            <Link href="/policies/returns" className={linkCls}>
              {t("returnsLink")}
            </Link>
          </p>
        </InfoRow>
        <InfoRow icon={<ShieldCheck size={18} />}>
          <p>
            {t("warrantyLine", { months: warranty.months })}{" "}
            <Link href="/policies/warranty" className={linkCls}>
              {t("warrantyLink")}
            </Link>
          </p>
        </InfoRow>
        <InfoRow icon={<Lock size={18} />} aside={<PaymentLogos height={20} withPci={false} />}>
          <p>{t("securePayment")}</p>
        </InfoRow>
      </ul>

      {!soldOut ? (
        <div
          data-sticky-add=""
          aria-hidden={!barVisible}
          inert={!barVisible}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-between gap-4 border-t border-line bg-raised px-gutter transition-transform duration-[260ms] ease-[var(--ease-furniture)] lg:hidden",
            barVisible ? "translate-y-0" : "translate-y-full",
          )}
        >
          <PriceDisplay price={unitPrice} comparePrice={comparePrice} size="sm" />
          <Button size="md" onPress={() => (needsChoice ? addRowRef.current?.scrollIntoView({ block: "center" }) : add(null))}>
            {addLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
