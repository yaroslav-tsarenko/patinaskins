import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ShelfLoader } from "@/components/ui/ShelfLoader";
import { ConfirmedView } from "./ConfirmedView";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout.confirmed.meta");
  return noindexMetadata(t("title"), t("description"), "/order/confirmed", false);
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<ShelfLoader block />}>
      <ConfirmedView />
    </Suspense>
  );
}
