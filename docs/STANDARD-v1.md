# Design standard v1 (draft for review)

status: draft v1.1 2026-09-30. Planning only; nothing here is implemented yet. Decisions taken and
still open are in section 9. Evidence from the review of the three current apps is in the appendix.
Scope: TheBibleProject, ChurchHQ, TuitionManager first; other apps adopt it afterwards.

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

### 4.1 Delivery per platform (custom stroke sets, e.g. Bible)

The frozen SVG is the master. Each platform gets the form that renders it best, generated, never
hand-made:

| Platform | Output | Why |
|---|---|---|
| iOS / iPadOS | Asset catalog SVG, *Preserve Vector Data*, template rendering; phase 2 option: custom SF Symbol templates (strokes outlined) for Dynamic Type weight/scale and baseline alignment | exact geometry, tintable; symbol templates integrate with `Label`, tab bars, text |
| tvOS | Same geometry with a heavier TV stroke (value set by the TV guideline) | tvOS HIG: thin strokes shimmer at distance (`TV_DESIGN_SYSTEM.md`) |
| Android | Compose `ImageVector` generated as Kotlin (VectorDrawable XML for Views, widgets, notifications) | stroke width, caps and joins supported natively; no raster |
| Web | React components, `stroke="currentColor"`, plus an SVG sprite | exact, themeable, tree-shaken |
| React Native | `react-native-svg` components | same geometry as web |
| Flutter | `vector_graphics` compiled assets | precompiled, fast |
| Design tools | SVG set for Claude Design (`/design-sync`), Pen, Figma | designers use the frozen icons |

Sizes come from `icon.size` tokens (phone 20, tablet 24, TV per guideline). The stroke is part of
the geometry: 1.6 on the 24 grid, scaling with the icon, so every size keeps the same proportions.

**Banned** outside `generated/`: SF Symbols, Material Icons/Symbols, icon fonts from a CDN, inline
`<svg>`/`<path>` in app code, any icon library not named in `icons.json`. (An app may choose
Material Symbols or SF Symbols as its library, but then every platform uses it via the generator.)

**Source SVG rules (icons and scenes):** shapes (`path`, `circle`, `ellipse`, `rect`, `line`,
`polyline`, `polygon`) inside `<g>`. Fill, stroke and (for scenes) stroke width are read the way
SVG inherits them: the shape's own (an inline `style` wins over the attribute), else the nearest
group's, else the root's. In a line icon every shape is stroked on every platform, so a shape with
`stroke="none"`, or without a stroke while others have one, is refused (stroke it, or outline the
strokes so the icon is fill-only); scenes refuse `stroke="none"` likewise. `ds-extract` refuses
inline SVGs whose inner shapes are styled by page CSS classes or a style object defined elsewhere,
since that look is not read; a class on the `<svg>` itself is the usual line-icon styling. Anything the
outputs cannot carry is refused with the fix rather than dropped: transforms, `clip-path`,
`mask`, filters, `fill-rule="evenodd"`, hidden elements (`display="none"`,
`visibility="hidden"`/`collapse`, as attributes or inline styles: every output draws every shape),
opacity on a group or the root, `<use>`, `<defs>`,
`<symbol>`, `<text>`, `<image>`, gradients, patterns and `<style>`. Flatten them in the design tool
(apply transforms and clips to the coordinates, outline text, union/subtract shapes) and export
again. `ds-extract` lists refused inline SVGs with the reason instead of guessing.

**Verification:** CI renders each source icon and each platform output at 16/24/48 px and pixel
diffs them; it also publishes a contact sheet. Each pixel is measured as coverage (rendered at 8x
and averaged, software raster), so the check compares drawings rather than one renderer's
antialiasing of `<circle>` against the equivalent arc path. Every output `icons.json` configures
must exist and hold every shipped icon (asset catalog entries as tintable vectors, VectorDrawables
on the grid with every shape); a missing file or entry fails, it is never skipped.

## 5. Illustrations and motion art

Hand-drawn scenes (onboarding, feature intros, empty states) are data: an SVG plus a motion JSON
(per stroke: path, width, draw window, fade). DesignSystem ships one renderer per platform
(`DSStrokeScene` for SwiftUI, Compose, React/RN, Flutter) that plays that JSON. The design export
is the source; `ds-art extract` pulls it verbatim; no platform re-types paths. Scenes follow the
source SVG rules of section 4; a stroke's faintness is `data-faint`, not SVG opacity.

## 6. Components

- **Spec format** (adopted from Claude Design design-system projects, which ChurchHQ already uses):
  per component a `.d.ts` (props, variants, sizes) + `.prompt.md` (when to use, rules, examples)
  + a preview card. DesignSystem keeps generic specs; apps keep app-only patterns.
- Each spec lists: anatomy, variants, states (default, hover, pressed, focus, disabled, loading),
  token bindings, minimum touch size, accessibility role and label rules.
- SDK components (web, RN, SwiftUI, Compose, Flutter) are built from these specs and read semantic
  tokens only. Apps do not fork SDK components; a needed change goes to DesignSystem or is an app
  pattern that composes SDK components.

### 6.1 Packaging: an app ships only what it uses

Today each native SDK is one module and compiles every brand's theme into every app
(`DSTokens.swift`/`.kt`/`.g.dart` hold all three). The standard replaces that with layers an app
opts into, plus per-app generation so unused material never reaches the binary.

**Layers** (same names on every platform):

| Module | Contains | Depends on |
|---|---|---|
| `core` | theme types, runtime theme injection, type styles, spacing/radius/motion helpers | nothing |
| `icons` | `DSIcon` API and the icon provider interface; **no icon files** | core |
| `art` | `DSStrokeScene` renderer; **no illustrations** | core |
| `controls` | button, field, chip, toggle, segmented control | core, icons |
| `content` | card, list row, avatar, empty state, stat tile | core, icons |
| `navigation` | tab bar, nav bar, sheet, dialog | core, icons |

Per platform: SwiftPM **products** per module (`DesignSystemCore`, `DesignSystemControls`, …);
Gradle **modules** (`:ds-core`, `:ds-controls`, …) under one Maven group; npm **subpath exports**
(`@abrahamjeyaraj/ui-web/controls`) with `sideEffects: false` for tree shaking; Flutter one
package with separate libraries (`design_system/controls.dart`), unused code dropped by the
compiler.

**Generated into the app, never shipped by DesignSystem:**
- **Theme**: `ds-tokens` writes only that app's theme (one brand, the modes it supports).
- **Icons**: `ds-icons` emits only the icons the app references (the approach Bible's
  `sync-lucide-icons.sh` already uses for iOS); an icon in `icons.json` that no code uses is a CI
  warning, a used icon missing from `icons.json` is a CI error.
- **Art**: only the scenes the app declares; each scene is a small JSON, loaded when its screen opens.
- **Fonts**: only the families, weights and scripts the theme names, subset where the licence
  allows (ChurchHQ mobile already ships 51-glyph subsets).

**Dependencies:** no third-party runtime dependency in `core`; each extra one (Radix, react-native-svg)
lives only in the module that needs it and is listed in that module's README.

**Budgets (CI, per app):** the size each module adds is measured on every DesignSystem release
(web: gzip JS/CSS per subpath; iOS/Android: size delta of a sample app). A release that grows a
module past its budget fails until the growth is accepted in the changelog.

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

## 9. Decisions

### Taken (2026-09-30)

1. **Bible colours: the latest design is the reference.** The live iOS app (screenshots) measures
   brown `#8B5D2E`, blue `#5A7BBF`, gold `#C8B496`, page `#F4F2EF`, the values in the newest
   Claude Design screens (Scan a Verse, Home Refresh). Older values (`#B07C4B`, `#384F84`) are
   superseded. Web still uses the old values; iOS/Android are mixed. A full colour audit follows
   in the freeze step (phase 2) before `theme.json` is final.
2. **Bible icons: a custom set, stroke 1.6 on a 24 grid, round caps and joins.** No SF Symbols and
   no Material Icons on any platform. One variant per icon is frozen from the Claude Design
   drawings (the live tab bar set, `primitives.jsx`, is the starting point). Delivery per platform
   is in section 4.1.
3. **ChurchHQ icons: Lucide on every platform**, one pinned version. The mobile app moves off
   Material Symbols Rounded. An icon Lucide lacks is drawn as a custom icon in Lucide's style
   (24 grid, same stroke, round caps) and added to the app's set, reviewed like any other.
4. **ChurchHQ colours: to be standardised.** The design is early; values will be streamlined in
   the freeze/audit step rather than picked now.
5. **Tuition: the updated `tuition-manager.pen` is the source.** The Claude Design "Redesign v2"
   (navy/yellow, Ionicons) is dropped. Icons: Lucide. Dark mode off until the Pen file has one.
6. **Scope:** these three apps first; any other app follows the same standard later.

### Still open

7. **Native depth** (explained in section 9.1): full SDK components, or foundations only.
8. **Other design tools:** which tool "plot design" / "open design" refers to (Penpot?).
9. **ChurchHQ light/dark values** and **Bible's remaining colour set**, resolved by the audit.

### 9.1 Native depth, explained

Every app gets the *foundations* from DesignSystem either way: tokens, fonts, icons,
illustrations. The open question is whether it also gets the *building blocks*:

- **Option A, foundations and components.** The SDK ships ready-made `DSButton`, `DSCard`,
  `DSListRow`, `DSTabBar`, `DSChip`, `DSSheet`… for SwiftUI, Compose, RN and web. An app screen is
  assembled from them, so a button looks and behaves the same in every app, only the theme
  differs. A change (for example the focus ring) is made once. Cost: the SDK must cover what each
  app needs, and an app that wants something different has to add a variant to DesignSystem.
- **Option B, foundations only.** The SDK ships tokens, icons, art and type styles. Each app builds
  its own buttons and cards from them. More freedom per app, but each app, and each agent,
  re-implements the same components, which is the drift seen today.

Recommendation: **A for common controls** (button, field, chip, list row, card, tab bar, sheet,
dialog, empty state), **B for app-specific patterns** (verse card, receipt, leaderboard), which
live in the app and compose SDK components.

## 10. Roadmap

| Phase | Deliverable | Depends on |
|---|---|---|
| 0 | This standard agreed; `design/` template; exports committed to each app's `design/source/` | decision 7 |
| 1 | DTCG schema + naming grammar + rename map with deprecated aliases; generator reads DTCG | 0 |
| 2 | `ds-extract` (Claude Design + Pen) and the freeze/diff review; freeze Bible, ChurchHQ, Tuition | 1 |
| 3 | `ds-icons` + `DSIcon` API on every platform, pixel-diff CI; Bible first | 2 |
| 4 | `ds-art` + `DSStrokeScene`; Bible onboarding moves from hand-typed Kotlin to data | 2 |
| 5 | Runtime native themes (SDKs accept an app theme), split SDKs into modules (6.1), product themes leave DesignSystem | 1 |
| 6 | Adapters: `/design-sync` publish, Pen export, Figma, Penpot | 1–3 |
| 7 | Roll out per app with CI checks and AGENTS.md rules: Bible, ChurchHQ, Tuition, then others | 3–6 |

### 10.1 Status (2026-09-30)

Built test-first in this repo (each step committed red, then green); `bun run verify` passes.

| Standard section | Done here | Still open |
|---|---|---|
| 3 Tokens | DTCG themes, `ROLE_MAP`, `ds-tokens validate / migrate`, `contrast` | merge duplicate roles after each app's audit; `icon.size` and type-role tokens in base |
| 2 design/ folder | `ds-init` (SKILL.md, readme, starter theme, icons, art, lint, sources, LFS, agent rules) | commit the exports into each app (phase 0) |
| 7 Design tools | `ds-extract` for Claude Design exports and `.pen`, drift vs a theme | Pen / Figma / Penpot export adapters; `/design-sync` publish |
| 4 Icons | `ds-icons build` (web/RN, iOS, Android XML, Compose, Flutter, sprite), used-only, `verify` pixel check | freeze Bible's custom set; native `DSIcon` wrappers; RN `DSIcon` |
| 5 Illustrations | scene format, `ds-art extract / build`, `DSStrokeScene` (web) | SwiftUI / Compose / Flutter players (need a Mac to compile) |
| 6.1 Packaging | ui-web module subpaths with isolation tests; per-app Swift/Kotlin/Dart themes; public Swift inits | SwiftPM products and Gradle modules; neutral default theme as SDK default |
| 8 Checks | `ds-lint` with baseline, brand-free test for DesignSystem | wire into each app's CI |

First `ds-lint` run on the apps (for baselines): Bible about 1,130 findings, ChurchHQ 212,
Tuition 161, mostly colour literals and platform icons.

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
