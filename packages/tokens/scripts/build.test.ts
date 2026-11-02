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
  test("bible theme matches reference consumer globals.css and ui components", () => {
    const t = byName("bible");
    expect(t.light.background).toBe("#f4f2ef"); // cream
    expect(t.light.primary).toBe("#c8b496"); // gold
    expect(t.light.action).toBe("#c8b496");
    expect(t.dark.background).toBe("#121210"); // iPhone dark
    expect(t.dark.action).toBe("#d9c9a8");
    expect(t.dark.warning).toBe("#b8851f"); // inherited
    expect(t.fontSize.base).toBe(15);
    expect(t.radius.button).toBe(2);
    expect(t.label).toEqual({ case: "uppercase", tracking: 1.5, size: 13, weight: 500 });
    expect(t.extraLight["brand-brown-strong"]).toBe("#8a5a2e");
    expect(t.extraDark["brand-brown-strong"]).toBe("#d9a86a");
    expect(Object.keys(t.scales)).toEqual([]); // no numbered primary/accent scales
  });

  test("church theme matches reference consumer tokens.css", () => {
    const t = byName("church");
    expect(t.light.background).toBe("#f8f6f1");
    expect(t.light.primary).toBe("#1a6b54");
    expect(t.dark.background).toBe("#26241e");
    expect(t.fontFamily.heading.family).toBe("Newsreader");
    expect(t.radius.control).toBe(10);
    expect(t.radius.card).toBe(15);
    expect(t.fontSize.base).toBe(16);
  });

  test("tuition theme matches reference consumer ui.tsx tokens", () => {
    const t = byName("tuition");
    expect(t.light.background).toBe("#fbf7f0");
    expect(t.light.primary).toBe("#8a2b2b");
    expect(t.fontFamily.heading.family).toBe("Fraunces");
    expect(t.radius.button).toBe(9999);
    expect(t.label.weight).toBe(800);
  });
});

describe("mobile layer", () => {
  test("tuition native matches Pen Native Design System", () => {
    const t = byName("tuition");
    expect(t.mobile.type.title).toEqual({ font: "heading", size: 28, lineHeight: 36, weight: 500 });
    expect(t.mobile.type.body.size).toBe(15);
    expect(t.mobile.layout.touchTarget).toBe(48);
    expect(t.mobile.layout.sheetRadius).toBe(24);
    expect(t.supportsDark).toBe(false);
    expect(t.light.success).toBe("#3f6b3a"); // Pen "Paid" chip
  });

  test("other themes inherit base mobile defaults", () => {
    expect(byName("church").mobile.layout.touchTarget).toBe(44);
    expect(byName("church").supportsDark).toBe(true);
  });

  test("unknown mobile keys and fonts are rejected", () => {
    const src = JSON.parse(readFileSync(join(ROOT, "tokens/themes/bible.json"), "utf8"));
    expect(() => resolveTheme({ ...src, mobile: { layout: { huge: 1 } } }, base)).toThrow(/mobile\.layout\.huge/);
    expect(() => resolveTheme({ ...src, mobile: { type: { body: { font: "comic" } } } }, base)).toThrow(/not a fontFamily key/);
  });
});

describe("css", () => {
  const bible = themeCss(base, byName("bible"));
  const church = themeCss(base, byName("church"));

  test("emits Tailwind v4 namespaces and class dark mode", () => {
    expect(bible).toContain("@custom-variant dark (&:where(.dark, .dark *));");
    expect(bible).toContain("--color-sky-700: #2f6b8c;"); // bible-only palette alias
    expect(bible).not.toMatch(/--color-(primary|accent|gray)-\d{2,3}:/);
    expect(bible).toContain("--text-base: 0.9375rem;");
    expect(bible).toContain("--radius-button: 0.125rem;");
    expect(bible).toContain('--font-label: var(--font-ibm-plex-mono), "IBM Plex Mono", monospace;');
    expect(bible).toContain("--label-case: uppercase;");
    expect(bible).toMatch(/\.dark \{[^}]*--color-background: #121210;/);
    expect(bible).not.toMatch(/\.dark \{[^}]*--color-warning:/); // unchanged roles not repeated
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

describe("on-ink contrast", () => {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  };
  const contrast = (foreground: string, background: string) => {
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (lighter! + 0.05) / (darker! + 0.05);
  };
  test("on-ink text roles meet contrast against ink-900 in every theme and mode", () => {
    for (const theme of themes) {
      for (const mode of ["light", "dark"] as const) {
        const colors = theme[mode];
        expect(contrast(colors["on-ink"]!, colors["ink-900"]!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(colors["on-ink-muted"]!, colors["ink-900"]!)).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

test("committed outputs are up to date", () => {
  for (const [rel, content] of Object.entries(outputs())) {
    const path = join(ROOT, rel);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, "utf8") === content).toBe(true);
  }
});
