# DesignSystem, Product Requirements

## Overview

DesignSystem is shared UI infrastructure for consumer apps. It supplies the token generator, the role contract (`tokens/base.json`), and
generic components for web, React Native, SwiftUI, Compose and Flutter. Each app owns its own
look: its theme (colours, fonts, sizes, radii, shadows, label style) lives in the app's repo and is
generated with DesignSystem's tools.

This file is the product queue for the BB **Product** sidebar. Design rationale lives in
[`DESIGN.md`](../../DESIGN.md); usage lives in [`README.md`](../../README.md).

## Who it is for

- **App teams**: install packages, own a theme JSON,
  generate their theme CSS, and use shared components by role name.
- **Agents working in this repo**: pick `[pending]` items; keep components generic (no product
  concepts, see [`AGENTS.md`](../../AGENTS.md)).

## Status legend

- **[done]** shipped and verified.
- **[proto]** partial, or waiting on a consumer to finish adopting it.
- **[planned]** on the roadmap, not started.
- **[pending]** near-term gap, ready to pick up.
- **[blocked]** waiting on a dependency or decision.

Refs use `DS-` plus an area: `ARCH`, `REL`, `THEME`, `WEB`, `NATIVE`, `A11Y`.

## Documentation map

| Document | Owns |
| --- | --- |
| [`DESIGN.md`](../../DESIGN.md) | Decisions, provenance, open items |
| [`README.md`](../../README.md) | Layout, install, `ds-tokens` usage, checks |
| [`docs/pen-native-spec.md`](../pen-native-spec.md) | Native mobile scale and components from Pen |
| This file | Product status tags and the decision log |

Defects go to Taskwarrior, not this queue.

## Decision log

- **2026-09-25, themes live in the apps; DesignSystem is infra.** User direction: "Theme lives in
  our project .. the infra is in designsystem", and "all projects will follow the same".
  DesignSystem keeps the generator, `base.json`, components, and a neutral default theme for its own
  gallery and tests. Each app keeps its theme JSON, commits the generated CSS, and runs
  `ds-tokens css ... --check` in CI. Order: first web consumer (`app` theme); `app` and `app` move when those
  apps adopt it; native apps later.
- **2026-09-25, consumer lint reads a locally generated theme.** `@shadcn/lint` ignores token
  declarations imported from `node_modules`, so a theme imported from the package fails
  `no-raw-colors` (pilot web consumer: 3,241 errors). Rejected: pointing `components.json` at the package
  CSS (makes `shadcn add` write into `node_modules`, and loses app-only colours), and an allowlist
  (misses `hover:` and `/50` variants). A theme generated inside the app gives 0 errors.
- **2026-09-25, app-only colours stay in the app.** Red-letter and bookmark colours were briefly
  added to the `app` theme in DesignSystem and withdrawn before push. They belong in the app's own
  theme `extra`.
- **2026-09-24, CI/CD on Turborepo and GitHub Actions, not Jenkins.** CI and Release run on a
  Mac mini self-hosted runner (`self-hosted, macOS, ARM64, macmini` label in workflows); no Linux runner is needed
  today. Turbo cache in `~/.cache/turbo/DesignSystem`.
- **2026-09-23, private distribution via GitHub Packages.** npm `@abrahamjeyaraj/*` and Android
  Maven via GitHub Packages; SwiftPM and Flutter via git tag. Consumers need
  `GITHUB_PACKAGES_TOKEN` on every machine that installs packages, including CI hosts.
- **2026-09-23, shared structure, own look.** Apps share components, role names and scale keys; a
  theme may change values, never keys.

## 1. Architecture and tooling

- **DS-ARCH-1 Role contract** [done] : `base.json` roles (page layer, shadcn-compatible, plus
  control layer) and scales; the generator rejects missing or unknown roles and new scale keys.
- **DS-ARCH-2 `ds-tokens` bin** [done] : `@abrahamjeyaraj/tokens` ships `ds-tokens css
  <theme.json> <out.css> [--check]` and `base.json`, so apps generate their own Tailwind v4 theme
  CSS. Shipped in 0.4.2; reviewed by a pilot web session (lint 0 errors, `--check` passes).
- **DS-ARCH-3 Neutral default theme** [blocked] : a product-neutral theme for the DesignSystem
  gallery and tests, replacing `app` as `DEFAULT_THEME`. Blocked on DS-THEME-1..3.
- **DS-ARCH-4 Native codegen for app-owned themes** [proto] : `ds-tokens swift` and `ds-tokens
  kotlin --package` emit a theme value against SDK-owned types (Swift types now have public
  inits). Each SDK's tests compile a generated app theme from public API. Unreleased; Dart later.

## 2. Releases and CI

- **DS-REL-1 Turborepo task graph** [done] : `bun run ci` covers every platform (tokens check,
  test, typecheck, build) with a remote-free local cache.
- **DS-REL-2 Mac mini runner** [done] : CI and Release on the self-hosted Mac mini runner; Jenkins
  retired for this repo.
- **DS-REL-3 Release pins tokens version** [done] : the release refreshes `bun.lock` and fails if
  a packed `@abrahamjeyaraj/*` dependency differs from the release version (0.4.1 shipped
  ui-web and ui-native depending on tokens 0.2.1). Fixed from 0.4.2.
- **DS-REL-4 Publish from the Mac mini** [done] : 0.4.2 is the first release published from the
  self-hosted runner.

## 3. Theme migration to the apps

- **DS-THEME-1 First web consumer owns its theme** [proto] : consumer repo `apps/web/theme/app.json`
  plus generated `theme.css`, `--check` in lint, `@source not` for the theme folder. Work on a feature branch (commit `8d9a435b`, on 0.4.2: lint 0 errors,
  `theme:check` passes, compiled CSS unchanged). Done when merged to main.
- **DS-THEME-2 Remove app from DesignSystem** [blocked] : drop `tokens/themes/app.json` and
  the shipped `app.css` after DS-THEME-1 is merged. Blocked on DS-THEME-1.
- **DS-THEME-3 app move out** [planned] : those consumers own
  their themes when they adopt `ds-tokens`; remove them here afterwards. Not moved pre-emptively.

## 4. Web

- **DS-WEB-1 `ui-web` usable from an installed package** [done] : ships `src` so Tailwind
  `@source` finds component classes (fixed in 0.4.1).
- **DS-WEB-2 First web consumer adoption** [proto] : installs ui-web and tokens, deletes about 140
  lines of duplicated theme CSS, screenshots match in light and dark. On 0.4.2 in `8d9a435b`;
  not merged yet.
- **DS-WEB-3 Remaining web consumers** [planned] : wire both to `ui-web`
  and `ds-tokens`.

## 5. Native

- **DS-NATIVE-1 SDKs** [done] : SwiftUI, Compose, Flutter and React Native SDKs with galleries.
- **DS-NATIVE-2 example consumer iOS, tvOS and Android adoption** [pending] : consumer iOS (17), tvOS (17) and
  Android (single `:app`) use the SDKs with a repo-level `theme/app.json` shared with web.
  DesignSystem side: tvOS builds (TextEditor fallback) and iOS/tvOS builds run in CI; Android
  library lowered to minSdk 24 and Kotlin language/API 2.0 for that consumer. Consumer side: GitHub credentials
  for SwiftPM and Maven, `mobile` and font values, replacing its own Theme files.
- **DS-NATIVE-4 watchOS** [planned] : dropped from `Package.swift` (it never compiled:
  TextEditor, UIAccessibility). Add back with fallbacks when an app needs it.
- **DS-NATIVE-3 Component set convergence** [planned] : web and native component sets differ;
  converge when a second app needs a missing component.

## 6. Accessibility

- **DS-A11Y-1 default contrast** [planned] : `app` `muted-foreground` on cream is about 3.9:1,
  below AA for body text; decide once that consumer owns its theme (DS-THEME-3).
