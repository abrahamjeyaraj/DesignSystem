/**
 * DTCG (W3C Design Tokens Community Group) theme format.
 *
 * An app theme in DTCG form is the standard's `design/theme.json`: typed tokens (`$type`,
 * `$value`), `{alias}` references, semantic colour names (`color.surface.page`) and the dark
 * mode as `$extensions.ds.dark`. `fromDtcg` turns it into the legacy ThemeSource the generator
 * already understands, so every platform output is unchanged; `toDtcg` migrates a legacy file.
 */
import { PLATFORMS, resolveTheme, sourceFor, type Base, type ThemeSource } from "./build";

export const SCHEMA_VERSION = 1;

/** Categories allowed in the semantic colour tier: `color.<category>.<role>`. */
export const SEMANTIC_CATEGORIES = ["surface", "text", "border", "action", "accent", "status"] as const;

/**
 * Legacy role -> semantic token. One to one for now so no theme changes appearance; roles that
 * turn out to be duplicates are merged after each app's colour audit, with a deprecated alias.
 */
export const ROLE_MAP: Record<string, string> = {
  background: "color.surface.page",
  foreground: "color.text.primary",
  card: "color.surface.card",
  "card-foreground": "color.text.on-card",
  popover: "color.surface.overlay",
  "popover-foreground": "color.text.on-overlay",
  primary: "color.action.primary",
  "primary-foreground": "color.text.on-primary",
  secondary: "color.action.secondary",
  "secondary-foreground": "color.text.on-secondary",
  muted: "color.surface.muted",
  "muted-foreground": "color.text.muted",
  accent: "color.accent.tint",
  "accent-foreground": "color.accent.on-tint",
  destructive: "color.action.destructive",
  "destructive-foreground": "color.text.on-destructive",
  border: "color.border.default",
  input: "color.border.input",
  ring: "color.border.focus",
  success: "color.status.success",
  "success-light": "color.status.success-bg",
  warning: "color.status.warning",
  "warning-light": "color.status.warning-bg",
  error: "color.status.danger",
  "error-light": "color.status.danger-bg",
  info: "color.status.info",
  "info-light": "color.status.info-bg",
  ink: "color.text.control",
  "ink-body": "color.text.body",
  "ink-muted": "color.text.subtle",
  subtle: "color.surface.control",
  line: "color.border.control",
  "line-hover": "color.border.control-hover",
  action: "color.action.control",
  "action-foreground": "color.text.on-control",
  "surface-card": "color.surface.raised",
  "surface-sand": "color.surface.sunken",
  "accent-2": "color.accent.secondary",
  "ink-900": "color.surface.inverse",
  "on-ink": "color.text.inverse",
  "on-ink-muted": "color.text.inverse-muted",
  "on-ink-accent": "color.accent.on-inverse",
  "warn-bg": "color.status.warning-tint",
  "alert-bg": "color.status.danger-tint",
};

type Json = any;
export interface Token {
  $type?: string;
  $value: Json;
  $description?: string;
  $extensions: { ds: Record<string, Json> };
}
type TokenMap = Record<string, Token>;

export interface DtcgTheme {
  $description?: string;
  $extensions: { ds: { schema: number; name: string } & Record<string, Json> };
  palette?: Record<string, Token | TokenMap>;
  color: Record<string, TokenMap>;
  extra?: TokenMap & { $description?: Json };
  font?: { family?: TokenMap; size?: TokenMap; weight?: TokenMap; lineHeight?: TokenMap };
  radius: TokenMap;
  shadow: TokenMap;
  label?: Token;
  mobile?: { $description?: string; type?: TokenMap; layout?: TokenMap };
}

const HEX = /^#[0-9a-f]{6}$/;
const px = (value: number) => ({ value, unit: "px" });
const unpx = (d: { value: number }) => d.value;
const tok = ($type: string, $value: Json, ds: Record<string, Json> = {}): Token => ({ $type, $value, $extensions: { ds } });
const plain = <T>(o: Record<string, T> | undefined) => Object.entries(o ?? {}).filter(([k]) => !k.startsWith("$"));

const toAlias = (v: string) => v.replace(/^\{(.+)\}$/, "{palette.$1}");
const fromAlias = (v: string) => v.replace(/^\{palette\.(.+)\}$/, "{$1}");

export const isDtcg = (doc: unknown): doc is DtcgTheme =>
  typeof (doc as DtcgTheme | undefined)?.$extensions?.ds?.schema === "number";

export function toDtcg(src: ThemeSource): DtcgTheme {
  const ds: Record<string, Json> = { schema: SCHEMA_VERSION, name: src.name };
  if (src.supportsDark !== undefined) ds.supportsDark = src.supportsDark;
  if (src.platforms) ds.platforms = structuredClone(src.platforms);
  if (src.scales) ds.scales = src.scales;
  if (src.darkScales) ds.darkScales = src.darkScales;
  if (src.tailwindAliases) ds.tailwindAliases = src.tailwindAliases;

  const doc: DtcgTheme = { $extensions: { ds: ds as DtcgTheme["$extensions"]["ds"] }, color: {}, radius: {}, shadow: {} };
  const described = (src as { $description?: string }).$description;
  if (described) doc.$description = described;

  if (src.palette) {
    doc.palette = Object.fromEntries(
      plain(src.palette as Record<string, unknown>).map(([name, scale]) => [
        name,
        typeof scale === "string"
          ? tok("color", scale)
          : Object.fromEntries(plain(scale as Record<string, string>).map(([step, hex]) => [step, tok("color", hex)])),
      ]),
    );
  }

  for (const [role, value] of plain(src.light)) {
    const name = ROLE_MAP[role];
    if (!name) throw new Error(`${src.name}.light.${role}: no semantic name for this role`);
    const [, category, key] = name.split(".");
    const ext: Record<string, Json> = { legacy: role };
    if (src.dark[role] !== undefined) ext.dark = toAlias(src.dark[role]);
    doc.color[category] ??= {};
    doc.color[category][key] = tok("color", toAlias(value), ext);
  }

  if (src.extra) {
    const extra: TokenMap = {};
    for (const [name, value] of plain(src.extra.light)) {
      const ext: Record<string, Json> = {};
      if (src.extra.dark?.[name] !== undefined) ext.dark = toAlias(src.extra.dark[name]);
      extra[name] = tok("color", toAlias(value), ext);
    }
    doc.extra = extra;
    const note = (src.extra as { $description?: string }).$description;
    if (note) (doc.extra as { $description?: string }).$description = note;
  }

  const font: NonNullable<DtcgTheme["font"]> = {};
  if (src.fontFamily) {
    font.family = Object.fromEntries(
      Object.entries(src.fontFamily).map(([k, f]) => [k, tok("fontFamily", [f.family, ...f.fallback], f.webVar ? { webVar: f.webVar } : {})]),
    );
  }
  if (src.fontSize) font.size = Object.fromEntries(Object.entries(src.fontSize).map(([k, v]) => [k, tok("dimension", px(v))]));
  if (src.fontWeight) font.weight = Object.fromEntries(Object.entries(src.fontWeight).map(([k, v]) => [k, tok("fontWeight", v)]));
  if (src.lineHeight) font.lineHeight = Object.fromEntries(Object.entries(src.lineHeight).map(([k, v]) => [k, tok("number", v)]));
  if (Object.keys(font).length) doc.font = font;

  doc.radius = Object.fromEntries(Object.entries(src.radius ?? {}).map(([k, v]) => [k, tok("dimension", px(v))]));
  doc.shadow = Object.fromEntries(
    Object.entries(src.shadow ?? {}).map(([k, layers]) => [
      k,
      tok(
        "shadow",
        layers.map((l) => ({
          color: { colorSpace: "srgb", components: [0, 0, 0], alpha: l.alpha },
          offsetX: px(l.x),
          offsetY: px(l.y),
          blur: px(l.blur),
          spread: px(l.spread),
        })),
      ),
    ]),
  );

  if (src.label) {
    const l = src.label;
    const value: Record<string, Json> = { fontFamily: "{font.family.label}" };
    if (l.size !== undefined) value.fontSize = px(l.size);
    if (l.weight !== undefined) value.fontWeight = l.weight;
    if (l.tracking !== undefined) value.letterSpacing = px(l.tracking);
    doc.label = tok("typography", value, l.case !== undefined ? { case: l.case } : {});
  }

  if (src.mobile) {
    const m: NonNullable<DtcgTheme["mobile"]> = {};
    const note = (src.mobile as { $source?: string }).$source;
    if (note) m.$description = note;
    if (src.mobile.type) {
      m.type = Object.fromEntries(
        Object.entries(src.mobile.type).map(([k, r]) => {
          const value: Record<string, Json> = {};
          const ext: Record<string, Json> = {};
          if (r.font !== undefined) value.fontFamily = `{font.family.${r.font}}`;
          if (r.size !== undefined) value.fontSize = px(r.size);
          if (r.weight !== undefined) value.fontWeight = r.weight;
          if (r.lineHeight !== undefined) {
            ext.lineHeight = px(r.lineHeight);
            if (r.size) value.lineHeight = +(r.lineHeight / r.size).toFixed(4);
          }
          return [k, tok("typography", value, ext)];
        }),
      );
    }
    if (src.mobile.layout) m.layout = Object.fromEntries(Object.entries(src.mobile.layout).map(([k, v]) => [k, tok("dimension", px(v))]));
    doc.mobile = m;
  }
  return doc;
}

export function fromDtcg(doc: DtcgTheme): ThemeSource {
  const ds = doc.$extensions.ds;
  const src = { name: ds.name, light: {}, dark: {} } as ThemeSource & Record<string, Json>;
  if (doc.$description) src.$description = doc.$description;
  if (doc.palette) {
    src.palette = Object.fromEntries(
      Object.entries(doc.palette).map(([name, entry]) => [
        name,
        "$value" in entry
          ? (entry as Token).$value
          : Object.fromEntries(Object.entries(entry as TokenMap).map(([step, t]) => [step, t.$value])),
      ]),
    );
  }
  if (ds.scales) src.scales = ds.scales;
  if (ds.darkScales) src.darkScales = ds.darkScales;
  if (ds.tailwindAliases) src.tailwindAliases = ds.tailwindAliases;
  if (ds.supportsDark !== undefined) src.supportsDark = ds.supportsDark;
  if (ds.platforms !== undefined) src.platforms = structuredClone(ds.platforms);

  const byName = Object.fromEntries(Object.entries(ROLE_MAP).map(([role, name]) => [name, role]));
  for (const [category, tokens] of Object.entries(doc.color)) {
    for (const [key, t] of Object.entries(tokens)) {
      const role = byName[`color.${category}.${key}`];
      if (!role) throw new Error(`color.${category}.${key}: not in the contract`);
      src.light[role] = fromAlias(t.$value);
      if (t.$extensions?.ds?.dark !== undefined) src.dark[role] = fromAlias(t.$extensions.ds.dark);
    }
  }

  if (doc.extra) {
    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};
    for (const [name, t] of plain(doc.extra as TokenMap)) {
      light[name] = fromAlias(t.$value);
      if (t.$extensions?.ds?.dark !== undefined) dark[name] = fromAlias(t.$extensions.ds.dark);
    }
    src.extra = { light, dark };
    if (doc.extra.$description) (src.extra as Record<string, Json>).$description = doc.extra.$description;
  }

  const f = doc.font ?? {};
  if (f.family) {
    src.fontFamily = Object.fromEntries(
      Object.entries(f.family).map(([k, t]) => {
        const [family, ...fallback] = t.$value as string[];
        return [k, t.$extensions?.ds?.webVar ? { family, webVar: t.$extensions.ds.webVar, fallback } : { family, fallback }];
      }),
    );
  }
  if (f.size) src.fontSize = Object.fromEntries(Object.entries(f.size).map(([k, t]) => [k, unpx(t.$value)]));
  if (f.weight) src.fontWeight = Object.fromEntries(Object.entries(f.weight).map(([k, t]) => [k, t.$value]));
  if (f.lineHeight) src.lineHeight = Object.fromEntries(Object.entries(f.lineHeight).map(([k, t]) => [k, t.$value]));
  if (Object.keys(doc.radius ?? {}).length) src.radius = Object.fromEntries(Object.entries(doc.radius).map(([k, t]) => [k, unpx(t.$value)]));
  if (Object.keys(doc.shadow ?? {}).length) {
    src.shadow = Object.fromEntries(
      Object.entries(doc.shadow).map(([k, t]) => [
        k,
        (t.$value as Json[]).map((l) => ({ x: unpx(l.offsetX), y: unpx(l.offsetY), blur: unpx(l.blur), spread: unpx(l.spread), alpha: l.color.alpha })),
      ]),
    );
  }

  if (doc.label) {
    const v = doc.label.$value;
    const label: Record<string, Json> = {};
    if (doc.label.$extensions?.ds?.case !== undefined) label.case = doc.label.$extensions.ds.case;
    if (v.letterSpacing) label.tracking = unpx(v.letterSpacing);
    if (v.fontSize) label.size = unpx(v.fontSize);
    if (v.fontWeight !== undefined) label.weight = v.fontWeight;
    src.label = label as ThemeSource["label"];
  }

  if (doc.mobile) {
    const m: Record<string, Json> = {};
    if (doc.mobile.$description) m.$source = doc.mobile.$description;
    if (doc.mobile.type) {
      m.type = Object.fromEntries(
        Object.entries(doc.mobile.type).map(([k, t]) => {
          const v = t.$value;
          const r: Record<string, Json> = {};
          if (v.fontFamily) r.font = String(v.fontFamily).replace(/^\{font\.family\.(.+)\}$/, "$1");
          if (v.fontSize) r.size = unpx(v.fontSize);
          if (t.$extensions?.ds?.lineHeight) r.lineHeight = unpx(t.$extensions.ds.lineHeight);
          if (v.fontWeight !== undefined) r.weight = v.fontWeight;
          return [k, r];
        }),
      );
    }
    if (doc.mobile.layout) m.layout = Object.fromEntries(Object.entries(doc.mobile.layout).map(([k, t]) => [k, unpx(t.$value)]));
    src.mobile = m as ThemeSource["mobile"];
  }
  return src;
}

/** Every problem with a DTCG theme, as `path: message` lines. Empty means valid. */
export function validateDtcg(doc: DtcgTheme, base: Base): string[] {
  const errors: string[] = [];
  const ds = doc?.$extensions?.ds;
  if (!ds || ds.schema !== SCHEMA_VERSION) {
    errors.push(`$extensions.ds: schema ${ds?.schema} is not supported (expected ${SCHEMA_VERSION})`);
    if (!ds) return errors;
  }
  if (!ds.name) errors.push("$extensions.ds.name: missing");

  const resolves = (alias: string) => {
    const path = alias.slice(1, -1).split(".");
    if (path[0] !== "palette") return false;
    const [, name, step] = path;
    const local = doc.palette?.[name] as Json;
    if (local) return step === undefined ? "$value" in local : Boolean(local[step]);
    const shared = (base.palette as Record<string, Json>)[name];
    return step === undefined ? typeof shared === "string" : typeof shared?.[step] === "string";
  };
  const checkColor = (path: string, value: Json) => {
    if (typeof value === "string" && /^\{.+\}$/.test(value)) {
      if (!resolves(value)) errors.push(`${path}: alias ${value} does not resolve`);
    } else if (typeof value !== "string" || !HEX.test(value)) {
      errors.push(`${path}: "${value}" is not #rrggbb or an alias`);
    }
  };

  const walk = (node: Json, path: string) => {
    if (!node || typeof node !== "object") return;
    if ("$value" in node) {
      if (!node.$type) errors.push(`${path}: missing $type`);
      if (node.$type === "color") {
        checkColor(path, node.$value);
        if (node.$extensions?.ds?.dark !== undefined) checkColor(`${path} (dark)`, node.$extensions.ds.dark);
      }
      return;
    }
    for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v, path ? `${path}.${k}` : k);
  };
  walk(doc, "");

  const contract = new Set(base.roles.map((r) => ROLE_MAP[r]));
  for (const name of contract) {
    const [, category, key] = name.split(".");
    if (!doc.color?.[category]?.[key]) errors.push(`${name}: missing`);
  }
  for (const [category, tokens] of Object.entries(doc.color ?? {})) {
    for (const key of Object.keys(tokens)) {
      const name = `color.${category}.${key}`;
      if (!contract.has(name)) errors.push(`${name}: not in the contract (brand-only colours go in extra)`);
    }
  }
  if (ds.platforms !== undefined) {
    try {
      const src = fromDtcg(doc);
      sourceFor(src, null);
      for (const platform of PLATFORMS) resolveTheme(sourceFor(src, platform), base);
    } catch (error) {
      errors.push(`$extensions.ds.platforms: ${(error as Error).message}`);
    }
  }
  return errors;
}
