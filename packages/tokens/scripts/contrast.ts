/**
 * WCAG 2.x contrast check for a resolved theme: every text role against the surface it sits on,
 * in every mode the theme supports. Body text needs 4.5:1 (AA).
 */
import type { Theme } from "./build";

export interface ContrastPair {
  text: string;
  surface: string;
  min: number;
}

/** Text-on-surface pairs the components actually render. */
export const CONTRAST_PAIRS: ContrastPair[] = [
  { text: "foreground", surface: "background", min: 4.5 },
  { text: "muted-foreground", surface: "background", min: 4.5 },
  { text: "card-foreground", surface: "card", min: 4.5 },
  { text: "muted-foreground", surface: "card", min: 4.5 },
  { text: "popover-foreground", surface: "popover", min: 4.5 },
  { text: "primary-foreground", surface: "primary", min: 4.5 },
  { text: "secondary-foreground", surface: "secondary", min: 4.5 },
  { text: "accent-foreground", surface: "accent", min: 4.5 },
  { text: "destructive-foreground", surface: "destructive", min: 4.5 },
  { text: "ink", surface: "background", min: 4.5 },
  { text: "ink-body", surface: "background", min: 4.5 },
  { text: "ink-muted", surface: "background", min: 4.5 },
  { text: "ink", surface: "subtle", min: 4.5 },
  { text: "action-foreground", surface: "action", min: 4.5 },
  { text: "on-ink", surface: "ink-900", min: 4.5 },
  { text: "on-ink-muted", surface: "ink-900", min: 4.5 },
];

export interface ContrastResult extends ContrastPair {
  mode: "light" | "dark";
  ratio: number;
  pass: boolean;
}

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function checkContrast(theme: Theme): ContrastResult[] {
  const modes = theme.supportsDark ? (["light", "dark"] as const) : (["light"] as const);
  return modes.flatMap((mode) =>
    CONTRAST_PAIRS.map((p) => {
      const ratio = contrastRatio(theme[mode][p.text], theme[mode][p.surface]);
      return { ...p, mode, ratio, pass: ratio >= p.min };
    }),
  );
}

export function formatContrast(results: ContrastResult[]): string {
  return results
    .map((r) => `${r.pass ? "ok  " : "FAIL"}  ${r.mode.padEnd(5)}  ${r.text} on ${r.surface}  ${r.ratio.toFixed(2)}:1 (min ${r.min})`)
    .join("\n");
}
