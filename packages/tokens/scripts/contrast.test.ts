import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Base, resolveTheme, ROOT, type ThemeSource } from "./build";
import { CONTRAST_PAIRS, checkContrast, contrastRatio } from "./contrast";

const base = JSON.parse(readFileSync(join(ROOT, "tokens/base.json"), "utf8")) as Base;
const source = (name: string) => JSON.parse(readFileSync(join(ROOT, `tokens/themes/${name}.json`), "utf8")) as ThemeSource;
const CLI = join(import.meta.dir, "cli.ts");
const run = (cwd: string, ...args: string[]) => Bun.spawnSync(["bun", CLI, ...args], { cwd });

/** A theme whose every text role is black and every surface white: passes everything. */
function highContrast(): ThemeSource {
  const src = source("church");
  const texts = new Set(CONTRAST_PAIRS.map((p) => p.text));
  const light = Object.fromEntries(base.roles.map((r) => [r, texts.has(r) ? "#000000" : "#ffffff"]));
  const dark = Object.fromEntries(base.roles.map((r) => [r, texts.has(r) ? "#ffffff" : "#000000"]));
  return { ...src, name: "app", light, dark, darkScales: undefined, scales: {} };
}

describe("contrastRatio (WCAG 2.x relative luminance)", () => {
  test("extremes and identity", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#8a2b2b", "#8a2b2b")).toBeCloseTo(1, 5);
  });

  test("known reference values", () => {
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});

describe("checkContrast", () => {
  test("every pair names real roles", () => {
    for (const p of CONTRAST_PAIRS) {
      expect(base.roles).toContain(p.text);
      expect(base.roles).toContain(p.surface);
      expect(p.min).toBeGreaterThanOrEqual(3);
    }
  });

  test("checks both modes when the theme supports dark, light only otherwise", () => {
    const church = checkContrast(resolveTheme(source("church"), base));
    expect(new Set(church.map((r) => r.mode))).toEqual(new Set(["light", "dark"]));
    const noDark = checkContrast(resolveTheme({ ...source("church"), supportsDark: false }, base));
    expect(new Set(noDark.map((r) => r.mode))).toEqual(new Set(["light"]));
  });

  test("flags a known failure: tuition muted text on its cream page", () => {
    const results = checkContrast(resolveTheme(source("tuition"), base));
    const muted = results.find((r) => r.mode === "light" && r.text === "muted-foreground" && r.surface === "background");
    expect(muted?.pass).toBe(false);
    expect(muted?.ratio).toBeLessThan(4.5);
  });

  test("a high-contrast theme passes every pair", () => {
    expect(checkContrast(resolveTheme(highContrast(), base)).every((r) => r.pass)).toBe(true);
  });
});

describe("ds-tokens contrast", () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-contrast-"));
  writeFileSync(join(dir, "tuition.json"), JSON.stringify(source("tuition")));
  writeFileSync(join(dir, "good.json"), JSON.stringify(highContrast()));

  test("reports failures but exits 0 without --strict", () => {
    const r = run(dir, "contrast", "tuition.json");
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toString()).toMatch(/FAIL\s+light\s+muted-foreground on background/);
  });

  test("--strict exits 1 on any failure and 0 when all pass", () => {
    expect(run(dir, "contrast", "tuition.json", "--strict").exitCode).toBe(1);
    expect(run(dir, "contrast", "good.json", "--strict").exitCode).toBe(0);
  });
});
