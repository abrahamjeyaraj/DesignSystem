import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { canonicalSvg, diffExtraction, extractDesign, extractPen } from "../src/extract";

const FIX = join(import.meta.dir, "fixtures");
const DESIGN = join(FIX, "claude-design");
const ROOT = resolve(import.meta.dir, "../../..");
const CLI = join(import.meta.dir, "../src/extract-cli.ts");

const SEARCH = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

describe("canonicalSvg", () => {
  test("keeps geometry, drops presentation", () => {
    const a = canonicalSvg('<svg class="i" style="width:12px" viewBox="0 0 24 24" stroke="#F4F2EF"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>');
    const b = canonicalSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>');
    expect(a).toBe(b);
    expect(a).toContain('viewBox="0 0 24 24"');
    expect(a).toContain('stroke="currentColor"');
    expect(a).not.toContain("stroke-width");
    expect(a).not.toContain("class=");
  });

  test("reads JSX attribute syntax", () => {
    const jsx = canonicalSvg('<svg viewBox="0 0 24 24" style={s}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5" fill={color}/></svg>');
    expect(jsx).toBe(canonicalSvg(SEARCH));
  });
});

describe("extractDesign (Claude Design export folder)", () => {
  const x = extractDesign(DESIGN);

  test("scans design files and skips uploads", () => {
    expect(x.files.sort()).toEqual(["components/primitives.jsx", "screen-a.html", "screen-b.html"]);
    expect(x.variables["--ignored"]).toBeUndefined();
  });

  test("collects CSS variables and JS token objects, normalised", () => {
    expect(x.variables["--brand"].sort()).toEqual(["#8b5d2e", "#b07c4b"]);
    expect(x.variables["--ink"]).toEqual(["#1a1a1a"]);
    expect(x.variables["T.accent"]).toEqual(["#8b5d2e"]);
    expect(x.variables["--soft"]).toEqual(["rgba(200,180,150,0.18)"]);
  });

  test("reports a name that has different values in different files", () => {
    expect(x.conflicts).toEqual([{ name: "--brand", values: ["#8b5d2e", "#b07c4b"] }]);
  });

  test("groups colours by value with every name and literal use", () => {
    const ink = x.colors.find((c) => c.value === "#1a1a1a");
    expect(ink?.names.sort()).toEqual(["--ink", "T.ink"]);
    const literal = x.colors.find((c) => c.value === "#666666");
    expect(literal?.names).toEqual(["(literal)"]);
    const soft = x.colors.find((c) => c.value === "rgba(200,180,150,0.18)");
    expect(soft?.names.sort()).toEqual(["--soft", "T.soft"]);
  });

  test("lists primary font families", () => {
    expect(x.fonts).toEqual(["Geist", "Playfair Display"]);
  });

  test("groups inline SVG icons by geometry with the stroke widths used", () => {
    expect(x.icons).toHaveLength(5);
    const search = x.icons.find((i) => i.svg === canonicalSvg(SEARCH));
    expect(search?.count).toBe(2);
    expect(search?.files.sort()).toEqual(["screen-a.html", "screen-b.html"]);
    expect(search?.strokeWidths).toEqual([1.6]);
    const homes = x.icons.filter((i) => i.svg.includes("M4 11l8-7") || i.svg.includes("M3 10.5"));
    expect(homes.map((h) => h.strokeWidths[0]).sort()).toEqual([1.6, 1.8]);
    const person = x.icons.find((i) => i.svg.includes("M4 21a8 8"));
    expect(person?.strokeWidths).toEqual([1.6]);
    expect(person?.files).toEqual(["components/primitives.jsx"]);
    for (const icon of x.icons) expect(icon.id).toMatch(/^[0-9a-f]{8}$/);
  });

  test("records icons that come from a library or icon font", () => {
    expect(x.libraryIcons).toEqual({ "icon-font": ["calendar"], ionicons: ["star-outline"] });
  });
});

describe("extractPen", () => {
  const p = extractPen(join(FIX, "sample.pen"));

  test("reads variables", () => {
    expect(Object.keys(p.variables)).toEqual(["surface", "text-primary", "font-body", "r-md"]);
    expect(p.variables.surface).toEqual({ type: "color", value: "#fbf7f0" });
  });

  test("lists icons per library", () => {
    expect(p.iconLibraries).toEqual({ lucide: ["chevron-right", "search"] });
    expect(p.iconCount).toBe(3);
  });

  test("counts raw colours that bypass variables", () => {
    expect(p.rawColors).toEqual([{ value: "#e3ecdf", count: 1 }]);
  });
});

describe("diffExtraction (drift against the frozen set)", () => {
  const x = extractDesign(DESIGN);

  test("new colours and icons are the ones not frozen", () => {
    const d = diffExtraction(x, {
      colors: ["#1a1a1a", "#B07C4B", "#666666", "rgba(200, 180, 150, .18)"],
      icons: [SEARCH],
    });
    expect(d.newColors).toEqual(["#8b5d2e"]);
    expect(d.newIcons).toHaveLength(4);
    expect(d.newIcons.some((i) => i.svg === canonicalSvg(SEARCH))).toBe(false);
  });
});

describe("ds-extract CLI", () => {
  const run = (...args: string[]) => Bun.spawnSync(["bun", CLI, ...args]);

  test("writes a report and one candidate SVG per distinct icon", () => {
    const out = mkdtempSync(join(tmpdir(), "ds-extract-"));
    const r = run(DESIGN, "--out", join(out, "report.json"), "--candidates", join(out, "icons"));
    expect(r.exitCode).toBe(0);
    const report = JSON.parse(readFileSync(join(out, "report.json"), "utf8"));
    expect(report.icons).toHaveLength(5);
    const svgs = readdirSync(join(out, "icons")).filter((f) => f.endsWith(".svg"));
    expect(svgs).toHaveLength(5);
    expect(existsSync(join(out, "icons", "index.json"))).toBe(true);
    expect(r.stdout.toString()).toContain("--brand: #8b5d2e, #b07c4b");
  });

  test("--theme reports colours the frozen theme does not have", () => {
    const out = mkdtempSync(join(tmpdir(), "ds-extract-"));
    const r = run(DESIGN, "--out", join(out, "report.json"), "--theme", join(ROOT, "tokens/themes/church.json"));
    expect(r.exitCode).toBe(0);
    const report = JSON.parse(readFileSync(join(out, "report.json"), "utf8"));
    expect(report.drift.newColors).toContain("#8b5d2e");
  });

  test("reads a .pen file", () => {
    const out = mkdtempSync(join(tmpdir(), "ds-extract-"));
    expect(run(join(FIX, "sample.pen"), "--out", join(out, "report.json")).exitCode).toBe(0);
    const report = JSON.parse(readFileSync(join(out, "report.json"), "utf8"));
    expect(report.iconLibraries).toEqual({ lucide: ["chevron-right", "search"] });
  });

  test("bad arguments print usage", () => {
    expect(run().exitCode).toBe(2);
  });
});
