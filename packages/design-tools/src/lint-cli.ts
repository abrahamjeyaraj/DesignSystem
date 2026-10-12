#!/usr/bin/env bun
/**
 * ds-lint: check an app against the standard's code rules (config: design/lint.json).
 *
 *   ds-lint <app-root>                            exit 1 on any finding
 *   ds-lint <app-root> --write-baseline <file>    record today's findings to adopt the rules
 *   ds-lint <app-root> --baseline <file>          exit 1 only on findings not in the baseline
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { type Baseline, lintApp, newFindings, toBaseline } from "./lint";

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const root = args[0];
  if (!root || root.startsWith("--")) {
    console.error("usage: ds-lint <app-root> [--baseline file] [--write-baseline file]");
    process.exit(2);
  }
  const findings = lintApp(root);
  const write = option(args, "--write-baseline");
  if (write) {
    mkdirSync(dirname(write), { recursive: true });
    writeFileSync(write, `${JSON.stringify(toBaseline(findings), null, 2)}\n`);
    console.error(`ds-lint: baseline of ${findings.length} finding(s) written to ${write}`);
    process.exit(0);
  }
  const baselinePath = option(args, "--baseline");
  const report = baselinePath ? newFindings(findings, JSON.parse(readFileSync(baselinePath, "utf8")) as Baseline) : findings;
  for (const f of report) console.log(`${f.file}:${f.line} ${f.rule}  ${f.match}`);
  if (report.length) {
    console.error(`ds-lint: ${report.length} finding(s)${baselinePath ? " not in the baseline" : ""}`);
    process.exit(1);
  }
  console.error("ds-lint: clean");
}
