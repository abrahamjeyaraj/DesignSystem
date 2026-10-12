#!/usr/bin/env bun
/**
 * ds-init: scaffold the standard design/ folder in an app.
 *
 *   ds-init <app-root> --name <app> [--icons lucide|custom] [--from-legacy theme.json] [--agents] [--force]
 */
import { initDesign } from "./init";

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const root = args[0];
  const name = option(args, "--name");
  if (!root || root.startsWith("--") || !name) {
    console.error("usage: ds-init <app-root> --name <app> [--icons lucide|custom] [--from-legacy theme.json] [--agents] [--force]");
    process.exit(2);
  }
  try {
    const icons = option(args, "--icons") === "custom" ? "custom" : "lucide";
    const r = initDesign(root, { name, icons, fromLegacy: option(args, "--from-legacy"), agents: args.includes("--agents"), force: args.includes("--force") });
    for (const f of r.created) console.log(`created ${f}`);
    for (const f of r.skipped) console.log(`kept    ${f} (exists; --force to replace)`);
    if (args.includes("--agents")) console.log("updated AGENTS.md design rules");
  } catch (err) {
    console.error(`ds-init: ${(err as Error).message}`);
    process.exit(1);
  }
}
