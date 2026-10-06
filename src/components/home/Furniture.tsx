import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Knob({ className }: { className?: string }) {
  return <span aria-hidden="true" data-knob="" className={cn("bevel-xs block size-2.5 shrink-0 before:bg-shelf", className)} />;
}

export function Hinges({ side, className }: { side: "left" | "right"; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-y-0 flex flex-col justify-between py-[18%]", side === "left" ? "left-0" : "right-0", className)}>
      <span className="block h-px w-2 bg-shelf" />
      <span className="block h-px w-2 bg-shelf" />
    </span>
  );
}

export function SectionLink({ href, children, tone = "default", className }: { href: string; children: React.ReactNode; tone?: "default" | "on-paint"; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 text-ui-md font-semibold underline decoration-1 underline-offset-4 hover-device:hover:decoration-2",
        tone === "on-paint" ? "text-brass-on-paint" : "text-ink",
        className,
      )}
    >
      {children}
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
}
