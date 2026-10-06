import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { getHomeData } from "@/components/home/data";
import { HomeHero } from "@/components/home/HomeHero";
import { WeaponTypeIndex } from "@/components/home/WeaponTypeIndex";
import { ProductRow } from "@/components/home/ProductRow";
import { RarityRail } from "@/components/home/RarityRail";
import { DeliverySteps } from "@/components/home/DeliverySteps";
import { BRAND } from "@/lib/brand";
import { pageMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import { POLICY_FACTS } from "@/lib/policy-facts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  const title = t("metaTitle", { brand: BRAND.name });
  const description = t("metaDescription", { brand: BRAND.name, method: POLICY_FACTS.deliveryMethod });
  return pageMetadata({ title, description, path: "/", absoluteTitle: true });
}

export default async function HomePage() {
  const data = await getHomeData();
  const t = await getTranslations("home");

  return (
    <div data-landing="home">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <HomeHero totalProducts={data.totalProducts} typeCount={data.types.length} />
      <WeaponTypeIndex types={data.types} />
      <ProductRow id="featured" title={t("featured.title")} lead={t("featured.lead")} products={data.featured} link={{ href: "/catalog?sort=rarity-desc", label: t("featured.link") }} />
      <RarityRail rarities={data.rarities} />
      <ProductRow id="newest" title={t("newest.title")} products={data.newest} link={{ href: "/catalog?sort=newest", label: t("newest.link") }} />
      <DeliverySteps />
    </div>
  );
}
