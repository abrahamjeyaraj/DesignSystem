#!/usr/bin/env bun
/**
 * Token generator. Reads tokens/base.json + tokens/themes/*.json and writes every platform output.
 *
 *   bun packages/tokens/scripts/build.ts          write outputs
 *   bun packages/tokens/scripts/build.ts --check  exit 1 if any committed output is stale
 *
 * Outputs are committed so native consumers (Xcode, Gradle, pub) never need Bun.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const ROOT = resolve(import.meta.dir, "../../..");
export const DEFAULT_THEME = "bible";

type Hex = string;
type Scale = Record<string, Hex>;
type Palette = Record<string, Hex | Scale>;
type ShadowLayer = { x: number; y: number; blur: number; spread: number; alpha: number };
type FontFamily = { family: string; webVar?: string; fallback: string[] };
type Label = { case: "none" | "uppercase"; tracking: number; size: number; weight: number };

/** Theme-overridable groups. A theme may change values, never keys. */
const OVERRIDABLE = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "radius", "shadow", "label"] as const;
type Overridable = (typeof OVERRIDABLE)[number];

interface Styled {
  fontFamily: Record<string, FontFamily>;
  fontSize: Record<string, number>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, number>;
  radius: Record<string, number>;
  shadow: Record<string, ShadowLayer[]>;
  label: Label;
}

export interface Base extends Styled {
  palette: Palette;
  roles: string[];
  spacing: Record<string, number>;
  duration: Record<string, number>;
  easing: Record<string, [number, number, number, number]>;
  zIndex: Record<string, number>;
  breakpoint: Record<string, number>;
  minTouchTarget: number;
}

interface ThemeSource extends Partial<Styled> {
  name: string;
  palette?: Record<string, Scale>;
  scales?: Record<string, string>;
  darkScales?: Record<string, Scale>;
  tailwindAliases?: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
  extra?: { light: Record<string, string>; dark: Record<string, string> };
}

export interface Theme extends Styled {
  name: string;
  scales: Record<string, Scale>;
  darkScales: Record<string, Scale>;
  aliases: Record<string, Scale>;
  light: Record<string, Hex>;
  dark: Record<string, Hex>;
  extraLight: Record<string, Hex>;
  extraDark: Record<string, Hex>;
}

const HEX = /^#[0-9a-f]{6}$/;

export function resolveColor(value: string, palette: Palette, where: string): Hex {
  const ref = value.match(/^\{([a-z]+)(?:\.(\d+))?\}$/);
  let hex: unknown = value;
  if (ref) {
    const entry = palette[ref[1]];
    hex = ref[2] === undefined ? entry : typeof entry === "object" ? entry[ref[2]] : undefined;
  }
  if (typeof hex !== "string" || !HEX.test(hex)) {
    throw new Error(`${where}: "${value}" is not a lowercase #rrggbb or a valid {palette.step} reference`);
  }
  return hex;
}

function resolveMap(src: Record<string, string>, palette: Palette, where: string): Record<string, Hex> {
  return Object.fromEntries(
    Object.entries(src)
      .filter(([k]) => !k.startsWith("$"))
      .map(([k, v]) => [k, resolveColor(v, palette, `${where}.${k}`)]),
  );
}

function pickScale(palette: Palette, name: string, where: string): Scale {
  const scale = palette[name];
  if (typeof scale !== "object") throw new Error(`${where}: unknown palette "${name}"`);
  return scale;
}

export function resolveTheme(src: ThemeSource, base: Base): Theme {
  const n = src.name;
  const palette: Palette = { ...base.palette, ...src.palette };

  const lightKeys = Object.keys(src.light);
  const missing = base.roles.filter((r) => !lightKeys.includes(r));
  const unknown = lightKeys.filter((r) => !base.roles.includes(r));
  if (missing.length || unknown.length) {
    throw new Error(`${n}.light: missing roles [${missing}] unknown roles [${unknown}] (put brand-only colours in "extra")`);
  }
  const lightAll = resolveMap(src.light, palette, `${n}.light`);
  const light = Object.fromEntries(base.roles.map((r) => [r, lightAll[r]]));
  for (const r of Object.keys(src.dark)) if (!base.roles.includes(r)) throw new Error(`${n}.dark.${r}: unknown role`);
  const dark = { ...light, ...resolveMap(src.dark, palette, `${n}.dark`) };

  const extraLight = resolveMap(src.extra?.light ?? {}, palette, `${n}.extra.light`);
  const extraDarkOnly = resolveMap(src.extra?.dark ?? {}, palette, `${n}.extra.dark`);
  for (const k of Object.keys(extraDarkOnly)) if (!(k in extraLight)) throw new Error(`${n}.extra.dark.${k}: missing from extra.light`);
  for (const k of Object.keys(extraLight)) if (base.roles.includes(k)) throw new Error(`${n}.extra.${k}: shadows a role`);

  const styled = {} as Styled;
  for (const group of OVERRIDABLE) {
    const override = (src[group] ?? {}) as Record<string, unknown>;
    for (const k of Object.keys(override)) {
      if (!(k in base[group])) throw new Error(`${n}.${group}.${k}: not a key in base.json ${group}`);
    }
    (styled as unknown as Record<Overridable, unknown>)[group] = { ...base[group], ...override };
  }

  const scales = Object.fromEntries(
    Object.entries(src.scales ?? {}).map(([alias, p]) => [alias, pickScale(palette, p, `${n}.scales.${alias}`)]),
  );
  const darkScales = Object.fromEntries(
    Object.entries(src.darkScales ?? {}).map(([alias, steps]) => {
      if (!scales[alias]) throw new Error(`${n}.darkScales.${alias}: not in scales`);
      return [alias, resolveMap(steps, palette, `${n}.darkScales.${alias}`)];
    }),
  );
  const aliases = Object.fromEntries(
    Object.entries(src.tailwindAliases ?? {}).map(([name, p]) => [name, pickScale(palette, p, `${n}.tailwindAliases.${name}`)]),
  );

  return { name: n, ...styled, scales, darkScales, aliases, light, dark, extraLight, extraDark: { ...extraLight, ...extraDarkOnly } };
}

export function load(root = ROOT): { base: Base; themes: Theme[] } {
  const base = JSON.parse(readFileSync(join(root, "tokens/base.json"), "utf8")) as Base;
  const dir = join(root, "tokens/themes");
  const themes = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const src = JSON.parse(readFileSync(join(dir, f), "utf8")) as ThemeSource;
      if (`${src.name}.json` !== f) throw new Error(`${f}: name must be "${f.replace(/\.json$/, "")}"`);
      return resolveTheme(src, base);
    });
  if (!themes.some((t) => t.name === DEFAULT_THEME)) throw new Error(`default theme ${DEFAULT_THEME} missing`);
  return { base, themes };
}

// ---------- shared helpers ----------

const HEADER = "GENERATED by packages/tokens/scripts/build.ts from tokens/*.json. Do not edit.";
const rem = (px: number) => (px === 0 ? "0" : `${+(px / 16).toFixed(4)}rem`);
const shadowCss = (layers: ShadowLayer[]) =>
  layers.map((l) => `${l.x}px ${l.y}px ${l.blur}px ${l.spread}px rgb(0 0 0 / ${l.alpha})`).join(", ");
const cssFont = (f: FontFamily) => {
  const quote = (s: string) => (s.startsWith("-") || /^[a-z-]+$/.test(s) ? s : `"${s}"`);
  return [f.webVar ? `var(${f.webVar})` : null, ...[f.family, ...f.fallback].map(quote)].filter(Boolean).join(", ");
};
/** "card-foreground" -> "cardForeground", "2xl" -> "xl2", "4" -> "s4", "DEFAULT" -> "base" */
export const ident = (key: string) => {
  if (key === "DEFAULT") return "base";
  if (/^\d+$/.test(key)) return `s${key}`;
  const m = key.match(/^(\d)(xl)$/);
  if (m) return `${m[2]}${m[1]}`;
  return key.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
};
const hex6 = (hex: Hex) => hex.slice(1).toUpperCase();

// ---------- CSS (Tailwind v4), one self-contained file per theme ----------

export function themeCss(base: Base, t: Theme): string {
  const out: string[] = [
    `/* ${HEADER} */`,
    `/* Theme "${t.name}".  Use:  @import "tailwindcss";  @import "@abe/tokens/css/${t.name}.css"; */`,
    "",
    "@custom-variant dark (&:where(.dark, .dark *));",
    "",
    "@theme {",
  ];
  const scale = (prefix: string, s: Scale) => {
    for (const [step, hex] of Object.entries(s)) out.push(`  --color-${prefix}-${step}: ${hex};`);
  };
  for (const [alias, s] of Object.entries(t.scales)) scale(alias, s);
  for (const [alias, s] of Object.entries(t.aliases)) scale(alias, s);
  out.push("");
  for (const [role, hex] of Object.entries(t.light)) out.push(`  --color-${role}: ${hex};`);
  for (const [role, hex] of Object.entries(t.extraLight)) out.push(`  --color-${role}: ${hex};`);
  out.push("");
  for (const [k, f] of Object.entries(t.fontFamily)) out.push(`  --font-${k}: ${cssFont(f)};`);
  for (const [k, px] of Object.entries(t.fontSize)) out.push(`  --text-${k}: ${rem(px)};`);
  for (const [k, w] of Object.entries(t.fontWeight)) out.push(`  --font-weight-${k}: ${w};`);
  for (const [k, lh] of Object.entries(t.lineHeight)) out.push(`  --leading-${k}: ${lh};`);
  out.push("", `  --spacing: ${rem(base.spacing["1"])};`);
  for (const [k, px] of Object.entries(t.radius)) out.push(`  --radius-${k}: ${k === "full" ? "9999px" : rem(px)};`);
  for (const [k, layers] of Object.entries(t.shadow)) out.push(`  --shadow${k === "DEFAULT" ? "" : `-${k}`}: ${shadowCss(layers)};`);
  for (const [k, e] of Object.entries(base.easing)) out.push(`  --ease-${k}: cubic-bezier(${e.join(", ")});`);
  for (const [k, px] of Object.entries(base.breakpoint)) out.push(`  --breakpoint-${k}: ${rem(px)};`);
  out.push("}", "");

  out.push(
    ":root {",
    `  --label-case: ${t.label.case};`,
    `  --label-tracking: ${t.label.tracking === 0 ? "0" : `${t.label.tracking}px`};`,
    `  --label-size: ${rem(t.label.size)};`,
    `  --label-weight: ${t.label.weight};`,
    `  --min-touch-target: ${rem(base.minTouchTarget)};`,
    "}",
    "",
    ".dark {",
  );
  for (const [role, hex] of Object.entries(t.dark)) if (t.light[role] !== hex) out.push(`  --color-${role}: ${hex};`);
  for (const [role, hex] of Object.entries(t.extraDark)) if (t.extraLight[role] !== hex) out.push(`  --color-${role}: ${hex};`);
  for (const [alias, s] of Object.entries(t.darkScales)) {
    for (const [step, hex] of Object.entries(s)) out.push(`  --color-${alias}-${step}: ${hex};`);
  }
  out.push(
    "}",
    "",
    "/* Button / tab / chip label style. Size is separate so callers can pair it with any text-* utility. */",
    "@utility label-text {",
    "  font-family: var(--font-label);",
    "  text-transform: var(--label-case);",
    "  letter-spacing: var(--label-tracking);",
    "  font-weight: var(--label-weight);",
    "}",
  );
  return `${out.join("\n")}\n`;
}

// ---------- TypeScript ----------

export function tokensJson(base: Base, themes: Theme[]) {
  return {
    defaultTheme: DEFAULT_THEME,
    roles: base.roles,
    spacing: base.spacing,
    duration: base.duration,
    easing: base.easing,
    zIndex: base.zIndex,
    breakpoint: base.breakpoint,
    minTouchTarget: base.minTouchTarget,
    themes: Object.fromEntries(
      themes.map((t) => [
        t.name,
        {
          light: t.light,
          dark: t.dark,
          extra: { light: t.extraLight, dark: t.extraDark },
          scales: t.scales,
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          fontWeight: t.fontWeight,
          lineHeight: t.lineHeight,
          radius: t.radius,
          shadow: t.shadow,
          label: t.label,
        },
      ]),
    ),
  };
}

export function tokensTs(base: Base, themes: Theme[]): string {
  return `// ${HEADER}
export const tokens = ${JSON.stringify(tokensJson(base, themes), null, 2)} as const;

export type Tokens = typeof tokens;
export type ThemeName = keyof Tokens["themes"];
export type ColorMode = "light" | "dark";
export type ColorRole = Tokens["roles"][number];
export type ColorScheme = Record<ColorRole, string>;
export type ThemeTokens = Tokens["themes"][ThemeName];

export function theme(name: ThemeName = tokens.defaultTheme): ThemeTokens {
  return tokens.themes[name];
}

export function colorScheme(name: ThemeName = tokens.defaultTheme, mode: ColorMode = "light"): ColorScheme {
  return tokens.themes[name][mode];
}

export default tokens;
`;
}

// ---------- native (Swift / Kotlin / Dart) ----------

type Kind = "color" | "double" | "int" | "string" | "shadow" | "bool";
interface Field {
  name: string;
  kind: Kind;
  value: unknown;
}
interface StructDef {
  type: string;
  fields: (t: Theme) => Field[];
}

const fieldsOf = (rec: Record<string, unknown>, kind: Kind, map: (v: unknown) => unknown = (v) => v) =>
  Object.entries(rec).map(([k, v]) => ({ name: ident(k), kind, value: map(v) }));

const STRUCTS: StructDef[] = [
  { type: "ColorScheme", fields: (t) => fieldsOf(t.light, "color") },
  { type: "FontFamilies", fields: (t) => fieldsOf(t.fontFamily, "string", (f) => (f as FontFamily).family) },
  { type: "FontSizes", fields: (t) => fieldsOf(t.fontSize, "double") },
  { type: "FontWeights", fields: (t) => fieldsOf(t.fontWeight, "int") },
  { type: "LineHeights", fields: (t) => fieldsOf(t.lineHeight, "double") },
  { type: "Radii", fields: (t) => fieldsOf(t.radius, "double") },
  { type: "Shadows", fields: (t) => fieldsOf(t.shadow, "shadow") },
  {
    type: "LabelStyle",
    fields: (t) => [
      { name: "uppercase", kind: "bool", value: t.label.case === "uppercase" },
      { name: "tracking", kind: "double", value: t.label.tracking },
      { name: "size", kind: "double", value: t.label.size },
      { name: "weight", kind: "int", value: t.label.weight },
    ],
  },
];

interface Lang {
  type: Record<Kind, string>;
  lit: (kind: Kind, v: unknown) => string;
  struct: (name: string, fields: Field[]) => string;
  construct: (name: string, args: [string, string][], indent: string) => string;
  extras: (m: Record<string, Hex>) => string;
}

const num = (v: number, forceDecimal: boolean) => (forceDecimal && Number.isInteger(v) ? `${v}.0` : `${v}`);

const SWIFT: Lang = {
  type: { color: "UInt32", double: "Double", int: "Int", string: "String", shadow: "[AbeShadowLayer]", bool: "Bool" },
  lit: (k, v) =>
    k === "color" ? `0x${hex6(v as Hex)}`
    : k === "string" ? `"${v}"`
    : k === "shadow" ? `[${(v as ShadowLayer[]).map((l) => `AbeShadowLayer(x: ${l.x}, y: ${l.y}, blur: ${l.blur}, spread: ${l.spread}, alpha: ${l.alpha})`).join(", ")}]`
    : `${v}`,
  struct: (name, fields) =>
    `public struct ${name}: Sendable, Equatable {\n${fields.map((f) => `    public let ${f.name}: ${SWIFT.type[f.kind]}`).join("\n")}\n}`,
  construct: (name, args, ind) => `${name}(\n${args.map(([k, v]) => `${ind}    ${k}: ${v}`).join(",\n")}\n${ind})`,
  extras: (m) => (Object.keys(m).length ? `[${Object.entries(m).map(([k, v]) => `"${k}": 0x${hex6(v)}`).join(", ")}]` : "[:]"),
};

const KOTLIN: Lang = {
  type: { color: "Long", double: "Double", int: "Int", string: "String", shadow: "List<AbeShadowLayer>", bool: "Boolean" },
  lit: (k, v) =>
    k === "color" ? `0xFF${hex6(v as Hex)}`
    : k === "string" ? `"${v}"`
    : k === "double" ? num(v as number, true)
    : k === "shadow" ? `listOf(${(v as ShadowLayer[]).map((l) => `AbeShadowLayer(${l.x}f, ${l.y}f, ${l.blur}f, ${l.spread}f, ${l.alpha}f)`).join(", ")})`
    : `${v}`,
  struct: (name, fields) => `data class ${name}(\n${fields.map((f) => `    val ${f.name}: ${KOTLIN.type[f.kind]},`).join("\n")}\n)`,
  construct: (name, args, ind) => `${name}(\n${args.map(([k, v]) => `${ind}    ${k} = ${v},`).join("\n")}\n${ind})`,
  extras: (m) => (Object.keys(m).length ? `mapOf(${Object.entries(m).map(([k, v]) => `"${k}" to 0xFF${hex6(v)}`).join(", ")})` : "emptyMap()"),
};

const DART: Lang = {
  type: { color: "int", double: "double", int: "int", string: "String", shadow: "List<AbeShadowLayer>", bool: "bool" },
  lit: (k, v) =>
    k === "color" ? `0xFF${hex6(v as Hex)}`
    : k === "string" ? `'${v}'`
    : k === "double" ? num(v as number, true)
    : k === "shadow" ? `[${(v as ShadowLayer[]).map((l) => `AbeShadowLayer(${num(l.x, true)}, ${num(l.y, true)}, ${num(l.blur, true)}, ${num(l.spread, true)}, ${l.alpha})`).join(", ")}]`
    : `${v}`,
  struct: (name, fields) =>
    `class Abe${name} {\n  const Abe${name}({\n${fields.map((f) => `    required this.${f.name},`).join("\n")}\n  });\n\n${fields
      .map((f) => `  final ${DART.type[f.kind]} ${f.name};`)
      .join("\n")}\n}`,
  construct: (name, args, ind) => `${name}(\n${args.map(([k, v]) => `${ind}  ${k}: ${v},`).join("\n")}\n${ind})`,
  extras: (m) => (Object.keys(m).length ? `{${Object.entries(m).map(([k, v]) => `'${k}': 0xFF${hex6(v)}`).join(", ")}}` : "{}"),
};

function themeArgs(lang: Lang, t: Theme, ind: string, prefix: string): [string, string][] {
  const build = (def: StructDef, source: Theme) =>
    lang.construct(`${prefix}${def.type}`, def.fields(source).map((f) => [f.name, lang.lit(f.kind, f.value)]), ind + (lang === DART ? "  " : "    "));
  const [scheme, ...rest] = STRUCTS;
  const darkTheme = { ...t, light: t.dark };
  const keyOf: Record<string, string> = {
    FontFamilies: "fontFamily", FontSizes: "fontSize", FontWeights: "fontWeight", LineHeights: "lineHeight",
    Radii: "radius", Shadows: "shadow", LabelStyle: "label",
  };
  return [
    ["name", lang.lit("string", t.name)],
    ["light", build(scheme, t)],
    ["dark", build(scheme, darkTheme)],
    ["extraLight", lang.extras(t.extraLight)],
    ["extraDark", lang.extras(t.extraDark)],
    ...rest.map((d) => [keyOf[d.type], build(d, t)] as [string, string]),
  ];
}

export function swift(base: Base, themes: Theme[]): string {
  const sample = themes[0];
  const themeStruct = `public struct AbeThemeTokens: Sendable, Equatable {
    public let name: String
    public let light: AbeColorScheme
    public let dark: AbeColorScheme
    /// Brand-only colours (0xRRGGBB) outside the shared role contract.
    public let extraLight: [String: UInt32]
    public let extraDark: [String: UInt32]
    public let fontFamily: AbeFontFamilies
    public let fontSize: AbeFontSizes
    public let fontWeight: AbeFontWeights
    public let lineHeight: AbeLineHeights
    public let radius: AbeRadii
    public let shadow: AbeShadows
    public let label: AbeLabelStyle

    public func colors(dark isDark: Bool) -> AbeColorScheme { isDark ? dark : light }
}`;
  const consts = (name: string, rec: Record<string, number>, type = "Double") =>
    [`    public enum ${name} {`, ...Object.entries(rec).map(([k, v]) => `        public static let ${ident(k)}: ${type} = ${v}`), "    }"].join("\n");
  return `// ${HEADER}
// swiftlint:disable all

public struct AbeShadowLayer: Sendable, Equatable {
    public let x: Double, y: Double, blur: Double, spread: Double, alpha: Double
}

/// Colours are 0xRRGGBB.
${STRUCTS.map((s) => SWIFT.struct(`Abe${s.type}`, s.fields(sample))).join("\n\n")}

${themeStruct}

public enum AbeTokens {
    public static let defaultTheme = "${DEFAULT_THEME}"
    public static let minTouchTarget: Double = ${base.minTouchTarget}

${themes.map((t) => `    public static let ${ident(t.name)} = ${SWIFT.construct("AbeThemeTokens", themeArgs(SWIFT, t, "    ", "Abe"), "    ")}`).join("\n\n")}

    public static let themes: [String: AbeThemeTokens] = [${themes.map((t) => `"${t.name}": ${ident(t.name)}`).join(", ")}]

${consts("Spacing", base.spacing)}
${consts("Duration", base.duration)}
${consts("ZIndex", base.zIndex, "Int")}
${consts("Breakpoint", base.breakpoint)}
}
`;
}

export function kotlin(base: Base, themes: Theme[]): string {
  const sample = themes[0];
  const consts = (name: string, rec: Record<string, number>) =>
    [`    object ${name} {`, ...Object.entries(rec).map(([k, v]) => `        const val ${ident(k)}: Int = ${v}`), "    }"].join("\n");
  return `// ${HEADER}
@file:Suppress("unused")

package com.abe.design

data class AbeShadowLayer(val x: Float, val y: Float, val blur: Float, val spread: Float, val alpha: Float)

/** Colours are 0xAARRGGBB, ready for androidx.compose.ui.graphics.Color(Long). */
${STRUCTS.map((s) => KOTLIN.struct(`Abe${s.type}`, s.fields(sample))).join("\n\n")}

data class AbeThemeTokens(
    val name: String,
    val light: AbeColorScheme,
    val dark: AbeColorScheme,
    /** Brand-only colours outside the shared role contract. */
    val extraLight: Map<String, Long>,
    val extraDark: Map<String, Long>,
    val fontFamily: AbeFontFamilies,
    val fontSize: AbeFontSizes,
    val fontWeight: AbeFontWeights,
    val lineHeight: AbeLineHeights,
    val radius: AbeRadii,
    val shadow: AbeShadows,
    val label: AbeLabelStyle,
) {
    fun colors(dark: Boolean): AbeColorScheme = if (dark) this.dark else light
}

object AbeTokens {
    const val DEFAULT_THEME = "${DEFAULT_THEME}"
    const val MIN_TOUCH_TARGET: Int = ${base.minTouchTarget}

${themes.map((t) => `    val ${ident(t.name)} = ${KOTLIN.construct("AbeThemeTokens", themeArgs(KOTLIN, t, "    ", "Abe"), "    ")}`).join("\n\n")}

    val themes: Map<String, AbeThemeTokens> = mapOf(${themes.map((t) => `"${t.name}" to ${ident(t.name)}`).join(", ")})

${consts("Spacing", base.spacing)}
${consts("Duration", base.duration)}
${consts("ZIndex", base.zIndex)}
${consts("Breakpoint", base.breakpoint)}
}
`;
}

export function dart(base: Base, themes: Theme[]): string {
  const sample = themes[0];
  const consts = (name: string, rec: Record<string, number>, type: "int" | "double") =>
    [`abstract final class ${name} {`, ...Object.entries(rec).map(([k, v]) => `  static const ${type} ${ident(k)} = ${type === "double" ? num(v, true) : v};`), "}"].join("\n");
  return `// ${HEADER}
// ignore_for_file: constant_identifier_names

class AbeShadowLayer {
  const AbeShadowLayer(this.x, this.y, this.blur, this.spread, this.alpha);
  final double x, y, blur, spread, alpha;
}

/// Colours are 0xAARRGGBB, ready for dart:ui Color(int).
${STRUCTS.map((s) => DART.struct(s.type, s.fields(sample))).join("\n\n")}

class AbeThemeTokens {
  const AbeThemeTokens({
    required this.name,
    required this.light,
    required this.dark,
    required this.extraLight,
    required this.extraDark,
    required this.fontFamily,
    required this.fontSize,
    required this.fontWeight,
    required this.lineHeight,
    required this.radius,
    required this.shadow,
    required this.label,
  });

  final String name;
  final AbeColorScheme light;
  final AbeColorScheme dark;

  /// Brand-only colours outside the shared role contract.
  final Map<String, int> extraLight;
  final Map<String, int> extraDark;
  final AbeFontFamilies fontFamily;
  final AbeFontSizes fontSize;
  final AbeFontWeights fontWeight;
  final AbeLineHeights lineHeight;
  final AbeRadii radius;
  final AbeShadows shadow;
  final AbeLabelStyle label;

  AbeColorScheme colors({required bool dark}) => dark ? this.dark : light;
}

abstract final class AbeTokens {
  static const String defaultTheme = '${DEFAULT_THEME}';
  static const double minTouchTarget = ${num(base.minTouchTarget, true)};

${themes.map((t) => `  static const ${ident(t.name)} = ${DART.construct("AbeThemeTokens", themeArgs(DART, t, "  ", "Abe"), "  ")};`).join("\n\n")}

  static const Map<String, AbeThemeTokens> themes = {${themes.map((t) => `'${t.name}': ${ident(t.name)}`).join(", ")}};
}

${consts("AbeSpacing", base.spacing, "double")}

${consts("AbeDuration", base.duration, "int")}

${consts("AbeBreakpoint", base.breakpoint, "double")}
`;
}

// ---------- main ----------

export function outputs(root = ROOT): Record<string, string> {
  const { base, themes } = load(root);
  const files: Record<string, string> = {};
  for (const t of themes) files[`packages/tokens/generated/css/${t.name}.css`] = themeCss(base, t);
  files["packages/tokens/generated/tokens.json"] = `${JSON.stringify(tokensJson(base, themes), null, 2)}\n`;
  files["packages/tokens/generated/index.ts"] = tokensTs(base, themes);
  files["native/swift/Sources/AbeDesign/AbeTokens.swift"] = swift(base, themes);
  files["native/android/abe-design/src/main/kotlin/com/abe/design/AbeTokens.kt"] = kotlin(base, themes);
  files["native/flutter/lib/src/abe_tokens.g.dart"] = dart(base, themes);
  return files;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const stale: string[] = [];
  for (const [rel, content] of Object.entries(outputs())) {
    const path = join(ROOT, rel);
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (current === content) continue;
    if (check) {
      stale.push(rel);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
      console.log(`wrote ${rel}`);
    }
  }
  if (check && stale.length) {
    console.error(`stale generated tokens (run: bun run tokens):\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  if (check) console.log("generated tokens up to date");
}
