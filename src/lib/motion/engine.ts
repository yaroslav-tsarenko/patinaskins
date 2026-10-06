import { readMotionEnv, type MotionEnv } from "./env";
import { mountDresser } from "./scenes/dresser";
import { mountDrawers } from "./scenes/drawers";
import { mountHooks } from "./scenes/hooks";
import { mountRack } from "./scenes/rack";

interface Scene {
  selector: string;
  mount: (el: HTMLElement, env: MotionEnv) => () => void;
}

const SCENES: Scene[] = [
  { selector: "[data-scene=dresser]", mount: mountDresser },
  { selector: "[data-scene=drawers]", mount: mountDrawers },
  { selector: "[data-pin=rack]", mount: mountRack },
  { selector: "[data-scene=hooks]", mount: mountHooks },
];

const yieldToMain = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

export function mountMotion(root: ParentNode): () => void {
  const env = readMotionEnv();
  const cleanups: (() => void)[] = [];
  let cancelled = false;
  if (env.reduced) return () => {};

  (async () => {
    for (const scene of SCENES) {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(scene.selector));
      if (nodes.length === 0) continue;
      await yieldToMain();
      if (cancelled) return;
      for (const node of nodes) cleanups.push(scene.mount(node, env));
    }
  })();

  return () => {
    cancelled = true;
    for (const cleanup of cleanups.reverse()) cleanup();
    cleanups.length = 0;
  };
}
