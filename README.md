# Design System

One design system for TheBibleProject, ChurchHQ (ChurchManagement) and TuitionManager.
**Shared:** components, token names, scales, and structure. **Per app:** colours, fonts, type
sizes, radii, shadows and button-label style, via a theme. The apps do not look alike; they are
built the same way.

```
tokens/base.json            role contract + default scales (spacing, radius, type, shadow, motion)
tokens/themes/<app>.json    bible | church | tuition: palette, role colours, fonts, sizes, radii
        │  bun run tokens  (packages/tokens/scripts/build.ts)
        ▼
packages/tokens     @abrahamjeyaraj/tokens     Tailwind v4 CSS per theme + typed TS object
packages/ui-web     @abrahamjeyaraj/ui-web     React + Radix + Tailwind components (web and mobile web)
packages/ui-native  @abrahamjeyaraj/ui-native  React Native / Expo / react-native-web primitives
packages/design-tools @abrahamjeyaraj/design-tools  ds-extract, ds-icons, ds-art, ds-lint, ds-init (apps' design/ folder)
native/swift        DesignSystem       SwiftPM: tokens + SwiftUI environment, Color(dsHex:), button style
native/android      :designsystem     Android library: tokens + Compose DSTheme (Material3 bridge)
native/flutter      design_system      Dart package: tokens + ThemeData + DSTheme extension
```

Generated files are committed, so Xcode, Gradle and pub consumers never need Bun.

## Install

Everything is private. npm and Maven come from GitHub Packages; Swift and Flutter come from a git tag.
Any machine or CI job that installs needs a GitHub token with `read:packages` (classic PAT, or
`GITHUB_TOKEN` inside GitHub Actions). Releases: push a `v*` tag once; the `Release` workflow runs `bun run ci` then `bun run release`,
which publishes npm + Maven. `CI` runs `bun run ci` on every push to `main` and every PR. Both run on
the Mac mini self-hosted runner `macmini-DesignSystem` (`~/actions-runner/runner.sh` on the Mac
mini manages it).

**iOS (SwiftUI)**: Xcode > Add Package > `https://github.com/abrahamjeyaraj/DesignSystem`, from `0.2.0`,
product `DesignSystem` (Xcode must be signed in to GitHub).

```swift
import DesignSystem
RootView().dsTheme(DSTokens.tuition)          // DSButton, DSListRow, .dsFont(.title), DSGallery ...
```

**Android (Compose)**: `settings.gradle.kts`

```kotlin
dependencyResolutionManagement {
    repositories {
        google(); mavenCentral()
        maven {
            url = uri("https://maven.pkg.github.com/abrahamjeyaraj/DesignSystem")
            credentials {
                username = providers.gradleProperty("gpr.user").orNull ?: System.getenv("GITHUB_ACTOR")
                password = providers.gradleProperty("gpr.key").orNull ?: System.getenv("GITHUB_TOKEN")
            }
        }
    }
}
```

`implementation("com.abrahamjeyaraj:designsystem:0.2.0")`, put `gpr.user` / `gpr.key` in
`~/.gradle/gradle.properties`, then `DSTheme(DSTokens.tuition) { ... }`.

**React Native / Expo / react-native-web and React web**: `.npmrc` (or `bunfig.toml` scope)

```
@abrahamjeyaraj:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`bun add @abrahamjeyaraj/ui-native` (pulls `@abrahamjeyaraj/tokens`), then
`<DSThemeProvider theme="tuition">` and `DSButton`, `DSListRow`, `useDSTheme()` ...
Web: `bun add @abrahamjeyaraj/ui-web` and in CSS:

```css
@import "tailwindcss";
@import "@abrahamjeyaraj/tokens/css/church.css";
@import "@abrahamjeyaraj/tokens/base.css";
@import "@abrahamjeyaraj/ui-web/styles.css";
```

Load the theme fonts with `next/font` under the CSS variable named in the theme JSON (`webVar`).

**Flutter**

```yaml
dependencies:
  design_system:
    git:
      url: git@github.com:abrahamjeyaraj/DesignSystem.git
      ref: v0.2.0
      path: native/flutter
```

`MaterialApp(theme: dsThemeData(DSTokens.tuition, brightness: Brightness.light), ...)`.

Every SDK ships a gallery (`DSGallery`) showing all components per theme in light and dark.

## Change the look

Edit `tokens/themes/<app>.json` (or `base.json` for everyone), then `bun run tokens` and
`bun run verify`. The generator rejects missing roles, unknown roles and new scale keys, so every
theme keeps working with every component. Colours only one app needs go in that theme's `extra`.

Add an app: copy a theme file, rename `name`, and adjust the values.

### Own the theme in the app

Apps are moving their theme into their own repo (see DESIGN.md). With `@abrahamjeyaraj/tokens`
installed (needs Bun):

```sh
bunx ds-tokens css theme/app.json src/app/theme.css           # write
bunx ds-tokens css theme/app.json src/app/theme.css --check   # CI: fail if stale
```

The theme JSON has the same shape as `tokens/themes/*.json` and is checked against the shipped
`base.json` (`@abrahamjeyaraj/tokens/base.json`). Import the generated file after Tailwind in place
of `@abrahamjeyaraj/tokens/css/<app>.css`, and commit it. If the theme JSON sits where Tailwind
scans for sources, its keys become stray utilities; exclude it, e.g. `@source not "../../theme";`.

## The app's design/ folder

The standard (docs/STANDARD-v1.md): DesignSystem is infrastructure; each app owns its brand in a
`design/` folder, laid out like a Claude Design design-system project so it can be synced there.

```sh
bunx ds-init . --name my-app --agents                  # scaffold design/ + agent rules in AGENTS.md
bunx ds-tokens validate design/theme.json              # DTCG theme against the role contract
bunx ds-tokens contrast design/theme.json --strict     # WCAG AA for every text/surface pair
bunx ds-tokens css    design/theme.json src/theme.css                        # web
bunx ds-tokens swift  design/theme.json ios/App/AppTheme.swift               # DSTokens.myApp
bunx ds-tokens kotlin design/theme.json android/.../AppTheme.kt --package x  # MyAppTheme
bunx ds-tokens dart   design/theme.json lib/app_theme.g.dart                 # myAppTheme
bunx ds-tokens migrate old-theme.json design/theme.json                      # legacy -> DTCG
```

Themes are DTCG (`$type`, `$value`, `{palette.x.y}` aliases, dark mode in `$extensions.ds.dark`) with
semantic names (`color.surface.page`, `color.text.muted`, `color.action.primary`, ...). The legacy
role names map one to one (`ROLE_MAP` in `packages/tokens/scripts/dtcg.ts`), so outputs are identical.

```sh
bunx ds-extract design/source/<export> --out report.json --candidates icons/ --theme design/theme.json
bunx ds-icons build  design/icons/icons.json [--check]   # only icons the code uses, every platform
bunx ds-icons verify design/icons/icons.json --sheet sheet.html   # pixel check in Chromium
bunx ds-art extract scene.svg --id welcome --out design/art/scenes/welcome.json
bunx ds-art build design/art/art.json [--check]
bunx ds-lint . --baseline design/lint-baseline.json      # no literals, stock palettes, platform icons, inline SVG
```

- `ds-extract` lists what a Claude Design export or `.pen` file contains: colours by name and value,
  names whose value differs between files, fonts, inline icons grouped by geometry with their
  stroke widths, and library icons. `--theme` lists colours the frozen theme lacks (drift).
- `icons.json` pins one set (custom SVGs, or `lucide` at an exact version), one grid, stroke, cap
  and join. `ds-icons` writes web/RN data, an iOS asset catalog + Swift names, Android
  VectorDrawables, Compose ImageVectors and Flutter assets from the same geometry; `verify` renders
  each output beside its source and fails on any visible difference.
- Scenes (`ds-art`) are paths with a draw window each; `DSStrokeScene` plays them on the web.

**Web modules.** Import only what you use; each subpath bundles nothing from the others:
`@abrahamjeyaraj/ui-web/core`, `/controls`, `/content`, `/navigation`, `/icons` (DSIcon +
DSIconProvider with the app's generated icons), `/art` (DSStrokeScene). The root still exports all.

Native apps generate from the same theme JSON and commit the output:

```sh
bunx ds-tokens swift theme/app.json Sources/Theme/AppTheme.swift         # .dsTheme(.app)
bunx ds-tokens kotlin theme/app.json src/main/java/.../AppTheme.kt --package com.example.ui.theme
                                                                          # DSTheme(AppTheme) { ... }
```

Both accept `--check`. The Swift file extends `DSThemeTokens` with a static theme and provides `DSTokens.<name>` as a compatibility alias unless that name already belongs to the SDK; the Kotlin file
declares `<Name>Theme` in the given package. Set `mobile` and native `fontFamily` names in the
theme JSON to fonts the app bundles. Headers name the theme path relative to its git repo root.

A theme can override type, shape and `mobile` values per platform, for example fonts a TV target
bundles: `"platforms": { "tvos": { "fontFamily": { "heading": { ... } } } }`. Keys are `ios`,
`tvos` and `android`; the Swift file then carries an `#if os(tvOS)` value.

Compose: the library bundles no fonts, so pass `fonts = { name -> ... }` to `DSTheme` or every role
falls back to serif (headings) or the system sans. `DSTheme(..., applyMaterial = false)` provides
only the DS tokens under the app's own `MaterialTheme`.

## Checks

```
bun run verify          generated files fresh + tests (tokens contract, Tailwind compile per theme) + typecheck
bun run check:native    swift test, flutter analyze/test, gradle unit test + AAR
                        (design-tools icon verify needs Chromium; its tests skip without one)
bun run ci              every platform: tokens:check, test, typecheck, build
bun run release         publish npm packages + Android AAR (needs DS_VERSION, GITHUB_ACTOR, GITHUB_TOKEN)
```

Every platform is a Turborepo workspace (`packages/*`, `native/swift`, `native/android`,
`native/flutter`); `turbo.json` holds the task graph and results are cached in `.turbo/`.
