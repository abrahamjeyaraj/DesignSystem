# Agent guidance: DesignSystem

@~/Development/Projects/AGENTS.md

Shared design system for TheBibleProject, ChurchManagement (ChurchHQ) and TuitionManager. Read
`README.md` for layout and `DESIGN.md` for decisions and open items.

## Rules

- `tokens/*.json` is the only hand-edited source of token values. Never edit files under
  `packages/tokens/generated/`, `native/swift/Sources/DesignSystem/DSTokens.swift`,
  `native/android/.../DSTokens.kt` or `native/flutter/lib/src/ds_tokens.g.dart`; run `bun run tokens`.
- Components use role names only (`bg-action`, `text-ink`, `border-line`, `rounded-button`,
  `label-text`). No hex literals, no stock palette classes (`gray-500`), no brand font variables.
- A theme may change values, never keys. A new role or scale key goes in `base.json` and gets a value
  in every theme.
- Use Bun. Before handing off: `bun run verify`; if native adapters or the generator changed, also
  `bun run check:native`.
- Consumer repos are separate. Do not edit them from here unless asked.
