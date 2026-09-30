// Sets the release version on every published npm package, then proves the tarballs carry it.
// Usage: bun scripts/set-version.ts <version>
//
// `bun publish` fills in "workspace:*" from the workspace versions recorded in bun.lock, not from
// package.json, so the lockfile is refreshed after the bump. Without that, ui-web 0.4.1 shipped
// depending on tokens 0.2.1.
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const packages = ["tokens", "ui-web", "ui-native", "design-tools"];
const version = process.argv[2]?.replace(/^v/, "");
if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) throw new Error(`usage: set-version.ts <semver>, got ${process.argv[2]}`);

function run(cmd: string[], cwd: string): string {
  const r = Bun.spawnSync(cmd, { cwd });
  if (r.exitCode !== 0) throw new Error(`${cmd.join(" ")}\n${r.stderr.toString()}`);
  return r.stdout.toString();
}

// npm version cannot parse "workspace:*" deps, so set the field directly.
for (const p of packages) {
  const file = join(root, "packages", p, "package.json");
  const json = await Bun.file(file).json();
  json.version = version;
  await Bun.write(file, `${JSON.stringify(json, null, 2)}\n`);
}
run(["bun", "install"], root);

const out = mkdtempSync(join(tmpdir(), "ds-release-"));
try {
  for (const p of packages) {
    run(["bun", "pm", "pack", "--destination", out, "--quiet"], join(root, "packages", p));
    const tarball = readdirSync(out).find((f) => f.endsWith(".tgz"));
    if (!tarball) throw new Error(`bun pm pack produced no tarball for ${p}`);
    const manifest = JSON.parse(run(["tar", "-xzOf", join(out, tarball), "package/package.json"], out));
    rmSync(join(out, tarball));
    if (manifest.version !== version) throw new Error(`${p} packs as ${manifest.version}, expected ${version}`);
    for (const [name, spec] of Object.entries({ ...manifest.dependencies, ...manifest.peerDependencies })) {
      if (name.startsWith("@abrahamjeyaraj/") && spec !== version) throw new Error(`${p} packs ${name}@${spec}, expected ${version}`);
    }
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}
console.log(`packages set to ${version}; packed dependencies agree`);
