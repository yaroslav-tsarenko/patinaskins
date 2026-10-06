import { addTick } from "../ticker";
import { MOTION_LIMITS, MOTION_SPRING, MOTION_STAGGER } from "../tokens";
import type { MotionEnv } from "../env";

interface Hanger {
  el: HTMLElement;
  angle: number;
  velocity: number;
  stiffness: number;
  damping: number;
}

export function mountHooks(section: HTMLElement, env: MotionEnv): () => void {
  const items = Array.from(section.querySelectorAll<HTMLElement>("[data-hang]"));
  if (items.length === 0) return () => {};
  const scroller = section.querySelector<HTMLElement>("[role=region]");
  const maxDeg = env.coarsePointer || !env.desktop ? MOTION_LIMITS.hangDegCoarse : MOTION_LIMITS.hangDeg;

  const hangers: Hanger[] = items.map((el, i) => {
    const mass = 1 + ((i * 37) % 5) * 0.06;
    const stiffness = MOTION_SPRING.stiffness / mass;
    return { el, angle: 0, velocity: 0, stiffness, damping: MOTION_SPRING.damping / Math.sqrt(mass) };
  });

  let visible = false;
  let stopTick: (() => void) | null = null;
  let lastY = window.scrollY;
  let lastX = scroller?.scrollLeft ?? 0;
  let drive = 0;
  const timers: number[] = [];

  const tick = (dt: number) => {
    const seconds = dt / 1000;
    const y = window.scrollY;
    const x = scroller?.scrollLeft ?? 0;
    const speed = ((y - lastY) + (x - lastX) * 0.8) / Math.max(dt, 1);
    lastY = y;
    lastX = x;
    drive += (speed - drive) * Math.min(1, seconds * 12);
    const targetAngle = Math.max(-maxDeg, Math.min(maxDeg, -drive * MOTION_LIMITS.hangGain));
    let moving = Math.abs(drive) > 0.002;
    for (const h of hangers) {
      const accel = h.stiffness * (targetAngle - h.angle) - h.damping * h.velocity;
      h.velocity += accel * seconds;
      h.angle += h.velocity * seconds;
      if (Math.abs(h.angle) > 0.01 || Math.abs(h.velocity) > 0.02) moving = true;
      h.el.style.rotate = `${h.angle.toFixed(3)}deg`;
    }
    if (!moving || !visible) {
      for (const h of hangers) {
        h.angle = 0;
        h.velocity = 0;
        h.el.style.rotate = "";
      }
      drive = 0;
      stopTick = null;
      return false;
    }
  };

  const wake = () => {
    if (stopTick || !visible) return;
    lastY = window.scrollY;
    lastX = scroller?.scrollLeft ?? 0;
    stopTick = addTick(tick);
  };

  let entered = false;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) return;
    if (!entered) {
      entered = true;
      hangers.forEach((h, i) => {
        timers.push(
          window.setTimeout(() => {
            h.velocity += (maxDeg * 7) / (1 + i * 0.08);
            wake();
          }, i * MOTION_STAGGER.hooks),
        );
      });
    }
    wake();
  });
  io.observe(section);

  window.addEventListener("scroll", wake, { passive: true });
  scroller?.addEventListener("scroll", wake, { passive: true });

  return () => {
    io.disconnect();
    stopTick?.();
    for (const id of timers) window.clearTimeout(id);
    window.removeEventListener("scroll", wake);
    scroller?.removeEventListener("scroll", wake);
    for (const h of hangers) h.el.style.rotate = "";
  };
}
