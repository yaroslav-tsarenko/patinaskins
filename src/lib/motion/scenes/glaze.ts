import { addTick, damp } from "../ticker";
import { MOTION_DURATION, MOTION_LIMITS } from "../tokens";

const VERTEX = `
attribute vec2 a_pos;
uniform vec4 u_rect;
uniform vec2 u_canvas;
varying vec2 v_uv;
void main() {
  v_uv = a_pos;
  vec2 px = u_rect.xy + a_pos * u_rect.zw;
  vec2 clip = px / u_canvas * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform highp vec4 u_rect;
uniform highp vec3 u_light;
uniform float u_strength;
varying vec2 v_uv;
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float lumaAt(vec2 uv) { return luma(texture2D(u_tex, uv).rgb); }
void main() {
  vec4 c = texture2D(u_tex, v_uv);
  vec3 bg = texture2D(u_tex, vec2(0.015, 0.015)).rgb;
  float body = c.a * smoothstep(0.025, 0.09, distance(c.rgb, bg));
  float gx = lumaAt(v_uv + vec2(u_texel.x, 0.0)) - lumaAt(v_uv - vec2(u_texel.x, 0.0));
  float gy = lumaAt(v_uv + vec2(0.0, u_texel.y)) - lumaAt(v_uv - vec2(0.0, u_texel.y));
  vec3 n = normalize(vec3(-(v_uv.x - 0.5) * 2.4 - gx * 2.0, -0.18 - gy * 2.0, 1.0));
  highp vec2 p = u_rect.xy + v_uv * u_rect.zw;
  vec3 L = normalize(vec3(u_light.xy - p, u_light.z));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float nh = max(dot(n, H), 0.0);
  float spec = pow(nh, 34.0) * 0.55 + pow(nh, 240.0) * 0.9;
  float a = clamp(spec * body * u_strength, 0.0, 0.92);
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.92) * a, a);
}`;

interface Plate {
  img: HTMLImageElement;
  texture: WebGLTexture;
  width: number;
  height: number;
  rect: [number, number, number, number];
}

const SOFTWARE = /swiftshader|llvmpipe|software|basic render/i;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => img.decode().then(() => resolve(img), () => resolve(img));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function containRect(box: DOMRect, shelf: DOMRect, natural: { width: number; height: number }): [number, number, number, number] {
  const scale = Math.min(box.width / natural.width, box.height / natural.height);
  const w = natural.width * scale;
  const h = natural.height * scale;
  return [box.left - shelf.left + (box.width - w) / 2, box.top - shelf.top + box.height - h, w, h];
}

export function mountGlaze(shelf: HTMLElement): () => void {
  const host = shelf.parentElement;
  if (!host) return () => {};
  const params = new URLSearchParams(window.location.search);
  const frozen = params.has("t") ? Math.max(0, Number(params.get("t")) || 0) : null;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.glazeCanvas = "";
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return () => {};

  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
  if (SOFTWARE.test(renderer) && frozen === null) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return () => {};
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return () => {};
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return () => {};

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const aPos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uRect = gl.getUniformLocation(program, "u_rect");
  const uCanvas = gl.getUniformLocation(program, "u_canvas");
  const uTexel = gl.getUniformLocation(program, "u_texel");
  const uLight = gl.getUniformLocation(program, "u_light");
  const uStrength = gl.getUniformLocation(program, "u_strength");
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  Object.assign(canvas.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    pointerEvents: "none",
    zIndex: "2",
    opacity: "0",
    transition: `opacity ${MOTION_DURATION.reveal}ms var(--ease-std)`,
  });
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  host.appendChild(canvas);

  const plates: Plate[] = [];
  let cssWidth = 1;
  let cssHeight = 1;
  let dpr = 1;
  let alive = true;
  let visible = true;
  let stopTick: (() => void) | null = null;
  let sweepStart = -1;
  let pointerSeen = false;
  const light = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  const layout = () => {
    const shelfRect = shelf.getBoundingClientRect();
    cssWidth = Math.max(1, shelf.offsetWidth);
    cssHeight = Math.max(1, shelf.offsetHeight);
    dpr = Math.min(window.devicePixelRatio || 1, MOTION_LIMITS.dprCap);
    canvas.style.left = `${shelf.offsetLeft}px`;
    canvas.style.top = `${shelf.offsetTop}px`;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    const scaleX = cssWidth / Math.max(1, shelfRect.width);
    const scaleY = cssHeight / Math.max(1, shelfRect.height);
    for (const plate of plates) {
      const box = plate.img.getBoundingClientRect();
      const [x, y, w, h] = containRect(box, shelfRect, plate);
      plate.rect = [x * scaleX, y * scaleY, w * scaleX, h * scaleY];
    }
    if (!pointerSeen) {
      target.x = cssWidth * 0.3;
      target.y = -cssHeight * 0.4;
    }
  };

  const render = () => {
    if (!alive) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const dark = document.documentElement.dataset.theme === "dark";
    gl.uniform2f(uCanvas, cssWidth, cssHeight);
    gl.uniform3f(uLight, light.x, light.y, cssHeight * 1.4);
    gl.uniform1f(uStrength, dark ? 0.7 : 0.95);
    for (const plate of plates) {
      gl.bindTexture(gl.TEXTURE_2D, plate.texture);
      gl.uniform4f(uRect, plate.rect[0], plate.rect[1], plate.rect[2], plate.rect[3]);
      gl.uniform2f(uTexel, 1.5 / plate.width, 1.5 / plate.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  };

  const sweepAt = (elapsed: number) => {
    const t = Math.min(1, elapsed / MOTION_DURATION.glazeSweep);
    const eased = 1 - Math.pow(1 - t, 3);
    light.x = -cssWidth * 0.15 + eased * cssWidth * 1.3;
    light.y = -cssHeight * 0.35;
    return t >= 1;
  };

  const tick = (dt: number, now: number) => {
    if (!alive || !visible) {
      stopTick = null;
      return false;
    }
    let settled: boolean;
    if (sweepStart >= 0) {
      if (sweepAt(now - sweepStart)) sweepStart = -1;
      settled = false;
    } else {
      light.x = damp(light.x, target.x, 5, dt / 1000);
      light.y = damp(light.y, target.y, 5, dt / 1000);
      settled = Math.abs(light.x - target.x) < 0.5 && Math.abs(light.y - target.y) < 0.5;
    }
    render();
    if (settled) {
      stopTick = null;
      return false;
    }
  };

  const wake = () => {
    if (!stopTick && alive && visible && frozen === null) stopTick = addTick(tick);
  };

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const r = shelf.getBoundingClientRect();
    pointerSeen = true;
    target.x = (event.clientX - r.left) * (cssWidth / Math.max(1, r.width));
    target.y = (event.clientY - r.top) * (cssHeight / Math.max(1, r.height));
    wake();
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    teardown();
  };

  const resize = new ResizeObserver(() => {
    layout();
    render();
  });

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  });

  const teardown = () => {
    if (!alive) return;
    alive = false;
    stopTick?.();
    resize.disconnect();
    io.disconnect();
    window.removeEventListener("pointermove", onPointer);
    canvas.removeEventListener("webglcontextlost", onLost);
    for (const plate of plates) gl.deleteTexture(plate.texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };

  const sources = Array.from(shelf.querySelectorAll<HTMLImageElement>("[data-glaze] [data-packshot] img"));
  Promise.all(sources.map((img) => loadImage(img.currentSrc || img.src).then((loaded) => ({ img, loaded })))).then((results) => {
    if (!alive) return;
    for (const { img, loaded } of results) {
      if (!loaded) continue;
      const texture = gl.createTexture();
      if (!texture) continue;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, loaded);
      } catch {
        gl.deleteTexture(texture);
        continue;
      }
      plates.push({ img, texture, width: loaded.naturalWidth, height: loaded.naturalHeight, rect: [0, 0, 0, 0] });
    }
    if (plates.length === 0) {
      teardown();
      return;
    }
    layout();
    if (frozen !== null) {
      sweepAt(frozen * 1000);
    } else {
      light.x = -cssWidth * 0.15;
      light.y = -cssHeight * 0.35;
    }
    render();
    canvas.style.opacity = "1";
    resize.observe(shelf);
    io.observe(canvas);
    canvas.addEventListener("webglcontextlost", onLost);
    if (frozen === null) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      sweepStart = performance.now();
      wake();
    }
  });

  return teardown;
}
