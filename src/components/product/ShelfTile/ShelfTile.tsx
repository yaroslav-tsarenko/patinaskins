"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Handbag, Heart, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/providers/CartProvider";
import { useWishlist } from "@/providers/WishlistProvider";
import { PriceDisplay, discountPercent } from "@/components/shared/PriceDisplay/PriceDisplay";
import { Plate } from "@/components/ui/Plate";
import { Button } from "@/components/ui/Button";
import { SkeletonBar } from "@/components/ui/ShelfLoader";
import { itemQuantityCap } from "@/lib/pricing";

export interface ShelfProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number | string;
  comparePrice?: number | string | null;
  quantity?: number;
  images?: { url: string; alt?: string | null }[];
  imageUrl?: string | null;
  categories?: { category: { name: string; slug?: string } }[];
  category?: string | null;
  createdAt?: string | Date | null;
  isNew?: boolean;
}

type CubbySize = "tile" | "featured" | "compact" | "toast" | "thumb";

const CUBBY_ASPECT: Record<CubbySize, string> = {
  tile: "aspect-square",
  featured: "aspect-[4/5]",
  compact: "aspect-square",
  toast: "aspect-square",
  thumb: "aspect-square",
};

export interface CubbyProps {
  src?: string | null;
  alt: string;
  size?: CubbySize;
  sizes?: string;
  priority?: boolean;
  shelf?: boolean;
  lift?: boolean;
  settleKey?: number;
  className?: string;
  stageClassName?: string;
  children?: ReactNode;
}

export function Cubby({ src, alt, size = "tile", sizes, priority, shelf = true, lift = false, settleKey = 0, className, stageClassName, children }: CubbyProps) {
  const small = size === "compact" || size === "toast" || size === "thumb";
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <div className={cn("relative", className)}>
      <div
        data-cubby=""
        className={cn(
          "relative overflow-hidden",
          CUBBY_ASPECT[size],
          showImage ? "bg-stage" : "bg-surface-2",
          stageClassName,
        )}
      >
        {showImage ? (
          <>
            <span
              aria-hidden="true"
              className={cn(
                "contact-shadow",
                small && "h-1.5",
                lift && "group-hover:scale-x-110 group-hover:opacity-70 group-focus-within:scale-x-110 group-focus-within:opacity-70",
              )}
            />
            <div
              key={settleKey}
              data-depth="2"
              data-packshot=""
              className={cn(
                "absolute inset-x-[10%] bottom-[6%] top-[10%] z-[1] transition-transform duration-[160ms] ease-[var(--ease-furniture)]",
                lift && "group-hover:-translate-y-1 group-focus-within:-translate-y-1",
                settleKey > 0 && "animate-shelf-settle",
              )}
            >
              <Image
                src={src as string}
                alt={alt}
                fill
                priority={priority}
                sizes={sizes ?? (small ? "72px" : "(min-width: 1280px) 300px, (min-width: 1024px) 30vw, 50vw")}
                className="object-contain object-bottom mix-blend-multiply dark:mix-blend-normal"
                onError={() => setFailed(true)}
              />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-muted">
            <ImageOff size={small ? 16 : 24} aria-hidden="true" />
            {!small ? <span className="meta">No photo yet</span> : null}
          </div>
        )}
        {children}
      </div>
      {shelf ? <span aria-hidden="true" data-shelf="" className={cn("shelf-rule", small && "[--shelf-gap:2px]")} /> : null}
    </div>
  );
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function tilePlate(product: ShelfProduct): { variant: "brass" | "neutral"; label: string } | null {
  const price = toNumber(product.price) ?? 0;
  const compare = toNumber(product.comparePrice);
  if (product.quantity !== undefined && product.quantity <= 0) return { variant: "neutral", label: "Sold out" };
  const pct = discountPercent(price, compare);
  if (pct > 0) return { variant: "brass", label: `Reduced −${pct}%` };
  if (product.isNew) return { variant: "brass", label: "New" };
  const category = product.category ?? product.categories?.[0]?.category?.name;
  return category ? { variant: "brass", label: category } : null;
}

export interface ShelfTileProps {
  product: ShelfProduct;
  variant?: "default" | "featured" | "compact";
  priority?: boolean;
  sizes?: string;
  specLine?: string | null;
  headingLevel?: 2 | 3 | 4;
  showPlate?: boolean;
  className?: string;
}

export function ShelfTile({ product, variant = "default", priority, sizes, specLine, headingLevel = 3, showPlate = true, className }: ShelfTileProps) {
  const { addItem } = useCart();
  const { isSaved, toggle, pending } = useWishlist();
  const [settleKey, setSettleKey] = useState(0);
  const price = toNumber(product.price) ?? 0;
  const compare = toNumber(product.comparePrice);
  const imageUrl = product.imageUrl ?? product.images?.[0]?.url ?? null;
  const alt = product.images?.[0]?.alt || product.name;
  const outOfStock = product.quantity !== undefined && product.quantity <= 0;
  const saved = isSaved(product.id);
  const plate = showPlate ? tilePlate(product) : null;
  const href = `/product/${product.slug}`;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const add = (event: React.MouseEvent<HTMLElement>) => {
    if (outOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? product.id,
      price,
      quantity: 1,
      imageUrl,
      maxQuantity: itemQuantityCap(product.quantity),
    });
    setSettleKey((k) => k + 1);
    window.dispatchEvent(new CustomEvent("brasmora:bag-add", { detail: { productId: product.id, source: event.currentTarget.closest("[data-shelf-item]") } }));
  };

  if (variant === "compact") {
    return (
      <article data-shelf-item="" className={cn("group relative flex items-center gap-4", className)}>
        <Cubby src={imageUrl} alt="" size="compact" className="w-[72px] shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Heading className="m-0 font-sans text-ui-sm font-medium leading-[1.4] tracking-normal">
            <Link href={href} className="line-clamp-2 text-ink after:absolute after:inset-0 hover-device:hover:underline">
              {product.name}
            </Link>
          </Heading>
          <PriceDisplay price={price} comparePrice={compare} size="sm" />
        </div>
      </article>
    );
  }

  const featured = variant === "featured";

  return (
    <article data-shelf-item="" data-variant={variant} className={cn("group relative flex min-w-0 flex-col", className)}>
      <Cubby
        src={imageUrl}
        alt={alt}
        size={featured ? "featured" : "tile"}
        sizes={sizes ?? (featured ? "(min-width: 1024px) 560px, 100vw" : undefined)}
        priority={priority}
        lift
        settleKey={settleKey}
        className="shelf-continuous"
        stageClassName="group-has-[a[data-tile-link]:focus-visible]:outline-2 group-has-[a[data-tile-link]:focus-visible]:-outline-offset-2 group-has-[a[data-tile-link]:focus-visible]:outline-focus"
      >
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Saved: ${product.name}` : `Save ${product.name}`}
          disabled={pending(product.id)}
          className={cn(
            "absolute right-2 top-2 z-[2] flex cursor-pointer items-center gap-1.5 text-ui-sm font-semibold text-on-stage [--color-focus:var(--color-on-stage)] transition-opacity duration-[160ms]",
            "size-11 justify-center",
            "hover-device:size-auto hover-device:min-h-8 hover-device:px-2 hover-device:underline hover-device:decoration-1 hover-device:underline-offset-4",
            saved ? "hover-device:opacity-100" : "hover-device:opacity-0 hover-device:group-hover:opacity-100 hover-device:group-focus-within:opacity-100",
          )}
        >
          <Heart size={18} aria-hidden="true" fill={saved ? "currentColor" : "none"} className="hover-device:hidden" />
          <span className="hidden hover-device:inline">{saved ? "Saved" : "Save"}</span>
        </button>
      </Cubby>

      {plate ? (
        <div className="mt-3 flex">
          <Plate variant={plate.variant}>{plate.label}</Plate>
        </div>
      ) : null}

      <Heading
        className={cn(
          "m-0 tracking-normal",
          featured ? "mt-3 font-display text-step-3 leading-[1.12]" : "mt-2 font-sans text-step-0 font-medium leading-[1.4]",
        )}
      >
        <Link
          href={href}
          data-tile-link=""
          className={cn(
            "text-ink outline-none after:absolute after:inset-0 after:z-[1] hover-device:hover:underline hover-device:hover:decoration-1 hover-device:hover:underline-offset-4",
            !featured && "line-clamp-2 min-h-[2.8em] break-words [overflow-wrap:anywhere]",
          )}
        >
          {product.name}
        </Link>
      </Heading>

      {featured && specLine ? <p className="mt-1 text-ui-sm text-ink-muted">{specLine}</p> : null}

      <div className="mt-2 flex items-center justify-between gap-3">
        <PriceDisplay price={price} comparePrice={compare} size={featured ? "md" : "sm"} />
        {!outOfStock && !featured ? (
          <button
            type="button"
            onClick={add}
            aria-label={`Add ${product.name} to bag`}
            className="bevel-sm relative z-[2] flex size-11 shrink-0 cursor-pointer items-center justify-center text-on-brand before:bg-brand active:before:bg-brand-hover hover-device:hidden"
          >
            <Handbag size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {!outOfStock ? (
        <div
          className={cn(
            "relative z-[2] mt-3",
            featured ? "block" : "hidden hover-device:-mb-12 hover-device:block hover-device:opacity-0 hover-device:transition-opacity hover-device:duration-[160ms] hover-device:group-hover:opacity-100 hover-device:group-focus-within:opacity-100",
          )}
        >
          <Button size={featured ? "lg" : "sm"} fullWidth={!featured} onClick={add} aria-label={`Add ${product.name} to bag`}>
            Add to bag
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function ShelfTileSkeleton({ variant = "default" }: { variant?: "default" | "featured" }) {
  return (
    <div aria-hidden="true" className="flex min-w-0 flex-col">
      <div className={cn("bg-surface-2", variant === "featured" ? "aspect-[4/5]" : "aspect-square")} />
      <span className="shelf-rule shelf-continuous" />
      <span className="mt-3 block h-5 w-20 bg-surface-2" />
      <SkeletonBar className="mt-3 w-[85%]" />
      <SkeletonBar className="mt-2 w-[55%]" />
    </div>
  );
}

export function ShelfGrid({ children, className, dense = false }: { children: ReactNode; className?: string; dense?: boolean }) {
  return (
    <div className={cn("[overflow-x:clip]", className)}>
      <div
        className={cn(
          "grid min-w-0 grid-cols-2 [--shelf-col-gap:12px] sm:[--shelf-col-gap:24px] lg:[--shelf-col-gap:32px]",
          "gap-x-[var(--shelf-col-gap)] gap-y-10 sm:gap-y-14",
          dense ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4",
          "[&_.shelf-continuous_[data-shelf]]:-mx-[calc(var(--shelf-col-gap)/2)] [&_.shelf-continuous.shelf-rule]:-mx-[calc(var(--shelf-col-gap)/2)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ShelfGridSkeleton({ count = 8, dense = false }: { count?: number; dense?: boolean }) {
  return (
    <ShelfGrid dense={dense}>
      {Array.from({ length: count }).map((_, i) => (
        <ShelfTileSkeleton key={i} />
      ))}
    </ShelfGrid>
  );
}
