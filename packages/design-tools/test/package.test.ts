import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const pkg = resolve(import.meta.dir, "..");
const manifest = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));

test("every bin exists", () => {
  expect(Object.keys(manifest.bin).sort()).toEqual(["ds-art", "ds-extract", "ds-icons", "ds-init", "ds-lint"]);
  for (const path of Object.values<string>(manifest.bin)) expect(existsSync(join(pkg, path))).toBe(true);
});

test("the package root exposes the library API", async () => {
  const api = await import(join(pkg, manifest.exports["."]));
  for (const name of ["extractDesign", "extractPen", "diffExtraction", "buildIcons", "loadIcons", "buildArt", "validateScene", "lintApp", "initDesign"]) {
    expect(typeof api[name]).toBe("function");
  }
  expect(api.verifyIcons).toBeUndefined();
});

test("pixel verification is optional: Chromium tooling loads only for verify", () => {
  expect(readFileSync(join(pkg, "src/icons-cli.ts"), "utf8")).not.toMatch(/^import .*["']\.\/verify["']/m);
  expect(manifest.peerDependencies?.["playwright-core"]).toBeDefined();
  expect(manifest.peerDependenciesMeta?.["playwright-core"]).toEqual({ optional: true });
  expect(manifest.exports["./verify"]).toBe("./src/verify.ts");
});
