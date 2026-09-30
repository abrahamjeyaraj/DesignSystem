#!/usr/bin/env bun
/**
 * ds-extract: list what a design-tool export contains, so it can be frozen into design/.
 *
 *   ds-extract <claude-design-dir | file.pen> --out report.json
 *              [--candidates <dir>]   write one canonical SVG per distinct icon + index.json
 *              [--theme <theme.json>] report colours the frozen theme does not have (drift)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { diffExtraction, type Extraction, extractDesign, extractPen } from "./extract";
import { themeColors } from "./theme-colors";

const USAGE = "usage: ds-extract <claude-design-dir | file.pen> --out report.json [--candidates dir] [--theme theme.json]";

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function write(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function summary(x: Extraction): string {
  const lines = [`${x.files.length} design files`, `${x.colors.length} colours, ${Object.keys(x.variables).length} named`];
  if (x.conflicts.length) {
    lines.push(`${x.conflicts.length} name(s) with different values across files:`);
    for (const c of x.conflicts) lines.push(`  ${c.name}: ${c.values.join(", ")}`);
  }
  lines.push(`fonts: ${x.fonts.join(", ") || "none"}`);
  const widths = new Map<string, number>();
  for (const i of x.icons) {
    const key = i.strokeWidths.length ? i.strokeWidths.join("/") : "unknown";
    widths.set(key, (widths.get(key) ?? 0) + i.count);
  }
  lines.push(`${x.icons.length} distinct inline icons; stroke widths: ${[...widths].map(([w, n]) => `${w} x${n}`).join(", ") || "none"}`);
  for (const [lib, names] of Object.entries(x.libraryIcons)) lines.push(`library ${lib}: ${names.join(", ")}`);
  return lines.join("\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const input = args[0];
  const out = option(args, "--out");
  if (!input || input.startsWith("--") || !out) {
    console.error(USAGE);
    process.exit(2);
  }
  try {
    if (input.endsWith(".pen")) {
      const p = extractPen(input);
      write(out, `${JSON.stringify(p, null, 2)}\n`);
      console.log(`${Object.keys(p.variables).length} variables, ${p.iconCount} icons, ${p.rawColors.length} raw colours`);
      for (const [lib, names] of Object.entries(p.iconLibraries)) console.log(`library ${lib}: ${names.length} icons`);
    } else {
      const x = extractDesign(input);
      const report: Record<string, unknown> = { ...x };
      const theme = option(args, "--theme");
      if (theme) {
        const drift = diffExtraction(x, { colors: themeColors(theme), icons: [] });
        report.drift = { theme, newColors: drift.newColors };
      }
      const candidates = option(args, "--candidates");
      if (candidates) {
        for (const icon of x.icons) write(join(candidates, `${icon.id}.svg`), `${icon.svg}\n`);
        const index = x.icons.map(({ id, count, files, strokeWidths }) => ({ id, count, files, strokeWidths }));
        write(join(candidates, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
      }
      write(out, `${JSON.stringify(report, null, 2)}\n`);
      console.log(summary(x));
      if (theme) console.log(`colours not in ${theme}: ${(report.drift as { newColors: string[] }).newColors.join(", ") || "none"}`);
    }
  } catch (err) {
    console.error(`ds-extract: ${(err as Error).message}`);
    process.exit(1);
  }
}
