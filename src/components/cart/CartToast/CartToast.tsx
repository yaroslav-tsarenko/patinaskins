"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/providers/CartProvider";
import { Button } from "@/components/ui/Button";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";

interface CartToastProps {
  toastId?: string | number;
  name: string;
  imageUrl?: string | null;
  quantity: number;
}

export function CartToast({ toastId, name, imageUrl, quantity }: CartToastProps) {
  const { openSheet } = useCart();
  const dismiss = () => {
    if (toastId !== undefined) toast.dismiss(toastId);
  };

  return (
    <div role="status" className="relative flex w-[min(380px,calc(100vw-32px))] gap-3 border border-line bg-raised p-4 pr-11 text-ink shadow-lg">
      <Cubby src={imageUrl} alt="" size="toast" className="w-12 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="eyebrow text-ink-muted">Added to bag{quantity > 1 ? ` · ${quantity}` : ""}</p>
        <p className="truncate text-ui-sm font-medium text-ink">{name}</p>
        <div className="mt-2 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              dismiss();
              openSheet();
            }}
          >
            View bag
          </Button>
          <Button as={Link} href="/checkout" size="sm" onClick={dismiss}>
            Checkout
          </Button>
        </div>
      </div>
      <button type="button" onClick={dismiss} aria-label="Close" className="absolute right-1.5 top-1.5 flex size-9 cursor-pointer items-center justify-center text-ink-muted hover-device:hover:text-ink">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
