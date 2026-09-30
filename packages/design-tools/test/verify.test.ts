import { describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildIcons } from "../src/icons";
import { findChromium, verifyIcons } from "../src/verify";

const FIX = join(import.meta.dir, "fixtures/icons");
const CLI = join(import.meta.dir, "../src/icons-cli.ts");
const hasBrowser = Boolean(findChromium());

function built(): string {
  const dir = mkdtempSync(join(tmpdir(), "ds-verify-"));
  cpSync(FIX, dir, { recursive: true });
  buildIcons(join(dir, "icons.json"));
  return dir;
}
const edit = (path: string, from: string, to: string) => {
  const text = readFileSync(path, "utf8");
  expect(text).toContain(from);
  writeFileSync(path, text.replace(from, to));
};

describe.skipIf(!hasBrowser)("ds-icons verify (pixel comparison in Chromium)", () => {
  test("every generated platform output matches its source at 16, 24 and 48 px", async () => {
    const dir = built();
    const r = await verifyIcons(join(dir, "icons.json"));
    expect(r.failures).toEqual([]);
    const platforms = new Set(r.results.map((x) => x.platform));
    expect([...platforms].sort()).toEqual(["android", "compose", "flutter", "ios", "sprite", "web"]);
    expect(new Set(r.results.map((x) => x.size))).toEqual(new Set([16, 24, 48]));
    expect(new Set(r.results.map((x) => x.icon))).toEqual(new Set(["chevron-right", "close", "compass", "home", "search"]));
  }, 60_000);

  test("a moved point in a VectorDrawable is caught", async () => {
    const dir = built();
    edit(join(dir, "out/android/res/drawable/ds_ic_home.xml"), "M4 11l8-7", "M4 15l8-7");
    const r = await verifyIcons(join(dir, "icons.json"));
    expect(r.failures.map((f) => `${f.platform}:${f.icon}`)).toContain("android:home");
    expect(r.failures.every((f) => f.platform === "android" && f.icon === "home")).toBe(true);
  }, 60_000);

  test("a wrong stroke width in an iOS asset is caught", async () => {
    const dir = built();
    edit(join(dir, "out/ios/DSIcons.xcassets/ds-icon-search.imageset/ds-icon-search.svg"), 'stroke-width="1.6"', 'stroke-width="3"');
    const r = await verifyIcons(join(dir, "icons.json"));
    expect(r.failures.map((f) => `${f.platform}:${f.icon}`)).toContain("ios:search");
  }, 60_000);

  test("a changed Compose path is caught", async () => {
    const dir = built();
    edit(join(dir, "out/android/DSIcons.kt"), '"M9 6l6 6-6 6"', '"M9 6l6 6-6 9"');
    const r = await verifyIcons(join(dir, "icons.json"));
    expect(r.failures.map((f) => `${f.platform}:${f.icon}`)).toContain("compose:chevron-right");
  }, 60_000);

  test("CLI writes a contact sheet and fails on a mismatch", () => {
    const dir = built();
    const sheet = join(dir, "sheet.html");
    const ok = Bun.spawnSync(["bun", CLI, "verify", join(dir, "icons.json"), "--sheet", sheet]);
    expect(ok.exitCode).toBe(0);
    expect(existsSync(sheet)).toBe(true);
    expect(readFileSync(sheet, "utf8")).toContain("chevron-right");
    edit(join(dir, "out/flutter/assets/ds_icons/close.svg"), 'x1="6"', 'x1="2"');
    const bad = Bun.spawnSync(["bun", CLI, "verify", join(dir, "icons.json")]);
    expect(bad.exitCode).toBe(1);
    expect(bad.stderr.toString()).toContain("flutter close");
  }, 60_000);
});
