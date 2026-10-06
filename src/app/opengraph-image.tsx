import { getTranslations } from "next-intl/server";
import { BRAND } from "@/lib/brand";
import { defaultLocale } from "@/i18n/config";
import { POLICY_FACTS } from "@/lib/policy-facts";
import { OG_PALETTE as P, OG_SIZE } from "@/lib/og/assets";
import { BrassPlate, Shelf, Wordmark, ogResponse } from "@/lib/og/parts";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${BRAND.name}: ${BRAND.tagline}`;

export default async function Image() {
  const t = await getTranslations({ locale: defaultLocale, namespace: "seo" });
  const facts = [t("ogFreeOver", { amount: POLICY_FACTS.freeThreshold }), t("ogReturns", { days: POLICY_FACTS.withdrawalDays })];

  return ogResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: P.paint, color: P.chalk, padding: "84px 88px 72px", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Wordmark size={168} color={P.chalk} />
        <div style={{ display: "flex", marginTop: 28 }}>
          <Shelf color={P.chalk} hairline={P.onPaintLine} width={760} />
        </div>
        <div style={{ display: "flex", marginTop: 34, fontFamily: "Commissioner", fontSize: 40, color: P.onPaintMuted, maxWidth: 820, lineHeight: 1.25 }}>
          {t("siteDescription")}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontFamily: "Commissioner", fontSize: 28, color: P.onPaintMuted }}>
          {facts.map((fact, i) => (
            <div key={fact} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 ? <div style={{ width: 1, height: 26, background: P.onPaintLine, margin: "0 22px" }} /> : null}
              {fact}
            </div>
          ))}
        </div>
        <BrassPlate fontSize={28}>{BRAND.domain}</BrassPlate>
      </div>
    </div>,
  );
}
