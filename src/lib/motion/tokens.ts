export const MOTION_DURATION = {
  micro: 140,
  ui: 200,
  panel: 280,
  panelClose: 220,
  reveal: 700,
  reduced: 120,
  cartFlight: 420,
  lampSweep: 1600,
} as const;

export const MOTION_EASE = {
  instrument: [0.2, 0.8, 0.2, 1],
  std: [0.4, 0, 0.2, 1],
  inOut: [0.76, 0, 0.24, 1],
  outExpo: [0.16, 1, 0.3, 1],
} as const;

export type MotionEase = keyof typeof MOTION_EASE;

export function cssEase(name: MotionEase): string {
  return `cubic-bezier(${MOTION_EASE[name].join(", ")})`;
}

export const MOTION_SPRING = { stiffness: 260, damping: 30 } as const;

export const MOTION_DEPTH = [
  { pointer: 0, scroll: 0 },
  { pointer: 3, scroll: 0.04 },
  { pointer: 8, scroll: 0.08 },
  { pointer: 12, scroll: 0.12 },
  { pointer: 14, scroll: 0.06 },
] as const;

export const MOTION_STAGGER = { ticks: 4, bays: 80, spines: 60, words: 40 } as const;

export const MOTION_LIMITS = {
  tiltCatalog: 4,
  tiltHome: 8,
  tiltInspectYaw: 25,
  tiltInspectPitch: 10,
  lampLerp: 0.12,
  cartGhost: 40,
  cartGhostOpacity: 0.9,
  dprCap: 1.5,
} as const;

export const MOTION_QUERY = {
  finePointer: "(hover: hover) and (pointer: fine)",
  coarsePointer: "(pointer: coarse)",
} as const;
