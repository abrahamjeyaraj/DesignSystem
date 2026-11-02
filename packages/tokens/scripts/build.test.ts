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
  const src = JSON.parse(readFileSync(join(ROOT, "tokens/themes/default.json"), "utf8"));

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

describe("default SDK theme", () => {
  test("default theme uses neutral zinc and blue action roles", () => {
    const t = byName("default");
    expect(t.light.background).toBe("#fafafa");
    expect(t.light.primary).toBe("#2563eb");
    expect(t.light.action).toBe("#2563eb");
    expect(t.dark.background).toBe("#09090b");
    expect(t.supportsDark).toBe(true);
    expect(t.fontSize.base).toBe(16);
    expect(t.radius.button).toBe(6);
  });
});

describe("mobile layer", () => {
  test("default inherits base mobile defaults", () => {
    expect(byName("default").mobile.layout.touchTarget).toBe(44);
  });

  test("unknown mobile keys and fonts are rejected", () => {
    const src = JSON.parse(readFileSync(join(ROOT, "tokens/themes/default.json"), "utf8"));
    expect(() => resolveTheme({ ...src, mobile: { layout: { huge: 1 } } }, base)).toThrow(/mobile\.layout\.huge/);
    expect(() => resolveTheme({ ...src, mobile: { type: { body: { font: "comic" } } } }, base)).toThrow(/not a fontFamily key/);
  });
});

describe("css", () => {
  const css = themeCss(base, byName("default"));

  test("emits Tailwind v4 namespaces and class dark mode", () => {
    expect(css).toContain("@custom-variant dark (&:where(.dark, .dark *));");
    expect(css).toContain("--color-primary: #2563eb;");
    expect(css).toContain("--text-base: 1rem;");
    expect(css).toContain("--radius-button: 0.375rem;");
    expect(css).toMatch(/\.dark \{[^}]*--color-background: #09090b;/);
    expect(css).toContain("@utility label-text {");
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
