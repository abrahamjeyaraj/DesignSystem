#!/usr/bin/env bun
/**
 * ds-tokens: generate a consumer-owned theme against the DesignSystem role contract.
 *
 *   ds-tokens css <theme.json> <out.css>          write Tailwind v4 CSS for the theme
 *   ds-tokens css <theme.json> <out.css> --check  exit 1 if out.css is stale
 *   ds-tokens validate <theme.json>               list contract errors, exit 1 if any
 *   ds-tokens migrate <legacy.json> <theme.json>  convert a legacy theme to DTCG
 *   ds-tokens contrast <theme.json> [--strict]    WCAG AA text/surface report; --strict exits 1 on failure
 *
 * The theme is either DTCG (the standard's design/theme.json) or the legacy shape of
 * DesignSystem's tokens/themes/*.json. Either way it is validated against the base.json shipped
 * with this package. Commit the output and run --check in CI.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { type Base, resolveTheme, type ThemeSource, themeCss } from "./build";
import { type ContrastResult, checkContrast, formatContrast } from "./contrast";
import { fromDtcg, isDtcg, toDtcg, validateDtcg } from "./dtcg";

const BASE = join(import.meta.dir, "../generated/base.json");
const USAGE = [
  "usage: ds-tokens css <theme.json> <out.css> [--check]",
  "       ds-tokens validate <theme.json>",
  "       ds-tokens migrate <legacy.json> <theme.json>",
  "       ds-tokens contrast <theme.json> [--strict]",
].join("\n");

const loadBase = () => JSON.parse(readFileSync(BASE, "utf8")) as Base;

/** Reads a theme file in either format and returns the legacy source the generator uses. */
export function readTheme(themePath: string, base: Base, cwd = process.cwd()): ThemeSource {
  const doc = JSON.parse(readFileSync(resolve(cwd, themePath), "utf8"));
  if (!isDtcg(doc)) return doc as ThemeSource;
  const errors = validateDtcg(doc, base);
  if (errors.length) throw new Error(`${themePath} is not a valid theme:\n  ${errors.join("\n  ")}`);
  return fromDtcg(doc);
}

export function generateCss(themePath: string, outPath: string, cwd = process.cwd()): string {
  const base = loadBase();
  const src = readTheme(themePath, base, cwd);
  const source = relative(dirname(resolve(cwd, outPath)), resolve(cwd, themePath)) || themePath;
  return themeCss(base, resolveTheme(src, base), source);
}

function writeIfChanged(outPath: string, content: string, check: boolean, hint: string) {
  const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : null;
  if (check) {
    if (current !== content) {
      console.error(`ds-tokens: ${outPath} is stale (run: ${hint})`);
      process.exit(1);
    }
    console.log(`${outPath} up to date`);
  } else if (current !== content) {
    mkdirSync(dirname(resolve(outPath)), { recursive: true });
    writeFileSync(outPath, content);
    console.log(`wrote ${outPath}`);
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const [command, input, output] = args.filter((a) => !a.startsWith("--"));
  const fail = (err: unknown): never => {
    console.error(`ds-tokens: ${(err as Error).message}`);
    process.exit(1);
  };

  if (command === "css" && input && output) {
    let css = "";
    try {
      css = generateCss(input, output);
    } catch (err) {
      fail(err);
    }
    writeIfChanged(output, css, check, `ds-tokens css ${input} ${output}`);
  } else if (command === "validate" && input) {
    const base = loadBase();
    const doc = JSON.parse(readFileSync(input, "utf8"));
    const errors = isDtcg(doc) ? validateDtcg(doc, base) : [];
    if (!isDtcg(doc)) {
      try {
        resolveTheme(doc, base);
      } catch (err) {
        errors.push((err as Error).message);
      }
    }
    if (errors.length) {
      console.error(`ds-tokens: ${input}\n  ${errors.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`${input} is valid`);
  } else if (command === "contrast" && input) {
    const base = loadBase();
    let results: ContrastResult[] = [];
    try {
      results = checkContrast(resolveTheme(readTheme(input, base), base));
    } catch (err) {
      fail(err);
    }
    console.log(formatContrast(results));
    const failed = results.filter((r) => !r.pass).length;
    console.log(failed ? `${failed} pair(s) below WCAG AA` : "all pairs meet WCAG AA");
    if (failed && args.includes("--strict")) process.exit(1);
  } else if (command === "migrate" && input && output) {
    const base = loadBase();
    const src = JSON.parse(readFileSync(input, "utf8")) as ThemeSource;
    try {
      resolveTheme(src, base);
    } catch (err) {
      fail(err);
    }
    writeIfChanged(output, `${JSON.stringify(toDtcg(src), null, 2)}\n`, check, `ds-tokens migrate ${input} ${output}`);
  } else {
    console.error(USAGE);
    process.exit(2);
  }
}
