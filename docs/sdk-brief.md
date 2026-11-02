# Platform SDK brief (shared by all platform agents)

Repo: abrahamjeyaraj/DesignSystem (private). Base: `main` @ 882f58f. Read `README.md`, `AGENTS.md`,
`DESIGN.md`, `docs/HANDOFF.md` and `docs/pen-native-spec.md` first.

## Objective
Turn your platform's adapter into a component SDK that renders the Pen "Native Design System"
(`docs/pen-native-spec.md`, 21 `M /` components) **from theme tokens only**, so the first native
consumer can adopt it and others can reuse the SDK with their own themes (`app`, `app`, `app`, …).

## Hard rules
- Values come from the generated tokens (`DSTokens.<theme>`: `light/dark` roles, `mobileType`,
  `mobileLayout`, `radius`, `label`, `extraLight/extraDark`, `supportsDark`). No hex literals, no
  numbers that belong to a theme. Pen literals map to roles:
  - `$accent` = `primary`/`action`; `$on-accent` = `action-foreground`
  - `$surface` = `background`; `$surface-card` = `card`; `$surface-sand` = `secondary`; `$surface-tint` = `muted`
  - `$text-primary` = `foreground`/`ink`; `$text-secondary` = `ink-body`; `$text-muted` = `ink-muted`
  - `$border` = `border`/`line`
  - `$warn`/`$warn-bg` = `warning`/`warning-light`; `$alert`/`$alert-bg` = `error`/`error-light`
  - Paid chip `#3F6B3A`/`#E3ECDF` = `success`/`success-light`
  - Tab active fill `#8A2B2B1A` = `primary` at 10% alpha
  - font `$font-head` = `mobileType.title/headline` family; `$font-body` = body/label family
  - `$m-*` = `mobileType` / `mobileLayout`
- Fixed Pen sizes with no token (icon 18/20/22, avatar 40, chip padding 4x10, grabber 40x5) may be
  component constants, named once.
- Honour `supportsDark == false`: always use `light` even when the OS is dark.
- Dynamic Type / font scaling must work (iOS `@ScaledMetric`/`relativeTo`, Android `sp`, RN `allowFontScaling`, Flutter `textScaler`). Min touch target = `mobileLayout.touchTarget`.
- Fonts: resolve the theme family if the app bundles it, else fall back to system serif (heading
  roles) or system sans (others). No bundled font files, no network.
- Accessibility: labels/roles on every interactive component; chips and status not colour-only.
- Every component has a `DS` prefix (or lives in a `DS` namespace) to avoid clashing with app types.

## Components (minimum)
Text styles (title, headline, body, label, caption) · Button (primary, secondary, ghost, destructive;
optional leading icon; pill per `radius.button`) · IconButton · Chip (neutral, accent, success,
warning, error) · Avatar (initials) · ListRow (leading, title, subtitle, trailing, chevron) ·
StatTile (label, value, meta with tone) · Segmented control · Field (label + box, `fieldHeight`) ·
SearchField · LargeTitle (eyebrow, title, trailing action) · NavBar (leading, title, trailing) ·
SheetHandle · SectionHeader (title + action) · TabBar (floating capsule, icon+label items, active
pill) · Card · EmptyState (icon, title, message, action).
Plus a **Gallery** screen showing every component for a chosen theme (app, app, app) in
light and dark, which doubles as the manual check against Pen.

## Scope and deletion rules
- Write only inside your platform's paths (given in your prompt). Do NOT edit `tokens/*.json`,
  `packages/tokens/scripts/build.ts` or any generated token file. If you need a new token, stop and
  report the proposed key and values instead.
- Do not edit consumer app repos from this assignment.
- Do not push, tag, or publish. Commit on your worktree branch only.

## Report back (final message)
Branch + commit SHA, files added/changed, component list with any Pen deviations, exact check
commands run with pass/fail output, consumer install snippet for the pilot native app, and open issues or
token proposals.
