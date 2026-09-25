#!/usr/bin/env bun
/**
 * ds-tokens: generate a consumer-owned theme against the DesignSystem role contract.
 *
 *   ds-tokens css <theme.json> <out.css>          write Tailwind v4 CSS for the theme
 *   ds-tokens css <theme.json> <out.css> --check  exit 1 if out.css is stale
 *
 * The theme file has the same shape as DesignSystem's tokens/themes/*.json. It is validated
 * against the base.json shipped with this package: every role, no unknown roles or scale keys.
 * Commit the output and run --check in CI.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { type Base, resolveTheme, type ThemeSource, themeCss } from "./build";

const BASE = join(import.meta.dir, "../generated/base.json");
const USAGE = "usage: ds-tokens css <theme.json> <out.css> [--check]";

export function generateCss(themePath: string, outPath: string, cwd = process.cwd()): string {
  const base = JSON.parse(readFileSync(BASE, "utf8")) as Base;
  const src = JSON.parse(readFileSync(resolve(cwd, themePath), "utf8")) as ThemeSource;
  const source = relative(dirname(resolve(cwd, outPath)), resolve(cwd, themePath)) || themePath;
  return themeCss(base, resolveTheme(src, base), source);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const [command, themePath, outPath] = args.filter((a) => a !== "--check");
  if (command !== "css" || !themePath || !outPath) {
    console.error(USAGE);
    process.exit(2);
  }
  let css: string;
  try {
    css = generateCss(themePath, outPath);
  } catch (err) {
    console.error(`ds-tokens: ${(err as Error).message}`);
    process.exit(1);
  }
  const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
  if (check) {
    if (current !== css) {
      console.error(`ds-tokens: ${outPath} is stale (run: ds-tokens css ${themePath} ${outPath})`);
      process.exit(1);
    }
    console.log(`${outPath} up to date`);
  } else if (current !== css) {
    mkdirSync(dirname(resolve(outPath)), { recursive: true });
    writeFileSync(outPath, css);
    console.log(`wrote ${outPath}`);
  }
}
