#!/usr/bin/env bun
/**
 * ds-tokens: generate a consumer-owned theme against the DesignSystem role contract.
 *
 *   ds-tokens css <theme.json> <out.css>                       Tailwind v4 CSS
 *   ds-tokens swift <theme.json> <out.swift>                   `DSThemeTokens.<name>` for SwiftUI
 *   ds-tokens kotlin <theme.json> <out.kt> --package <pkg>     `<Name>Theme` for Compose
 *
 * Add --check to any command to exit 1 when the committed output is stale.
 *
 * The theme file has the same shape as DesignSystem's tokens/themes/*.json. It is validated
 * against the base.json shipped with this package: every role, no unknown roles or scale keys.
 * Commit the output and run --check in CI.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { type Base, kotlinTheme, resolveTheme, swiftTheme, type ThemeSource, themeCss } from "./build";

const BASE = join(import.meta.dir, "../generated/base.json");
const USAGE = `usage: ds-tokens css <theme.json> <out.css> [--check]
       ds-tokens swift <theme.json> <out.swift> [--check]
       ds-tokens kotlin <theme.json> <out.kt> --package <pkg> [--check]`;

export type Target = "css" | "swift" | "kotlin";

export function generate(target: Target, themePath: string, outPath: string, opts: { cwd?: string; pkg?: string } = {}): string {
  const cwd = opts.cwd ?? process.cwd();
  const base = JSON.parse(readFileSync(BASE, "utf8")) as Base;
  const src = JSON.parse(readFileSync(resolve(cwd, themePath), "utf8")) as ThemeSource;
  const source = relative(dirname(resolve(cwd, outPath)), resolve(cwd, themePath)) || themePath;
  const theme = resolveTheme(src, base);
  if (target === "swift") return swiftTheme(theme, source);
  if (target === "kotlin") {
    if (!opts.pkg) throw new Error("kotlin needs --package <pkg>");
    return kotlinTheme(theme, source, opts.pkg);
  }
  return themeCss(base, theme, source);
}

export const generateCss = (themePath: string, outPath: string, cwd = process.cwd()) =>
  generate("css", themePath, outPath, { cwd });

if (import.meta.main) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const p = args.indexOf("--package");
  const pkg = p >= 0 ? args[p + 1] : undefined;
  const [command, themePath, outPath] = args.filter((a, i) => a !== "--check" && (p < 0 || (i !== p && i !== p + 1)));
  if (!["css", "swift", "kotlin"].includes(command ?? "") || !themePath || !outPath) {
    console.error(USAGE);
    process.exit(2);
  }
  let output: string;
  try {
    output = generate(command as Target, themePath, outPath, { pkg });
  } catch (err) {
    console.error(`ds-tokens: ${(err as Error).message}`);
    process.exit(1);
  }
  const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
  if (check) {
    if (current !== output) {
      console.error(`ds-tokens: ${outPath} is stale (run: ds-tokens ${args.filter((a) => a !== "--check").join(" ")})`);
      process.exit(1);
    }
    console.log(`${outPath} up to date`);
  } else if (current !== output) {
    mkdirSync(dirname(resolve(outPath)), { recursive: true });
    writeFileSync(outPath, output);
    console.log(`wrote ${outPath}`);
  }
}
