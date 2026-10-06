"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { SteamDelivery, useSteamAccount } from "@/components/account/SteamDelivery/SteamDelivery";

export function SteamAccountView() {
  const t = useTranslations("account.steam");
  const params = useSearchParams();
  const flag = params.get("steam");
  const { steam, setSteam, loading, failed, reload } = useSteamAccount();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 text-step-4 leading-[1.05] text-ink">{t("title")}</h1>
        <p className="measure m-0 text-ui-md text-ink-muted">{t("lead")}</p>
      </header>
      {flag === "linked" ? <Alert tone="success">{t("flags.linked")}</Alert> : null}
      {flag === "taken" ? <Alert tone="danger">{t("flags.taken")}</Alert> : null}
      {flag === "other" ? <Alert tone="danger">{t("flags.other")}</Alert> : null}
      <SteamDelivery nextPath="/account/steam" steam={steam} loading={loading} failed={failed} onSaved={setSteam} onRetry={reload} />
    </div>
  );
}
