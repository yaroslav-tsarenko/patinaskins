import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Cubby } from "@/components/product/ShelfTile/ShelfTile";
import { Plate } from "@/components/ui/Plate";
import { navCategory } from "@/config/navigation";
import { BRAND } from "@/lib/brand";
import { POLICY_FACTS } from "@/lib/policy-facts";
import { cn } from "@/lib/utils/cn";
import { Hinges, Knob } from "./Furniture";
import { LinkButton } from "./LinkButton";
import type { HomeHero, HomeProduct } from "./types";

function HeroPackshot({ product, priority, className }: { product: HomeProduct; priority?: boolean; className?: string }) {
  return (
    <Link href={`/product/${product.slug}`} data-hero-item="" className={cn("group relative block min-w-0 flex-1 outline-offset-[-2px]", className)}>
      <Cubby
        src={product.images[0]?.url}
        alt=""
        shelf={false}
        lift
        priority={priority}
        sizes="(min-width: 1024px) 180px, 33vw"
      />
      <span className="sr-only">{product.name}</span>
    </Link>
  );
}

function Door({ side, label }: { side: "left" | "right"; label: string }) {
  const left = side === "left";
  return (
    <div
      aria-hidden="true"
      data-door={side}
      data-depth="4"
      className={cn(
        "pointer-events-none absolute inset-y-0 z-[3] w-1/2 [transform-style:preserve-3d]",
        "[transform:rotateY(var(--door-angle))] transition-transform duration-[var(--dur-ui)] ease-[var(--ease-furniture)]",
        left ? "left-0 origin-left [--door-angle:calc(var(--door-open)*-1)]" : "right-0 origin-right [--door-angle:var(--door-open)]",
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center border-[1.5px] border-shelf bg-raised pt-[14%] [backface-visibility:hidden]">
        <span className="absolute inset-3 border border-shelf-hairline sm:inset-4" />
        <Plate size="sm" className="relative">{label}</Plate>
        <Knob className={cn("absolute top-1/2", left ? "right-3" : "left-3")} />
        <Hinges side={side} />
      </div>
      <div className="absolute inset-0 border-[1.5px] border-shelf bg-surface-1 [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <span className="absolute inset-3 border border-shelf-hairline sm:inset-4" />
      </div>
    </div>
  );
}

export async function DresserHero({ hero }: { hero: HomeHero }) {
  const t = await getTranslations("home.hero");
  const [firstShelf, secondShelf] = hero.shelves;
  let priorityLeft = 2;
  const takePriority = () => {
    if (priorityLeft <= 0) return false;
    priorityLeft -= 1;
    return true;
  };

  return (
    <section
      aria-labelledby="home-hero-title"
      data-scene="dresser"
      className="relative overflow-x-clip bg-surface lg:min-h-[calc(100svh-var(--header-height)-var(--utility-height))]"
    >
      <span aria-hidden="true" data-depth="0" className="absolute inset-0 bg-surface" />
      <div data-scene-stage="" className="relative mx-auto grid max-w-container grid-cols-1 gap-x-6 lg:grid-rows-[auto_1fr] px-gutter pt-6 lg:grid-cols-12 lg:pt-10">
        <div data-dresser="" className="@container/dresser relative [--door-open:105deg] lg:col-span-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:grid lg:grid-rows-subgrid">
          <div data-depth="3" data-cornice="" className="relative -mx-2 bg-paint px-4 pb-3 pt-4 text-on-paint sm:-mx-3 sm:px-6 lg:px-7 lg:pb-4 lg:pt-6">
            <p aria-hidden="true" className="m-0 whitespace-nowrap font-display text-[calc((100cqw-2rem)/4.6)] leading-[0.9] tracking-[-0.015em]">
              {BRAND.name}
            </p>
            <span aria-hidden="true" className="absolute inset-x-0 bottom-1.5 h-px bg-on-paint-line" />
          </div>

          <div>
          <div data-depth="3" data-carcass="" className="relative border-x-[1.5px] border-shelf">
            {[firstShelf, secondShelf].map((shelf, index) =>
              shelf ? (
                <div key={shelf.category.slug} className={cn(index > 0 && "hidden sm:block")}>
                  <ul aria-label={t("shelfLabel", { category: shelf.category.name })} data-depth="1" data-hero-shelf={shelf.category.slug} className="m-0 flex list-none items-end justify-evenly bg-stage p-0 px-[2%] pt-3">
                    {shelf.products.map((product, i) => (
                      <li key={product.id} data-glaze={index === 0 ? "" : undefined} className={cn("w-[30%] min-w-0 sm:w-[17%]", i >= 3 && "hidden sm:block")}>
                        <HeroPackshot product={product} priority={takePriority()} />
                      </li>
                    ))}
                  </ul>
                  <span aria-hidden="true" data-shelf="" className="shelf-rule" />
                  <span aria-hidden="true" className="block h-3 bg-surface-1" />
                </div>
              ) : null,
            )}

            {hero.cupboards.length > 0 ? (
              <div data-cupboard="" className="relative grid grid-cols-[1fr_3.2fr_1fr] border-t-[1.5px] border-shelf">
                <span aria-hidden="true" className="border-r-[1.5px] border-shelf bg-surface-1" />
                <div data-cupboard-view="" className="relative [perspective:1400px]">
                  <div data-depth="1" className="grid grid-cols-2 bg-surface-2">
                    {hero.cupboards.map((cupboard, ci) => (
                      <div key={cupboard.category.slug} className={cn("flex flex-col justify-end px-[6%] pt-2", ci > 0 && "border-l-[1.5px] border-shelf")}>
                        <Link href={`/catalog/${cupboard.category.slug}`} className="eyebrow mb-2 inline-flex min-h-6 items-center self-start text-ink-muted hover-device:hover:text-ink">
                          {cupboard.category.name}
                        </Link>
                        <ul aria-label={t("cupboardLabel", { category: cupboard.category.name })} className="m-0 flex list-none items-end gap-2 p-0">
                          {cupboard.products.map((product, pi) => (
                            <li key={product.id} data-settle="" style={{ "--i": ci * cupboard.products.length + pi } as CSSProperties} className={cn("min-w-0 flex-1 basis-0", pi > 0 && "hidden sm:block")}>
                              <HeroPackshot product={product} />
                            </li>
                          ))}
                        </ul>
                        <span aria-hidden="true" className="shelf-rule -mx-[6.5%]" />
                        <span aria-hidden="true" className="block h-3" />
                      </div>
                    ))}
                  </div>
                  <span aria-hidden="true" data-door-light="" className="pointer-events-none absolute inset-y-0 left-1/2 z-[2] w-[16%] -translate-x-1/2 bg-stage opacity-0" />
                  {hero.cupboards.map((cupboard, ci) => (
                    <Door key={cupboard.category.slug} side={ci === 0 ? "left" : "right"} label={cupboard.category.name} />
                  ))}
                </div>
                <span aria-hidden="true" className="border-l-[1.5px] border-shelf bg-surface-1" />
              </div>
            ) : null}

            {hero.drawers.length > 0 ? (
              <nav aria-label={t("drawersLabel")} data-hero-drawers="" className="hidden border-t-[1.5px] border-shelf sm:block">
                <ul className="m-0 grid list-none p-0" style={{ gridTemplateColumns: `repeat(${hero.drawers.length}, minmax(0, 1fr))` }}>
                  {hero.drawers.map((drawer, i) => (
                    <li key={drawer.slug} className={cn(i > 0 && "border-l-[1.5px] border-shelf")}>
                      <Link
                        href={`/catalog/${drawer.slug}`}
                        data-depth="4"
                        data-hero-drawer={drawer.slug}
                        className="group flex h-16 flex-col items-center justify-center gap-2 bg-raised outline-offset-[-3px] hover-device:hover:bg-brand-soft"
                      >
                        <Knob />
                        <span className="eyebrow text-ink-muted group-hover:text-ink">{navCategory(drawer.slug)?.short ?? drawer.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
          <span aria-hidden="true" data-depth="3" className="block h-[2px] bg-shelf" />
          <span aria-hidden="true" data-depth="3" className="mx-3 block h-3 bg-paint" />
          </div>
        </div>

        <div data-layer="L0" className="relative pb-4 pt-8 lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:pb-10 lg:pl-10 lg:pt-5">
          <h1 id="home-hero-title" className="m-0 text-step-4 leading-[1.06]">
            {t("title")}
          </h1>
          <p className="mt-4 text-step-1 leading-[1.5] text-ink-muted measure">{t("lead")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <LinkButton href="#shop-drawers" size="lg" data-action="open-cupboards">
              {t("open")}
            </LinkButton>
            <LinkButton href="/catalog" variant="ghost" size="lg">
              {t("browse")}
            </LinkButton>
          </div>
          <p className="meta mt-8 max-w-[34ch] border-t border-line pt-4 text-ink-muted">
            {t("shipsFrom", { dispatchFrom: POLICY_FACTS.dispatchFrom, countries: POLICY_FACTS.deliveryCountries })}
          </p>
        </div>
      </div>
    </section>
  );
}
