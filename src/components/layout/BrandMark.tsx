import type { CSSProperties, SVGProps } from "react";
import { BRAND } from "@/lib/brand";

const P_PATH = "M152 112H300C368 112 412 152 412 216C412 280 368 320 300 320H232V400H152ZM232 184V248H292C316 248 330 236 330 216C330 196 316 184 292 184Z";

const TILE_POINTS = "61.44,0 450.56,0 512,61.44 512,450.56 450.56,512 61.44,512 0,450.56 0,61.44";

type MarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  title?: string;
};

export function Wordmark({ title, className, ...rest }: MarkProps) {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 600 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      {...rest}
    >
      <text x="0" y="80" fontSize="92" fontFamily="inherit" fontWeight="600" textLength="600" lengthAdjust="spacingAndGlyphs">
        {BRAND.name}
      </text>
    </svg>
  );
}

export function Monogram({ title, className, size, style, ...rest }: MarkProps & { size?: number }) {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color: "var(--color-paint)", ...(style as CSSProperties) }}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      {...rest}
    >
      <polygon points={TILE_POINTS} fill="currentColor" />
      <path d={P_PATH} fill="var(--mark-ink, var(--color-on-paint))" fillRule="evenodd" />
    </svg>
  );
}

export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return <Monogram size={size} className={className} />;
}
