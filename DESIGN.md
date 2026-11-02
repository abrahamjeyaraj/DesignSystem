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
  
  Two layers exist because the `bible` theme's controls use editorial colours that differ from its page
  colours. For `church` and `tuition` the layers mostly coincide.
- **Radius roles** `control` (inputs, menus, dialogs), `button`, `card`. The tuition theme uses pill buttons
  (9999) while its inputs are 8.
- **Label style** (`label-text` utility plus `--label-size`) carries font, case, tracking and
  weight for buttons, tabs and menus: `bible` IBM Plex Mono uppercase 1.5px; `church` Geist 600;
  `tuition` Inter 800.
- **Custom generator** (`packages/tokens/scripts/build.ts`) instead of Style Dictionary. It has
  zero dependencies, validates the contract, and emits CSS, TS, Swift, Kotlin and Dart.
- **Themes live in the apps; DesignSystem is infra** (decided 2026-09-25, three pilot consumers). Each
  app owns its theme JSON (roles, scales, `extra`) and generates its CSS with the `ds-tokens` bin
  from `@abrahamjeyaraj/tokens`, validated against the shipped `base.json`. The app commits the
  output and runs `ds-tokens css ... --check` in CI. DesignSystem keeps the generator, the role
  contract, the components and, once the apps have moved, a neutral default theme for its gallery
  and tests. A theme generated inside the app is also what `@shadcn/lint` needs: it ignores token
  declarations imported from `node_modules`.
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
  (`COMPONENT_ICONS`). `bible`: custom set, stroke 1.6. `church` and `tuition`: Lucide 0.469.0.
- **Modular packages.** ui-web has module subpaths; apps generate only their own theme, used
  icons and declared scenes. Native module splits follow on a machine that can compile them.

## Provenance

Shipped themes under `tokens/themes/` were extracted from consumer app repos (paths omitted here;
see each theme JSON `$description` and git history). Summary:

- `bible`: web globals and local UI components; an older in-repo token file disagreed with what
  rendered (base 16 vs 15, lighter shadows) and was ignored. Native hand-written theme files were not reconciled.
- `church`: web tokens CSS and layout fonts. **Derived** (the app uses `rgba(var(--ink), a)`):
  `muted-foreground`/`ink-muted` #6f6c63, `ink-body` #3d3a33,
  `border`/`line` #e6e3dc, `line-hover` #d6d2c8, the dark equivalents, `success-light`, `info-light`.
- `tuition`: web component token object and layout fonts.
  **Its dark theme is a proposal**; that app had no dark mode when extracted. `success`/`info` were chosen
  here because the source had none.

## Component changes vs early web copies

- `ed-*` classes became roles; brand font variables became `font-heading` / `font-body` / `label-text`.
- `rounded-[2px]` became `rounded-control` / `rounded-button`; Card uses `rounded-card shadow-card`.
- Menu items used tracking 1px and now use the theme tracking (`bible` 1.5px), a small visual change.
- App-only colours live in each theme's `extra`, with the names the consumer uses. Only generic content-badge palettes (indigo, sky, emerald, rose) remain shared.
- `animate-in`/`zoom-in` classes are kept but inert, as in the source web app (no animation plugin);
  add `tw-animate-css` in a consumer to enable them.

## Open items

0. Standard v1 follow-ups that need a Mac (Swift/Kotlin/Flutter toolchains): run `check:native` for
   the new public Swift inits; native players for scenes (SwiftUI trim, Compose PathMeasure, Flutter
   PathMetric) and native `DSIcon` wrappers; split SwiftPM products / Gradle modules; RN `DSIcon`
   (needs react-native-svg); a neutral default theme replacing the product themes as SDK defaults
   and previews (the brand-free test lists those files). Contrast today: `tuition` muted text 3.78:1,
   `church` dark buttons 3.41:1.

1. Wire consumers: one web consumer is adopting 0.4.x (feature branch, not merged);
   the other web and native consumers still to do. Status: docs/product/prd.md.
2. Accessibility: `tuition` `muted-foreground` #8b7c6d on #fbf7f0 is about 3.9:1 (below AA for
   body text). It is kept as-is from the app. Tuition accent-on-cream is also low.
3. Move themes out (see Decisions): `bible` theme to its consumer web repo first, then `church` and `tuition`
   as those apps adopt `ds-tokens`. Drop them from `tokens/themes` and the shipped CSS only after
   each consumer has switched, then add the neutral default theme. Native apps need the generator
   to emit Swift/Kotlin/Dart values against SDK-owned types before they can follow.
4. Replace hand-written native theme types with the published SDK modules.
5. Web (`ui-web`) and native SDKs have different component sets: web has dialogs/menus/tabs from
   an early web import; native has the Pen mobile set. Converge when a second app needs a missing one.
6. Pen deviations: status/nav bar heights use `controlHeight` (48) vs Pen 54/52; tab bar shadow uses
   platform elevation. Tuition web sizes still use base defaults, not Pen's web scale (11.5-34).
