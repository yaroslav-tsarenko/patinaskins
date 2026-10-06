import type { ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { OG_PALETTE as P, OG_SIZE, ogFonts } from "./assets";

export async function ogResponse(element: ReactElement, cacheSeconds = 86400) {
  const fonts = await ogFonts();
  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts,
    headers: { "Cache-Control": `public, max-age=${Math.min(cacheSeconds, 3600)}, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}` },
  });
}

export function Shelf({ color, hairline, width = "100%" }: { color: string; hairline: string; width?: number | string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width }}>
      <div style={{ height: 4, background: color, width: "100%" }} />
      <div style={{ height: 5 }} />
      <div style={{ height: 2, background: hairline, width: "100%" }} />
    </div>
  );
}

export function BrassPlate({ children, fontSize = 30, onPaint = true }: { children: ReactNode; fontSize?: number; onPaint?: boolean }) {
  const cut = Math.round(fontSize * 0.42);
  const padY = Math.round(fontSize * 0.34);
  const padX = Math.round(fontSize * 0.7);
  const text = typeof children === "string" ? children : String(children ?? "");
  const w = Math.round(text.length * fontSize * 0.56 + padX * 2);
  const h = Math.round(fontSize * 1.25 + padY * 2);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: w,
        height: h,
        lineHeight: 1.25,
        background: onPaint ? P.brassOnPaint : P.brass,
        color: P.onBrass,
        fontFamily: "Commissioner",
        fontWeight: 600,
        fontSize,
        letterSpacing: 0.2,
        clipPath: `polygon(${cut}px 0px, ${w - cut}px 0px, ${w}px ${cut}px, ${w}px ${h - cut}px, ${w - cut}px ${h}px, ${cut}px ${h}px, 0px ${h - cut}px, 0px ${cut}px)`,
      }}
    >
      {children}
    </div>
  );
}

export function Wordmark({ size, color }: { size: number; color: string }) {
  return (
    <div style={{ display: "flex", fontFamily: "Gloock", fontSize: size, lineHeight: 1, letterSpacing: -size * 0.01, color }}>{BRAND.name}</div>
  );
}

export function Packshot({ src, size, background }: { src: string | null; size: number; background: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: size, height: size }}>
        {src ? <img src={src} width={size} height={size} style={{ objectFit: "contain", width: size, height: size, background }} alt="" /> : null}
      </div>
      <div style={{ display: "flex", width: Math.round(size * 0.78), height: 14, marginTop: -8, borderRadius: "50%", background: P.contact, filter: "blur(6px)" }} />
    </div>
  );
}

export function titleSize(text: string, sizes: [number, number][]): number {
  for (const [max, size] of sizes) if (text.length <= max) return size;
  return sizes[sizes.length - 1][1];
}
