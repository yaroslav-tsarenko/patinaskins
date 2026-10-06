import Link from "next/link";

export interface ChestDrawer {
  slug: string;
  name: string;
  countLabel: string;
}

export function CategoryChest({ label, drawers }: { label: string; drawers: ChestDrawer[] }) {
  if (drawers.length === 0) return null;
  return (
    <nav aria-label={label} data-chest="" className="mb-14">
      <ul className="m-0 grid list-none grid-cols-2 gap-px border border-line bg-line p-0 lg:grid-cols-5">
        {drawers.map((drawer) => (
          <li key={drawer.slug} className="flex">
            <Link
              href={`/catalog/${drawer.slug}`}
              data-drawer={drawer.slug}
              className="group flex min-h-[72px] w-full items-center justify-between gap-3 bg-raised px-4 py-3 transition-colors duration-[160ms] hover-device:hover:bg-brand-soft"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-ui-sm font-semibold leading-[1.3] text-ink group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{drawer.name}</span>
                <span className="tabular meta text-ink-muted">{drawer.countLabel}</span>
              </span>
              <span aria-hidden="true" className="bevel-xs relative size-2.5 shrink-0 before:bg-shelf" />
            </Link>
          </li>
        ))}
      </ul>
      <span aria-hidden="true" className="shelf-rule" />
    </nav>
  );
}
