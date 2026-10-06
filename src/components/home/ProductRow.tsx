import { ShelfGrid, ShelfTile, type ShelfProduct } from "@/components/product/ShelfTile/ShelfTile";
import { SectionLink } from "./SectionLink";

export function ProductRow({ id, title, lead, products, link }: { id: string; title: string; lead?: string; products: ShelfProduct[]; link?: { href: string; label: string } }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={`${id}-title`} data-section={id} className="mx-auto max-w-container px-gutter py-16">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex flex-col gap-2">
          <h2 id={`${id}-title`} className="m-0 text-step-3 leading-[1.12] text-ink">
            {title}
          </h2>
          {lead ? <p className="measure m-0 text-ui-md text-ink-muted">{lead}</p> : null}
        </div>
        {link ? <SectionLink href={link.href}>{link.label}</SectionLink> : null}
      </div>
      <ShelfGrid className="mt-10">
        {products.map((product) => (
          <ShelfTile key={product.id} product={product} headingLevel={3} />
        ))}
      </ShelfGrid>
    </section>
  );
}
