"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterPlaque() {
  const t = useTranslations("home.newsletter");
  const id = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError(t("invalid"));
      return;
    }
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("idle");
      setError(t("error"));
    }
  };

  return (
    <section aria-labelledby={`${id}-title`} className="px-gutter pb-24 pt-16">
      <div data-plaque="newsletter" className="bevel-lg mx-auto max-w-[720px] px-6 py-8 text-on-brass before:bg-brass sm:px-10 sm:py-10">
        <h2 id={`${id}-title`} className="m-0 text-step-3 leading-[1.12]">
          {t("title")}
        </h2>
        <p className="m-0 mt-2 text-step-0">{t("lead")}</p>
        <div aria-live="polite" className="mt-6">
          {status === "done" ? (
            <p className="m-0 border-t border-on-brass/30 pt-4 text-step-1 font-medium">{t("success", { email: email.trim() })}</p>
          ) : (
            <form noValidate onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                label={t("label")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                required
                wrapperClassName="flex-1 [&_label]:text-on-brass [&_p]:text-on-brass"
              />
              <Button type="submit" size="md" className="h-12 shrink-0" isLoading={status === "sending"}>
                {t("cta")}
              </Button>
            </form>
          )}
        </div>
        <p className="meta m-0 mt-4">
          {t("note")}{" "}
          <Link href="/policies/privacy" className="underline decoration-1 underline-offset-4 hover-device:hover:decoration-2">
            {t("privacy")}
          </Link>
        </p>
      </div>
    </section>
  );
}
