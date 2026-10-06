import { cssEase, MOTION_DURATION, MOTION_LIMITS } from "./tokens";

export interface BagAddDetail {
  productId?: string;
  source?: Element | null;
}

function visibleRect(el: Element | null | undefined): DOMRect | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return null;
  return rect;
}

export function flyToBag(detail: BagAddDetail | undefined) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (document.querySelector("[data-header-state=hidden]")) return;
  const source = detail?.source ?? null;
  const cubby = source?.querySelector<HTMLElement>("[data-cubby]") ?? null;
  const img = source?.querySelector<HTMLImageElement>("[data-packshot] img, img") ?? null;
  const from = visibleRect(cubby ?? img);
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-bag-target]"));
  const target = targets.map((el) => ({ el, rect: visibleRect(el) })).find((t) => t.rect);
  if (!from || !img || !target?.rect) return;

  const size = Math.min(from.width, from.height);
  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.className = "bg-stage";
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left + (from.width - size) / 2}px`,
    top: `${from.top + (from.height - size) / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    zIndex: "85",
    pointerEvents: "none",
    padding: `${size * 0.1}px`,
    transformOrigin: "0 0",
    willChange: "transform, opacity",
  });
  const picture = document.createElement("img");
  picture.src = img.currentSrc || img.src;
  picture.alt = "";
  Object.assign(picture.style, { width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom", display: "block" });
  ghost.appendChild(picture);
  document.body.appendChild(ghost);

  const scale = MOTION_LIMITS.bagGhost / size;
  const startX = from.left + (from.width - size) / 2;
  const startY = from.top + (from.height - size) / 2;
  const endX = target.rect.left + target.rect.width / 2 - MOTION_LIMITS.bagGhost / 2;
  const endY = target.rect.top + target.rect.height / 2 - MOTION_LIMITS.bagGhost / 2;
  const dx = endX - startX;
  const dy = endY - startY;
  const lift = Math.min(80, Math.abs(dy) * 0.25);

  const flight = ghost.animate(
    [
      { transform: "translate(0px, -6px) scale(1)", opacity: MOTION_LIMITS.bagGhostOpacity },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(${(1 + scale) / 2})`, opacity: MOTION_LIMITS.bagGhostOpacity, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.35 },
    ],
    { duration: MOTION_DURATION.bagFlight, easing: cssEase("furniture"), fill: "forwards" },
  );

  const finish = () => {
    ghost.remove();
    target.el.animate([{ transform: "translateY(2px)" }, { transform: "translateY(0)" }], { duration: MOTION_DURATION.micro, easing: cssEase("furniture") });
  };
  flight.finished.then(finish, () => ghost.remove());
}
