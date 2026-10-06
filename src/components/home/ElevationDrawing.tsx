import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

const FRAME = [
  "M10 12H390V64H10Z",
  "M18 56H382",
  "M24 64V474",
  "M376 64V474",
  "M24 168H376",
  "M24 173H376",
  "M24 268H376",
  "M24 273H376",
  "M24 410H376",
  "M200 273V410",
  "M24 474H376",
  "M18 474H382V490H18Z",
  "M32 490V500H52V490",
  "M348 490V500H368V490",
];

const SHELF_TOP = [
  "M58 166a26 26 0 1 1 52 0",
  "M66 166a18 18 0 1 1 36 0",
  "M118 166a26 26 0 1 1 52 0",
  "M126 166a18 18 0 1 1 36 0",
  "M186 166c4-22 60-22 64 0",
  "M192 150h52",
  "M272 166v-46h34c14 0 18 10 18 18s-4 18-18 18h-4",
  "M272 120h34",
  "M336 166v-34h24v34",
  "M332 132h32",
];

const SHELF_MIDDLE = [
  "M62 266h24M74 266v-30M60 214c0 18 6 22 14 22s14-4 14-22Z",
  "M112 266h24M124 266v-30M110 214c0 18 6 22 14 22s14-4 14-22Z",
  "M168 266l4-48h28l4 48Z",
  "M216 266l4-48h28l4 48Z",
  "M280 266h40v-30c0-18-8-26-20-26s-20 8-20 26Z",
  "M300 210v-10",
  "M340 266h24M352 266v-36M346 202h12l2 28h-16Z",
];

const DOORS = [
  "M32 281H192V402H32Z",
  "M44 293H180V390H44Z",
  "M208 281H368V402H208Z",
  "M220 293H356V390H220Z",
  "M180 338h6v6h-6Z",
  "M214 338h6v6h-6Z",
  "M32 300h-5M32 383h-5",
  "M368 300h5M368 383h5",
];

const DRAWERS = [
  "M32 418H140V466H32Z",
  "M146 418H254V466H146Z",
  "M260 418H368V466H260Z",
  "M83 439h6v6h-6Z",
  "M197 439h6v6h-6Z",
  "M311 439h6v6h-6Z",
];

const GROUPS: { name: string; paths: string[] }[] = [
  { name: "frame", paths: FRAME },
  { name: "shelf-top", paths: SHELF_TOP },
  { name: "shelf-middle", paths: SHELF_MIDDLE },
  { name: "doors", paths: DOORS },
  { name: "drawers", paths: DRAWERS },
];

const OFFSETS = GROUPS.map((_, g) => GROUPS.slice(0, g).reduce((sum, group) => sum + group.paths.length, 0));

export function ElevationDrawing({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 510"
      data-draw=""
      className={cn("block h-auto w-full text-shelf", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GROUPS.map((group, g) => (
        <g key={group.name} data-draw-group={group.name}>
          {group.paths.map((d, p) => (
            <path key={d} d={d} data-stroke="" pathLength={1} style={{ "--i": OFFSETS[g] + p } as CSSProperties} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      ))}
    </svg>
  );
}
