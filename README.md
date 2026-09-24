# Abe Design System

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
native/swift        AbeDesign       SwiftPM: tokens + SwiftUI environment, Color(abeHex:), button style
native/android      :abe-design     Android library: tokens + Compose AbeTheme (Material3 bridge)
native/flutter      abe_design      Dart package: tokens + ThemeData + AbeTheme extension
```

Generated files are committed, so Xcode, Gradle and pub consumers never need Bun.

## Use it

**Next.js (Tailwind v4)**: add `"@abrahamjeyaraj/ui-web": "file:../../../DesignSystem/packages/ui-web"` and
`"@abrahamjeyaraj/tokens": "file:../../../DesignSystem/packages/tokens"`, set `transpilePackages: ["@abrahamjeyaraj/ui-web", "@abrahamjeyaraj/tokens"]`, then:

```css
@import "tailwindcss";
@import "@abrahamjeyaraj/tokens/css/church.css";   /* your app's theme */
@import "@abrahamjeyaraj/tokens/base.css";         /* optional body/heading base layer */
@import "@abrahamjeyaraj/ui-web/styles.css";       /* lets Tailwind see the component classes */
```

```tsx
import { Button, Card, Input } from "@abrahamjeyaraj/ui-web";
```

Load the theme's fonts with `next/font` using the CSS variable named in the theme JSON (`webVar`),
e.g. church: `--font-geist-sans`, `--font-geist-mono`, `--font-newsreader`. Dark mode is the `.dark` class.

**React Native / Expo / react-native-web**: wrap the root in `<AbeThemeProvider theme="tuition">`,
then use `Button`, `Card`, `Input`, `Text`, `Badge`, or `useAbeTheme()` for raw values.

**SwiftUI**: add `native/swift` as a local package; `.abeTheme(AbeTokens.church)` at the root; read
`@Environment(\.abeTheme)`; `Color(abeHex: theme.colors(for: scheme).action)`; `.buttonStyle(AbeButtonStyle())`.

**Compose**: `include(":abe-design")` with `project(":abe-design").projectDir = file("…/DesignSystem/native/android/abe-design")`;
wrap in `AbeTheme(AbeTokens.tuition) { … }`; `Abe.current.colors` for non-Material roles.

**Flutter**: `abe_design: { path: …/DesignSystem/native/flutter }`;
`theme: abeThemeData(AbeTokens.church, brightness: Brightness.light)`; `AbeTheme.of(context)` for extra roles.

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
