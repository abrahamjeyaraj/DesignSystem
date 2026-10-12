import { describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lintApp } from "../src/lint";

const APP = join(import.meta.dir, "fixtures/lint-app");
const CLI = join(import.meta.dir, "../src/lint-cli.ts");
const key = (f: { file: string; line: number; rule: string }) => `${f.file}:${f.line} ${f.rule}`;

describe("lintApp", () => {
  const findings = lintApp(APP).map(key).sort();

  test("finds each rule where it happens", () => {
    expect(findings).toEqual(
      [
        "android/app/Home.kt:1 platform-icons",
        "android/app/Home.kt:2 platform-icons",
        "android/app/Home.kt:4 hex-color",
        "android/app/Home.kt:4 platform-icons",
        "flutter/lib/home.dart:2 platform-icons",
        "flutter/lib/home.dart:3 hex-color",
        "flutter/lib/home.dart:3 platform-icons",
        "ios/App/Home.swift:4 platform-icons",
        "ios/App/Home.swift:5 hex-color",
        "ios/App/Home.swift:5 platform-icons",
        "web/src/Page.tsx:1 icon-library",
        "web/src/Page.tsx:4 stock-palette",
        "web/src/Page.tsx:5 hex-color",
        "web/src/Page.tsx:6 stock-palette",
        "web/src/Page.tsx:7 inline-svg",
      ].sort(),
    );
  });

  test("skips generated files, the design folder and clean code", () => {
    expect(findings.some((f) => f.includes("generated/"))).toBe(false);
    expect(findings.some((f) => f.includes("theme.css"))).toBe(false);
    expect(findings.some((f) => f.startsWith("design/"))).toBe(false);
    expect(findings.some((f) => f.includes("Clean.tsx"))).toBe(false);
  });

  test("a palette the theme defines can be allowed", () => {
    const f = lintApp(APP, { allowPalettes: ["indigo"] }).map(key);
    expect(f).not.toContain("web/src/Page.tsx:6 stock-palette");
    expect(f).toContain("web/src/Page.tsx:4 stock-palette");
  });

  test("rules can be turned off", () => {
    const f = lintApp(APP, { rules: { "inline-svg": "off" } }).map(key);
    expect(f).not.toContain("web/src/Page.tsx:7 inline-svg");
  });
});

describe("ds-lint CLI", () => {
  const workspace = () => {
    const dir = mkdtempSync(join(tmpdir(), "ds-lint-"));
    cpSync(APP, dir, { recursive: true });
    return dir;
  };

  test("exit 1 with file:line findings", () => {
    const r = Bun.spawnSync(["bun", CLI, workspace()]);
    expect(r.exitCode).toBe(1);
    expect(r.stdout.toString()).toContain("web/src/Page.tsx:5 hex-color");
  });

  test("reads design/lint.json", () => {
    const dir = workspace();
    writeFileSync(join(dir, "design/lint.json"), JSON.stringify({ rules: { "hex-color": "off", "stock-palette": "off", "platform-icons": "off", "icon-library": "off", "inline-svg": "off" } }));
    expect(Bun.spawnSync(["bun", CLI, dir]).exitCode).toBe(0);
  });

  test("a baseline lets an app adopt the rules and fail only on new findings", () => {
    const dir = workspace();
    const baseline = join(dir, "design/lint-baseline.json");
    expect(Bun.spawnSync(["bun", CLI, dir, "--write-baseline", baseline]).exitCode).toBe(0);
    expect(Bun.spawnSync(["bun", CLI, dir, "--baseline", baseline]).exitCode).toBe(0);
    writeFileSync(join(dir, "web/src/New.tsx"), "export const N = () => <p style={{ color: '#00ff00' }} />;\n");
    const r = Bun.spawnSync(["bun", CLI, dir, "--baseline", baseline]);
    expect(r.exitCode).toBe(1);
    expect(r.stdout.toString().trim().split("\n").filter((l) => l.includes(" hex-color"))).toEqual(["web/src/New.tsx:1 hex-color  #00ff00"]);
  });
});
