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

## Released v0.2.0 (2026-09-23)
- Rename done (e379744); zero "Abe" outside this file. Tag v0.2.0 -> e379744.
- Published to GitHub Packages: npm @abrahamjeyaraj/{tokens,ui-web,ui-native}@0.2.0 (manual dispatch
  from main after CI fixes: set versions without npm, bun publish --registry npm.pkg.github.com),
  Maven com.abrahamjeyaraj:designsystem:0.2.0 (tag run). SwiftPM + Flutter consume tag v0.2.0.
- Trap: bun publish ignores publishConfig.registry; npm version/publish choke on workspace:*.
- Trap: local gh token lacks read:packages; consumers need a PAT with read:packages.
- Next: migrate TuitionManager ios-native + android-native (needs user go-ahead).

## v0.2.1 + TuitionManager migration (2026-09-23)
- v0.2.1 released (tag 4d21c13): tab label fix all platforms, Android heading slots, Android CI
  version fix (v0.2.0 Maven went out as 0.0.0-SNAPSHOT; SNAPSHOT publish now refused).
- Token: classic PAT read:packages stored in ~/.secrets.zsh (GITHUB_PACKAGES_TOKEN),
  ~/.gradle/gradle.properties (gpr.user/gpr.key), ~/.npmrc (scope + env ref). Verified 200s.
- TuitionManager Android migrated + merged locally (5c4a358, ddde98b), NOT pushed (main ahead 7 incl.
  user's own web commits). Resolves designsystem:0.2.1 from GitHub Packages, 27 tests pass.
- TuitionManager iOS thr_3ivjvzmyca: sent back (grey bg, double tab bar, small titles, double chevron,
  empty search, nested card); must bump to 0.2.1 and capture before shots.
- Web: waiting on user (tokens-only vs full ui-web swap).
- SDK gaps queued for next minor: selectable chip, field validation, outline destructive button,
  optional empty-state message, section-title size token, themed native list/form container, date picker.

## Ruling (user, 2026-09-23): user owns Pen screen fidelity for Tuition iOS + Android
- Screens on both platforms do not match the Pen mocks yet; the user will get that fixed. Agents should
  not iterate on screen layout unless asked.
- iOS fix-up thread thr_khaaurgvuf stopped mid-edit. Uncommitted partial work (App.swift, project.yml,
  new DSChrome.swift) left in worktree ~/.bb/.../thr_3ivjvzmyca-1/TuitionManager on branch
  bb/impl-tuitionmanager-ios-onto-designsystem-sdk-thr_3ivjvzmyca (last commit 9ff6862, not merged).
- Android migration is merged into TuitionManager local main (5c4a358), not pushed.

## Released v0.2.4 (2026-09-24)
- DSTabBar capsule height is a 64pt minimum instead of fixed on every platform; Android labels use a
  13sp line height. Fixes the clipped active label on Android seen with v0.2.3.

## Released v0.3.0 (2026-09-24)
- Generic pattern components on web (`@abrahamjeyaraj/ui-web`), React Native
  (`@abrahamjeyaraj/ui-native`), Swift, Android Compose and Flutter: `DSSnackbar` (bar + host state),
  `DSWeekStrip`, `DSTimelineRow`, `DSCountPill`, `DSPodium`, `DSMarkToggle`, `DSSummaryBar`,
  `DSPresetGrid`, `DSStepper`, `DSQuickActionTile`, `DSActivityRow`, and multiline `DSField` /
  `DSMultilineField` with character counter. Sources live in `pattern-components` (web/RN) and
  `DSPatternComponents` (native); fixed layout metrics in `DSComponentMetrics` / `DSPenMetrics` /
  `DSPatternMetrics`. Gallery section title: Patterns.

## Released v0.2.3 (2026-09-24)
- DSSectionHeader no longer adds its own horizontal gutter (Pen sets padding 0 inside screen
  content) and uses body 17/600 on every platform.
- DSTabBar follows Pen `M / Tab Bar`: 64pt capsule, 6 padding, 16/12 outer inset, fixed 22pt icons,
  10.5 labels, hugging active pill. Swift now spreads items evenly; Flutter keeps 48dp targets.

## Released v0.2.2 (2026-09-23)
- DSToggle, DSProgress, DSInkCard, DSNudge on web, React Native, Swift, Android and Flutter (Pen
  TuitionManager native frames). New shared roles: surface-card, surface-sand, accent-2, ink-900,
  on-ink, on-ink-muted, on-ink-accent, warn-bg, alert-bg, with a contrast test (on-ink 4.5:1,
  on-ink-muted 3:1 against ink-900) for every theme and mode.
- Owner lifted the screen-fidelity pause: TuitionManager iOS and Android are being rebuilt to Pen.
