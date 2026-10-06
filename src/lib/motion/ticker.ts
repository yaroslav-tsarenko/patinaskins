export type Tick = (dt: number, now: number) => boolean | void;

const subscribers = new Set<Tick>();
let frame = 0;
let last = 0;

function loop(now: number) {
  const dt = last ? Math.min(now - last, 64) : 16.7;
  last = now;
  for (const tick of Array.from(subscribers)) {
    if (tick(dt, now) === false) subscribers.delete(tick);
  }
  if (subscribers.size > 0) {
    frame = window.requestAnimationFrame(loop);
  } else {
    frame = 0;
    last = 0;
  }
}

export function addTick(tick: Tick): () => void {
  subscribers.add(tick);
  if (!frame) frame = window.requestAnimationFrame(loop);
  return () => {
    subscribers.delete(tick);
  };
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
