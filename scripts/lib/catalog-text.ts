import type { Matcher } from "../../src/config/catalog";
import { containsSupplierTrace, isDistributorLine, scrubSupplierText } from "../../src/lib/utils/supplier";

export interface CompiledMatcher {
  source: Matcher;
  test: RegExp;
  global: RegExp;
}

const CHAR_FOLD: Record<string, string> = {
  ø: "o", Ø: "o", ß: "ss", æ: "ae", Æ: "ae", œ: "oe", Œ: "oe", ł: "l", Ł: "l", đ: "d", ð: "d", þ: "th",
};

export function foldDiacritics(value: string): string {
  return value
    .replace(/[øØßæÆœŒłŁđðþ]/g, (c) => CHAR_FOLD[c] || c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return foldDiacritics(value)
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function compileMatcher(matcher: Matcher): CompiledMatcher {
  if (matcher instanceof RegExp) {
    const flags = matcher.flags.replace("g", "");
    const withI = flags.includes("i") ? flags : `${flags}i`;
    return { source: matcher, test: new RegExp(matcher.source, withI), global: new RegExp(matcher.source, `${withI}g`) };
  }
  const norm = normalizeText(matcher);
  const body = norm
    .split(" ")
    .map((part) => escapeRegExp(part).replace(/\\-|-/g, "[\\s-]?"))
    .join("[\\s-]+");
  const plural = /[a-z]$/.test(norm) ? "(?:s|es)?" : "";
  const src = `(?<![a-z0-9])${body}${plural}(?![a-z0-9])`;
  return { source: matcher, test: new RegExp(src, "i"), global: new RegExp(src, "gi") };
}

export function compileMatchers(list: Matcher[]): CompiledMatcher[] {
  return list.map(compileMatcher);
}

export function anyMatch(text: string, matchers: CompiledMatcher[]): CompiledMatcher | null {
  for (const m of matchers) if (m.test.test(text)) return m;
  return null;
}

export function stripPhrases(text: string, phrases: CompiledMatcher[]): string {
  let out = text;
  for (const p of phrases) out = out.replace(p.global, " ");
  return out.replace(/\s+/g, " ").trim();
}

export function matcherLabel(m: CompiledMatcher): string {
  return m.source instanceof RegExp ? m.source.source : m.source;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", deg: "°", times: "×", euro: "€",
  pound: "£", copy: "©", reg: "®", trade: "™", middot: "·", bull: "•", frac12: "½", frac14: "¼", frac34: "¾",
  sup2: "²", sup3: "³", oslash: "ø", Oslash: "Ø", eacute: "é", egrave: "è", aacute: "á", agrave: "à",
  iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß",
  micro: "µ", plusmn: "±", shy: "",
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return " ";
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body] ?? NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Inline = { kind: "text"; text: string; strong: boolean } | { kind: "br" };
type Block = { kind: "p"; inline: Inline[] } | { kind: "ul"; items: Inline[][] };

const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|svg|video|audio|canvas|form|select|textarea|button|template|head|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const SUPPLIER_ANCHOR = /<a\b[^>]*\bhref\s*=\s*["']?[^"'>\s]*big-?bu[yi][^>]*>[\s\S]*?<\/a\s*>/gi;

const BLOCK_TAGS = new Set(["p", "div", "section", "article", "header", "footer", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "dl", "dt", "dd", "center", "pre", "figure", "figcaption", "main", "aside"]);

function plainToHtml(raw: string): string {
  return raw
    .split(/\r?\n\s*\r?\n/)
    .map((para) => `<p>${para.split(/\r?\n/).join("<br>")}</p>`)
    .join("");
}

export function inlineText(inline: Inline[]): string {
  return inline.map((i) => (i.kind === "br" ? "\n" : i.text)).join("").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}

function parseBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  let para: Inline[] = [];
  let list: Inline[][] | null = null;
  let item: Inline[] | null = null;
  let strongDepth = 0;
  let headingDepth = 0;
  let cellCount = 0;

  const target = (): Inline[] => item ?? para;
  const flushPara = () => {
    if (para.some((i) => i.kind === "text" && i.text.trim())) blocks.push({ kind: "p", inline: para });
    para = [];
  };
  const flushItem = () => {
    if (list && item && item.some((i) => i.kind === "text" && i.text.trim())) list.push(item);
    item = null;
  };
  const flushList = () => {
    flushItem();
    if (list && list.length) blocks.push({ kind: "ul", items: list });
    list = null;
  };

  const tokens = html.replace(/<!--[\s\S]*?-->/g, " ").replace(DROP_WITH_CONTENT, " ").replace(SUPPLIER_ANCHOR, " ").split(/(<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>)/);
  for (const token of tokens) {
    if (!token) continue;
    const tag = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/.exec(token);
    if (!tag) {
      const text = decodeEntities(token.replace(/<|>/g, " ")).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f​­]/g, "").replace(/\s+/g, " ");
      if (!text.trim() && !target().length) continue;
      target().push({ kind: "text", text, strong: strongDepth > 0 || headingDepth > 0 });
      continue;
    }
    const closing = tag[1] === "/";
    const name = tag[2].toLowerCase();
    if (name === "br") {
      target().push({ kind: "br" });
    } else if (name === "strong" || name === "b") {
      strongDepth = Math.max(0, strongDepth + (closing ? -1 : 1));
    } else if (/^h[1-6]$/.test(name)) {
      if (!list) flushPara();
      headingDepth = closing ? 0 : 1;
      if (closing && !list) flushPara();
    } else if (name === "ul" || name === "ol" || name === "table" || name === "tbody") {
      if (closing) {
        if (name === "ul" || name === "ol" || name === "table") flushList();
      } else if (!list) {
        flushPara();
        list = [];
      }
    } else if (name === "li" || name === "tr") {
      if (!list) {
        flushPara();
        list = [];
      }
      flushItem();
      if (!closing) {
        item = [];
        cellCount = 0;
      }
    } else if (name === "td" || name === "th") {
      if (!closing && item) {
        if (cellCount > 0) item.push({ kind: "text", text: ": ", strong: false });
        cellCount++;
      }
    } else if (BLOCK_TAGS.has(name)) {
      if (item) item.push({ kind: "text", text: " ", strong: false });
      else {
        if (list) flushList();
        flushPara();
      }
    }
  }
  flushList();
  flushPara();
  return blocks;
}

function lineToListItems(block: Block): Block {
  if (block.kind !== "p") return block;
  const lines = inlineText(block.inline).split("\n").map((l) => l.trim()).filter(Boolean);
  const bulleted = lines.filter((l) => /^[-•*·–]\s+/.test(l));
  if (lines.length >= 2 && bulleted.length >= Math.ceil(lines.length * 0.6)) {
    return { kind: "ul", items: lines.map((l) => [{ kind: "text", text: l.replace(/^[-•*·–]\s+/, ""), strong: false }]) };
  }
  return block;
}

function scrubInline(inline: Inline[], knownSkus: string[]): Inline[] {
  const out: Inline[] = [];
  for (const seg of inline) {
    if (seg.kind === "br") {
      out.push(seg);
      continue;
    }
    const lead = /^\s/.test(seg.text) ? " " : "";
    const trail = /\s$/.test(seg.text) ? " " : "";
    const scrubbed = containsSupplierTrace(seg.text, knownSkus) ? scrubSupplierText(seg.text, knownSkus) : seg.text;
    if (scrubbed.trim()) out.push({ kind: "text", text: `${lead}${scrubbed.trim()}${trail}`, strong: seg.strong });
  }
  while (out.length && out[0].kind === "br") out.shift();
  while (out.length && out[out.length - 1].kind === "br") out.pop();
  return out.filter((seg, i, arr) => !(seg.kind === "br" && arr[i - 1]?.kind === "br" && arr[i - 2]?.kind === "br"));
}

const INTRO_OPENER = /^\s*(?:<(?:p|div|span|b|strong)\b[^>]*>\s*)*(?:if you (?:like to take care|are looking for|are thinking of|want to add)|keep fit and discover|children deserve the best|return to the office|summer fun is assured|equip your vehicle|(?:<b>\s*)?[\w' -]{2,30}(?:\s*<\/b>)?\s+is here to help you)/i;

const INTRO_END = /<br\s*\/?>(?:\s*<br\s*\/?>)?|<\/p>|<(?:ul|ol|p|div|table|h[1-6])\b/i;

const ATTRIBUTE_NOISE = /^\s*(?:(?:product with plug|type of plug|power supply|voltage|power|batteries included|battery operated|battery type|number of batteries)\s*:|not included\s*:\s*batter)/i;

export function stripMarketingIntro(raw: string): string {
  const opener = INTRO_OPENER.exec(raw);
  if (!opener) return raw;
  const rest = raw.slice(opener[0].length);
  const end = INTRO_END.exec(rest);
  if (!end) return rest.length <= 400 ? "" : raw;
  if (end.index > 700) return raw;
  const closes = end[0].startsWith("</") || end[0].toLowerCase().startsWith("<br");
  return rest.slice(closes ? end.index + end[0].length : end.index);
}

function lineIsSupplierJunk(text: string): boolean {
  return isDistributorLine(text) || ATTRIBUTE_NOISE.test(text) || /^\s*(?:ref(?:erence)?|sku|ean)\s*[:#.]?\s*\S*\s*$/i.test(text);
}

function renderInline(inline: Inline[]): string {
  let html = "";
  for (const seg of inline) {
    if (seg.kind === "br") html += "<br>";
    else if (seg.strong && seg.text.trim()) html += `${/^\s/.test(seg.text) ? " " : ""}<strong>${escapeHtml(seg.text.trim())}</strong>${/\s$/.test(seg.text) ? " " : ""}`;
    else html += escapeHtml(seg.text);
  }
  return html.replace(/\s*<br>\s*/g, "<br>").replace(/\s+/g, " ").trim();
}

export function cleanDescriptionHtml(raw: string | null | undefined, knownSkus: string[] = []): { html: string; text: string } {
  if (!raw || !raw.trim()) return { html: "", text: "" };
  const trimmed = stripMarketingIntro(raw);
  const source = /<[a-zA-Z/!][^>]*>/.test(trimmed) ? trimmed : plainToHtml(trimmed);
  const blocks = parseBlocks(source).map(lineToListItems);
  const htmlParts: string[] = [];
  const textParts: string[] = [];
  for (const block of blocks) {
    if (block.kind === "p") {
      const lines = inlineText(block.inline).split("\n");
      if (lines.every((l) => !l.trim() || lineIsSupplierJunk(l))) continue;
      const inline = scrubInline(block.inline, knownSkus);
      const text = inlineText(inline);
      if (!text || !/[a-z]/i.test(text)) continue;
      htmlParts.push(`<p>${renderInline(inline)}</p>`);
      textParts.push(text.replace(/\n/g, " "));
    } else {
      const items: string[] = [];
      for (const it of block.items) {
        if (lineIsSupplierJunk(inlineText(it))) continue;
        const inline = scrubInline(it, knownSkus);
        const text = inlineText(inline);
        if (!text || !/[a-z0-9]/i.test(text)) continue;
        items.push(`<li>${renderInline(inline)}</li>`);
        textParts.push(text.replace(/\n/g, " "));
      }
      if (items.length) htmlParts.push(`<ul>${items.join("")}</ul>`);
    }
  }
  return { html: htmlParts.join(""), text: textParts.join("\n").trim() };
}

const EN_STOP = new Set([
  "the", "and", "with", "for", "of", "to", "in", "is", "a", "an", "this", "your", "you", "it", "its", "are", "made", "from", "on", "set", "pack",
  "pieces", "piece", "that", "can", "be", "has", "which", "will", "or", "by", "as", "ideal", "perfect",
  "type", "colour", "color", "material", "capacity", "dimensions", "approx", "characteristics", "suitable", "design", "includes", "included",
  "compatible", "recommended", "use", "diameter", "weight", "height", "width", "length", "number", "stainless", "steel", "glass", "dishwasher",
  "dishwashers", "not", "size", "units", "properties", "wash", "hand", "black", "white", "grey", "silver", "transparent", "wood",
]);
const FOREIGN_STOP = new Set([
  "de", "la", "el", "los", "las", "del", "con", "para", "y", "por", "una", "uno", "juego", "cocina", "taza", "olla", "sarten", "sartén", "vaso", "plato",
  "le", "les", "des", "avec", "pour", "et", "une", "du", "au", "aux", "est", "dans",
  "und", "mit", "fur", "für", "der", "die", "das", "ein", "eine", "ist", "zu", "auf",
  "il", "lo", "gli", "della", "di", "per", "e", "un", "nel",
  "com", "uma", "os", "nao", "não", "em", "ao", "dos", "das",
  "acero", "inoxidable", "capacidad", "negro", "blanco", "tipo", "diametro", "diámetro", "medidas", "apto", "lavavajillas", "vidrio", "madera",
]);

export function englishScore(text: string): { en: number; foreign: number; words: number } {
  const words = normalizeText(text).split(/[^a-z']+/).filter(Boolean);
  let en = 0;
  let foreign = 0;
  for (const w of words) {
    if (EN_STOP.has(w)) en++;
    else if (FOREIGN_STOP.has(w)) foreign++;
  }
  return { en, foreign, words: words.length };
}

export function looksEnglishName(name: string): boolean {
  const letters = name.replace(/[Øø⌀]/g, "").match(/\p{L}/gu) || [];
  if (!letters.length) return false;
  const ascii = letters.filter((c) => /[a-z]/i.test(c)).length;
  if (ascii / letters.length < 0.85) return false;
  const { en, foreign } = englishScore(name);
  return !(foreign >= 2 && foreign > en);
}

export function looksEnglishText(text: string): boolean {
  const { en, foreign, words } = englishScore(text);
  if (words < 12) return foreign <= en;
  return en >= 2 && en >= foreign * 1.5;
}

const DANGLING_END = /\b(?:and|or|with|the|of|for|to|a|an|in|on|at|by|from|which|that|is|are|de|y|con|para|e|the following|including|such as)\s*$/i;

export function descriptionProblem(text: string, minChars: number): string | null {
  const t = text.trim();
  if (!t) return "missing";
  if (t.length < minChars) return "too-short";
  if (/(?:\.\.\.|…)\s*$/.test(t)) return "truncated";
  if (DANGLING_END.test(t)) return "truncated";
  if (/[,;:(\-–—/]\s*$/.test(t)) return "truncated";
  const opens = (t.match(/\(/g) || []).length;
  const closes = (t.match(/\)/g) || []).length;
  if (opens > closes + 1) return "truncated";
  if (/�|Ã[\u0080-¿]|â€|Â[ -¿]/.test(t)) return "garbage";
  if (/lorem ipsum|\{\{|\}\}|\[\[|<\?|\bundefined\b|\bnull\b/i.test(t) || /\bNaN\b/.test(t)) return "garbage";
  const letters = (t.match(/\p{L}/gu) || []).length;
  if (letters / t.length < 0.5) return "garbage";
  const upper = (t.match(/[A-Z]/g) || []).length;
  const lowerCase = (t.match(/[a-z]/g) || []).length;
  if (upper > 40 && upper > lowerCase) return "garbage";
  if (/(.)\1{7,}/.test(t.replace(/[\s._\-=*]/g, ""))) return "garbage";
  if (t.split(/\s+/).some((w) => w.length > 45 && !/^https?:/i.test(w))) return "garbage";
  if (!looksEnglishText(t)) return "not-english";
  return null;
}

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with", "x"]);

function fixShouting(name: string): string {
  const letters = name.replace(/[^A-Za-z]/g, "");
  if (letters.length < 6 || letters !== letters.toUpperCase()) return name;
  return name
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function cleanProductName(raw: string | null | undefined, knownSkus: string[] = []): string {
  if (!raw) return "";
  let name = decodeEntities(raw.replace(/<[^>]*>/g, " ")).replace(/[\u0000-\u001f​­]/g, "");
  if (containsSupplierTrace(name, knownSkus)) name = scrubSupplierText(name, knownSkus);
  name = name
    .replace(/\s+/g, " ")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .replace(/^[\s,.;:\-–—|]+|[\s,;:\-–—|]+$/g, "")
    .trim();
  return fixShouting(name);
}

export function slugifyName(value: string, maxLength = 80): string {
  const base = foldDiacritics(value.replace(/[Øø⌀]\s*(?=\d)/g, " "))
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[''`´]/g, "")
    .replace(/(\d)[.,](\d)/g, "$1-$2")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length <= maxLength) return base;
  const cut = base.slice(0, maxLength);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > maxLength * 0.6 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, "");
}

export function createSlugAllocator(taken: Iterable<string> = []) {
  const seen = new Set<string>(taken);
  return (value: string, fallback: string): string => {
    const base = slugifyName(value) || slugifyName(fallback) || "item";
    let slug = base;
    let i = 2;
    while (seen.has(slug)) slug = `${base}-${i++}`;
    seen.add(slug);
    return slug;
  };
}

export function shortDescriptionFrom(text: string, maxLength = 220): string | null {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  const sentences = flat.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [];
  let out = "";
  for (const s of sentences) {
    const next = `${out} ${s.trim()}`.trim();
    if (next.length > maxLength) break;
    out = next;
  }
  if (out.length >= 40) return out;
  if (sentences[0] && sentences[0].trim().length <= maxLength * 1.6) return sentences[0].trim();
  return null;
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
