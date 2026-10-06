import { getTranslations } from "next-intl/server";
import { LinkButton } from "./LinkButton";
import { STORE_POLICY } from "@/config/store-policy";

export async function HomeHero({ totalProducts, typeCount }: { totalProducts: number; typeCount: number }) {
  const t = await getTranslations("home.hero");
  return (
    <section aria-labelledby="hero-title" data-section="hero" className="border-b border-line bg-surface-1">
      <div className="mx-auto grid max-w-container gap-8 px-gutter py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:py-24">
        <div className="flex flex-col gap-5">
          <h1 id="hero-title" className="m-0 text-step-5 leading-[1.04] text-ink">
            {t("title")}
          </h1>
          <p className="measure m-0 text-step-1 leading-[1.5] text-ink-muted">{t("lead", { game: STORE_POLICY.delivery.game })}</p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/catalog" size="lg">
              {t("browse")}
            </LinkButton>
            <LinkButton href="/catalog/knives" size="lg" variant="outline">
              {t("knives")}
            </LinkButton>
          </div>
        </div>
        <dl data-hero-facts="" className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div>
            <dt className="eyebrow text-ink-muted">{t("factItems")}</dt>
            <dd className="tabular m-0 text-step-2 text-ink">{totalProducts}</dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-muted">{t("factTypes")}</dt>
            <dd className="tabular m-0 text-step-2 text-ink">{typeCount}</dd>
          </div>
          <div className="col-span-2">
            <dt className="eyebrow text-ink-muted">{t("factDelivery")}</dt>
            <dd className="m-0 text-ui-md text-ink">{t("deliveryValue", { method: STORE_POLICY.delivery.method, usual: STORE_POLICY.delivery.usualTime })}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
