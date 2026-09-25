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
  
  Two layers exist because Bible's controls use editorial colours that differ from its page
  colours. For church and tuition the layers mostly coincide.
- **Radius roles** `control` (inputs, menus, dialogs), `button`, `card`. Tuition buttons are pills
  (9999) while its inputs are 8.
- **Label style** (`label-text` utility plus `--label-size`) carries font, case, tracking and
  weight for buttons, tabs and menus: Bible IBM Plex Mono uppercase 1.5px; church Geist 600;
  tuition Inter 800.
- **Custom generator** (`packages/tokens/scripts/build.ts`) instead of Style Dictionary. It has
  zero dependencies, validates the contract, and emits CSS, TS, Swift, Kotlin and Dart.
- **Themes live in the apps; DesignSystem is infra** (decided 2026-09-25, all three apps). Each
  app owns its theme JSON (roles, scales, `extra`) and generates its CSS with the `ds-tokens` bin
  from `@abrahamjeyaraj/tokens`, validated against the shipped `base.json`. The app commits the
  output and runs `ds-tokens css ... --check` in CI. DesignSystem keeps the generator, the role
  contract, the components and, once the apps have moved, a neutral default theme for its gallery
  and tests. A theme generated inside the app is also what `@shadcn/lint` needs: it ignores token
  declarations imported from `node_modules`.
- **Native type names are `DS`-prefixed** so they don't collide with SwiftUI/Material3
  `ColorScheme`.

## Provenance

- bible: `TheBibleProject/apps/web/src/app/globals.css` (what renders) and `components/ui/*.tsx`.
  Its `src/design-system/tokens.ts` disagrees with globals.css (base 16 vs 15, lighter shadows)
  and was ignored. iOS `DesignSystem.swift` and Android `DesignSystem.kt` were not reconciled.
- church: `ChurchManagement/apps/web/src/app/tokens.css`, `layout.tsx` fonts. **Derived** (Church
  uses `rgba(var(--ink), a)`): `muted-foreground`/`ink-muted` #6f6c63, `ink-body` #3d3a33,
  `border`/`line` #e6e3dc, `line-hover` #d6d2c8, the dark equivalents, `success-light`, `info-light`.
- tuition: `TuitionManager/apps/web/src/components/ui.tsx` `designTokens`, `layout.tsx` fonts.
  **Its dark theme is a proposal**; the app has no dark mode today. `success`/`info` were chosen
  here because Tuition has none.

## Component changes vs Bible originals

- `ed-*` classes became roles; brand font variables became `font-heading` / `font-body` / `label-text`.
- `rounded-[2px]` became `rounded-control` / `rounded-button`; Card uses `rounded-card shadow-card`.
- Menu items used tracking 1px and now use the theme tracking (Bible 1.5px), a small visual change.
- Bible-only colours (body, border-subtle, brand-brown, ...) live in bible `extra`, with the
  same names Bible web uses. Only the content-badge palettes (indigo, sky, emerald, rose) remain.
- `animate-in`/`zoom-in` classes are kept but inert, as in Bible today (no animation plugin);
  add `tw-animate-css` in a consumer to enable them.

## Open items

1. Wire consumers: Bible web is adopting 0.4.x (TheBibleProject `web/shadcn-colors`, not merged);
   ChurchHQ web and TuitionManager web and native still to do. Status: docs/product/prd.md.
2. Accessibility: tuition `muted-foreground` #8b7c6d on #fbf7f0 is about 3.9:1 (below AA for
   body text). It is kept as-is from the app. Tuition accent-on-cream is also low.
3. Move themes out (see Decisions): bible to TheBibleProject web first, then church and tuition
   as those apps adopt `ds-tokens`. Drop them from `tokens/themes` and the shipped CSS only after
   each consumer has switched, then add the neutral default theme. Native apps need the generator
   to emit Swift/Kotlin/Dart values against SDK-owned types before they can follow.
4. Bible iOS/Android: replace hand-written DesignSystem/Tokens with `DesignSystem` / `:designsystem`.
5. Web (`ui-web`) and native SDKs have different component sets: web has dialogs/menus/tabs from
   Bible; native has the Pen mobile set. Converge when a second app needs a missing one.
6. Pen deviations: status/nav bar heights use `controlHeight` (48) vs Pen 54/52; tab bar shadow uses
   platform elevation. Tuition web sizes still use base defaults, not Pen's web scale (11.5-34).
