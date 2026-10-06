"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Sheet } from "@/components/ui/Dialog";
import { Wordmark } from "@/components/layout/BrandMark";
import { NAV_CATEGORIES } from "@/config/navigation";
import { findCategory, subtreeCount, type CategoryNode } from "@/lib/hooks/useCategoryTree";
import { useAuth } from "@/providers/AuthProvider";
import { CurrencySelect } from "./CurrencySelect";
import { ThemeToggle } from "./ThemeToggle";

const rowCls = "flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 border-b border-line text-left text-step-0 text-ink";
const activeRowCls = "aria-[current]:font-semibold aria-[current]:shadow-[inset_3px_0_0_var(--color-brass)] aria-[current]:pl-3";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryNode[];
  activeSlug?: string | null;
  activeRoot?: string | null;
}

export function MobileMenu({ open, onClose, categories, activeSlug = null, activeRoot = null }: MobileMenuProps) {
  const { user, role } = useAuth();
  const [panel, setPanel] = useState<string | null>(null);
  const active = panel ? findCategory(categories, panel) : undefined;
  const activeName = NAV_CATEGORIES.find((c) => c.slug === panel)?.name ?? active?.name ?? "";

  const close = () => {
    setPanel(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} side="left" label="Menu" motion="drawer-left">
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
          <Wordmark className="h-[25px] w-auto text-ink" />
          <button type="button" onClick={close} aria-label="Close menu" className="flex size-11 cursor-pointer items-center justify-center text-ink">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {panel ? (
            <nav aria-label={activeName} className="animate-fade-in px-4">
              <button type="button" onClick={() => setPanel(null)} className={`${rowCls} justify-start text-ink-muted`}>
                <ChevronLeft size={20} aria-hidden="true" />
                Back
              </button>
              <Link href={`/catalog/${panel}`} onClick={close} aria-current={activeSlug === panel ? "page" : undefined} className={`${rowCls} ${activeRowCls} font-semibold`}>
                <span>All {activeName}</span>
                {active ? <span className="tabular meta font-normal text-ink-muted">{subtreeCount(active)}</span> : null}
              </Link>
              {(active?.children ?? []).map((child) => (
                <Link key={child.id} href={`/catalog/${child.slug}`} onClick={close} aria-current={activeSlug === child.slug ? "page" : undefined} className={`${rowCls} ${activeRowCls}`}>
                  <span>{child.name}</span>
                  <span className="tabular meta text-ink-muted">{subtreeCount(child)}</span>
                </Link>
              ))}
            </nav>
          ) : (
            <div className="animate-fade-in px-4">
              <nav aria-label="Categories">
                <p className="eyebrow pb-2 pt-5 text-ink-muted">Shop</p>
                {NAV_CATEGORIES.map((cat) => {
                  const node = findCategory(categories, cat.slug);
                  const hasChildren = Boolean(node?.children?.length);
                  const current = activeSlug === cat.slug ? "page" : activeRoot === cat.slug ? "true" : undefined;
                  return hasChildren ? (
                    <button key={cat.slug} type="button" onClick={() => setPanel(cat.slug)} aria-current={current} className={`${rowCls} ${activeRowCls}`} aria-label={`${cat.name}, show sub-categories`}>
                      <span>{cat.name}</span>
                      <ChevronRight size={20} aria-hidden="true" className="text-ink-muted" />
                    </button>
                  ) : (
                    <Link key={cat.slug} href={`/catalog/${cat.slug}`} onClick={close} aria-current={current} className={`${rowCls} ${activeRowCls}`}>
                      <span>{cat.name}</span>
                      <ChevronRight size={20} aria-hidden="true" className="text-ink-muted" />
                    </Link>
                  );
                })}
              </nav>

              <nav aria-label="Account">
                <p className="eyebrow pb-2 pt-8 text-ink-muted">Your account</p>
                {user ? (
                  <>
                    <Link href="/account" onClick={close} className={rowCls}>Account</Link>
                    <Link href="/account/orders" onClick={close} className={rowCls}>Orders</Link>
                    <Link href="/account/wishlist" onClick={close} className={rowCls}>Saved</Link>
                    {role === "ADMIN" || role === "SUPER_ADMIN" ? (
                      <a href="/admin" onClick={close} className={rowCls}>Admin</a>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={close} className={rowCls}>Sign in</Link>
                    <Link href="/auth/register" onClick={close} className={rowCls}>Create an account</Link>
                  </>
                )}
              </nav>

              <nav aria-label="Help">
                <p className="eyebrow pb-2 pt-8 text-ink-muted">Help</p>
                <Link href="/faq" onClick={close} className={rowCls}>FAQ</Link>
                <Link href="/policies/shipping" onClick={close} className={rowCls}>Delivery</Link>
                <Link href="/policies/returns" onClick={close} className={rowCls}>Returns</Link>
                <Link href="/contact" onClick={close} className={rowCls}>Contact</Link>
              </nav>

              <div className="pb-8 pt-6">
                <div className="flex min-h-14 items-center justify-between border-b border-line">
                  <CurrencySelect size="md" showLabel className="w-full justify-between" />
                </div>
                <ThemeToggle variant="row" className="border-b border-line" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
