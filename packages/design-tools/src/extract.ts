/**
 * Extract design facts from design-tool exports so they can be frozen into an app's design/
 * folder: colours (CSS variables, JS token objects, literals), fonts, inline SVG icons grouped by
 * geometry, and icons that come from a library. Nothing here decides what is canonical; it lists
 * what the design contains, including where it disagrees with itself.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface ColorUse {
  value: string;
  names: string[];
  files: string[];
  count: number;
}
export interface IconCandidate {
  id: string;
  svg: string;
  viewBox: string;
  strokeWidths: number[];
  count: number;
  files: string[];
}
export interface Extraction {
  source: string;
  files: string[];
  variables: Record<string, string[]>;
  conflicts: { name: string; values: string[] }[];
  colors: ColorUse[];
  fonts: string[];
  icons: IconCandidate[];
  /** Inline SVGs that could not become candidates without changing the drawing, and why. */
  rejectedIcons: { file: string; reason: string }[];
  libraryIcons: Record<string, string[]>;
}

const DESIGN_EXT = /\.(html?|jsx|tsx|js|ts|css)$/;
const SKIP_DIRS = new Set(["uploads", "assets", "screenshots", "node_modules", "ref"]);
/** Claude Design's own runtime and canvas chrome, not part of the design. */
const TOOL_FILES = new Set(["support.js", "design-canvas.jsx", "tweaks-panel.jsx", "image-slot.js", "doc-page.js"]);
const GENERIC_FONTS = /^(serif|sans-serif|monospace|cursive|system-ui|-apple-system|blinkmacsystemfont|inherit|initial|ui-[a-z-]+|var\(.*)$/i;

const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

/** Lowercase #rrggbb (or #rrggbbaa), rgb() as hex, rgba() without spaces and with a leading 0. */
export function normalizeColor(raw: string): string | null {
  const v = raw.trim();
  const hex = v.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (hex) {
    const h = hex[1].toLowerCase();
    return `#${h.length === 3 ? [...h].map((c) => c + c).join("") : h}`;
  }
  const fn = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (!fn) return null;
  const [r, g, b] = fn.slice(1, 4).map(Number);
  if (fn[4] === undefined || Number(fn[4]) === 1) {
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  }
  return `rgba(${r},${g},${b},${Number(fn[4])})`;
}

const primaryFont = (stack: string) => {
  for (const part of stack.split(",")) {
    const name = part.trim().replace(/^['"]|['"]$/g, "").trim();
    if (!name) continue;
    return GENERIC_FONTS.test(name) || !/^[A-Z][A-Za-z0-9 ]*$/.test(name) ? null : name;
  }
  return null;
};
const FONT_STACK = /,\s*(serif|sans-serif|monospace|system-ui|-apple-system|ui-[a-z-]+)\b/;

/** Character ranges inside dark-mode rules: `.dark`, `[data-theme="dark"]`, `prefers-color-scheme: dark`. */
function darkRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  const DARK = /\.dark\b|data-theme=["']?dark|prefers-color-scheme:\s*dark/;
  let from = 0;
  for (let open = text.indexOf("{", from); open >= 0; open = text.indexOf("{", from)) {
    const head = text.slice(Math.max(0, open - 200), open);
    const selector = head.slice(Math.max(head.lastIndexOf("}"), head.lastIndexOf("{"), head.lastIndexOf(";")) + 1);
    from = open + 1;
    if (!DARK.test(selector)) continue;
    let depth = 1;
    let i = open + 1;
    for (; i < text.length && depth; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") depth--;
    }
    ranges.push([open - selector.length, i]);
  }
  return ranges;
}

// ---------- SVG ----------

const ATTR = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
const GEOMETRY = ["d", "cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points", "opacity"];

export type SvgAttrs = Record<string, { value: string; expr: boolean }>;

export function svgAttrs(src: string): SvgAttrs {
  const out: SvgAttrs = {};
  for (const m of src.matchAll(ATTR)) {
    const expr = m[4] !== undefined;
    out[m[1]] = { value: (m[2] ?? m[3] ?? m[4] ?? "").trim(), expr };
  }
  return out;
}
const rootTag = (svg: string) => svg.match(/^<svg\b((?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*)>/)?.[1] ?? "";

/** SVG input the design tools cannot carry over without changing the drawing. */
export class UnsupportedSvgError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedSvgError";
  }
}

export const SHAPE_TAGS = ["path", "circle", "rect", "line", "polyline", "polygon", "ellipse"];
const TAG = /<(\/?)([a-zA-Z][\w:.-]*)((?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*?)(\/?)>/g;
const IGNORED = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<(title|desc|metadata)\b[^>]*\/>|<(title|desc|metadata)\b[\s\S]*?<\/\2>/gi;
const FLATTEN = "flatten it in the design tool (apply the transform, clip or effect to the path coordinates) and export again";
const ELEMENT_HELP: Record<string, string> = {
  use: "replace the <use> with a copy of the shapes it references",
  symbol: "replace the <symbol> with the shapes it holds",
  defs: "move visible shapes out of <defs> and delete unused definitions",
  clippath: `the clip is not carried to the outputs; ${FLATTEN}`,
  mask: `the mask is not carried to the outputs; ${FLATTEN}`,
  text: "convert the text to outlines (paths) in the design tool",
  image: "redraw the bitmap as vector shapes; bitmaps cannot be tinted or scaled exactly",
  lineargradient: "use one solid colour; the platforms tint the drawing",
  radialgradient: "use one solid colour; the platforms tint the drawing",
  pattern: "use one solid colour; the platforms tint the drawing",
  filter: "remove the filter effect",
  style: "export presentation as attributes instead of a <style> block",
  svg: "flatten the nested <svg> into the outer drawing",
};
/** Attributes whose effect would be silently lost, wherever they appear. */
const LOSSY: Record<string, string> = {
  transform: `transforms are not supported; ${FLATTEN}`,
  "clip-path": `clip-path is not supported; ${FLATTEN}`,
  mask: `mask is not supported; ${FLATTEN}`,
  filter: "filter effects are not supported; remove the effect",
  "fill-rule": 'fill-rule="evenodd" is not carried to the outputs; flatten the shape (boolean union/subtract) so it fills correctly with the default nonzero rule',
};
/** Opacity on a group is not the same as opacity on each shape where shapes overlap. (On the
 * root it is presentation, like colour: icons are tinted and faded by the platform.) */
const GROUP_LOSSY = ["opacity", "fill-opacity", "stroke-opacity"];
/** The same lossy effects set through an inline style (`style="transform: ..."` or JSX `style={{ transform }}`). */
const STYLE_LOSSY = /(?:^|[;{,\s])(transform|clip-?path|mask|filter)\s*:/i;

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
/** Presentation an inline style can set that the tools read (or must refuse). */
const STYLED = ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "fill-rule", "display", "visibility"];
/** Values that hide an element (and, for display or an inherited visibility, everything inside it). */
const HIDDEN: Record<string, string[]> = { display: ["none"], visibility: ["hidden", "collapse"] };

/**
 * Declarations of an inline style (`style="fill: none"` or JSX `style={{ fill: 'none' }}`), in
 * attribute spelling. A JSX value that is not a literal is an expression, like `fill={color}`.
 */
function styleDecls(style: { value: string; expr: boolean } | undefined): SvgAttrs {
  const out: SvgAttrs = {};
  if (!style) return out;
  const decl = style.expr ? /([A-Za-z-]+)\s*:\s*('[^']*'|"[^"]*"|[^,}]+)/g : /([A-Za-z-]+)\s*:\s*([^;]+)/g;
  for (const m of style.value.matchAll(decl)) {
    const name = kebab(m[1]).toLowerCase();
    if (!STYLED.includes(name)) continue;
    const raw = m[2].replace(/!important/i, "").trim();
    const quoted = /^(['"]).*\1$/.test(raw);
    out[name] = { value: quoted ? raw.slice(1, -1) : raw, expr: style.expr && !quoted && !/^-?[\d.]+$/.test(raw) };
  }
  return out;
}
/** An attribute in SVG (`stroke-width`) or JSX (`strokeWidth`) spelling. */
export function attr(a: SvgAttrs, name: string): { value: string; expr: boolean } | undefined {
  return a[name] ?? a[name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())];
}

export interface SvgShape {
  tag: string;
  attrs: SvgAttrs;
  /** The root, then each enclosing <g>, outermost first. */
  ancestors: SvgAttrs[];
}

/** The nearest value of a presentation attribute: the shape's own, else its groups', else the root's. */
export function inherited(shape: SvgShape, name: string): { value: string; expr: boolean } | undefined {
  const own = attr(shape.attrs, name);
  if (own) return own;
  for (let i = shape.ancestors.length - 1; i >= 0; i--) {
    const v = attr(shape.ancestors[i], name);
    if (v) return v;
  }
  return undefined;
}

function rejectLossy(a: SvgAttrs, where: string, groupLevel: boolean) {
  for (const [k, v] of Object.entries(a)) {
    const name = kebab(k);
    // Every output draws every shape, so a hidden one would appear.
    if (HIDDEN[name]?.includes(v.value.toLowerCase())) {
      throw new UnsupportedSvgError(
        `${where}: ${name}="${v.value}" hides it, but every output draws all shapes; delete the hidden shapes (or show them) in the design tool and export again`,
      );
    }
    if (name === "fill-rule" && v.value !== "evenodd") continue;
    if (LOSSY[name]) throw new UnsupportedSvgError(`${where}: ${LOSSY[name]}`);
    const styled = name === "style" ? v.value.match(STYLE_LOSSY)?.[1] : undefined;
    if (styled) throw new UnsupportedSvgError(`${where}: ${styled} in style is not supported; ${FLATTEN}`);
    if (groupLevel && GROUP_LOSSY.includes(name)) {
      throw new UnsupportedSvgError(`${where}: ${name} on a group is not carried to the outputs; set it on each shape or flatten the group in the design tool`);
    }
  }
}

function rejectPageStyled(a: SvgAttrs, where: string) {
  const cls = attr(a, "class") ?? a.className;
  if (cls) {
    throw new UnsupportedSvgError(
      `${where}: class "${cls.value}" takes its look from page CSS, which is not read; set fill and stroke as attributes in the design, or export the icon as a standalone SVG`,
    );
  }
  const style = a.style;
  if (style?.expr && !style.value.includes(":")) {
    throw new UnsupportedSvgError(`${where}: style={${style.value}} is defined elsewhere and is not read; set fill and stroke as attributes, or export the icon as a standalone SVG`);
  }
}

/**
 * Shapes of an SVG with their ancestors, for reading presentation the way SVG inherits it, with
 * inline style declarations taking precedence over attributes.
 * Anything that would change the drawing if dropped (transforms, clips, masks, filters,
 * references, text, bitmaps, group opacity, even-odd fills, hidden elements, and the same effects
 * set through an inline style) is an UnsupportedSvgError that says
 * how to fix the source. Comments, <title>, <desc>, <metadata> and editor-namespaced tags are
 * ignored. With `pageCss` (an inline SVG inside a page), shapes and groups styled by classes or by
 * a style object defined elsewhere are refused: their look comes from code the tools do not read.
 */
export function readSvg(svg: string, opts: { pageCss?: boolean } = {}): { root: SvgAttrs; shapes: SvgShape[] } {
  const text = svg.replace(IGNORED, "");
  const shapes: SvgShape[] = [];
  let root: SvgAttrs | null = null;
  const stack: SvgAttrs[] = [];
  for (const m of text.matchAll(TAG)) {
    const [, closing, rawName, attrText, selfClosing] = m;
    const name = rawName.toLowerCase();
    if (name.includes(":")) continue;
    if (closing) {
      if (name === "g") stack.pop();
      continue;
    }
    const written = svgAttrs(attrText);
    // An inline style wins over presentation attributes, as in CSS.
    const a = { ...written, ...styleDecls(attr(written, "style")) };
    if (root && opts.pageCss) rejectPageStyled(written, `<${rawName}>`);
    if (!root) {
      if (name !== "svg") throw new UnsupportedSvgError(`<${rawName}> before <svg>; the file must be one <svg> element`);
      rejectLossy(a, "<svg>", false);
      root = a;
      continue;
    }
    if (name === "g") {
      rejectLossy(a, "<g>", true);
      if (!selfClosing) stack.push(a);
      continue;
    }
    if (SHAPE_TAGS.includes(name)) {
      rejectLossy(a, `<${name}>`, false);
      shapes.push({ tag: name, attrs: a, ancestors: [root, ...stack] });
      continue;
    }
    throw new UnsupportedSvgError(
      `<${rawName}> is not supported; ${ELEMENT_HELP[name] ?? `use only ${SHAPE_TAGS.map((t) => `<${t}>`).join(", ")} inside <g>`}`,
    );
  }
  return { root: root ?? {}, shapes };
}

/**
 * Geometry-only form of an icon: viewBox, shapes and their geometry in order, fills as
 * currentColor/none. Presentation (size, class, colour, stroke width) is dropped so the same
 * drawing matches wherever it appears. Fill and stroke are read the way SVG inherits them (shape,
 * then enclosing groups, then the root). Stroke icons get the line-icon presentation; icons whose
 * every shape is filled and none stroked stay filled. Throws UnsupportedSvgError for input whose
 * drawing would change (see readSvg), including a line icon where some shapes are not stroked.
 */
export function canonicalSvg(svg: string, opts: { pageCss?: boolean } = {}): string {
  const { root, shapes: found } = readSvg(svg.trim(), opts);
  const viewBox = root.viewBox?.value ?? "0 0 24 24";
  const shapes = found.map((s) => {
    const parts = [s.tag];
    for (const k of GEOMETRY) {
      const v = s.attrs[k];
      if (v && !v.expr) parts.push(`${k}="${v.value.replace(/\s+/g, " ")}"`);
    }
    const fill = inherited(s, "fill");
    const filled = Boolean(fill && fill.value !== "none");
    // An explicit fill is kept as written; an inherited one only when it fills (absent means none).
    if (attr(s.attrs, "fill") || filled) parts.push(`fill="${filled ? "currentColor" : "none"}"`);
    const stroke = inherited(s, "stroke");
    const strokeState = !stroke ? "unset" : stroke.value === "none" ? "none" : "set";
    return { markup: `<${parts.join(" ")}/>`, filled, strokeState };
  });
  const filledOnly = shapes.length > 0 && shapes.every((s) => s.filled && s.strokeState !== "set");
  if (!filledOnly) {
    // Every output strokes each shape of a line icon. A stroke set nowhere is the line-icon
    // convention (presentation from the page); a shape left unstroked next to stroked ones is not.
    const where = (i: number) => `<${found[i].tag}> #${i + 1}`;
    const none = shapes.findIndex((s) => s.strokeState === "none");
    if (none >= 0) {
      throw new UnsupportedSvgError(
        `${where(none)} has stroke="none" in a line icon, but every output strokes each shape of a line icon; give it the icon's stroke, or outline the strokes in the design tool so the icon is fill-only`,
      );
    }
    const unset = shapes.findIndex((s) => s.strokeState === "unset");
    if (unset >= 0 && shapes.some((s) => s.strokeState === "set")) {
      throw new UnsupportedSvgError(
        `${where(unset)} has no stroke while other shapes are stroked; set the stroke on the <svg> so every shape has it, or outline the strokes in the design tool so the icon is fill-only`,
      );
    }
  }
  const presentation = filledOnly
    ? 'fill="currentColor"'
    : 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${presentation}>${shapes.map((s) => s.markup).join("")}</svg>`;
}

function strokeWidthOf(svg: string, file: string): number | null {
  const tag = rootTag(svg);
  const a = svgAttrs(tag);
  const direct = a["stroke-width"] ?? a.strokeWidth;
  if (direct && !Number.isNaN(Number(direct.value))) return Number(direct.value);
  const style = a.style;
  if (style) {
    const inline = style.value.match(/stroke-?[wW]idth\s*:\s*([\d.]+)/);
    if (inline) return Number(inline[1]);
    if (style.expr && /^\w+$/.test(style.value)) {
      const obj = file.match(new RegExp(`(?:const|let|var)\\s+${style.value}\\s*=\\s*\\{([^}]*)\\}`));
      const w = obj?.[1].match(/strokeWidth\s*:\s*([\d.]+)/);
      if (w) return Number(w[1]);
    }
  }
  for (const cls of (a.class?.value ?? a.className?.value ?? "").split(/\s+/).filter(Boolean)) {
    const rule = file.match(new RegExp(`\\.${cls.replace(/[-]/g, "\\-")}\\s*\\{([^}]*)\\}`));
    const w = rule?.[1].match(/stroke-width\s*:\s*([\d.]+)/);
    if (w) return Number(w[1]);
  }
  const child = svg.match(/stroke-width\s*=\s*"([\d.]+)"|strokeWidth\s*=\s*\{?"?([\d.]+)/);
  return child ? Number(child[1] ?? child[2]) : null;
}

// ---------- files ----------

function walk(dir: string, root = dir): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) out.push(...walk(full, root));
    } else if (DESIGN_EXT.test(name) && !TOOL_FILES.has(name)) {
      out.push(relative(root, full));
    }
  }
  return out;
}

export function extractDesign(dir: string): Extraction {
  const files = walk(dir);
  const variables = new Map<string, Set<string>>();
  const colors = new Map<string, { names: Set<string>; files: Set<string>; count: number }>();
  const fonts = new Set<string>();
  const icons = new Map<string, { svg: string; viewBox: string; widths: Set<number>; count: number; files: Set<string> }>();
  const library = new Map<string, Set<string>>();
  const rejected: Extraction["rejectedIcons"] = [];

  const addColor = (value: string, name: string, file: string) => {
    const c = colors.get(value) ?? { names: new Set(), files: new Set(), count: 0 };
    c.names.add(name);
    c.files.add(file);
    c.count++;
    colors.set(value, c);
  };
  const addVar = (name: string, value: string, file: string) => {
    if (!variables.has(name)) variables.set(name, new Set());
    variables.get(name)?.add(value);
    addColor(value, name, file);
  };
  const addLib = (lib: string, name: string) => {
    if (!library.has(lib)) library.set(lib, new Set());
    library.get(lib)?.add(name);
  };

  for (const file of files) {
    let text = readFileSync(join(dir, file), "utf8");

    for (const svg of text.match(/<svg\b[\s\S]*?<\/svg>/g) ?? []) {
      if (svg.length > 8000 || svg.includes("${")) continue;
      let canonical: string;
      try {
        canonical = canonicalSvg(svg, { pageCss: true });
      } catch (err) {
        if (!(err instanceof UnsupportedSvgError)) throw err;
        rejected.push({ file, reason: err.message });
        continue;
      }
      if (!canonical.includes("<path") && !/<(circle|rect|line|poly|ellipse)/.test(canonical)) continue;
      const entry = icons.get(canonical) ?? {
        svg: canonical,
        viewBox: svgAttrs(rootTag(svg)).viewBox?.value ?? "0 0 24 24",
        widths: new Set<number>(),
        count: 0,
        files: new Set<string>(),
      };
      const w = strokeWidthOf(svg, text);
      if (w !== null) entry.widths.add(w);
      entry.count++;
      entry.files.add(file);
      icons.set(canonical, entry);
    }
    text = text.replace(/<svg\b[\s\S]*?<\/svg>/g, (m) => m.replace(COLOR, ""));

    for (const m of text.matchAll(/<ion-icon\b[^>]*\bname="([^"]+)"/g)) addLib("ionicons", m[1]);
    for (const m of text.matchAll(/<i\b[^>]*class="[^"]*\bicon-([a-z0-9-]+)/g)) addLib("icon-font", m[1]);
    for (const m of text.matchAll(/data-lucide="([^"]+)"/g)) addLib("lucide", m[1]);
    for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/g)) {
      for (const n of m[1].split(",").map((s) => s.trim()).filter(Boolean)) addLib("lucide-react", n);
    }

    for (const m of text.matchAll(/fonts\.googleapis\.com\/css2\?family=([^:&"']+)/g)) fonts.add(decodeURIComponent(m[1].replace(/\+/g, " ")));

    const defined: [number, number][] = [];
    const dark = darkRanges(text);
    const inDark = (pos: number) => dark.some(([a, b]) => pos >= a && pos < b);
    for (const m of text.matchAll(/(--[\w-]+)\s*:\s*([^;}{]+)/g)) {
      const color = normalizeColor(m[2]);
      if (color) addVar(inDark(m.index ?? 0) ? `${m[1]} (dark)` : m[1], color, file);
      else if (/['"]|,/.test(m[2])) {
        const f = primaryFont(m[2]);
        if (f) fonts.add(f);
      }
      defined.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
    }
    for (const m of text.matchAll(/(?:const|let|var)\s+([A-Z]\w*)\s*=\s*\{([^{}]*)\}/g)) {
      for (const e of m[2].matchAll(/(\w+)\s*:\s*(['"])(.*?)\2/g)) {
        const color = normalizeColor(e[3]);
        if (color) addVar(`${m[1]}.${e[1]}`, color, file);
        else if ((/^f[A-Z]|^font(Family)?$|Font$/.test(e[1]) && /,|^['"]/.test(e[3])) || FONT_STACK.test(e[3])) {
          const f = primaryFont(e[3]);
          if (f) fonts.add(f);
        }
      }
      defined.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
    }
    for (const m of text.matchAll(/font-family\s*:\s*([^;}"\n]+)/g)) {
      const f = primaryFont(m[1]);
      if (f) fonts.add(f);
    }
    for (const m of text.matchAll(/fontFamily\s*:\s*((?:[^,}'"]|'[^']*'|"[^"]*")*)/g)) {
      for (const q of m[1].matchAll(/(["'])((?:(?!\1).)*)\1/g)) {
        const f = primaryFont(q[2]);
        if (f) fonts.add(f);
      }
    }

    const parts: string[] = [];
    let at = 0;
    for (const [a, b] of defined.sort((x, y) => x[0] - y[0])) {
      if (a < at) continue;
      parts.push(text.slice(at, a), " ".repeat(b - a));
      at = b;
    }
    parts.push(text.slice(at));
    const literals = parts.join("");
    for (const m of literals.matchAll(COLOR)) {
      const color = normalizeColor(m[0]);
      if (color) addColor(color, "(literal)", file);
    }
  }

  const vars = Object.fromEntries([...variables].map(([k, v]) => [k, [...v].sort()]));
  return {
    source: dir,
    files,
    variables: vars,
    conflicts: Object.entries(vars)
      .filter(([, v]) => v.length > 1)
      .map(([name, values]) => ({ name, values })),
    colors: [...colors].map(([value, c]) => ({ value, names: [...c.names], files: [...c.files], count: c.count })),
    fonts: [...fonts].sort(),
    icons: [...icons.values()].map((i) => ({
      id: createHash("sha1").update(i.svg).digest("hex").slice(0, 8),
      svg: i.svg,
      viewBox: i.viewBox,
      strokeWidths: [...i.widths].sort((a, b) => a - b),
      count: i.count,
      files: [...i.files],
    })),
    rejectedIcons: rejected,
    libraryIcons: Object.fromEntries([...library].map(([k, v]) => [k, [...v].sort()])),
  };
}

// ---------- Pencil ----------

export interface PenExtraction {
  source: string;
  variables: Record<string, { type: string; value: unknown }>;
  themes: unknown;
  iconLibraries: Record<string, string[]>;
  iconCount: number;
  rawColors: { value: string; count: number }[];
}

export function extractPen(file: string): PenExtraction {
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const variables: PenExtraction["variables"] = {};
  for (const [name, v] of Object.entries<{ type: string; value: unknown }>(doc.variables ?? {})) {
    const value = v.type === "color" && typeof v.value === "string" ? (normalizeColor(v.value) ?? v.value) : v.value;
    variables[name] = { type: v.type, value };
  }
  const libs = new Map<string, Set<string>>();
  const raw = new Map<string, number>();
  let iconCount = 0;
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "icon" || n.type === "icon_font") {
      iconCount++;
      const lib = String(n.library ?? n.iconFontFamily ?? "unknown");
      if (!libs.has(lib)) libs.set(lib, new Set());
      libs.get(lib)?.add(String(n.icon ?? n.iconFontName ?? n.name));
    }
    for (const key of ["fill", "stroke", "color"]) {
      const v = n[key];
      if (typeof v === "string" && v.startsWith("#")) {
        const c = normalizeColor(v) ?? v.toLowerCase();
        raw.set(c, (raw.get(c) ?? 0) + 1);
      }
    }
    for (const [k, v] of Object.entries(n)) if (k !== "variables" && typeof v === "object") visit(v);
  };
  visit(doc.children ?? []);
  return {
    source: file,
    variables,
    themes: doc.themes ?? null,
    iconLibraries: Object.fromEntries([...libs].map(([k, v]) => [k, [...v].sort()])),
    iconCount,
    rawColors: [...raw].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
  };
}

// ---------- drift ----------

export interface Frozen {
  colors: string[];
  icons: string[];
}

/** What a new export contains that the frozen design/ set does not. */
export function diffExtraction(x: Extraction, frozen: Frozen) {
  const colors = new Set(frozen.colors.map((c) => normalizeColor(c) ?? c));
  const icons = new Set(frozen.icons.map((svg) => canonicalSvg(svg)));
  return {
    newColors: x.colors.map((c) => c.value).filter((v) => !colors.has(v)).sort(),
    newIcons: x.icons.filter((i) => !icons.has(i.svg)),
  };
}
