import { getTranslations } from "next-intl/server";
import { SectionLink } from "./Furniture";

const NOTES = [
  { key: "castIron", href: "/search?q=cast%20iron" },
  { key: "enamel", href: "/search?q=enamel" },
  { key: "nonStick", href: "/search?q=non-stick" },
  { key: "glass", href: "/catalog/glassware-drinkware" },
] as const;

export async function CareCupboard() {
  const t = await getTranslations("home.care");

  return (
    <section aria-labelledby="care-title" className="py-16">
      <div className="mx-auto grid max-w-container gap-x-6 gap-y-8 px-gutter lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="care-title" className="m-0 text-step-3 leading-[1.12] tracking-[-0.005em]">
            {t("title")}
          </h2>
          <p className="m-0 mt-3 max-w-[34ch] text-step-1 leading-[1.5] text-ink-muted">{t("lead")}</p>
        </div>
        <ul className="m-0 list-none border-t border-line p-0 lg:col-span-8 lg:col-start-5 lg:grid lg:grid-cols-2 lg:gap-x-10">
          {NOTES.map((note) => (
            <li key={note.key} className="border-b border-line py-6 lg:[&:nth-child(-n+2)]:pt-6">
              <h3 className="m-0 text-step-2 leading-[1.2] tracking-normal">{t(`${note.key}.title`)}</h3>
              <p className="m-0 mt-2 measure text-step-0 leading-[1.6] text-ink-muted">{t(`${note.key}.body`)}</p>
              <SectionLink href={note.href} className="mt-2">
                {t(`${note.key}.link`)}
              </SectionLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
