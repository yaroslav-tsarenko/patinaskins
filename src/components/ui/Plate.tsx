import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type PlateVariant = "brass" | "neutral" | "success" | "warning" | "danger" | "info" | "on-paint";

const VARIANT: Record<PlateVariant, string> = {
  brass: "before:bg-brass text-on-brass",
  neutral: "before:bg-surface-1 text-ink",
  success: "before:bg-success-tint text-success",
  warning: "before:bg-warning-tint text-warning",
  danger: "before:bg-danger-tint text-danger",
  info: "before:bg-info-tint text-info",
  "on-paint": "before:bg-brass-on-paint text-on-brass",
};

export interface PlateProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PlateVariant;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Plate({ variant = "brass", size = "md", className, children, ...rest }: PlateProps) {
  return (
    <span
      className={cn(
        "eyebrow tabular inline-flex max-w-full shrink-0 items-center whitespace-nowrap",
        size === "sm" && "bevel-xs h-5 px-2 text-[0.6875rem]",
        size === "md" && "bevel-sm h-6 px-2.5",
        size === "lg" && "bevel-sm h-7 px-3",
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

const ORDER_STATUS_VARIANT: Record<string, PlateVariant> = {
  PENDING: "neutral",
  CONFIRMED: "info",
  PAID: "success",
  PROCESSING: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "neutral",
  FAILED: "danger",
};

export function statusPlateVariant(status: string): PlateVariant {
  return ORDER_STATUS_VARIANT[status.toUpperCase()] ?? "neutral";
}

export function StatusPlate({ status, label, className }: { status: string; label?: string; className?: string }) {
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <Plate variant={statusPlateVariant(status)} className={className}>
      {text}
    </Plate>
  );
}
