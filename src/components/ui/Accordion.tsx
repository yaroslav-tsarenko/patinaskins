"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AccordionItemProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  headingLevel?: 2 | 3 | 4;
  tone?: "default" | "paint";
  aside?: ReactNode;
  titleClassName?: string;
  panelClassName?: string;
  className?: string;
  id?: string;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  headingLevel = 3,
  tone = "default",
  aside,
  titleClassName,
  panelClassName,
  className,
  id,
}: AccordionItemProps) {
  const autoId = useId();
  const baseId = id || autoId;
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const onPaint = tone === "paint";

  const toggle = () => {
    const next = !open;
    if (controlledOpen === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div data-drawer="" data-open={open || undefined} className={cn("relative border-b", onPaint ? "border-on-paint-line" : "border-line", className)}>
      <Heading className="m-0 font-sans text-[length:inherit] tracking-normal">
        <button
          type="button"
          id={`${baseId}-trigger`}
          aria-expanded={open}
          aria-controls={`${baseId}-panel`}
          onClick={toggle}
          className={cn(
            "flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 py-3 text-left font-sans text-step-1 font-medium leading-[1.3]",
            onPaint ? "text-on-paint" : "text-ink",
            titleClassName,
          )}
        >
          <span className="min-w-0 flex-1">{title}</span>
          {aside ? <span className="shrink-0">{aside}</span> : null}
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={cn("shrink-0 transition-transform duration-[260ms] ease-[var(--ease-furniture)]", open && "rotate-180")}
          />
        </button>
      </Heading>
      <div
        id={`${baseId}-panel`}
        role="region"
        aria-labelledby={`${baseId}-trigger`}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-[260ms] ease-[var(--ease-furniture)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={cn(onPaint ? "pb-5" : "bg-raised p-5", panelClassName)}>{children}</div>
          {!onPaint ? <span aria-hidden="true" className="shelf-rule" /> : null}
        </div>
      </div>
    </div>
  );
}

export function Accordion({ children, className, tone = "default" }: { children: ReactNode; className?: string; tone?: "default" | "paint" }) {
  return <div className={cn("border-t", tone === "paint" ? "border-on-paint-line" : "border-line", className)}>{children}</div>;
}
