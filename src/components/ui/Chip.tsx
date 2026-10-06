"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function FilterChip({ label, onRemove, className }: { label: string; onRemove: () => void; className?: string }) {
  return (
    <span
      className={cn(
        "bevel-outline bevel-xs inline-flex h-8 items-center gap-1 pl-3 text-ui-sm text-ink",
        "before:bg-control after:bg-raised has-[button:hover]:before:bg-brand",
        className,
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="flex h-8 w-8 cursor-pointer items-center justify-center text-ink-muted hover-device:hover:text-ink"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </span>
  );
}

export function FilterChipRow({ children, onClearAll, className }: { children: ReactNode; onClearAll?: () => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
      {onClearAll ? (
        <button type="button" onClick={onClearAll} className="ml-1 min-h-8 cursor-pointer text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
          Clear all
        </button>
      ) : null}
    </div>
  );
}

export interface VariantOptionProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  selected?: boolean;
  unavailable?: boolean;
  swatch?: string | null;
}

export function VariantOption({ label, selected = false, unavailable = false, swatch, className, onClick, ...rest }: VariantOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={unavailable || undefined}
      onClick={(e) => {
        if (unavailable) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      className={cn(
        "relative inline-flex h-10 min-w-10 items-center justify-center gap-2 border px-4 text-ui-sm font-medium transition-colors duration-[160ms]",
        selected
          ? "border-brand text-ink shadow-[inset_0_0_0_1px_var(--color-accent)] after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-[7px] after:h-[2px] after:bg-shelf"
          : "border-control text-ink hover-device:hover:border-ink-muted",
        unavailable && "cursor-not-allowed overflow-hidden text-ink-subtle hover-device:hover:border-control",
        !unavailable && "cursor-pointer",
        className,
      )}
      {...rest}
    >
      {swatch ? <span aria-hidden="true" className="size-5 shrink-0 border border-line" style={{ backgroundColor: swatch }} /> : null}
      <span>{label}</span>
      {unavailable ? (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <line x1="0" y1="100" x2="100" y2="0" stroke="var(--color-border-control)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : null}
      {unavailable ? <span className="sr-only">(unavailable)</span> : null}
    </button>
  );
}
