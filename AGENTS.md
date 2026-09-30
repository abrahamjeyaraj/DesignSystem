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
- Components are generic UI patterns only. No product or domain concepts (students, attendance,
  fees, stars, sermons, members, donations) in component names, APIs, default labels, metrics names
  or file names. Accessibility labels have no product-specific defaults. Gallery samples use neutral
  content. Anything that only makes sense for one product belongs in that product's app.
- A theme may change values, never keys. A new role or scale key goes in `base.json` and gets a value
  in every theme.
- Use Bun. Before handing off: `bun run verify`; if native adapters or the generator changed, also
  `bun run check:native`.
- Design tooling follows docs/STANDARD-v1.md. Test fixtures under `packages/design-tools/test/fixtures`
  use neutral content. The brand-free test lists the files still allowed to name a product; that
  list may only shrink.
- ui-web modules (`src/modules/*.ts`) must together export exactly the root API; a new component
  goes into one module.
- Consumer repos are separate. Do not edit them from here unless asked.
