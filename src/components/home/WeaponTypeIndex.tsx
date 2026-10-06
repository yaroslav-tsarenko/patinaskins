import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import type { HomeWeaponType } from "./types";

const WEAPONS_SHOWN = 4;

export async function WeaponTypeIndex({ types }: { types: HomeWeaponType[] }) {
  if (types.length === 0) return null;
  const t = await getTranslations("home.types");
  return (
    <section aria-labelledby="types-title" data-section="weapon-types" className="mx-auto max-w-container px-gutter py-16">
      <h2 id="types-title" className="m-0 text-step-3 leading-[1.12] text-ink">
        {t("title")}
      </h2>
      <ul className="m-0 mt-8 grid list-none grid-cols-1 border-t border-line p-0 sm:grid-cols-2 lg:grid-cols-4">
        {types.map((type) => (
          <li key={type.key} data-weapon-type={type.key} className="flex flex-col gap-3 border-b border-line py-5 sm:pr-6">
            <Link href={`/catalog/${type.key}`} className="group flex items-baseline justify-between gap-3 text-ink">
              <span className="text-step-1 font-semibold underline-offset-4 group-hover:underline">{type.name}</span>
              <span className="tabular meta text-ink-muted">{t("count", { count: type.count })}</span>
            </Link>
            {type.minPrice !== null ? (
              <p className="meta m-0 flex items-baseline gap-1.5 text-ink-muted">
                {t("from")} <PriceDisplay price={type.minPrice} size="sm" />
              </p>
            ) : null}
            <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
              {type.weapons.slice(0, WEAPONS_SHOWN).map((weapon) => (
                <li key={weapon.slug}>
                  <Link href={`/catalog/${weapon.slug}`} className="text-ui-sm text-ink-muted underline decoration-1 underline-offset-4 hover-device:hover:text-ink">
                    {weapon.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
