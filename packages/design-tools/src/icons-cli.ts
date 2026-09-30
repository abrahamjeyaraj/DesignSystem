#!/usr/bin/env bun
/**
 * ds-icons: generate every platform's icon assets from the app's design/icons/icons.json.
 *
 *   ds-icons build <icons.json>           write outputs (only icons the code uses + component icons)
 *   ds-icons build <icons.json> --check   exit 1 if any output is stale (CI)
 *   ds-icons build <icons.json> --all     emit every icon in the set
 *   ds-icons verify <icons.json> [--sheet out.html]
 *                                        render every output next to its source in Chromium; exit 1 on a mismatch
 */
import { buildIcons } from "./icons";

const USAGE = "usage: ds-icons build <icons.json> [--check] [--all]\n       ds-icons verify <icons.json> [--sheet out.html]";

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const [command, manifest] = args.filter((a) => !a.startsWith("--"));
  if (command === "verify" && manifest) {
    try {
      const sheet = option(args, "--sheet");
      const { verifyIcons } = await import("./verify");
      const r = await verifyIcons(manifest, { sheet });
      for (const f of r.failures) console.error(`ds-icons: mismatch: ${f.platform} ${f.icon} ${f.size}px ${(f.diff * 100).toFixed(1)}% of inked pixels differ`);
      if (sheet) console.log(`contact sheet: ${sheet}`);
      if (r.failures.length) process.exit(1);
      console.log(`${r.results.length} renders match their source`);
      process.exit(0);
    } catch (err) {
      console.error(`ds-icons: ${(err as Error).message}`);
      process.exit(1);
    }
  }
  if (command !== "build" || !manifest) {
    console.error(USAGE);
    process.exit(2);
  }
  const check = args.includes("--check");
  try {
    const r = buildIcons(manifest, { check, all: args.includes("--all") });
    for (const w of r.warnings) console.error(`ds-icons: warning: ${w}`);
    if (check) {
      if (r.stale.length) {
        console.error(`ds-icons: stale outputs (run: ds-icons build ${manifest}):\n  ${r.stale.join("\n  ")}`);
        process.exit(1);
      }
      console.log(`${r.icons.length} icons up to date`);
    } else {
      console.log(`${r.icons.length} icons; ${r.written.length} file(s) written`);
    }
  } catch (err) {
    console.error(`ds-icons: ${(err as Error).message}`);
    process.exit(1);
  }
}
