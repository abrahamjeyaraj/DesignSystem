# Design standard v1 (draft for review)

status: draft 2026-09-30. Planning only; nothing here is implemented yet. Decisions still open are
listed in section 9. Evidence from the review of the three current apps is in the appendix.

## 1. Goal

One way of building UI across every app, whatever design tool made the design:

- **DesignSystem is infrastructure.** It owns the contract (names, schema), the generators, the
  component SDKs, the checks and the agent rules. It contains no brand: no app names, colours,
  logos, icon files or fonts, apart from one neutral reference theme for its own gallery and tests.
- **Each app owns its brand.** Theme, icons, illustrations, fonts, logo, app icon, store assets and
  its design-tool files all live in the app repo, in one standard folder.
- **One frozen source per app.** Design tools (Claude Design, Pencil, Figma, Penpot, Paper) feed
  that source and are fed from it. Code is generated from it, never retyped from a picture.

## 2. The app `design/` folder

Every app has the same layout. It is a superset of a Claude Design design-system project, so the
same folder can be pushed to Claude Design with `/design-sync` and read by agents directly.

```
design/
  SKILL.md                 agent entry point (Claude Design skill format): brand essentials + map
  readme.md                voice, content rules, visual foundations, iconography rules
  theme.json               DTCG tokens: the only hand-edited token source (section 3)
  icons/
    icons.json             manifest: semantic name -> source, style, allowed sizes (section 4)
    svg/                   frozen SVGs (custom sets) — absent when a library is pinned
  art/                     illustrations: SVG + motion JSON (section 5)
  brand/                   logo, app-icon master SVG, splash, store templates
  fonts/                   font files + licences
  guidelines/              platform rules (mobile.md, tv.md, web.md, email.md)
  components/              app-level component specs (.d.ts + .prompt.md), app-only patterns
  sources.md               which design file is authoritative for which surface, and when frozen
  source/                  committed exports: Claude Design zip contents, .pen, .fig links (LFS for images)
  generated/               tokens/*.css, platform themes, icon assets — committed, CI-checked
```

Rules:
- `theme.json`, `icons/`, `art/`, `brand/`, `fonts/` are hand-edited (or produced by the freeze
  step and then reviewed). Everything in `generated/` is produced by DesignSystem tools.
- `source/` is evidence, not truth. A design export can propose changes; it never overrides
  `theme.json` or `icons/` without a reviewed diff (section 7).

## 3. Tokens

**Format:** W3C Design Tokens (DTCG): `$value`, `$type`, `$description`, `{alias}` references,
`$deprecated`. Light/dark and platform differences are modes; brands are separate files, never
modes inside DesignSystem.

**Tiers:**
1. Primitive — raw ramps: `color.pine.600`, `size.4`. App-owned, any names.
2. Semantic — the contract every component uses. DesignSystem owns the names; apps own the values.
3. Component — optional per-component overrides aliasing semantic tokens.

**Naming grammar** (semantic tier): `category.role[.variant][.state]`, lowercase, dot path; CSS
`--category-role-variant-state`, Swift/Kotlin/Dart camelCase.

| Category | Roles |
|---|---|
| `color.surface` | `page`, `card`, `raised`, `sunken`, `sidebar`, `inverse`, `overlay` |
| `color.text` | `primary`, `body`, `muted`, `subtle`, `inverse`, `on-action`, `link` |
| `color.border` | `hairline`, `default`, `strong`, `focus` |
| `color.action` | `primary`, `primary-hover`, `secondary`, `destructive` (+ `-hover`, `-pressed`, `-disabled`) |
| `color.accent` | `default`, `tint`, `tint-ring`, `on-surface` |
| `color.status` | `success`, `warning`, `danger`, `info`, each with `-bg` and `-fg` |
| `font.family` | `display`, `body`, `label`, `mono`, `reading` (optional) |
| `type` | `display`, `title`, `headline`, `body`, `label`, `caption`, `eyebrow` (composite: family, size, weight, line-height, tracking, case) |
| `space` | `0 1 2 3 4 5 6 8 10 12 16` (4px grid) |
| `radius` | `control`, `button`, `card`, `sheet`, `pill` |
| `shadow` | `card`, `hover`, `pop`, `brand` |
| `motion` | `duration.fast/base/slow`, `easing.standard/emphasis` |
| `layout.mobile` | `gutter`, `touch-target`, `section-gap`, `item-gap`, `bar-height` |
| `icon.size` | `sm 16`, `md 20`, `lg 24`, `xl 28`; `icon.stroke` (one value per app) |

This is close to the semantic layer ChurchHQ's Claude Design system already uses
(`--text-muted`, `--surface-page`, `--action-primary`, `--status-success`, `--border-hairline`), so
it is proven in practice. No hue names, no product words, no look words (`sand`, `ink-900`) in the
semantic tier.

**Migration from today's contract:** a published map from each current role (`ink-muted`,
`surface-sand`, `warn-bg`, `action`, …) to its new name, shipped as `$deprecated` aliases for one
minor version, then removed in the next major.

**Theme requirements:** every semantic token has a value in every mode the app supports;
`supportsDark` is explicit; `theme.json` pins the schema version it targets
(`"$schema": "@abrahamjeyaraj/tokens@<major>/theme.schema.json"`).

## 4. Icons

**Principle:** icons are copied, never drawn. Agents reference icons by name only.

`icons/icons.json` declares exactly one of:
- **Library:** `{ "library": "lucide", "version": "0.469.0", "stroke": 1.6, "grid": 24 }` — the
  generator vendors the exact SVGs of the pinned version. `@latest` is not allowed.
- **Custom set:** `{ "source": "svg/", "stroke": 1.6, "grid": 24 }` — the frozen SVGs are the truth.

Plus the **semantic map**: `{ "home": "house", "read": "book-open", "search": "search", ... }`.
Components use DesignSystem's fixed semantic names (`chevron-right`, `close`, `search`, `check`,
`more`, `back`, `add`, …); the app maps them, and adds its own names for screens.

`ds-icons build` emits, from the same geometry: React components, react-native-svg components,
iOS `.xcassets` (vector, template rendering for monochrome), Android VectorDrawable, Flutter
`vector_graphics`, and an SVG sprite for design tools. No path simplification or rounding.

**Banned** outside `generated/`: SF Symbols, Material Icons/Symbols, icon fonts from a CDN, inline
`<svg>`/`<path>` in app code, any icon library not named in `icons.json`. (An app may choose
Material Symbols or SF Symbols as its library, but then every platform uses it via the generator.)

**Verification:** CI renders each source icon and each platform output at 16/24/48 px and pixel
diffs them; it also publishes a contact sheet.

## 5. Illustrations and motion art

Hand-drawn scenes (onboarding, feature intros, empty states) are data: an SVG plus a motion JSON
(per stroke: path, width, draw window, fade). DesignSystem ships one renderer per platform
(`DSStrokeScene` for SwiftUI, Compose, React/RN, Flutter) that plays that JSON. The design export
is the source; `ds-art extract` pulls it verbatim; no platform re-types paths.

## 6. Components

- **Spec format** (adopted from Claude Design design-system projects, which ChurchHQ already uses):
  per component a `.d.ts` (props, variants, sizes) + `.prompt.md` (when to use, rules, examples)
  + a preview card. DesignSystem keeps generic specs; apps keep app-only patterns.
- Each spec lists: anatomy, variants, states (default, hover, pressed, focus, disabled, loading),
  token bindings, minimum touch size, accessibility role and label rules.
- SDK components (web, RN, SwiftUI, Compose, Flutter) are built from these specs and read semantic
  tokens only. Apps do not fork SDK components; a needed change goes to DesignSystem or is an app
  pattern that composes SDK components.

## 7. Design tools

Round trip for every tool:

```
design tool ──export──▶ design/source/ ──freeze / diff──▶ theme.json + icons/ + art/ (reviewed)
     ▲                                                              │
     └──────────── adapter (tokens, icons, components) ◀────────────┘
```

| Tool | In (tool → app) | Out (app → tool) |
|---|---|---|
| Claude Design | zip export committed to `source/claude-design/`; `ds-extract` reads CSS vars, JS token objects, inline SVGs | `/design-sync` pushes `design/` as a design-system project so new work uses the real tokens, icons and components |
| Pencil (.pen) | `variables` block + icon `library`/names | `ds-tokens export --target pen` writes variables and themes with contract names |
| Figma | Variables export | Variables JSON with modes |
| Penpot | DTCG directly | DTCG directly |
| Paper / code-first tools | — | generated CSS / Tailwind |

**Drift check:** when a new export lands, `ds-extract --diff` lists every colour, font, radius,
icon or stroke width not in the frozen set. Each item is accepted into `theme.json`/`icons/`
(reviewed PR) or rejected. Nothing is adopted silently.

Design files use contract names. Mapping tables (like the Pen table in `docs/sdk-brief.md`) are
removed once the adapters exist.

## 8. Checks, versioning, agent rules

**App CI:** `ds-tokens --check`, `ds-icons --check`, `ds-art --check`, contrast check (WCAG AA
for every text-on-surface pair in every mode), lint banning hex literals, stock palette classes,
inline SVG, SF Symbols/Material imports and unlisted icon libraries outside `generated/`.

**DesignSystem CI:** additionally rejects any brand material in the repo (app names in tokens or
components, image/font/icon assets outside the neutral reference theme).

**Versioning:** semver on the contract. New semantic token = minor; rename/removal = major after
one minor of `$deprecated`. Changelog per release; upgrade PRs into each app.

**Agent rules** (copied into each app's AGENTS.md):
- Read `design/SKILL.md` before any UI work.
- Never draw, redraw, retype or substitute an icon or illustration. If a name is missing, stop and
  ask for it to be exported and frozen.
- Never write a colour, size or font literal; use semantic tokens.
- Never edit `design/generated/`; run the generators.
- A design export is evidence; changes to the frozen set go through the drift check.

## 9. Decisions open

1. **Bible colours.** Newer Claude Design screens use brown `#8B5D2E` and several blues
   (`#5A7BBF`, `#3E5C9A`, `#3f5f95`); older screens and the live app use `#B07C4B` / `#384F84`.
   Which set is canonical?
2. **Bible icons.** Freeze one variant per icon from the 154 distinct drawings, and one stroke
   width (1.6 at 20px appears in the newest screens). Confirm 1.6.
3. **ChurchHQ icons.** The Claude Design system says Lucide (web already uses it); the mobile app
   switched to Material Symbols Rounded to match the old Church.pen. Which one for all platforms?
   Also pin the Lucide version (the project mixes `0.469.0` and `@latest`).
4. **ChurchHQ values.** Light page `#faf8f3` (Claude Design) vs `#f8f6f1` (app); dark page
   `#14130f` (Claude Design) vs `#26241e` (app). Which wins?
5. **Tuition source.** The updated `tuition-manager.pen` (24 boards) is assumed current and the
   Claude Design "Redesign v2" (navy/yellow, Ionicons) abandoned. Confirm. Dark mode stays off
   until Pen has a dark theme.
6. **Scope.** Which other repos adopt this after the three apps.
7. **Other design tools.** Which tool is meant by "plot design" / "open design" (Penpot?).
8. **Native depth.** Full SDK components on iOS/Android, or tokens + icons + art only with apps
   keeping their own views.

## 10. Roadmap

| Phase | Deliverable | Depends on |
|---|---|---|
| 0 | This standard agreed; `design/` template; exports committed to each app's `design/source/` | decisions 1–5 |
| 1 | DTCG schema + naming grammar + rename map with deprecated aliases; generator reads DTCG | 0 |
| 2 | `ds-extract` (Claude Design + Pen) and the freeze/diff review; freeze Bible, ChurchHQ, Tuition | 1 |
| 3 | `ds-icons` + `DSIcon` API on every platform, pixel-diff CI; Bible first | 2 |
| 4 | `ds-art` + `DSStrokeScene`; Bible onboarding moves from hand-typed Kotlin to data | 2 |
| 5 | Runtime native themes (SDKs accept an app theme), product themes leave DesignSystem | 1 |
| 6 | Adapters: `/design-sync` publish, Pen export, Figma, Penpot | 1–3 |
| 7 | Roll out per app with CI checks and AGENTS.md rules: Bible, ChurchHQ, Tuition, then others | 3–6 |

---

## Appendix: review evidence (2026-09-30)

### Integration today
| | Web | iOS | Android / mobile |
|---|---|---|---|
| Bible | tokens via `ds-tokens` 0.4.2 with `theme:check`; components are local copies in `components/ui/` (18 files, diverged), ui-web imported in 1 file | own `Tokens.swift` | own `Tokens.kt` |
| ChurchHQ | own `tokens.css` | Expo app, own tokens mirrored from Church.pen | same |
| Tuition | none | none (migration branch unmerged) | none on `origin/main` |

### Bible — Claude Design export (211 files, 102 MB, mostly images)
- 26 designs (Scan a Verse ×4, Home Refresh ×2, Community ×2, Unified Search, Word of the Day,
  Feature Intros, Onboarding, Apple TV system, Emails, Top Shelf) plus specs (`TV_*.md`,
  `ENGINEERING-DIRECTIONS.md`, feature briefs).
- Tokens: per-file CSS variables with shifting short names (`--fd`, `--bgp`, `--dks`) and a JS
  object `T` in `primitives.jsx`. Drift: brown ×3 values, blue ×4, muted ×2, gold-soft ×2.
- Its brief (`uploads/design-polish/DESIGN.md`) was extracted from the old Pen file.
- Icons: 354 inline SVGs, 310 on a 24 grid, no library; 154 distinct drawings; the same icon is
  drawn differently across files (home, book); stroke width 1.4–2.0.
- Onboarding art: all 169 Android Kotlin paths match `onboarding/scenes.jsx` verbatim; iOS and web
  have no equivalent.
- Live app icons: web Lucide (70 files), iOS SF Symbols (168 uses) + vendored Lucide (30),
  Android Material Icons (56).

### ChurchHQ — Claude Design design-system project (198 files, 11 MB)
- Full system: `SKILL.md`, `readme.md` (voice, foundations, iconography), `tokens/*.css`
  (colours with a semantic layer, type, spacing, mobile, `mobile.native.ts`), `foundations/`
  specimens, 27 component specs (`.jsx` + `.d.ts` + `.prompt.md`), `ui_kits/` (app, marketing,
  mobile), `guidelines/mobile.md`, 10 `.dc.html` screens.
- Icons: Lucide via CDN (`lucide-static@0.469.0` and `lucide@latest`). The mobile app uses
  Material Symbols Rounded (per old Church.pen, with a parity doc).
- Values vs the app: light page `#faf8f3` vs `#f8f6f1`; dark page/surface/foreground differ.
  The web spec in the app repo (`docs/design/churchhq-app-spec`) was hand-summarised because the
  design file was not readable by agents.

### Tuition — Pencil file
- Updated `tuition-manager.pen`: 24 boards (repo copy has 14), 54 variables (unchanged), 39
  reusable components, 197 Lucide icons, 4,707 variable references and only 11 raw hex values
  (success green `#3F6B3A`/`#E3ECDF` lacks a variable). DesignSystem's tuition theme matches it.
- Live apps: iOS SF Symbols, Android Material Icons, web none.
- A Claude Design "Redesign v2" export in the repo uses navy/yellow and Ionicons (conflicts).
