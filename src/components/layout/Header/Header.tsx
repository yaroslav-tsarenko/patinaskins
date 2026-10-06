"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Handbag, Menu, Search } from "lucide-react";
import { Wordmark } from "@/components/layout/BrandMark";
import { Plate } from "@/components/ui/Plate";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { catalogSlugFromPath, findRootSlug, useCategoryTree } from "@/lib/hooks/useCategoryTree";
import { CORNICE_LINKS, navCategory } from "@/config/navigation";
import { SHIPPING } from "@/config/shipping";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySelect } from "./CurrencySelect";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchDialog } from "@/components/search/SearchDialog/SearchDialog";
import { CartSheet } from "@/components/cart/CartSheet/CartSheet";
import { CheckoutHeader } from "@/components/checkout/CheckoutFrame";

type HeaderState = "top" | "compact" | "hidden";

const corniceLink = cn(
  "relative inline-flex h-full items-center whitespace-nowrap text-ui-md font-medium text-on-paint",
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-[calc(50%-17px)] after:h-[2px] after:origin-left after:scale-x-0 after:bg-brass-on-paint after:transition-transform after:duration-[160ms] after:ease-[var(--ease-furniture)]",
  "hover-device:hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 aria-[current=true]:after:scale-x-100 aria-expanded:after:scale-x-100",
);

const corniceAction = "relative inline-flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap text-ui-md font-medium text-on-paint hover-device:hover:underline hover-device:hover:decoration-1 hover-device:hover:underline-offset-[6px]";

function StoreHeader() {
  const pathname = usePathname();
  const { itemCount, cartBounce, openSheet, isSheetOpen } = useCart();
  const { user, role } = useAuth();
  const categories = useCategoryTree();
  const megaId = useId();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [state, setState] = useState<HeaderState>("top");
  const megaTimer = useRef<number | undefined>(undefined);
  const megaTrigger = useRef<HTMLButtonElement>(null);
  const lastY = useRef(0);
  const anyOpen = megaOpen || mobileOpen || searchOpen || isSheetOpen;
  const anyOpenRef = useRef(anyOpen);

  useEffect(() => {
    anyOpenRef.current = anyOpen;
  }, [anyOpen]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      lastY.current = y;
      if (anyOpenRef.current) return;
      if (y <= 120) setState("top");
      else if (delta > 4) setState("hidden");
      else if (delta < -4) setState("compact");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMegaOpen(false);
  }, [pathname]);

  const openMega = useCallback((delay: number) => {
    window.clearTimeout(megaTimer.current);
    megaTimer.current = window.setTimeout(() => setMegaOpen(true), delay);
  }, []);

  const closeMega = useCallback((delay: number, restoreFocus = false) => {
    window.clearTimeout(megaTimer.current);
    megaTimer.current = window.setTimeout(() => {
      setMegaOpen(false);
      if (restoreFocus) megaTrigger.current?.focus();
    }, delay);
  }, []);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMega(0, true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [megaOpen, closeMega]);

  const compact = state !== "top";
  const catalogSlug = catalogSlugFromPath(pathname);
  const activeRoot = findRootSlug(categories, catalogSlug) ?? catalogSlug;
  const triggerActive = pathname === "/catalog" || (activeRoot !== null && !CORNICE_LINKS.includes(activeRoot)) ? "all" : activeRoot ? "link" : undefined;
  const isAdmin = Boolean(user && (role === "ADMIN" || role === "SUPER_ADMIN"));

  const bagPlate =
    itemCount > 0 ? (
      <Plate key={cartBounce} variant="on-paint" size="sm" data-bag-count="" className={cn("min-w-5 justify-center px-1.5", cartBounce > 0 && "animate-plate-in")}>
        {itemCount > 99 ? "99+" : itemCount}
      </Plate>
    ) : null;

  return (
    <>
      <div aria-hidden="true" className="h-[var(--header-height-mobile)] shrink-0 lg:h-[calc(var(--utility-height)+var(--header-height))]" />
      <header
        data-header=""
        data-header-state={state}
        data-print-hide=""
        onPointerLeave={() => {
          if (megaOpen) closeMega(250);
        }}
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-transform duration-[320ms] ease-[var(--ease-furniture)]",
          state === "hidden" && "-translate-y-full",
          state === "compact" && "lg:-translate-y-[var(--utility-height)]",
        )}
      >
        <div data-depth="0" className="hidden h-[var(--utility-height)] border-b border-line bg-surface lg:block">
          <div className="mx-auto flex h-full max-w-container items-center justify-between gap-6 px-gutter">
            <p className="meta text-ink-muted">{SHIPPING.statement}</p>
            <div className="flex items-center gap-4">
              <CurrencySelect />
              <ThemeToggle />
              <Link href="/faq" className="meta text-ink-muted hover-device:hover:text-ink hover-device:hover:underline hover-device:hover:underline-offset-4">
                Help
              </Link>
              {isAdmin ? (
                <a href="/admin" className="meta text-ink-muted hover-device:hover:text-ink hover-device:hover:underline hover-device:hover:underline-offset-4">
                  Admin
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div
          data-cornice=""
          data-depth="3"
          className={cn(
            "on-paint relative bg-paint text-on-paint transition-[height] duration-[320ms] ease-[var(--ease-furniture)]",
            "h-[var(--header-height-mobile)]",
            compact ? "lg:h-[var(--header-height-compact)]" : "lg:h-[var(--header-height)]",
          )}
        >
          <div className="relative mx-auto grid h-full max-w-container grid-cols-[1fr_auto_1fr] items-center gap-4 px-gutter lg:flex lg:justify-between lg:gap-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="-ml-2 flex h-11 min-w-11 cursor-pointer items-center gap-2 justify-self-start px-2 text-on-paint lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
              <span className="text-ui-md font-medium max-[389px]:sr-only">Menu</span>
            </button>

            <Link href="/" aria-label="Brasmora, home" className="flex shrink-0 items-center justify-self-center text-on-paint">
              <Wordmark className={cn("w-auto transition-[height] duration-[320ms] ease-[var(--ease-furniture)]", "h-[25px]", compact ? "lg:h-[25px]" : "lg:h-[33px]")} />
            </Link>

            <nav aria-label="Main" className="hidden h-full items-center gap-7 lg:flex">
              {CORNICE_LINKS.map((slug) => {
                const cat = navCategory(slug);
                const href = `/catalog/${slug}`;
                const current = catalogSlug === slug ? "page" : activeRoot === slug ? "true" : undefined;
                return (
                  <Link key={slug} href={href} aria-current={current} className={cn(corniceLink, "hidden xl:inline-flex")}>
                    {cat?.short ?? slug}
                  </Link>
                );
              })}
              <button
                ref={megaTrigger}
                type="button"
                data-mega-trigger=""
                data-active={triggerActive}
                aria-expanded={megaOpen}
                aria-controls={megaId}
                onClick={() => {
                  window.clearTimeout(megaTimer.current);
                  setMegaOpen((v) => !v);
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") openMega(150);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse" && !megaOpen) window.clearTimeout(megaTimer.current);
                }}
                className={cn(corniceLink, "cursor-pointer gap-1.5 data-[active=all]:after:scale-x-100 max-xl:data-[active=link]:after:scale-x-100")}
              >
                <span className="xl:hidden">Shop</span>
                <span className="hidden xl:inline">All categories</span>
                <ChevronDown size={16} aria-hidden="true" className={cn("transition-transform duration-[260ms]", megaOpen && "rotate-180")} />
              </button>
            </nav>

            <div className="flex items-center gap-1 justify-self-end lg:gap-6">
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className={cn(corniceAction, "w-11 justify-center lg:w-auto")}>
                <Search size={20} aria-hidden="true" className="lg:hidden" />
                <span className="hidden lg:inline">Search</span>
              </button>
              <Link href={user ? "/account" : "/auth/login"} className={cn(corniceAction, "hidden lg:inline-flex")}>
                {user ? "Account" : "Sign in"}
              </Link>
              <button
                type="button"
                onClick={openSheet}
                aria-label={`Bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
                data-bag-target=""
                className={cn(corniceAction, "-mr-2 min-w-11 justify-center px-2 lg:mr-0 lg:px-0")}
              >
                <Handbag size={20} aria-hidden="true" className="lg:hidden" />
                <span className="hidden lg:inline">Bag</span>
                {bagPlate}
              </button>
            </div>
          </div>
          <span aria-hidden="true" className={cn("absolute inset-x-0 top-full h-[2px] bg-shelf transition-opacity duration-[160ms]", compact ? "opacity-100" : "opacity-0")} />
          <div className="hidden lg:block">
            <MegaMenu
              id={megaId}
              open={megaOpen}
              categories={categories}
              activeSlug={catalogSlug}
              activeRoot={activeRoot}
              onClose={(restore) => closeMega(0, restore)}
              onPointerEnter={() => window.clearTimeout(megaTimer.current)}
              onPointerLeave={() => closeMega(250)}
            />
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} activeSlug={catalogSlug} activeRoot={activeRoot} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} categories={categories} />
      <CartSheet />
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return <CheckoutHeader />;
  return <StoreHeader />;
}
