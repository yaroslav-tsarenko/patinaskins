"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { X } from "lucide-react";
import { Sheet } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { CartItem } from "@/components/cart/CartItem/CartItem";
import { EmptyShelf } from "@/components/shared/EmptyState/EmptyState";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { useCart } from "@/providers/CartProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { COMPANY } from "@/lib/company";

const EMPTY_LINKS = [
  { href: "/catalog/cookware", label: "Cookware" },
  { href: "/catalog/tableware", label: "Tableware" },
  { href: "/catalog/glassware-drinkware", label: "Glassware & drinkware" },
];

export function CartSheet() {
  const { cart, displayTotals, isSheetOpen, closeSheet } = useCart();
  const tt = useTranslations("checkout.totals");
  const { currency } = useCurrency();
  const titleId = useId();
  const count = cart.itemCount;

  return (
    <Sheet open={isSheetOpen} onClose={closeSheet} side="right" labelledBy={titleId} motion="cupboard-door">
      <div data-door="cart" className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line pl-6 pr-3">
          <div className="flex items-center gap-3">
            <h2 id={titleId} className="text-step-2 leading-none text-ink">
              Your bag
            </h2>
            {count > 0 ? (
              <Plate variant="neutral" aria-label={`${count} ${count === 1 ? "item" : "items"}`}>
                {count}
              </Plate>
            ) : null}
          </div>
          <button type="button" onClick={closeSheet} aria-label="Close bag" className="flex size-11 cursor-pointer items-center justify-center text-ink hover-device:hover:bg-brand-soft">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start gap-4 px-6 py-12">
            <EmptyShelf />
            <p className="font-display text-step-2 leading-[1.2] text-ink">Your bag is empty</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {EMPTY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={closeSheet} className="text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Button as={Link} href="/catalog" variant="outline" onClick={closeSheet} className="mt-4">
              Browse the shop
            </Button>
          </div>
        ) : (
          <>
            <ul aria-label="Items in your bag" className="m-0 min-h-0 flex-1 list-none divide-y divide-line overflow-y-auto px-6 py-1">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} onNavigate={closeSheet} />
              ))}
            </ul>
            <div className="shrink-0 border-t border-line bg-raised px-6 pb-6 pt-5">
              <dl className="m-0 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ui-sm text-ink-muted">Subtotal</dt>
                  <dd className="tabular m-0 text-ui-sm text-ink">{formatPrice(displayTotals.subtotal, currency)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ui-sm text-ink-muted">Delivery</dt>
                  <dd className="tabular m-0 text-ui-sm text-ink">{displayTotals.shipping === 0 ? tt("free") : formatPrice(displayTotals.shipping, currency)}</dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                  <dt className="text-step-0 font-medium text-ink">{COMPANY.vatRegistered ? "Total incl. VAT" : "Total"}</dt>
                  <dd className="tabular m-0 font-display text-step-2 leading-none text-ink">{formatPrice(displayTotals.total, currency)}</dd>
                </div>
              </dl>
              <Button as={Link} href="/checkout" size="lg" fullWidth onClick={closeSheet} className="mt-5">
                Checkout
              </Button>
              <div className="mt-3 flex items-center justify-between gap-4">
                <Button as={Link} href="/cart" variant="ghost" onClick={closeSheet}>
                  View bag
                </Button>
                <PaymentLogos height={24} withPci={false} />
              </div>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
