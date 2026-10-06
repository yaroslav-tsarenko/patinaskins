"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Choice";
import { cn } from "@/lib/utils/cn";
import { COOKIE_CATEGORIES, COOKIE_TABLE, type CookieCategory } from "@/config/cookies";
import { onOpenCookieSettings, useConsent, writeConsent } from "@/lib/consent";

const bannerButton = cn(
  "bevel-outline bevel-sm inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center px-4 text-ui-sm font-semibold text-on-paint sm:flex-none sm:px-5",
  "before:bg-on-paint hover-device:hover:after:bg-on-paint-line active:translate-y-px",
);

function CookieList({ category }: { category: CookieCategory }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rows = COOKIE_TABLE[category];
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4 hover-device:hover:decoration-2"
      >
        {open ? "Hide cookies" : "Show cookies"}
        <ChevronDown size={16} aria-hidden="true" className={cn("transition-transform duration-[260ms]", open && "rotate-180")} />
      </button>
      <div id={`${id}-list`} inert={!open} className={cn("grid transition-[grid-template-rows] duration-[260ms] ease-[var(--ease-furniture)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="min-h-0 overflow-hidden">
          {rows.length === 0 ? (
            <p className="meta pt-2 text-ink-muted">None in use. We will list them here before any are added.</p>
          ) : (
            <div className="pt-2">
              <table className="w-full table-fixed border-collapse text-left text-ui-xs">
                <thead>
                  <tr className="border-b border-line text-ink-muted">
                    <th scope="col" className="w-[32%] py-2 pr-3 font-medium">Name</th>
                    <th scope="col" className="w-[18%] py-2 pr-3 font-medium max-sm:hidden">Provider</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Purpose</th>
                    <th scope="col" className="w-[20%] py-2 font-medium">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.name} className="border-b border-line align-top">
                      <td className="py-2 pr-3 font-mono text-ink [overflow-wrap:anywhere]">
                        {row.name}
                        <span className="block font-sans text-ink-muted">{row.kind}</span>
                      </td>
                      <td className="py-2 pr-3 text-ink max-sm:hidden">{row.provider}</td>
                      <td className="py-2 pr-3 text-ink">{row.purpose}</td>
                      <td className="py-2 text-ink">{row.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CookieConsent() {
  const { consent, ready } = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });

  useEffect(
    () =>
      onOpenCookieSettings(() => {
        const current = consent ?? { analytics: false, marketing: false };
        setDraft({ analytics: current.analytics, marketing: current.marketing });
        setSettingsOpen(true);
      }),
    [consent],
  );

  const openSettings = () => {
    setDraft({ analytics: consent?.analytics ?? false, marketing: consent?.marketing ?? false });
    setSettingsOpen(true);
  };

  const decide = (choice: { analytics: boolean; marketing: boolean }) => {
    writeConsent(choice);
    setSettingsOpen(false);
  };

  const showBanner = ready && !consent && !settingsOpen;

  return (
    <>
      {showBanner ? (
        <section
          role="region"
          aria-label="Cookie consent"
          data-print-hide=""
          className="on-paint fixed inset-x-0 bottom-[var(--sticky-bar-offset,0px)] z-90 bg-paint text-on-paint animate-rise-in"
        >
          <span aria-hidden="true" className="block h-[2px] bg-shelf" />
          <div className="mx-auto flex max-w-container flex-col gap-4 px-gutter py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <p className="max-w-[78ch] text-ui-sm leading-[1.5]">
              We use necessary cookies to run the store, and optional analytics and marketing cookies only if you allow them.{" "}
              <Link href="/policies/cookies" className="font-semibold text-brass-on-paint underline underline-offset-4">
                Cookie policy
              </Link>
            </p>
            <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:gap-3">
              <button type="button" className={bannerButton} onClick={() => decide({ analytics: true, marketing: true })}>
                Accept all
              </button>
              <button type="button" className={bannerButton} onClick={() => decide({ analytics: false, marketing: false })}>
                Reject all
              </button>
              <button type="button" className={bannerButton} onClick={openSettings}>
                Customise
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Cookie settings"
        description="Choose which optional cookies we may use. You can change this at any time from the footer."
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" onPress={() => decide({ analytics: false, marketing: false })}>
              Reject all
            </Button>
            <Button variant="outline" onPress={() => decide({ analytics: true, marketing: true })}>
              Accept all
            </Button>
            <Button variant="primary" onPress={() => decide(draft)}>
              Save choices
            </Button>
          </div>
        }
      >
        <div className="border-t border-line">
          {COOKIE_CATEGORIES.map((category) => {
            const locked = category.id === "necessary";
            const checked = locked ? true : draft[category.id as "analytics" | "marketing"];
            return (
              <div key={category.id} data-drawer="" className="border-b border-line py-5">
                <Switch
                  label={category.title}
                  description={category.purpose}
                  checked={checked}
                  disabled={locked}
                  lockedText={locked ? "Always on" : undefined}
                  onChange={(next) => setDraft((d) => ({ ...d, [category.id]: next }))}
                />
                <CookieList category={category.id} />
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
