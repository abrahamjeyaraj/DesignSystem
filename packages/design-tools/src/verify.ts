/**
 * Pixel check for ds-icons: read every generated platform file back from disk, turn it into an
 * SVG, and render it next to the untouched source SVG in Chromium at several sizes. An output
 * passes when almost none of the source's inked pixels differ. This proves the copy is exact
 * without trusting the generator.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Browser, chromium } from "playwright-core";
import { iconFileNames, type Manifest, selectIcons, sourcePath } from "./icons";

export interface VerifyResult {
  icon: string;
  platform: string;
  size: number;
  diff: number;
}

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
function referenceSvg(raw: string, stroke: number): string {
  const svg = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  return svg.replace(/<svg\b([^>]*)>/, (_, a: string) => {
    const kept = a
      .replace(/\s(width|height|class|stroke-width)="[^"]*"/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return `<svg ${kept} stroke-width="${stroke}">`;
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
  const shapes = [...line.matchAll(/S\("((?:[^"\\]|\\.)*)"((?:, \w+ = [^,)]+)*)\)/g)].map((m) => {
    const filled = /filled = true/.test(m[2]);
    const alpha = m[2].match(/alpha = ([\d.]+)f/)?.[1];
    const parts = [`d="${m[1].replace(/\\\$/g, "$")}"`, `fill="${filled ? "#000000" : "none"}"`];
    if (stroked) parts.push(`stroke="#000000" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"`);
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
async function loadWeb(path: string): Promise<Record<string, WebIcon> | null> {
  const text = read(path);
  if (!text) return null;
  const js = new Bun.Transpiler({ loader: "ts" }).transformSync(text);
  const tmp = join(mkdtempSync(join(tmpdir(), "ds-verify-web-")), "icons.mjs");
  writeFileSync(tmp, js);
  return (await import(tmp)).icons;
}
function webToSvg(i: WebIcon): string {
  const root = i.filled
    ? 'fill="currentColor"'
    : `fill="none" stroke="currentColor" stroke-width="${i.stroke}" stroke-linecap="round" stroke-linejoin="round"`;
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

/** Renders each pair on white and returns the share of the source's inked pixels that differ. */
async function compare(browser: Browser, pairs: Pair[]): Promise<number[]> {
  const page = await browser.newPage();
  await page.setContent("<!doctype html><body></body>");
  const url = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const diffs = await page.evaluate(
    async (items) => {
      const load = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("image failed to load"));
          img.src = src;
        });
      const pixels = (img: HTMLImageElement, size: number) => {
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const d = ctx.getImageData(0, 0, size, size).data;
        const lum = new Float32Array(size * size);
        for (let i = 0; i < lum.length; i++) lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        return lum;
      };
      const out: number[] = [];
      for (const it of items) {
        try {
          const [a, b] = [pixels(await load(it.a), it.size), pixels(await load(it.b), it.size)];
          let ink = 0;
          let diff = 0;
          for (let i = 0; i < a.length; i++) {
            if (a[i] < 250 || b[i] < 250) ink++;
            if (Math.abs(a[i] - b[i]) > 64) diff++;
          }
          out.push(diff / Math.max(ink, 1));
        } catch {
          out.push(1);
        }
      }
      return out;
    },
    pairs.map((p) => ({ a: url(p.source), b: url(p.output), size: p.size })),
  );
  await page.close();
  return diffs;
}

export async function verifyIcons(
  manifestPath: string,
  opts: { sizes?: number[]; threshold?: number; sheet?: string } = {},
): Promise<{ results: VerifyResult[]; failures: VerifyResult[] }> {
  const sizes = opts.sizes ?? [16, 24, 48];
  const threshold = opts.threshold ?? 0.03;
  const { manifest, dir, selected } = selectIcons(manifestPath);
  const o: NonNullable<Manifest["outputs"]> = manifest.outputs ?? {};
  const kt = o.compose ? read(join(dir, o.compose.file)) : null;
  const sprite = o.sprite ? read(join(dir, o.sprite)) : null;
  const web = o.web ? await loadWeb(join(dir, o.web)) : null;

  const pairs: Pair[] = [];
  for (const icon of selected) {
    const source = referenceSvg(readFileSync(sourcePath(manifest, dir, manifest.icons[icon.name]), "utf8"), icon.stroke);
    const outputs: Record<string, string | null> = {};
    if (o.ios) outputs.ios = read(join(dir, o.ios, `${iconFileNames.asset(icon.name)}.imageset`, `${iconFileNames.asset(icon.name)}.svg`));
    if (o.flutter) outputs.flutter = read(join(dir, o.flutter.dir, `${icon.name}.svg`));
    if (o.android) {
      const xml = read(join(dir, o.android, `${iconFileNames.res(icon.name)}.xml`));
      outputs.android = xml && androidToSvg(xml);
    }
    if (kt !== null) outputs.compose = composeToSvg(kt, icon.name);
    if (sprite !== null) outputs.sprite = spriteToSvg(sprite, icon.name);
    if (web) outputs.web = web[icon.name] ? webToSvg(web[icon.name]) : null;
    for (const [platform, output] of Object.entries(outputs)) {
      for (const size of sizes) pairs.push({ icon: icon.name, platform, size, source, output: output ?? "<svg/>" });
    }
  }

  const executablePath = findChromium();
  if (!executablePath) throw new Error("no Chromium found (set DS_CHROMIUM to a Chromium binary)");
  const browser = await chromium.launch({ executablePath });
  let diffs: number[];
  try {
    diffs = await compare(browser, pairs);
  } finally {
    await browser.close();
  }
  const results = pairs.map((p, i) => ({ icon: p.icon, platform: p.platform, size: p.size, diff: diffs[i] }));
  if (opts.sheet) writeFileSync(opts.sheet, contactSheet(pairs, results));
  return { results, failures: results.filter((r) => r.diff > threshold) };
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
