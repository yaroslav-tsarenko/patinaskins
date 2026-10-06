"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft" | "light" | "flat" | "bordered";
type Kind = "paint" | "outline" | "text" | "danger" | "danger-text";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  color?: "primary" | "danger" | "success" | "warning" | "default";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isDisabled?: boolean;
  isIconOnly?: boolean;
  fullWidth?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  as?: React.ElementType;
  href?: string;
  target?: string;
  download?: boolean;
  onPress?: () => void;
  className?: string;
  [key: string]: unknown;
}

const SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 px-4 text-ui-sm",
  md: "h-11 px-5 text-ui-md",
  lg: "h-[52px] px-7 text-step-0",
};

const TEXT_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "min-h-9 text-ui-sm",
  md: "min-h-11 text-ui-md",
  lg: "min-h-[52px] text-step-0",
};

function resolveKind(variant: Variant, color?: ButtonProps["color"]): Kind {
  if (color === "danger") {
    return variant === "flat" || variant === "light" || variant === "ghost" || variant === "tertiary" || variant === "danger-soft"
      ? "danger-text"
      : "danger";
  }
  switch (variant) {
    case "secondary":
    case "outline":
    case "bordered":
      return "outline";
    case "tertiary":
    case "ghost":
    case "light":
    case "flat":
      return color === "primary" || color === "success" ? "paint" : "text";
    case "danger":
      return "danger";
    case "danger-soft":
      return "danger-text";
    default:
      return "paint";
  }
}

function kindClasses(kind: Kind, size: "sm" | "md" | "lg", disabled: boolean) {
  const bevel = size === "sm" ? "bevel-sm" : "bevel";
  if (kind === "paint" || kind === "danger") {
    if (disabled) return cn(bevel, "before:bg-surface-1 text-ink-subtle");
    if (kind === "danger") {
      return cn(bevel, "before:bg-danger text-on-danger hover-device:hover:brightness-[0.92] active:translate-y-px");
    }
    return cn(
      bevel,
      "before:bg-brand text-on-brand",
      "after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-[6px] after:h-[2px] after:bg-shelf after:opacity-0 after:transition-opacity after:duration-[160ms]",
      "hover-device:hover:before:bg-brand-hover hover-device:hover:-translate-y-px hover-device:hover:after:opacity-100",
      "active:translate-y-0 active:after:opacity-0",
    );
  }
  if (kind === "outline") {
    if (disabled) return cn("bevel-outline", size === "sm" && "bevel-sm", "before:bg-line text-ink-subtle");
    return cn(
      "bevel-outline",
      size === "sm" && "bevel-sm",
      "before:bg-brand text-brand",
      "hover-device:hover:after:bg-brand-soft active:after:bg-brand-soft active:translate-y-px",
    );
  }
  if (kind === "danger-text") {
    if (disabled) return "text-ink-subtle";
    return "text-danger underline decoration-1 underline-offset-4 hover-device:hover:decoration-2";
  }
  if (disabled) return "text-ink-subtle";
  return "text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2 active:decoration-brand";
}

export function ButtonLoader({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0 flex items-center justify-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 border border-current [animation:shelf-loader_480ms_steps(1,end)_infinite] motion-reduce:animate-none"
          style={{ animationDelay: `${i * 160}ms`, ["--color-accent" as string]: "currentColor" }}
        />
      ))}
    </span>
  );
}

export function buttonClasses({
  variant = "primary",
  color,
  size = "md",
  isIconOnly = false,
  fullWidth = false,
  disabled = false,
  className,
}: {
  variant?: Variant;
  color?: ButtonProps["color"];
  size?: "sm" | "md" | "lg";
  isIconOnly?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const kind = resolveKind(variant, color);
  if (isIconOnly) {
    return cn(
      "relative inline-flex shrink-0 items-center justify-center size-10 touch-device:size-11 transition-colors duration-[160ms]",
      disabled
        ? "text-ink-subtle cursor-not-allowed"
        : cn(kind === "danger" || kind === "danger-text" ? "text-danger" : "text-ink", "cursor-pointer hover-device:hover:bg-brand-soft active:bg-brand-soft"),
      className,
    );
  }
  const isText = kind === "text" || kind === "danger-text";
  return cn(
    "relative inline-flex items-center justify-center gap-2 font-sans font-semibold leading-none tracking-[0.01em] whitespace-nowrap select-none",
    "transition-[transform,color,filter,text-decoration-thickness] duration-[160ms] ease-[var(--ease-std)]",
    "focus-visible:outline-offset-[3px]",
    isText ? TEXT_SIZE[size] : SIZE[size],
    kindClasses(kind, size, disabled),
    disabled ? "cursor-not-allowed" : "cursor-pointer",
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant = "primary",
  color,
  size = "md",
  isLoading = false,
  isDisabled = false,
  isIconOnly = false,
  fullWidth = false,
  startContent,
  endContent,
  as,
  href,
  target,
  download,
  onPress,
  children,
  className,
  onClick,
  onMouseDown,
  disabled,
  ...rest
}: ButtonProps) {
  const inert = isDisabled || Boolean(disabled);
  const blocked = inert || isLoading;
  const classes = buttonClasses({ variant, color, size, isIconOnly, fullWidth, disabled: inert, className });

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (blocked) {
      e.preventDefault();
      return;
    }
    (onClick as ((event: React.MouseEvent<HTMLElement>) => void) | undefined)?.(e);
    onPress?.();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    (onMouseDown as ((event: React.MouseEvent<HTMLButtonElement>) => void) | undefined)?.(e);
    const active = document.activeElement;
    if (!e.defaultPrevented && active instanceof HTMLElement && active.matches("input, textarea, select")) e.preventDefault();
  };

  const content = isIconOnly ? (
    <>
      {startContent}
      {children}
      {endContent}
    </>
  ) : (
    <>
      <span className={cn("inline-flex items-center gap-2 [&_svg]:size-[18px]", isLoading && "invisible")}>
        {startContent}
        {children}
        {endContent}
      </span>
      {isLoading ? <ButtonLoader /> : null}
    </>
  );

  if (as || href) {
    const Component = (as || "a") as React.ElementType;
    return (
      <Component
        href={href}
        target={target}
        download={download}
        className={classes}
        onClick={handleClick}
        aria-disabled={inert || undefined}
        aria-busy={isLoading || undefined}
        {...rest}
      >
        {content}
      </Component>
    );
  }

  return (
    <button
      type={(rest.type as "button" | "submit" | "reset" | undefined) || "button"}
      className={classes}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      disabled={inert}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}
