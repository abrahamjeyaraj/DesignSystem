import { describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildIcons } from "../src/icons";
import { checkOutputs, findChromium, verifyIcons } from "../src/verify";

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

const failed = (r: { platform: string; icon: string }[]) => r.map((f) => `${f.platform}:${f.icon}`).sort();

describe("ds-icons verify: every configured output is present and complete (no browser)", () => {
  test("freshly built outputs have no problems", async () => {
    expect(await checkOutputs(join(built(), "icons.json"))).toEqual([]);
  });

  test("a missing Compose file, sprite or web module is a failure, not a skipped platform", async () => {
    const dir = built();
    rmSync(join(dir, "out/android/DSIcons.kt"));
    rmSync(join(dir, "out/sprite.svg"));
    rmSync(join(dir, "out/web/icons.ts"));
    const problems = await checkOutputs(join(dir, "icons.json"));
    expect(failed(problems)).toEqual(["compose:*", "sprite:*", "web:*"]);
    for (const p of problems) expect(p.reason).toContain("is missing; run ds-icons build");
  });

  test("a missing per-icon file names the icon", async () => {
    const dir = built();
    rmSync(join(dir, "out/android/res/drawable/ds_ic_search.xml"));
    rmSync(join(dir, "out/ios/DSIcons.xcassets/ds-icon-close.imageset/ds-icon-close.svg"));
    rmSync(join(dir, "out/flutter/assets/ds_icons/home.svg"));
    expect(failed(await checkOutputs(join(dir, "icons.json")))).toEqual(["android:search", "flutter:home", "ios:close"]);
  });

  test("an output that lost an icon or a setting is caught", async () => {
    const dir = built();
    edit(join(dir, "out/android/DSIcons.kt"), 'icon("home", ', 'icon("house", ');
    edit(join(dir, "out/sprite.svg"), '<symbol id="close"', '<symbol id="dismiss"');
    edit(join(dir, "out/ios/DSIconName.swift"), '= "ds-icon-search"', '= "ds-icon-find"');
    edit(join(dir, "out/flutter/lib/ds_icons.g.dart"), "'assets/ds_icons/compass.svg'", "'assets/ds_icons/compas.svg'");
    edit(join(dir, "out/ios/DSIcons.xcassets/ds-icon-home.imageset/Contents.json"), '"template-rendering-intent": "template"', '"template-rendering-intent": "original"');
    edit(join(dir, "out/android/res/drawable/ds_ic_chevron_right.xml"), 'android:viewportWidth="24"', 'android:viewportWidth="20"');
    const problems = await checkOutputs(join(dir, "icons.json"));
    expect(failed(problems)).toEqual(["android:chevron-right", "compose:home", "flutter-dart:compass", "ios-swift:search", "ios:home", "sprite:close"]);
    expect(problems.find((p) => p.platform === "ios")?.reason).toContain("cannot be tinted");
    expect(problems.find((p) => p.platform === "android")?.reason).toContain("the icon grid is 24");
  });

  test("a VectorDrawable that dropped a shape is caught", async () => {
    const dir = built();
    const xml = join(dir, "out/android/res/drawable/ds_ic_search.xml");
    writeFileSync(xml, readFileSync(xml, "utf8").replace(/ {4}<path\n(?: {8}[^\n]*\n)*? {8}[^\n]*\/>\n/, ""));
    const problems = await checkOutputs(join(dir, "icons.json"));
    expect(failed(problems)).toEqual(["android:search"]);
    expect(problems[0].reason).toContain("has 1 path(s), the source has 2 shape(s)");
  });
});

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

  test("a resized circle in the Android and Compose arc paths is caught", async () => {
    const dir = built();
    const circle = "M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0";
    const bigger = "M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0";
    edit(join(dir, "out/android/res/drawable/ds_ic_search.xml"), circle, bigger);
    edit(join(dir, "out/android/DSIcons.kt"), circle, bigger);
    const r = await verifyIcons(join(dir, "icons.json"));
    expect(failed(r.failures).filter((f, i, a) => a.indexOf(f) === i)).toEqual(["android:search", "compose:search"]);
  }, 60_000);

  test("a configured output that is missing fails verify", async () => {
    const dir = built();
    rmSync(join(dir, "out/sprite.svg"));
    const r = await verifyIcons(join(dir, "icons.json"));
    expect(failed(r.failures)).toEqual(["sprite:*"]);
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
