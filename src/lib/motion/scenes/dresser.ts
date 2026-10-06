import { addTick, damp } from "../ticker";
import { documentTop, onIdle, type MotionEnv } from "../env";
import { MOTION_DEPTH, MOTION_LIMITS } from "../tokens";

const OPEN_AT = 0.6;
const CLOSED_BELOW = 0.03;

interface DeviceOrientationStatic {
  requestPermission?: () => Promise<string>;
}

function pinActive(env: MotionEnv) {
  return env.desktop && env.scrollTimeline && !env.reduced;
}

export function mountDresser(scene: HTMLElement, env: MotionEnv): () => void {
  const cleanups: (() => void)[] = [];
  const stage = scene.querySelector<HTMLElement>("[data-scene-stage]");
  const dresser = scene.querySelector<HTMLElement>("[data-dresser]");
  const carcass = scene.querySelector<HTMLElement>("[data-carcass]");
  const cupboard = scene.querySelector<HTMLElement>("[data-cupboard]");
  const cupboardView = scene.querySelector<HTMLElement>("[data-cupboard-view]");
  const pinned = pinActive(env);

  let sceneTop = 0;
  let range = 1;

  const measure = () => {
    sceneTop = documentTop(scene);
    range = Math.max(1, scene.offsetHeight - window.innerHeight);
    if (stage) scene.style.setProperty("--stage-top", `${Math.min(0, window.innerHeight - stage.offsetHeight)}px`);
    if (dresser && carcass && cupboard && carcass.offsetParent === dresser) {
      scene.style.setProperty("--dolly-y", `${carcass.offsetTop + cupboard.offsetTop + cupboard.offsetHeight / 2}px`);
    }
  };

  const progress = () => (window.scrollY - sceneTop) / range;
  const scrollToProgress = (p: number) => window.scrollTo({ top: sceneTop + range * p, behavior: "smooth" });

  if (pinned) {
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(scene);
    if (stage) resize.observe(stage);
    window.addEventListener("resize", measure);
    cleanups.push(() => {
      resize.disconnect();
      window.removeEventListener("resize", measure);
      scene.style.removeProperty("--stage-top");
      scene.style.removeProperty("--dolly-y");
    });

    let doorState = "";
    const syncDoors = () => {
      const next = progress() < CLOSED_BELOW ? "closed" : "open";
      if (next !== doorState) {
        doorState = next;
        scene.dataset.doors = next;
      }
    };
    syncDoors();
    window.addEventListener("scroll", syncDoors, { passive: true });
    cleanups.push(() => {
      window.removeEventListener("scroll", syncDoors);
      delete scene.dataset.doors;
    });

    const onDoorClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("[data-door]")) return;
      if (scene.dataset.doors === "closed") scrollToProgress(1);
    };
    scene.addEventListener("click", onDoorClick);
    cleanups.push(() => scene.removeEventListener("click", onDoorClick));

    const opener = scene.querySelector<HTMLAnchorElement>("[data-action=open-cupboards]");
    const onOpen = (event: MouseEvent) => {
      event.preventDefault();
      scrollToProgress(1);
    };
    opener?.addEventListener("click", onOpen);
    cleanups.push(() => opener?.removeEventListener("click", onOpen));

    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && cupboard?.contains(event.target) && progress() < OPEN_AT) scrollToProgress(OPEN_AT);
    };
    scene.addEventListener("focusin", onFocus);
    cleanups.push(() => scene.removeEventListener("focusin", onFocus));
  }

  const camera = env.finePointer && env.desktop;
  const tilt = !camera && env.coarsePointer && typeof DeviceOrientationEvent !== "undefined" && typeof (DeviceOrientationEvent as unknown as DeviceOrientationStatic).requestPermission !== "function";

  if ((camera || tilt) && dresser) {
    const frameAmp = MOTION_DEPTH[3].pointer * (tilt ? MOTION_LIMITS.tiltScale : 1);
    const doorAmp = MOTION_LIMITS.doorCamera * (tilt ? MOTION_LIMITS.tiltScale : 1);
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let visible = false;
    let stopTick: (() => void) | null = null;

    const write = () => {
      dresser.style.translate = `${(current.x * frameAmp).toFixed(2)}px ${(current.y * frameAmp).toFixed(2)}px`;
      if (cupboardView) cupboardView.style.perspectiveOrigin = `calc(50% + ${(-current.x * doorAmp).toFixed(1)}px) calc(50% + ${(-current.y * doorAmp).toFixed(1)}px)`;
    };

    const tick = (dt: number) => {
      current.x = damp(current.x, target.x, 6, dt / 1000);
      current.y = damp(current.y, target.y, 6, dt / 1000);
      write();
      const settled = Math.abs(current.x - target.x) < 0.001 && Math.abs(current.y - target.y) < 0.001;
      if (settled || !visible) {
        stopTick = null;
        return false;
      }
    };

    const wake = () => {
      if (!stopTick && visible) stopTick = addTick(tick);
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight) * 2 - 1));
      wake();
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      target.x = Math.max(-1, Math.min(1, event.gamma / 30));
      target.y = Math.max(-1, Math.min(1, (event.beta - 45) / 30));
      wake();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(scene);

    if (camera) window.addEventListener("pointermove", onPointer, { passive: true });
    else window.addEventListener("deviceorientation", onOrientation, { passive: true });

    cleanups.push(() => {
      io.disconnect();
      stopTick?.();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrientation);
      dresser.style.translate = "";
      if (cupboardView) cupboardView.style.perspectiveOrigin = "";
    });
  }

  const glazeShelf = scene.querySelector<HTMLElement>("[data-glaze]")?.closest<HTMLElement>("ul");
  const forced = new URLSearchParams(window.location.search).has("t");
  if (glazeShelf && env.desktop && !env.reduced && (forced || (env.finePointer && !env.saveData && !env.lowPower))) {
    let disposed = false;
    let disposeGlaze: (() => void) | undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const cancelIdle = onIdle(() => {
        import("./glaze").then(({ mountGlaze }) => {
          if (!disposed) disposeGlaze = mountGlaze(glazeShelf);
        });
      }, 2000);
      cleanups.push(cancelIdle);
    });
    io.observe(glazeShelf);
    cleanups.push(() => {
      disposed = true;
      io.disconnect();
      disposeGlaze?.();
    });
  }

  return () => {
    for (const cleanup of cleanups.reverse()) cleanup();
  };
}
