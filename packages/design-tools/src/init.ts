/**
 * ds-init: scaffold the standard design/ folder in an app. The layout is a superset of a Claude
 * Design design-system project, so the folder can be synced to Claude Design and read by agents.
 * Existing files are never overwritten unless `force` is set.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ThemeSource } from "@abrahamjeyaraj/tokens/build";
import { toDtcg } from "@abrahamjeyaraj/tokens/dtcg";

export const AGENTS_MARKER = "<!-- ds:design-rules -->";
const LUCIDE_VERSION = "0.469.0";
const COMPONENT_LUCIDE: Record<string, string> = {
  add: "plus",
  check: "check",
  "chevron-down": "chevron-down",
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
  close: "x",
  more: "ellipsis",
  search: "search",
};

/** Brand-free starting values (neutral greys) that meet WCAG AA; the app replaces them. */
const STARTER_LIGHT: Record<string, string> = {
  background: "#ffffff", foreground: "#171717", card: "#ffffff", "card-foreground": "#171717",
  popover: "#ffffff", "popover-foreground": "#171717", primary: "#262626", "primary-foreground": "#fafafa",
  secondary: "#f5f5f5", "secondary-foreground": "#262626", muted: "#f5f5f5", "muted-foreground": "#595959",
  accent: "#f5f5f5", "accent-foreground": "#262626", destructive: "#b91c1c", "destructive-foreground": "#ffffff",
  border: "#e5e5e5", input: "#e5e5e5", ring: "#a3a3a3", success: "#15803d", "success-light": "#dcfce7",
  warning: "#a16207", "warning-light": "#fef9c3", error: "#b91c1c", "error-light": "#fee2e2", info: "#1d4ed8",
  "info-light": "#dbeafe", ink: "#171717", "ink-body": "#404040", "ink-muted": "#595959", subtle: "#fafafa",
  line: "#e5e5e5", "line-hover": "#d4d4d4", action: "#262626", "action-foreground": "#fafafa",
  "surface-card": "#ffffff", "surface-sand": "#f5f5f5", "accent-2": "#525252", "ink-900": "#171717",
  "on-ink": "#fafafa", "on-ink-muted": "#d4d4d4", "on-ink-accent": "#e5e5e5", "warn-bg": "#fef9c3", "alert-bg": "#fee2e2",
};
const STARTER_DARK: Record<string, string> = {
  background: "#0a0a0a", foreground: "#fafafa", card: "#171717", "card-foreground": "#fafafa",
  popover: "#171717", "popover-foreground": "#fafafa", primary: "#fafafa", "primary-foreground": "#171717",
  secondary: "#262626", "secondary-foreground": "#fafafa", muted: "#262626", "muted-foreground": "#a3a3a3",
  accent: "#262626", "accent-foreground": "#fafafa", destructive: "#dc2626", border: "#262626", input: "#262626",
  ring: "#525252", ink: "#fafafa", "ink-body": "#d4d4d4", "ink-muted": "#a3a3a3", subtle: "#171717", line: "#262626",
  "line-hover": "#404040", action: "#fafafa", "action-foreground": "#171717", "surface-card": "#171717",
  "surface-sand": "#262626",
};

export interface InitOptions {
  name: string;
  icons?: "lucide" | "custom";
  fromLegacy?: string;
  force?: boolean;
  agents?: boolean;
}

const skill = (name: string) => `---
name: ${name}-design
description: Use this skill to design or build UI for ${name}: brand essentials, semantic tokens, the frozen icon set, illustrations and the rules every screen follows. For production code or for throwaway mocks.
user-invocable: true
---

Read \`readme.md\` in this folder first, then the files it points to.

## Map
- \`theme.json\`: DTCG tokens, the only hand-edited source of colour, type, spacing, radius, shadow and motion.
- \`icons/icons.json\`: the icon set (a pinned library or frozen custom SVGs) and its stroke, grid and names.
- \`art/\`: line-art scenes as data, played by DSStrokeScene on every platform.
- \`brand/\`, \`fonts/\`: logo, app icon master, store templates, font files and licences.
- \`guidelines/\`: platform rules (mobile, tablet, TV, web, email).
- \`components/\`: app-only component specs (\`.d.ts\` + \`.prompt.md\`); shared components come from the design system.
- \`sources.md\`: which design file is authoritative for which surface, and when it was frozen.
- \`source/\`: committed design-tool exports. Evidence, not truth.

## Essentials
- Use semantic tokens (\`color.surface.page\`, \`color.text.muted\`, \`color.action.primary\`), never literals.
- Icons come only from the set in \`icons/icons.json\`, by name.
- Fill this section in with the brand's colour, type, shape and voice in a few lines.
`;

const readme = (name: string) => `# ${name}: design

The frozen design of ${name}. Code is generated from this folder; design tools feed it and are fed
from it. Nothing here is copied by eye.

## Voice and content
<!-- Tone, person, casing, numbers and money, honesty markers, example microcopy. -->

## Visual foundations
<!-- Colour (which roles carry the brand), type (families and when each is used), shape (radii),
depth (shadows), motion (durations). Reference token names from theme.json. -->

## Iconography
- One set, declared in \`icons/icons.json\`: one grid, one stroke width, one cap and join style.
- Code uses \`DSIcon\` with a name from the set. No SF Symbols, Material icons or other libraries.
- A missing icon is exported from the design tool, frozen into the set, and reviewed.

## Illustrations
- Scenes live in \`art/\` as data (paths plus draw windows) and play on every platform.

## Generated outputs
- \`ds-tokens css design/theme.json <out.css>\` (and the Swift/Kotlin/Dart targets) for tokens.
- \`ds-icons build design/icons/icons.json\` once \`outputs\` in icons.json lists this app's platforms.
- \`ds-art build design/art/art.json\` once scenes and \`outputs\` are listed.

## Checks
- \`ds-tokens validate design/theme.json\`, \`ds-tokens contrast design/theme.json --strict\`
- \`ds-icons build ... --check\`, \`ds-icons verify ...\`, \`ds-art build ... --check\`
- \`ds-lint . --baseline design/lint-baseline.json\`
`;

const SOURCES = `# Design sources

| Surface | Tool | File or project | Authoritative | Frozen on |
|---|---|---|---|---|
| Mobile | | | yes | |
| Web | | | | |

Exports go in \`source/\` (images through Git LFS). A new export is checked with
\`ds-extract design/source/<export> --out report.json --theme design/theme.json\`; anything it lists
that is not frozen is accepted into theme.json or icons/ in a reviewed PR, or rejected.
`;

const agentsBlock = () => `${AGENTS_MARKER}
## Design rules (DesignSystem standard)

- Read \`design/SKILL.md\` before any UI work.
- Colours, type, spacing, radius, shadow and motion come from semantic tokens (\`design/theme.json\`). Never write a colour, size or font literal.
- Icons come only from \`DSIcon\` with a name in \`design/icons/icons.json\`. Never draw, redraw, retype or substitute an icon or illustration; no SF Symbols, Material icons or other icon libraries. If an icon is missing, stop and ask for it to be exported and frozen.
- Illustrations are scenes in \`design/art/\`, played by DSStrokeScene. Never re-type their paths.
- Never edit generated files (header "GENERATED by ..."); run ds-tokens, ds-icons or ds-art.
- A design export in \`design/source/\` is evidence, not truth. Changes to the theme, icons or art go through \`ds-extract --theme\` and a reviewed PR.
- Before handing off: \`ds-lint . --baseline design/lint-baseline.json\` and \`ds-tokens contrast design/theme.json\`.
${AGENTS_MARKER}
`;

function starterTheme(name: string): ThemeSource {
  return { name, light: STARTER_LIGHT, dark: STARTER_DARK } as ThemeSource;
}

export function initDesign(root: string, opts: InitOptions) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(opts.name)) throw new Error(`name "${opts.name}" must be kebab-case`);
  const legacy = opts.fromLegacy ? ({ ...JSON.parse(readFileSync(opts.fromLegacy, "utf8")), name: opts.name } as ThemeSource) : null;
  const theme = toDtcg(legacy ?? starterTheme(opts.name));
  const custom = opts.icons === "custom";
  const icons = {
    schema: 1,
    source: custom ? { dir: "svg" } : { library: "lucide", version: LUCIDE_VERSION },
    style: { grid: 24, stroke: custom ? 1.6 : 2, linecap: "round", linejoin: "round" },
    icons: custom ? Object.fromEntries(Object.keys(COMPONENT_LUCIDE).map((n) => [n, n])) : COMPONENT_LUCIDE,
    scan: ["../.."],
    outputs: {},
  };

  const files: Record<string, string> = {
    "design/SKILL.md": skill(opts.name),
    "design/readme.md": readme(opts.name),
    "design/theme.json": `${JSON.stringify(theme, null, 2)}\n`,
    "design/icons/icons.json": `${JSON.stringify(icons, null, 2)}\n`,
    "design/art/art.json": `${JSON.stringify({ schema: 1, scenes: [], outputs: {} }, null, 2)}\n`,
    "design/lint.json": `${JSON.stringify({ rules: {}, allowPalettes: [] }, null, 2)}\n`,
    "design/sources.md": SOURCES,
    "design/source/.gitattributes": ["png", "jpg", "jpeg", "webp", "gif", "mp4", "mov", "pdf", "zip"].map((e) => `*.${e} filter=lfs diff=lfs merge=lfs -text`).join("\n") + "\n",
    "design/brand/README.md": "# Brand\n\nLogo, app icon master SVG, splash and store templates. App icons are generated from the master.\n",
    "design/fonts/README.md": "# Fonts\n\nFont files the theme names, with their licences. Only the families and weights in theme.json ship.\n",
    "design/guidelines/README.md": "# Guidelines\n\nPlatform rules: mobile.md, tablet.md, tv.md, web.md, email.md.\n",
    "design/components/README.md": "# App components\n\nApp-only patterns as `<Name>.d.ts` + `<Name>.prompt.md`. Shared controls come from the design system.\n",
  };
  if (custom) files["design/icons/svg/README.md"] = "# Icon SVGs\n\nFrozen SVGs, one per icon, on the grid in icons.json. Add the component icons listed there first.\n";

  const created: string[] = [];
  const skipped: string[] = [];
  for (const [rel, content] of Object.entries(files)) {
    const path = join(root, rel);
    if (existsSync(path) && !opts.force) {
      skipped.push(rel);
      continue;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    created.push(rel);
  }

  if (opts.agents) {
    const path = join(root, "AGENTS.md");
    const current = existsSync(path) ? readFileSync(path, "utf8") : "";
    const block = agentsBlock();
    const start = current.indexOf(AGENTS_MARKER);
    const end = current.indexOf(AGENTS_MARKER, start + AGENTS_MARKER.length);
    const next =
      start >= 0 && end > start
        ? current.slice(0, start) + block.trimEnd() + current.slice(end + AGENTS_MARKER.length)
        : `${current}${current && !current.endsWith("\n") ? "\n" : ""}${current ? "\n" : ""}${block}`;
    writeFileSync(path, next);
  }
  return { created: created.filter((f) => !f.endsWith("svg/README.md")), skipped };
}
