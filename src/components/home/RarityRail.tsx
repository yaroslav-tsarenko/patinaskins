import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { HomeRarity } from "./types";

export async function RarityRail({ rarities }: { rarities: HomeRarity[] }) {
  if (rarities.length === 0) return null;
  const t = await getTranslations("home.rarity");
  return (
    <section aria-labelledby="rarity-title" data-section="rarity-rail" className="border-y border-line bg-surface-1">
      <div className="mx-auto max-w-container px-gutter py-12">
        <h2 id="rarity-title" className="m-0 text-step-2 leading-[1.15] text-ink">
          {t("title")}
        </h2>
        <ul className="m-0 mt-6 flex list-none gap-2 overflow-x-auto p-0 pb-2">
          {rarities.map((rarity) => (
            <li key={rarity.key} className="shrink-0">
              <Link
                href={`/catalog?rarity=${rarity.key}`}
                data-rarity={rarity.key}
                className="flex min-h-11 items-center gap-2 border border-line bg-raised px-3 text-ui-sm text-ink hover-device:hover:border-ink-muted"
              >
                <span aria-hidden="true" className="inline-block size-2.5" style={{ background: rarity.color }} />
                <span>{rarity.label}</span>
                <span className="tabular meta text-ink-muted">{rarity.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
