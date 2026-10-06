import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SectionLink({ href, children, tone = "default", className }: { href: string; children: ReactNode; tone?: "default" | "on-paint"; className?: string }) {
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
