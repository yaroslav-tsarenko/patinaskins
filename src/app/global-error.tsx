"use client";

import "@fontsource-variable/commissioner/wght.css";
import "./fonts.css";
import "@/styles/globals.css";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/brand";
import { COMPANY } from "@/lib/company";
import messages from "../../messages/en/errors.json";
import common from "../../messages/en/common.json";

const THEME_INIT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var d=document.documentElement;d.setAttribute("data-theme",t);d.classList.toggle("dark",t==="dark")}catch(e){}})();`;

export default function GlobalError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = () => (unstable_retry ?? reset)?.();

  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <title>{`${messages.serverErrorTitle} | ${BRAND.name}`}</title>
        <header className="bg-paint text-on-paint">
          <div className="mx-auto flex h-14 max-w-container items-center px-gutter">
            <a href="/" className="font-display text-step-2 leading-none text-on-paint">
              {BRAND.name}
            </a>
          </div>
          <span aria-hidden="true" className="block h-[2px] bg-shelf" />
        </header>
        <main className="mx-auto w-full max-w-container flex-1 px-gutter pb-24 pt-16">
          <div className="measure">
            <h1 className="m-0 font-display text-step-4 leading-[1.08] tracking-[-0.01em]">{messages.serverErrorTitle}</h1>
            <p className="mt-4 text-step-1 leading-[1.5] text-ink-muted">{messages.serverError}</p>
            <p className="mt-3 text-step-0 leading-[1.6] text-ink-muted">{messages.serverErrorBody.replace("{email}", COMPANY.email)}</p>
            {error.digest ? <p className="meta mt-3 font-mono text-ink-subtle">{messages.errorReference.replace("{digest}", error.digest)}</p> : null}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Button onPress={retry}>{common.retry}</Button>
              <Button as="a" href="/" variant="ghost">
                {messages.backHome}
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
