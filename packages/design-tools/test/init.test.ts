import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { resolveTheme } from "@abrahamjeyaraj/tokens/build";
import { checkContrast } from "@abrahamjeyaraj/tokens/contrast";
import { fromDtcg, toDtcg, validateDtcg } from "@abrahamjeyaraj/tokens/dtcg";
import { buildArt } from "../src/art";
import { loadIcons, validateManifest } from "../src/icons";
import { AGENTS_MARKER, initDesign } from "../src/init";
import { loadBase } from "../src/theme-colors";

const ROOT = resolve(import.meta.dir, "../../..");
const CLI = join(import.meta.dir, "../src/init-cli.ts");
const app = () => mkdtempSync(join(tmpdir(), "ds-init-"));

const EXPECTED = [
  "design/SKILL.md",
  "design/readme.md",
  "design/theme.json",
  "design/icons/icons.json",
  "design/art/art.json",
  "design/lint.json",
  "design/sources.md",
  "design/source/.gitattributes",
  "design/brand/README.md",
  "design/fonts/README.md",
  "design/guidelines/README.md",
  "design/components/README.md",
];

describe("initDesign", () => {
  test("scaffolds every part of the design/ folder", () => {
    const dir = app();
    const r = initDesign(dir, { name: "sample" });
    expect(r.created.sort()).toEqual([...EXPECTED].sort());
    for (const f of EXPECTED) expect(existsSync(join(dir, f))).toBe(true);
  });

  test("the starter theme is a valid DTCG theme named for the app", () => {
    const dir = app();
    initDesign(dir, { name: "sample" });
    const theme = JSON.parse(readFileSync(join(dir, "design/theme.json"), "utf8"));
    expect(theme.$extensions.ds.name).toBe("sample");
    expect(validateDtcg(theme, loadBase())).toEqual([]);
  });

  test("the starter theme meets WCAG AA in both modes", () => {
    const dir = app();
    initDesign(dir, { name: "sample" });
    const theme = JSON.parse(readFileSync(join(dir, "design/theme.json"), "utf8"));
    const failing = checkContrast(resolveTheme(fromDtcg(theme), loadBase())).filter((r) => !r.pass);
    expect(failing).toEqual([]);
  });

  test("the starter icon set pins Lucide and maps every component icon", () => {
    const dir = app();
    initDesign(dir, { name: "sample" });
    const m = JSON.parse(readFileSync(join(dir, "design/icons/icons.json"), "utf8"));
    expect(validateManifest(m)).toEqual([]);
    expect(m.source).toEqual({ library: "lucide", version: "0.469.0" });
    expect(Object.keys(m.icons).sort()).toEqual(["add", "check", "chevron-down", "chevron-left", "chevron-right", "close", "more", "search"]);
    expect(loadIcons(join(dir, "design/icons/icons.json")).icons).toHaveLength(8);
  });

  test("a custom icon set starts empty-handed but valid in shape", () => {
    const dir = app();
    initDesign(dir, { name: "sample", icons: "custom" });
    const m = JSON.parse(readFileSync(join(dir, "design/icons/icons.json"), "utf8"));
    expect(m.source).toEqual({ dir: "svg" });
    expect(validateManifest(m)).toEqual([]);
    expect(existsSync(join(dir, "design/icons/svg/README.md"))).toBe(true);
  });

  test("the art manifest builds", () => {
    const dir = app();
    initDesign(dir, { name: "sample" });
    expect(buildArt(join(dir, "design/art/art.json")).scenes).toEqual([]);
  });

  test("--from-legacy migrates an existing theme", () => {
    const dir = app();
    const legacySrc = JSON.parse(readFileSync(join(ROOT, "tokens/themes/default.json"), "utf8"));
    writeFileSync(join(dir, "old.json"), JSON.stringify(legacySrc));
    initDesign(dir, { name: "sample", fromLegacy: join(dir, "old.json") });
    const theme = JSON.parse(readFileSync(join(dir, "design/theme.json"), "utf8"));
    const expected = toDtcg({ ...legacySrc, name: "sample" });
    expect(theme).toEqual(JSON.parse(JSON.stringify(expected)));
  });

  test("never overwrites without force", () => {
    const dir = app();
    mkdirSync(join(dir, "design"), { recursive: true });
    writeFileSync(join(dir, "design/readme.md"), "mine");
    const r = initDesign(dir, { name: "sample" });
    expect(r.skipped).toEqual(["design/readme.md"]);
    expect(readFileSync(join(dir, "design/readme.md"), "utf8")).toBe("mine");
    initDesign(dir, { name: "sample", force: true });
    expect(readFileSync(join(dir, "design/readme.md"), "utf8")).not.toBe("mine");
  });

  test("agents: appends the design rules to AGENTS.md once", () => {
    const dir = app();
    writeFileSync(join(dir, "AGENTS.md"), "# App\n\nExisting rules.\n");
    initDesign(dir, { name: "sample", agents: true });
    initDesign(dir, { name: "sample", agents: true });
    const text = readFileSync(join(dir, "AGENTS.md"), "utf8");
    expect(text).toStartWith("# App\n\nExisting rules.\n");
    expect(text.split(AGENTS_MARKER).length - 1).toBe(2);
    expect(text).toContain("Never draw, redraw, retype or substitute an icon");
    expect(text).toContain("design/SKILL.md");
  });

  test("the names are kebab-case", () => {
    expect(() => initDesign(app(), { name: "Sample App" })).toThrow("kebab-case");
  });
});

describe("ds-init CLI", () => {
  test("scaffolds and reports", () => {
    const dir = app();
    const r = Bun.spawnSync(["bun", CLI, dir, "--name", "sample", "--agents"]);
    expect(r.exitCode).toBe(0);
    expect(existsSync(join(dir, "design/theme.json"))).toBe(true);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(true);
    expect(Bun.spawnSync(["bun", CLI]).exitCode).toBe(2);
  });
});
