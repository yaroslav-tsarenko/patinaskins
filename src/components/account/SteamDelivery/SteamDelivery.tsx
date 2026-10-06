"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SkeletonBar } from "@/components/ui/ShelfLoader";
import { STORE_POLICY } from "@/config/store-policy";
import { cn } from "@/lib/utils/cn";

export interface SteamState {
  steamId64: string;
  personaName: string | null;
  avatar: string | null;
  profileUrl: string | null;
  tradeUrl: string | null;
  tradeUrlVerified: boolean;
  tradeUrlUpdatedAt: string | null;
}

const STEAM_TRADE_URL_PAGE = "https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url";

export function useSteamAccount(enabled = true) {
  const [steam, setSteam] = useState<SteamState | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch("/api/account/steam", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { steam: SteamState | null };
        if (!cancelled) {
          setSteam(data.steam);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  const reload = useCallback(() => {
    setLoading(true);
    setTick((n) => n + 1);
  }, []);

  return { steam, setSteam, loading, failed, reload };
}

export interface SteamDeliveryProps {
  nextPath: string;
  steam: SteamState | null;
  loading: boolean;
  failed?: boolean;
  onSaved: (steam: SteamState) => void;
  onRetry?: () => void;
  headingLevel?: 2 | 3;
  className?: string;
}

export function SteamDelivery({ nextPath, steam, loading, failed, onSaved, onRetry, headingLevel = 2, className }: SteamDeliveryProps) {
  const t = useTranslations("account.steam");
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkHref = `/api/auth/steam?link=1&next=${encodeURIComponent(nextPath)}`;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/steam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeUrl: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.code === "TRADE_URL_OTHER_ACCOUNT" ? t("errors.otherAccount") : data.code === "TRADE_URL_INVALID" ? t("errors.invalid") : t("errors.generic"));
        return;
      }
      onSaved(data.steam as SteamState);
      setEditing(false);
      setDraft("");
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-3", className)} aria-busy="true">
        <SkeletonBar className="w-1/2" />
        <SkeletonBar className="w-3/4" />
      </div>
    );
  }

  if (failed) {
    return (
      <Alert tone="danger" title={t("errors.loadTitle")} className={className} action={onRetry ? <Button size="sm" variant="outline" onPress={onRetry}>{t("retry")}</Button> : undefined}>
        {t("errors.load")}
      </Alert>
    );
  }

  const showForm = Boolean(steam) && (editing || !steam?.tradeUrlVerified);

  return (
    <div data-steam-delivery="" className={cn("flex flex-col gap-6", className)}>
      <section className="flex flex-col gap-3">
        <Heading className="m-0 text-step-1 font-semibold text-ink">{t("accountTitle")}</Heading>
        {steam ? (
          <div className="flex items-center gap-3">
            {steam.avatar ? <Image src={steam.avatar} alt="" width={40} height={40} className="size-10 shrink-0 bg-surface-2" /> : null}
            <div className="min-w-0">
              <p className="m-0 text-ui-md font-medium text-ink">{steam.personaName ?? t("unnamed")}</p>
              <p className="meta tabular m-0 text-ink-muted">{t("steamId", { id: steam.steamId64 })}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="m-0 text-ui-md text-ink-muted">{t("linkLead")}</p>
            <Button as="a" href={linkHref}>
              {t("link")}
            </Button>
            <p className="meta m-0 text-ink-muted">{t("linkNote")}</p>
          </div>
        )}
      </section>

      {steam ? (
        <section className="flex flex-col gap-3 border-t border-line pt-5">
          <Heading className="m-0 text-step-1 font-semibold text-ink">{t("tradeTitle")}</Heading>
          {steam.tradeUrlVerified && !editing ? (
            <div className="flex flex-col gap-2">
              <p className="m-0 flex items-center gap-2 text-ui-md text-ink">
                <CheckCircle2 size={18} aria-hidden="true" className="text-success" />
                {t("tradeSaved")}
              </p>
              <p className="meta m-0 break-all text-ink-muted">{steam.tradeUrl}</p>
              <div>
                <Button size="sm" variant="outline" onPress={() => setEditing(true)}>
                  {t("tradeChange")}
                </Button>
              </div>
            </div>
          ) : null}
          {showForm ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) save();
              }}
            >
              <Input
                id="steam-trade-url"
                label={t("tradeLabel")}
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…&token=…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                error={error ?? undefined}
                hint={t.rich("tradeHint", {
                  link: (chunks) => (
                    <a href={STEAM_TRADE_URL_PAGE} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                      {chunks}
                    </a>
                  ),
                })}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" isLoading={saving} isDisabled={!draft.trim()}>
                  {t("tradeSave")}
                </Button>
                {editing ? (
                  <Button variant="ghost" onPress={() => { setEditing(false); setError(null); }}>
                    {t("cancel")}
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-2 border-t border-line pt-5">
        <Heading className="m-0 text-ui-md font-semibold text-ink">{t("requirementsTitle")}</Heading>
        <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-ui-sm text-ink-muted">
          {STORE_POLICY.delivery.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
