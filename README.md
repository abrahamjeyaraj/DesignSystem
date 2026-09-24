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
native/swift        DesignSystem       SwiftPM: tokens + SwiftUI environment, Color(dsHex:), button style
native/android      :designsystem     Android library: tokens + Compose DSTheme (Material3 bridge)
native/flutter      design_system      Dart package: tokens + ThemeData + DSTheme extension
```

Generated files are committed, so Xcode, Gradle and pub consumers never need Bun.

## Install

Everything is private. npm and Maven come from GitHub Packages; Swift and Flutter come from a git tag.
Any machine or CI job that installs needs a GitHub token with `read:packages` (classic PAT, or
`GITHUB_TOKEN` inside GitHub Actions). Releases: push a `v*` tag; the workflows publish npm + Maven.

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

## Checks

```
bun run verify          generated files fresh + tests (tokens contract, Tailwind compile per theme) + typecheck
bun run check:native    swift test, flutter analyze/test, gradle unit test + AAR
```
