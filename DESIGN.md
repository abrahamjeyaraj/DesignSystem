# DesignSystem design

status: v0.2.0 2026-09-23: platform SDKs (SwiftUI, Compose, React Native, Flutter). No consumer app wired yet.

## Decisions

- **Separate private repo** `abrahamjeyaraj/DesignSystem`. Distribution: npm and Maven via GitHub
  Packages (publish on tag `v*`), SwiftPM and Flutter via git tag.
- **Generic naming** so the repo can go public later: `DesignSystem` module, `DS` type prefix,
  `com.abrahamjeyaraj:designsystem`, `design_system`, `@abrahamjeyaraj/*`.
- **Shared structure, own look.** All apps share components, role names and scale keys. Each
  theme owns palette, colours, fonts, type sizes, radii, shadows and label style.
- **Role contract** (`base.json` `roles`) has two layers:
  - page layer, shadcn-compatible: `background`, `foreground`, `card`, `primary`, `muted`, `border`, …
  - control layer: `ink`, `ink-body`, `ink-muted`, `subtle`, `line`, `line-hover`, `action`, `action-foreground`
  
  Two layers exist because some apps use editorial control colours that differ from page colours; the
  built-in `default` theme keeps them aligned for simplicity.
- **Radius roles** `control` (inputs, menus, dialogs), `button`, `card`. Apps override per theme; the
  SDK default uses base radii (6px controls and buttons).
- **Label style** (`label-text` utility plus `--label-size`) carries font, case, tracking and
  weight for buttons, tabs and menus. The SDK `default` theme uses Inter, no case transform, 500 weight.
- **Custom generator** (`packages/tokens/scripts/build.ts`) instead of Style Dictionary. It has
  zero dependencies, validates the contract, and emits CSS, TS, Swift, Kotlin and Dart.
- **Themes live in the apps; DesignSystem is infra** (decided 2026-09-25). Each app owns its theme JSON
  (roles, scales, arbitrary `extra` keys) and generates CSS/native values with the `ds-tokens` bin from
  `@abrahamjeyaraj/tokens`, validated against the shipped `base.json`. DesignSystem ships one neutral
  `default` theme for galleries, tests and SDK defaults; product palettes stay in consumer repos.
- **Native apps own their theme too** (2026-09-25). `ds-tokens swift|kotlin` writes the app's
  theme value; the SDKs keep components and types. SwiftPM targets iOS 16, macOS 13 and tvOS 16
  (built in CI); Android library minSdk 24, Kotlin language/API 2.0, so a consumer on minSdk 24 and Kotlin
  2.0.21 can adopt it.
- **Native type names are `DS`-prefixed** so they don't collide with SwiftUI/Material3
  `ColorScheme`.

- **Design standard v1** (2026-09-30, docs/STANDARD-v1.md). Each app owns a `design/` folder
  (DTCG theme, icon set, scenes, brand, fonts, sources); DesignSystem ships the contract, the
  generators (`ds-tokens`, `ds-extract`, `ds-icons`, `ds-art`, `ds-lint`, `ds-init`) and the SDKs.
  Claude Design is the source for two pilot consumers; a Pen file for the third; exports are
  evidence and are frozen into `design/` through `ds-extract` and review.
- **DTCG themes with semantic names.** `ds-tokens` reads DTCG or legacy themes; legacy roles map
  one to one (`ROLE_MAP`), so nothing changes visually. Duplicate roles merge after each app's
  colour audit, behind deprecated aliases.
- **Icons are copied, never drawn.** One pinned set per app; every platform output comes from the
  same geometry and is pixel-checked against the source. Components use fixed semantic names
  (`COMPONENT_ICONS`). Each app pins its own set (custom SVG or a Lucide version).
- **Modular packages.** ui-web has module subpaths; apps generate only their own theme, used
  icons and declared scenes. Native module splits follow on a machine that can compile them.

## Provenance

The shipped `tokens/themes/default.json` is a generic zinc/blue palette for SDK previews only. Consumer
apps keep their palettes in their own repos and generate theme outputs with `ds-tokens`.

## Component changes vs early web copies

- `ed-*` classes became roles; brand font variables became `font-heading` / `font-body` / `label-text`.
- `rounded-[2px]` became `rounded-control` / `rounded-button`; Card uses `rounded-card shadow-card`.
- Menu items use each theme's label tracking from tokens.
- App-only colours live in each theme's `extra` map (any string keys); the SDK does not enumerate them.
- `animate-in`/`zoom-in` classes are kept but inert, as in the source web app (no animation plugin);
  add `tw-animate-css` in a consumer to enable them.

## Open items

0. Standard v1 follow-ups that need a Mac (Swift/Kotlin/Flutter toolchains): run `check:native` for
   the new public Swift inits; native players for scenes (SwiftUI trim, Compose PathMeasure, Flutter
   PathMetric) and native `DSIcon` wrappers; split SwiftPM products / Gradle modules; RN `DSIcon`
   (needs react-native-svg).

1. Wire consumers: apps adopt `@abrahamjeyaraj/tokens` and commit generated theme files. Status: docs/product/prd.md.
2. Accessibility: run `ds-tokens contrast ... --strict` on app themes in CI.
3. Replace hand-written native theme types with app-generated `ds-tokens` output against SDK types.
4. Web (`ui-web`) and native SDKs have different component sets: web has dialogs/menus/tabs from
   an early web import; native has the Pen mobile set. Converge when a second app needs a missing one.
5. Pen deviations: status/nav bar heights use `controlHeight` (48) vs Pen 54/52; tab bar shadow uses
   platform elevation.
