/**
 * Pixel check for ds-icons: read every generated platform file back from disk, turn it into an
 * SVG, and render it next to the untouched source SVG in Chromium at several sizes. An output
 * passes when almost none of the source's inked pixels differ. This proves the copy is exact
 * without trusting the generator.
 *
 * Every output icons.json configures must exist and hold every shipped icon: a missing file or
 * entry is a failure with a reason, never a skipped comparison (checkOutputs, no browser needed).
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { type Browser, chromium } from "playwright-core";
import { type IconDef, iconFileNames, type Manifest, selectIcons, sourcePath } from "./icons";

export interface VerifyResult {
  icon: string;
  platform: string;
  /** Rendered size in px; 0 for a structural problem found without rendering. */
  size: number;
  diff: number;
  /** Why an output failed without (or before) a pixel comparison. */
  reason?: string;
}

/** Each rendered pixel is the mean of SCALE x SCALE samples, so the comparison measures how much
 * of each pixel the drawing covers rather than how one rasterizer antialiases one shape type
 * (Skia draws <circle> and the equivalent arc path with different edge coverage on some GPUs). */
const SCALE = 8;
/** Software rendering, the same on every machine; GPU raster differs between hosts. */
const CHROMIUM_ARGS = ["--disable-gpu", "--disable-gpu-rasterization", "--disable-accelerated-2d-canvas", "--force-color-profile=srgb"];

const CANDIDATES = [process.env.DS_CHROMIUM, "/opt/pw-browsers/chromium", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"];

export function findChromium(): string | null {
  for (const c of CANDIDATES) if (c && existsSync(c)) return c;
  try {
    const p = chromium.executablePath();
    return existsSync(p) ? p : null;
  } catch {
    return null;
  }
}

const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const xmlAttrs = (s: string) => Object.fromEntries([...s.matchAll(/([\w:]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

/** Source SVG as the designer drew it, with only the set's stroke width applied. */
function referenceSvg(raw: string, icon: { stroke: number; linecap: string; linejoin: string }): string {
  const svg = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  return svg.replace(/<svg\b([^>]*)>/, (_, a: string) => {
    const kept = a
      .replace(/\s(width|height|class|stroke-width|stroke-linecap|stroke-linejoin)="[^"]*"/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return `<svg ${kept} stroke-width="${icon.stroke}" stroke-linecap="${icon.linecap}" stroke-linejoin="${icon.linejoin}">`;
  });
}

function androidToSvg(xml: string): string {
  const root = xmlAttrs(xml.match(/<vector\b([^>]*)>/)?.[1] ?? "");
  const paths = [...xml.matchAll(/<path\b([^>]*)\/>/g)].map((m) => {
    const a = xmlAttrs(m[1]);
    const color = (c?: string) => (c ? `#${c.slice(-6)}` : "none");
    const parts = [`d="${a["android:pathData"]}"`, `fill="${color(a["android:fillColor"])}"`];
    if (a["android:strokeColor"]) {
      parts.push(`stroke="${color(a["android:strokeColor"])}"`, `stroke-width="${a["android:strokeWidth"] ?? 0}"`);
      parts.push(`stroke-linecap="${a["android:strokeLineCap"] ?? "butt"}"`, `stroke-linejoin="${a["android:strokeLineJoin"] ?? "miter"}"`);
    }
    if (a["android:fillAlpha"]) parts.push(`fill-opacity="${a["android:fillAlpha"]}"`, `stroke-opacity="${a["android:strokeAlpha"] ?? 1}"`);
    return `<path ${parts.join(" ")}/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${root["android:viewportWidth"]} ${root["android:viewportHeight"]}">${paths.join("")}</svg>`;
}

function composeToSvg(kt: string, name: string): string | null {
  const stroke = Number(kt.match(/private const val STROKE = ([\d.]+)f/)?.[1]);
  const grid = Number(kt.match(/private const val GRID = ([\d.]+)f/)?.[1]);
  const line = kt.split("\n").find((l) => l.includes(`icon("${name}", `));
  if (!line) return null;
  const stroked = line.includes(`icon("${name}", true,`);
  const cap = (kt.match(/StrokeCap\.(\w+)/)?.[1] ?? "Round").toLowerCase();
  const join = (kt.match(/StrokeJoin\.(\w+)/)?.[1] ?? "Round").toLowerCase();
  const shapes = [...line.matchAll(/S\("((?:[^"\\]|\\.)*)"((?:, \w+ = [^,)]+)*)\)/g)].map((m) => {
    const filled = /filled = true/.test(m[2]);
    const alpha = m[2].match(/alpha = ([\d.]+)f/)?.[1];
    const parts = [`d="${m[1].replace(/\\\$/g, "$")}"`, `fill="${filled ? "#000000" : "none"}"`];
    if (stroked) parts.push(`stroke="#000000" stroke-width="${stroke}" stroke-linecap="${cap}" stroke-linejoin="${join}"`);
    if (alpha) parts.push(`opacity="${alpha}"`);
    return `<path ${parts.join(" ")}/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid} ${grid}">${shapes.join("")}</svg>`;
}

function spriteToSvg(sprite: string, name: string): string | null {
  const m = sprite.match(new RegExp(`<symbol id="${name}"([^>]*)>([\\s\\S]*?)</symbol>`));
  return m ? `<svg xmlns="http://www.w3.org/2000/svg"${m[1]}>${m[2]}</svg>` : null;
}

type WebIcon = { viewBox: string; stroke: number; filled: boolean; shapes: [string, Record<string, string>, boolean][] };
type WebStyle = { linecap: string; linejoin: string };
async function loadWeb(path: string): Promise<{ icons: Record<string, WebIcon>; iconStyle: WebStyle } | null> {
  const text = read(path);
  if (!text) return null;
  const js = new Bun.Transpiler({ loader: "ts" }).transformSync(text);
  const tmp = join(mkdtempSync(join(tmpdir(), "ds-verify-web-")), "icons.mjs");
  writeFileSync(tmp, js);
  return await import(tmp);
}
function webToSvg(i: WebIcon, style: WebStyle): string {
  const root = i.filled
    ? 'fill="currentColor"'
    : `fill="none" stroke="currentColor" stroke-width="${i.stroke}" stroke-linecap="${style.linecap}" stroke-linejoin="${style.linejoin}"`;
  const body = i.shapes
    .map(([tag, a, filled]) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(" ")}${filled && !i.filled ? ' fill="currentColor"' : ""}/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${i.viewBox}" ${root}>${body}</svg>`;
}

interface Pair {
  icon: string;
  platform: string;
  size: number;
  source: string;
  output: string;
}

interface Rendered {
  diff: number;
  sourceInk: number;
  outputInk: number;
  error?: string;
}

/**
 * Renders each pair on white at SCALE times the size, averages each SCALE x SCALE block into one
 * pixel, and returns the share of inked pixels whose luminance differs by more than a quarter.
 */
async function compare(browser: Browser, pairs: Pair[]): Promise<Rendered[]> {
  const page = await browser.newPage();
  await page.setContent("<!doctype html><body></body>");
  const url = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const rendered = await page.evaluate(
    async ({ items, scale }) => {
      const load = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("image failed to load"));
          img.src = src;
        });
      const pixels = (img: HTMLImageElement, size: number) => {
        const big = size * scale;
        const c = document.createElement("canvas");
        c.width = c.height = big;
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, big, big);
        ctx.drawImage(img, 0, 0, big, big);
        const d = ctx.getImageData(0, 0, big, big).data;
        const lum = new Float32Array(size * size);
        for (let y = 0; y < big; y++) {
          for (let x = 0; x < big; x++) {
            const i = (y * big + x) * 4;
            lum[Math.floor(y / scale) * size + Math.floor(x / scale)] += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          }
        }
        for (let i = 0; i < lum.length; i++) lum[i] /= scale * scale;
        return lum;
      };
      const out: { diff: number; sourceInk: number; outputInk: number; error?: string }[] = [];
      for (const it of items) {
        try {
          const [a, b] = [pixels(await load(it.a), it.size), pixels(await load(it.b), it.size)];
          let ink = 0;
          let sourceInk = 0;
          let outputInk = 0;
          let diff = 0;
          for (let i = 0; i < a.length; i++) {
            if (a[i] < 250) sourceInk++;
            if (b[i] < 250) outputInk++;
            if (a[i] < 250 || b[i] < 250) ink++;
            if (Math.abs(a[i] - b[i]) > 64) diff++;
          }
          out.push({ diff: diff / Math.max(ink, 1), sourceInk, outputInk });
        } catch (err) {
          out.push({ diff: 1, sourceInk: 0, outputInk: 0, error: String((err as Error).message ?? err) });
        }
      }
      return out;
    },
    { items: pairs.map((p) => ({ a: url(p.source), b: url(p.output), size: p.size })), scale: SCALE },
  );
  await page.close();
  return rendered;
}

const problem = (platform: string, icon: string, reason: string): VerifyResult => ({ icon, platform, size: 0, diff: 1, reason });
const missing = (dir: string, path: string) => `${relative(dir, path)} is missing; run ds-icons build`;

/** The rendered outputs to compare per icon, and every structural problem with the outputs. */
async function collect(manifestPath: string) {
  const { manifest, dir, selected } = selectIcons(manifestPath);
  const web = manifest.outputs?.web ? await loadWeb(join(dir, manifest.outputs.web)) : null;
  const o: NonNullable<Manifest["outputs"]> = manifest.outputs ?? {};
  const problems: VerifyResult[] = [];
  const whole = (platform: string, path: string): string | null => {
    const text = read(path);
    if (text === null) problems.push(problem(platform, "*", missing(dir, path)));
    return text;
  };

  const kt = o.compose ? whole("compose", join(dir, o.compose.file)) : null;
  if (kt !== null && o.compose) {
    if (!kt.includes(`package ${o.compose.package}\n`)) problems.push(problem("compose", "*", `${o.compose.file} is not in package ${o.compose.package}`));
    const grid = Number(kt.match(/private const val GRID = ([\d.]+)f/)?.[1]);
    if (grid !== manifest.style.grid) problems.push(problem("compose", "*", `${o.compose.file} has GRID ${grid}, icons.json has ${manifest.style.grid}`));
  }
  const sprite = o.sprite ? whole("sprite", join(dir, o.sprite)) : null;
  if (o.web && web === null) problems.push(problem("web", "*", missing(dir, join(dir, o.web))));
  const swift = o.iosSwift ? whole("ios-swift", join(dir, o.iosSwift)) : null;
  const dart = o.flutter ? whole("flutter-dart", join(dir, o.flutter.dart)) : null;

  const outputs = new Map<string, Record<string, string>>();
  for (const icon of selected) {
    const out: Record<string, string> = {};
    const add = (platform: string, svg: string | null, reason: string) => {
      if (svg === null) problems.push(problem(platform, icon.name, reason));
      else out[platform] = svg;
    };
    if (o.ios) {
      const set = join(dir, o.ios, `${iconFileNames.asset(icon.name)}.imageset`);
      const svgPath = join(set, `${iconFileNames.asset(icon.name)}.svg`);
      add("ios", read(svgPath), missing(dir, svgPath));
      const contents = read(join(set, "Contents.json"));
      const reason = imagesetProblem(contents, `${iconFileNames.asset(icon.name)}.svg`);
      if (reason) problems.push(problem("ios", icon.name, `${relative(dir, join(set, "Contents.json"))}: ${reason}`));
    }
    if (o.flutter) {
      const svgPath = join(dir, o.flutter.dir, `${icon.name}.svg`);
      add("flutter", read(svgPath), missing(dir, svgPath));
      const asset = `'${o.flutter.assetPrefix ?? "assets/ds_icons"}/${icon.name}.svg'`;
      if (dart !== null && !dart.includes(asset)) problems.push(problem("flutter-dart", icon.name, `${o.flutter.dart} has no entry for ${asset}`));
    }
    if (o.android) {
      const xmlPath = join(dir, o.android, `${iconFileNames.res(icon.name)}.xml`);
      const xml = read(xmlPath);
      const reason = xml === null ? missing(dir, xmlPath) : vectorProblem(xml, icon);
      if (reason) problems.push(problem("android", icon.name, xml === null ? reason : `${relative(dir, xmlPath)}: ${reason}`));
      else out.android = androidToSvg(xml as string);
    }
    if (kt !== null) add("compose", composeToSvg(kt, icon.name), `${o.compose?.file} has no DSIcons.${iconFileNames.kotlin(icon.name)}`);
    if (sprite !== null) add("sprite", spriteToSvg(sprite, icon.name), `${o.sprite} has no <symbol id="${icon.name}">`);
    if (web) add("web", web.icons[icon.name] ? webToSvg(web.icons[icon.name], web.iconStyle) : null, `${o.web} has no entry for "${icon.name}"`);
    if (swift !== null && !swift.includes(`= "${iconFileNames.asset(icon.name)}"`)) {
      problems.push(problem("ios-swift", icon.name, `${o.iosSwift} has no case for "${iconFileNames.asset(icon.name)}"`));
    }
    outputs.set(icon.name, out);
  }
  return { manifest, dir, selected, outputs, problems };
}

/** An asset catalog entry must point at the SVG and keep it a tintable vector. */
function imagesetProblem(contents: string | null, file: string): string | null {
  if (contents === null) return "missing; run ds-icons build";
  let json: { images?: { filename?: string }[]; properties?: Record<string, unknown> };
  try {
    json = JSON.parse(contents);
  } catch {
    return "is not valid JSON";
  }
  if (json.images?.[0]?.filename !== file) return `does not reference ${file}`;
  if (json.properties?.["template-rendering-intent"] !== "template") return "is not a template image, so it cannot be tinted";
  if (json.properties?.["preserves-vector-representation"] !== true) return "does not preserve the vector representation";
  return null;
}

/** A VectorDrawable must be on the icon grid and draw something. */
function vectorProblem(xml: string, icon: IconDef): string | null {
  const root = xmlAttrs(xml.match(/<vector\b([^>]*)>/)?.[1] ?? "");
  const grid = String(icon.grid);
  if (root["android:viewportWidth"] !== grid || root["android:viewportHeight"] !== grid) {
    return `viewport is ${root["android:viewportWidth"]}x${root["android:viewportHeight"]}, the icon grid is ${grid}`;
  }
  const paths = [...xml.matchAll(/<path\b([^>]*)\/>/g)];
  if (paths.length !== icon.shapes.length) return `has ${paths.length} path(s), the source has ${icon.shapes.length} shape(s)`;
  return null;
}

/** Structural problems with the generated outputs (missing files, entries or settings), without a browser. */
export async function checkOutputs(manifestPath: string): Promise<VerifyResult[]> {
  return (await collect(manifestPath)).problems;
}

export async function verifyIcons(
  manifestPath: string,
  opts: { sizes?: number[]; threshold?: number; sheet?: string } = {},
): Promise<{ results: VerifyResult[]; failures: VerifyResult[] }> {
  const sizes = opts.sizes ?? [16, 24, 48];
  const threshold = opts.threshold ?? 0.03;
  const { manifest, dir, selected, outputs, problems } = await collect(manifestPath);

  const pairs: Pair[] = [];
  for (const icon of selected) {
    const source = referenceSvg(readFileSync(sourcePath(manifest, dir, manifest.icons[icon.name]), "utf8"), icon);
    for (const [platform, output] of Object.entries(outputs.get(icon.name) ?? {})) {
      for (const size of sizes) pairs.push({ icon: icon.name, platform, size, source, output });
    }
  }

  const executablePath = findChromium();
  if (!executablePath) throw new Error("no Chromium found (set DS_CHROMIUM to a Chromium binary)");
  const browser = await chromium.launch({ executablePath, args: CHROMIUM_ARGS });
  let rendered: Rendered[];
  try {
    rendered = await compare(browser, pairs);
  } finally {
    await browser.close();
  }
  const results: VerifyResult[] = pairs.map((p, i) => {
    const r = rendered[i];
    const base = { icon: p.icon, platform: p.platform, size: p.size, diff: r.diff };
    if (r.error) return { ...base, diff: 1, reason: `could not render: ${r.error}` };
    if (r.sourceInk === 0) return { ...base, diff: 1, reason: "the source renders blank" };
    if (r.outputInk === 0) return { ...base, diff: 1, reason: "the output renders blank" };
    return base;
  });
  if (opts.sheet) writeFileSync(opts.sheet, contactSheet(pairs, results));
  const all = [...problems, ...results];
  return { results: all, failures: all.filter((r) => r.reason !== undefined || r.diff > threshold) };
}

function contactSheet(pairs: Pair[], results: VerifyResult[]): string {
  const url = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const largest = Math.max(...pairs.map((p) => p.size));
  const rows = new Map<string, string[]>();
  pairs.forEach((p, i) => {
    if (p.size !== largest) return;
    const cells = rows.get(p.icon) ?? [`<td><img src="${url(p.source)}" width="${largest}" height="${largest}"><br>source</td>`];
    const d = results[i].diff;
    cells.push(`<td class="${d > 0.03 ? "bad" : ""}"><img src="${url(p.output)}" width="${largest}" height="${largest}"><br>${p.platform} ${(d * 100).toFixed(1)}%</td>`);
    rows.set(p.icon, cells);
  });
  return `<!doctype html><meta charset="utf-8"><title>Icon check</title>
<style>body{font:13px system-ui;margin:16px;background:#fff;color:#111}td{padding:8px;text-align:center;border:1px solid #ddd}.bad{background:#fdd}</style>
<table>${[...rows].map(([icon, cells]) => `<tr><th>${icon}</th>${cells.join("")}</tr>`).join("\n")}</table>
`;
}
