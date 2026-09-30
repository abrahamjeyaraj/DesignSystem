/** Every colour a frozen theme defines (DTCG or legacy), resolved, for drift checks. */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { type Base, resolveTheme, type ThemeSource } from "@abrahamjeyaraj/tokens/build";
import { fromDtcg, isDtcg } from "@abrahamjeyaraj/tokens/dtcg";
import { normalizeColor } from "./extract";

const require = createRequire(import.meta.url);

export function loadBase(): Base {
  return JSON.parse(readFileSync(require.resolve("@abrahamjeyaraj/tokens/base.json"), "utf8")) as Base;
}

export function readThemeSource(path: string): ThemeSource {
  const doc = JSON.parse(readFileSync(path, "utf8"));
  return isDtcg(doc) ? fromDtcg(doc) : (doc as ThemeSource);
}

export function themeColors(path: string): string[] {
  const src = readThemeSource(path);
  const theme = resolveTheme(src, loadBase());
  const out = new Set<string>();
  const collect = (node: unknown) => {
    if (typeof node === "string") {
      const c = normalizeColor(node);
      if (c) out.add(c);
    } else if (node && typeof node === "object") {
      for (const v of Object.values(node)) collect(v);
    }
  };
  collect(src.palette);
  collect([theme.light, theme.dark, theme.extraLight, theme.extraDark, theme.scales, theme.darkScales, theme.aliases]);
  return [...out].sort();
}
