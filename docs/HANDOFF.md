# Handoff: platform SDKs (started 2026-09-23)

## Rulings from user
- Private GitHub repo abrahamjeyaraj/DesignSystem (pushed, main @ 717aacb). Stay private.
- Distribution via GitHub Packages (free tier OK): npm `@abrahamjeyaraj/*`, Android Maven.
  iOS = SwiftPM git tag (GH Packages has no Swift registry). Flutter = git dep + path (no pub registry).
- Apps share structure, NOT look. Themes own colours/fonts/sizes.
- Build order: 1) iOS + Android native SDKs  2) React Native SDK (Expo + RN-web, shareable by
  Tuition + ChurchHQ mobile)  3) Flutter.
- First consumer: TuitionManager ios-native + android-native. Editing TuitionManager repo needs a go-ahead.

## Source of truth for native look
- `TuitionManager/ux/tuition-manager.pen` board "Native Design System": 21 `M /` components +
  mobile scale (m-title 28, m-headline 20, m-body 15, m-label 13, m-caption 11, gutter 20,
  touch 48, card radius 16, sheet radius 24). Spec extract: docs/pen-native-spec.md.
- Tuition iOS today: Sources/App.swift `Theme`, `PenTypography`, `PenList/PenForm`; PEN-THEME.md
  (light-only, system font fallback New York/SF, @ScaledMetric no clamp).
- Tuition Android today: ui/theme/{Color,Dimens,Type,Theme}.kt, ui/components/AppComponents.kt.

## Plan phase 1
1. tokens: add per-theme `mobile` (type roles title/headline/body/label/caption with size,
   lineHeight, weight, font; layout gutter/sectionGap/itemGap/touchTarget/cardRadius/sheetRadius)
   and `supportsDark`. Regenerate.
2. Root Package.swift (SwiftPM needs it at repo root) -> native/swift paths.
3. SwiftUI + Compose component sets matching Pen M/ list.
4. Android maven-publish to GitHub Packages; GitHub Actions workflow on tag v*.
5. Tag v0.2.0.

## Traps
- Tailwind CLI resolves imports relative to input file (test tmp lives in package/.tmp).
- Native type names must stay Abe-prefixed (SwiftUI/Material3 ColorScheme clash).
- Android built with TuitionManager's gradle wrapper; AGP 8.9.2, Kotlin 2.1.20, compose BOM 2025.04.01.
- context-mode hook blocks some build commands in Bash; use ctx_execute for gradle/swift builds.

## Phase 1-3 dispatch (2026-09-23, base main @ b595ce7, brief docs/sdk-brief.md)
- iOS SwiftUI     thr_mby8hpkpks  codex gpt-6-luna                 native/swift/**, Package.swift
- Android Compose thr_w4u8grdxdt  acp-cursor composer-2.5          native/android/**, .github/workflows/publish-android.yml
- React Native    thr_qv55s5nur3  pi antigravity/gemini-3.8-flash  packages/ui-native/**, package.json publish fields, publish-npm.yml
- Flutter         thr_mrd47fkp89  codex gpt-6-luna                 native/flutter/**
Parent integrates: inspect each branch diff, rerun checks, merge to main, tag v0.2.0, push (publish runs on tag).

## Rename ruling (user, 2026-09-23): no "Abe" anywhere; generic for future public release
Do ONE rename pass after RN + Flutter branches merge, before tagging v0.2.0:
root pkg abe-design-system -> design-system; Swift module/product AbeDesign -> DesignSystem;
type prefix Abe* -> DS* (DSThemeTokens, DSTokens, DSButton, ...); .abeTheme/.abeFont/Color(abeHex:) ->
.dsTheme/.dsFont/Color(dsHex:); Android :abe-design -> :designsystem, com.abe.design ->
com.abrahamjeyaraj.designsystem, Maven com.abrahamjeyaraj:designsystem; Flutter abe_design ->
design_system; RN AbeThemeProvider/useAbeTheme -> DSThemeProvider/useDSTheme. npm names unchanged.
Merged so far: Android (56b5058), iOS (22a63e1).
