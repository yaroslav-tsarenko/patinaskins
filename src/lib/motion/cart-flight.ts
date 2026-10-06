import { cssEase, MOTION_DURATION, MOTION_LIMITS } from "./tokens";

export interface CartAddDetail {
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

export function flyToCart(detail: CartAddDetail | undefined) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const source = detail?.source ?? null;
  const stage = source?.querySelector<HTMLElement>("[data-stage]") ?? null;
  const img = source?.querySelector<HTMLImageElement>("[data-render] img, img") ?? null;
  const from = visibleRect(stage ?? img);
  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"));
  const target = targets.map((el) => ({ el, rect: visibleRect(el) })).find((t) => t.rect);
  if (!from || !img || !target?.rect) return;

  const size = Math.min(from.width, from.height);
  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.className = "stage";
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
  Object.assign(picture.style, { width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", display: "block" });
  ghost.appendChild(picture);
  document.body.appendChild(ghost);

  const scale = MOTION_LIMITS.cartGhost / size;
  const startX = from.left + (from.width - size) / 2;
  const startY = from.top + (from.height - size) / 2;
  const endX = target.rect.left + target.rect.width / 2 - MOTION_LIMITS.cartGhost / 2;
  const endY = target.rect.top + target.rect.height / 2 - MOTION_LIMITS.cartGhost / 2;
  const dx = endX - startX;
  const dy = endY - startY;

  const flight = ghost.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: MOTION_LIMITS.cartGhostOpacity },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.35 },
    ],
    { duration: MOTION_DURATION.cartFlight, easing: cssEase("instrument"), fill: "forwards" },
  );

  const finish = () => {
    ghost.remove();
    target.el.animate([{ transform: "translateY(1px)" }, { transform: "translateY(0)" }], { duration: MOTION_DURATION.micro, easing: cssEase("instrument") });
  };
  flight.finished.then(finish, () => ghost.remove());
}
