#!/usr/bin/env bun
/**
 * ds-art: line-art scenes as data.
 *
 *   ds-art extract <scene.svg> --id <id> --out <scene.json>   annotated SVG -> scene JSON
 *   ds-art build <art.json> [--check]                         write web module + native JSON
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildArt, extractScene, validateScene } from "./art";

const USAGE = "usage: ds-art extract <scene.svg> --id <id> --out <scene.json>\n       ds-art build <art.json> [--check]";

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const [command, input] = args;
  try {
    if (command === "extract" && input && option(args, "--id") && option(args, "--out")) {
      const out = option(args, "--out") as string;
      const scene = extractScene(readFileSync(input, "utf8"), option(args, "--id") as string);
      const groups = [...new Set(scene.strokes.map((s) => s.group).filter(Boolean))] as string[];
      if (groups.length) scene.groups = Object.fromEntries(groups.map((g) => [g, { keyframes: [] }]));
      const errors = validateScene(scene);
      if (errors.length) throw new Error(errors.join("\n  "));
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, `${JSON.stringify(scene, null, 2)}\n`);
      console.log(`${scene.strokes.length} strokes -> ${out}`);
    } else if (command === "build" && input) {
      const check = args.includes("--check");
      const r = buildArt(input, { check });
      if (check && r.stale.length) {
        console.error(`ds-art: stale outputs (run: ds-art build ${input}):\n  ${r.stale.join("\n  ")}`);
        process.exit(1);
      }
      console.log(check ? `${r.scenes.length} scenes up to date` : `${r.scenes.length} scenes; ${r.written.length} file(s) written`);
    } else {
      console.error(USAGE);
      process.exit(2);
    }
  } catch (err) {
    console.error(`ds-art: ${(err as Error).message}`);
    process.exit(1);
  }
}
