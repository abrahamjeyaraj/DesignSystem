import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Base, ident, load, outputs, resolveColor, resolveTheme, ROOT, themeCss } from "./build";

const { base, themes } = load();
const byName = (n: string) => {
  const t = themes.find((x) => x.name === n);
  if (!t) throw new Error(`theme ${n} missing`);
  return t;
};

describe("resolveColor", () => {
  const palette = { white: "#ffffff", stone: { "900": "#1a1a12" } };

  test("resolves literals and references", () => {
    expect(resolveColor("#a83c3c", palette, "t")).toBe("#a83c3c");
    expect(resolveColor("{stone.900}", palette, "t")).toBe("#1a1a12");
    expect(resolveColor("{white}", palette, "t")).toBe("#ffffff");
  });

  test("rejects bad values", () => {
    expect(() => resolveColor("{stone.950}", palette, "t")).toThrow();
    expect(() => resolveColor("#FFF", palette, "t")).toThrow();
    expect(() => resolveColor("red", palette, "t")).toThrow();
  });
});

test("ident maps keys to platform-safe identifiers", () => {
  expect(ident("card-foreground")).toBe("cardForeground");
  expect(ident("line-hover")).toBe("lineHover");
  expect(ident("2xl")).toBe("xl2");
  expect(ident("16")).toBe("s16");
  expect(ident("DEFAULT")).toBe("base");
});

describe("theme contract", () => {
  const src = JSON.parse(readFileSync(join(ROOT, "tokens/themes/bible.json"), "utf8"));

  test("every theme defines every role, in base order", () => {
    for (const t of themes) {
      expect(Object.keys(t.light)).toEqual(base.roles);
      expect(Object.keys(t.dark)).toEqual(base.roles);
    }
  });

  test("a missing role is rejected", () => {
    const { ink: _drop, ...light } = src.light;
    expect(() => resolveTheme({ ...src, light }, base as Base)).toThrow(/missing roles \[ink\]/);
  });

  test("a theme cannot invent scale keys", () => {
    expect(() => resolveTheme({ ...src, fontSize: { huge: 99 } }, base)).toThrow(/fontSize\.huge/);
  });

  test("brand colours must go in extra, not light", () => {
    expect(() => resolveTheme({ ...src, light: { ...src.light, sparkle: "#ffffff" } }, base)).toThrow(/unknown roles \[sparkle\]/);
  });
});

describe("themes keep their own look", () => {
  test("bible matches TheBibleProject globals.css and ui components", () => {
    const t = byName("bible");
    expect(t.light.background).toBe("#f8f8f6");
    expect(t.light.accent).toBe("#c97a54");
    expect(t.light.action).toBe("#c8b496"); // ed-gold CTA
    expect(t.dark.action).toBe("#d9c9a8");
    expect(t.dark.success).toBe("#3d6b4d"); // inherited
    expect(t.fontSize.base).toBe(15);
    expect(t.radius.button).toBe(2);
    expect(t.label).toEqual({ case: "uppercase", tracking: 1.5, size: 13, weight: 500 });
    expect(t.extraLight["ed-gold"]).toBe("#c8b496");
  });

  test("church matches ChurchHQ tokens.css", () => {
    const t = byName("church");
    expect(t.light.background).toBe("#f8f6f1");
    expect(t.light.primary).toBe("#1a6b54");
    expect(t.dark.background).toBe("#26241e");
    expect(t.fontFamily.heading.family).toBe("Newsreader");
    expect(t.radius.control).toBe(10);
    expect(t.radius.card).toBe(15);
    expect(t.fontSize.base).toBe(16);
  });

  test("tuition matches TuitionManager ui.tsx", () => {
    const t = byName("tuition");
    expect(t.light.background).toBe("#fbf7f0");
    expect(t.light.primary).toBe("#8a2b2b");
    expect(t.fontFamily.heading.family).toBe("Fraunces");
    expect(t.radius.button).toBe(9999);
    expect(t.label.weight).toBe(800);
  });
});

describe("css", () => {
  const bible = themeCss(base, byName("bible"));
  const church = themeCss(base, byName("church"));

  test("emits Tailwind v4 namespaces and class dark mode", () => {
    expect(bible).toContain("@custom-variant dark (&:where(.dark, .dark *));");
    expect(bible).toContain("--color-accent-500: #c97a54;");
    expect(bible).toContain("--color-gray-500: #6d6d59;"); // bible-only palette alias
    expect(bible).toContain("--text-base: 0.9375rem;");
    expect(bible).toContain("--radius-button: 0.125rem;");
    expect(bible).toContain('--font-label: var(--font-ibm-plex-mono), "IBM Plex Mono", monospace;');
    expect(bible).toContain("--label-case: uppercase;");
    expect(bible).toMatch(/\.dark \{[^}]*--color-background: #1a1a12;/);
    expect(bible).not.toMatch(/\.dark \{[^}]*--color-success:/); // unchanged roles not repeated
    expect(bible).toContain("@utility label-text {");
  });

  test("church gets its own values and dark scale overrides", () => {
    expect(church).toContain("--color-primary: #1a6b54;");
    expect(church).toContain("--radius-card: 0.9375rem;");
    expect(church).toContain("--color-verified-blue: #1d9bf0;");
    expect(church).toMatch(/\.dark \{[^}]*--color-accent-600: #3a9b7a;/);
    expect(church).not.toContain("--color-gray-500"); // no bible aliases leak
  });
});

test("committed outputs are up to date", () => {
  for (const [rel, content] of Object.entries(outputs())) {
    const path = join(ROOT, rel);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8") === content).toBe(true);
  }
});
