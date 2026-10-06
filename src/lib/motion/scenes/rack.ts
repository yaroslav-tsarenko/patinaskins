import { documentTop, type MotionEnv } from "../env";
import { MOTION_LIMITS } from "../tokens";

export function mountRack(section: HTMLElement, env: MotionEnv): () => void {
  const pin = section.querySelector<HTMLElement>("[data-rack-pin]");
  const stage = section.querySelector<HTMLElement>("[data-rack-stage]");
  const spacer = section.querySelector<HTMLElement>("[data-rack-spacer]");
  const track = section.querySelector<HTMLElement>("[data-rack-track]");
  if (!pin || !stage || !spacer || !track || !env.desktop || !env.scrollTimeline || env.reduced) return () => {};

  const measure = () => section.style.setProperty("--rack-stage-h", `${stage.offsetHeight}px`);
  measure();
  const resize = new ResizeObserver(measure);
  resize.observe(stage);

  const onFocus = (event: FocusEvent) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-rack-track] > li") : null;
    if (!item) return;
    const distance = spacer.offsetHeight;
    if (distance === 0) return;
    const index = Array.prototype.indexOf.call(track.children, item);
    const viewport = track.parentElement?.clientWidth ?? window.innerWidth;
    const offset = index * MOTION_LIMITS.rackSlot - (viewport - MOTION_LIMITS.rackSlot) / 2;
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const top = documentTop(pin) - stickyTop + Math.max(0, Math.min(distance, offset));
    if (Math.abs(window.scrollY - top) > 4) window.scrollTo({ top, behavior: "smooth" });
  };

  section.addEventListener("focusin", onFocus);
  return () => {
    resize.disconnect();
    section.removeEventListener("focusin", onFocus);
    section.style.removeProperty("--rack-stage-h");
  };
}
