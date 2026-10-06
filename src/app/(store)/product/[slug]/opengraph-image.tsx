import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { STORE_POLICY } from "@/config/store-policy";
import { defaultLocale } from "@/i18n/config";
import { formatPrice } from "@/lib/utils/format-price";
import { OG_PALETTE as P, OG_SIZE, ogImageSource } from "@/lib/og/assets";
import { BrassPlate, Packshot, Shelf, Wordmark, ogResponse, titleSize } from "@/lib/og/parts";
import { stripSupplierMentions } from "@/lib/utils/supplier";

export const revalidate = 3600;

type SlugParams = { slug: string } | Promise<{ slug: string }>;

const loadProduct = cache(async (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      status: true,
      price: true,
      comparePrice: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      categories: { select: { category: { select: { name: true, parentId: true, isActive: true } } } },
    },
  }),
);

export async function generateImageMetadata({ params }: { params: SlugParams }) {
  const { slug } = await params;
  const product = slug ? await loadProduct(slug) : null;
  const t = await getTranslations({ locale: defaultLocale, namespace: "seo" });
  const name = product?.status === "ACTIVE" ? stripSupplierMentions(product.name) : BRAND.tagline;
  return [{ id: "card", size: OG_SIZE, contentType: "image/png", alt: t("ogProductAlt", { name, brand: BRAND.name }) }];
}

export default async function Image({ params }: { params: SlugParams }) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  const active = product?.status === "ACTIVE";
  const name = active ? stripSupplierMentions(product.name) : BRAND.tagline;
  const price = active ? Number(product.price) : null;
  const compare = active && product.comparePrice != null && Number(product.comparePrice) > Number(product.price) ? Number(product.comparePrice) : null;
  const linked = active ? product.categories.map((c) => c.category).filter((c) => c.isActive) : [];
  const category = (linked.find((c) => c.parentId) ?? linked[0])?.name ?? null;
  const src = active ? await ogImageSource(product.images[0]?.url, 900) : null;
  const nameSize = titleSize(name, [[28, 64], [48, 56], [72, 48], [110, 42]]);

  return ogResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: P.chalk }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", width: 620, height: "100%", padding: "0 56px 92px", background: P.stage }}>
        <Packshot src={src} size={440} background={P.stage} />
        <div style={{ display: "flex", marginTop: 6 }}>
          <Shelf color={P.shelf} hairline={P.shelfHairline} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, height: "100%", padding: "64px 64px 60px", background: P.paint, color: P.chalk }}>
        <Wordmark size={44} color={P.chalk} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {category ? (
            <div style={{ display: "flex", fontFamily: "Commissioner", fontWeight: 600, fontSize: 20, letterSpacing: 2.4, textTransform: "uppercase", color: P.onPaintMuted, marginBottom: 18 }}>
              {category}
            </div>
          ) : null}
          <div style={{ display: "block", fontFamily: "Gloock", fontSize: nameSize, lineHeight: 1.06, color: P.chalk, lineClamp: 4, overflow: "hidden", maxHeight: nameSize * 1.06 * 4 + 4 }}>{name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {price != null && price > 0 ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <BrassPlate fontSize={34}>{formatPrice(price, STORE_POLICY.currency)}</BrassPlate>
              {compare ? (
                <div style={{ display: "flex", marginLeft: 20, fontFamily: "Commissioner", fontSize: 28, color: P.onPaintMuted, textDecoration: "line-through" }}>
                  {formatPrice(compare, STORE_POLICY.currency)}
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          <div style={{ display: "flex", fontFamily: "Commissioner", fontSize: 22, color: P.onPaintMuted }}>{BRAND.domain}</div>
        </div>
      </div>
    </div>,
    3600,
  );
}
