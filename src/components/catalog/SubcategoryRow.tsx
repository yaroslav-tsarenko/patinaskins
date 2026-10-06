import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface SubcategoryLink {
  slug: string;
  label: string;
  count: number;
  href: string;
  active: boolean;
}

export function SubcategoryRow({ label, links }: { label: string; links: SubcategoryLink[] }) {
  if (links.length < 2) return null;
  return (
    <nav aria-label={label} className="-mx-gutter mb-4 border-y lg:mb-10 border-line lg:mx-0">
      <ul className="no-scrollbar m-0 flex list-none gap-6 overflow-x-auto px-gutter py-0 lg:flex-wrap lg:gap-y-0 lg:overflow-visible lg:px-0">
        {links.map((link) => (
          <li key={link.slug} className="shrink-0">
            <Link
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-12 items-center gap-2 whitespace-nowrap text-ui-sm",
                link.active ? "font-semibold text-ink" : "text-ink-muted hover-device:hover:text-ink",
              )}
            >
              {link.label}
              <span className="tabular meta text-ink-subtle">{link.count}</span>
              {link.active ? <span aria-hidden="true" className="shelf-rule-solid absolute inset-x-0 bottom-2" /> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
