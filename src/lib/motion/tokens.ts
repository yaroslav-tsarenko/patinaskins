export const MOTION_DURATION = {
  micro: 160,
  ui: 260,
  panel: 320,
  panelClose: 260,
  reveal: 900,
  reduced: 120,
  bagFlight: 450,
  glazeSweep: 1800,
} as const;

export const MOTION_EASE = {
  furniture: [0.22, 1, 0.36, 1],
  std: [0.4, 0, 0.2, 1],
  inOut: [0.76, 0, 0.24, 1],
  outExpo: [0.16, 1, 0.3, 1],
} as const;

export type MotionEase = keyof typeof MOTION_EASE;

export function cssEase(name: MotionEase): string {
  return `cubic-bezier(${MOTION_EASE[name].join(", ")})`;
}

export const MOTION_SPRING = { stiffness: 220, damping: 26 } as const;

export const MOTION_DEPTH = [
  { pointer: 2, scroll: 0 },
  { pointer: 4, scroll: 0.04 },
  { pointer: 8, scroll: 0.08 },
  { pointer: 10, scroll: 0.1 },
  { pointer: 14, scroll: 0 },
] as const;

export const MOTION_STAGGER = { rows: 70, drawers: 90, paths: 40, words: 40, hooks: 70 } as const;

export const MOTION_LIMITS = {
  pointerLerp: 0.09,
  doorCamera: 64,
  tiltScale: 0.5,
  hangDeg: 6,
  hangDegCoarse: 3,
  hangGain: 2.2,
  rackSlot: 196,
  bagGhost: 40,
  bagGhostOpacity: 0.9,
  dprCap: 1.5,
} as const;

export const MOTION_QUERY = {
  finePointer: "(hover: hover) and (pointer: fine)",
  coarsePointer: "(pointer: coarse)",
} as const;
