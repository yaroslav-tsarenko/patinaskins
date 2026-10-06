"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Plate } from "@/components/ui/Plate";
import { Cubby, type ShelfProduct } from "@/components/product/ShelfTile/ShelfTile";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { MEGA_ZONES, navCategory } from "@/config/navigation";
import { findCategory, subtreeCount, type CategoryNode } from "@/lib/hooks/useCategoryTree";
import { cachedFetchJSON, readCached } from "@/lib/utils/reliable-fetch";

function useFeaturedProduct(slug: string | null) {
  const [product, setProduct] = useState<ShelfProduct | null>(null);
  useEffect(() => {
    if (!slug) return;
    const cacheKey = `mega:featured:${slug}`;
    const cached = readCached<{ data: ShelfProduct[] }>({ cacheKey, storage: "session" });
    if (cached) setProduct(cached.data?.[0] ?? null);
    let cancelled = false;
    cachedFetchJSON<{ data: ShelfProduct[] }>(`/api/products?category=${encodeURIComponent(slug)}&pageSize=1&inStock=true`, { cacheKey, storage: "session" })
      .then((res) => {
        if (!cancelled) setProduct(res.data?.[0] ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return product;
}

export interface MegaMenuProps {
  id: string;
  open: boolean;
  categories: CategoryNode[];
  activeSlug?: string | null;
  activeRoot?: string | null;
  onClose: (restoreFocus?: boolean) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function MegaMenu({ id, open, categories, activeSlug = null, activeRoot = null, onClose, onPointerEnter, onPointerLeave }: MegaMenuProps) {
  const [pointed, setPointed] = useState<string | null>(null);
  const hovered = pointed ?? activeRoot ?? "cookware";
  const featured = useFeaturedProduct(open ? hovered : null);
  const hoveredName = navCategory(hovered)?.name ?? findCategory(categories, hovered)?.name ?? "";

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const target = e.target as HTMLElement;
    const column = target.closest<HTMLElement>("[data-mega-col]");
    if (!column) return;
    const columns = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-mega-col]"));
    const links = Array.from(column.querySelectorAll<HTMLAnchorElement>("a"));
    const index = links.indexOf(target as HTMLAnchorElement);
    e.preventDefault();
    if (e.key === "ArrowDown") links[Math.min(links.length - 1, index + 1)]?.focus();
    else if (e.key === "ArrowUp") links[Math.max(0, index - 1)]?.focus();
    else {
      const ci = columns.indexOf(column);
      const nextCol = columns[e.key === "ArrowRight" ? Math.min(columns.length - 1, ci + 1) : Math.max(0, ci - 1)];
      nextCol?.querySelector<HTMLAnchorElement>("a")?.focus();
    }
  };

  if (!open) return null;

  return (
    <div
      id={id}
      data-drawer="mega"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && (e.currentTarget.contains(next) || (next as HTMLElement).closest?.("[data-mega-trigger]"))) return;
        onClose(false);
      }}
      className="animate-drawer-out absolute inset-x-0 top-full z-50 max-h-[70vh] overflow-y-auto bg-raised text-ink shadow-lg"
    >
      <div className="mx-auto grid max-w-container grid-cols-5 gap-8 px-gutter py-8">
        {MEGA_ZONES.map((zone) => (
          <div key={zone.title} data-mega-col="" className="min-w-0">
            <Plate variant="brass">{zone.title}</Plate>
            <ul className="m-0 mt-5 flex list-none flex-col gap-6 p-0">
              {zone.slugs.map((slug) => {
                const node = findCategory(categories, slug);
                const label = navCategory(slug)?.name ?? node?.name ?? slug;
                return (
                  <li key={slug} onPointerEnter={() => setPointed(slug)}>
                    <Link
                      href={`/catalog/${slug}`}
                      aria-current={activeSlug === slug ? "page" : activeRoot === slug ? "true" : undefined}
                      onFocus={() => setPointed(slug)}
                      onClick={() => onClose(false)}
                      className="flex items-baseline justify-between gap-3 text-step-0 font-semibold text-ink underline-offset-4 hover-device:hover:underline aria-[current]:underline aria-[current]:decoration-brass aria-[current]:decoration-2"
                    >
                      <span>{label}</span>
                      {node ? <span className="tabular meta font-normal text-ink-subtle">{subtreeCount(node)}</span> : null}
                    </Link>
                    {node?.children && node.children.length > 0 ? (
                      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
                        {node.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/catalog/${child.slug}`}
                              aria-current={activeSlug === child.slug ? "page" : undefined}
                              onFocus={() => setPointed(slug)}
                              onClick={() => onClose(false)}
                              className="flex items-baseline justify-between gap-3 text-ui-sm text-ink-muted hover-device:hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink"
                            >
                              <span className="min-w-0">{child.name}</span>
                              <span className="tabular meta text-ink-subtle">{subtreeCount(child)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div data-mega-col="" className="min-w-0 border-l border-line pl-8">
          {featured ? (
            <div className="group relative">
              <Cubby src={featured.images?.[0]?.url} alt="" lift sizes="220px" />
              <p className="mt-3 line-clamp-2 text-ui-sm font-medium text-ink">{featured.name}</p>
              <PriceDisplay price={Number(featured.price)} comparePrice={featured.comparePrice ? Number(featured.comparePrice) : null} size="sm" className="mt-1" />
              <Link href={`/product/${featured.slug}`} onClick={() => onClose(false)} className="absolute inset-0" aria-label={featured.name} />
            </div>
          ) : (
            <div aria-hidden="true">
              <div className="aspect-square bg-surface-2" />
              <span className="shelf-rule" />
            </div>
          )}
          <Link
            href={`/catalog/${hovered}`}
            onClick={() => onClose(false)}
            className="mt-5 inline-flex items-center gap-1.5 text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2"
          >
            Shop all {hoveredName}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-container justify-end px-gutter py-3">
          <Link href="/catalog" onClick={() => onClose(false)} className="text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4">
            Browse all categories
          </Link>
        </div>
      </div>
    </div>
  );
}
