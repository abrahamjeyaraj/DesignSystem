import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { canonicalSvg, diffExtraction, extractDesign, extractPen, UnsupportedSvgError } from "../src/extract";

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
    const jsx = canonicalSvg('<svg viewBox="0 0 24 24" style={s}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5" strokeWidth={1.6}/></svg>');
    expect(jsx).toBe(canonicalSvg(SEARCH));
  });
});

test("canonicalSvg keeps a filled shape inside a stroke icon filled", () => {
  const svg = canonicalSvg('<svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z" fill={color}/></svg>');
  expect(svg).toContain('stroke="currentColor"');
  expect(svg).toContain('<path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor"/>');
});

describe("canonicalSvg keeps what the drawing inherits and rejects what it would lose", () => {
  const COMPASS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor"/></svg>';

  test("a fill on the root reaches every shape, so a filled icon stays filled", () => {
    const svg = canonicalSvg('<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v16H4z"/></svg>');
    expect(svg).toBe(canonicalSvg('<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="#111111"/></svg>'));
    expect(svg).toContain('viewBox="0 0 24 24" fill="currentColor">');
    expect(svg).not.toContain("stroke");
  });

  test("a fill on a group reaches its shapes", () => {
    const grouped = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><g fill="currentColor"><path d="m15.5 8.5-2 5-5 2 2-5z"/></g></svg>';
    expect(canonicalSvg(grouped)).toBe(canonicalSvg(COMPASS));
  });

  test("a shape's own fill wins over its group's", () => {
    const svg = canonicalSvg('<svg viewBox="0 0 24 24" stroke="currentColor"><g fill="currentColor"><circle cx="12" cy="12" r="9" fill="none"/></g></svg>');
    expect(svg).toContain('<circle cx="12" cy="12" r="9" fill="none"/>');
    expect(svg).toContain('stroke="currentColor"');
  });

  test("filled shapes that are also stroked keep their stroke", () => {
    const svg = canonicalSvg('<svg viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4h16v16H4z" fill="currentColor"/></svg>');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('<path d="M4 4h16v16H4z" fill="currentColor"/>');
  });

  test("comments, title and desc are not part of the drawing", () => {
    const noisy = '<svg viewBox="0 0 24 24"><!-- exported --><title>Search</title><desc>A magnifier</desc><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
    expect(canonicalSvg(noisy)).toBe(canonicalSvg(SEARCH));
  });

  const rejected: [string, RegExp][] = [
    ['<svg viewBox="0 0 24 24" transform="scale(2)"><path d="M1 1h2"/></svg>', /<svg>: transforms are not supported; flatten it in the design tool/],
    ['<svg viewBox="0 0 24 24"><g transform="translate(2 2)"><path d="M1 1h2"/></g></svg>', /<g>: transforms are not supported; flatten it in the design tool/],
    ['<svg viewBox="0 0 24 24"><path d="M1 1h2" transform="rotate(45)"/></svg>', /<path>: transforms are not supported/],
    ['<svg viewBox="0 0 24 24"><g opacity="0.5"><path d="M1 1h2"/></g></svg>', /opacity on a group is not carried/],
    ['<svg viewBox="0 0 24 24"><path d="M1 1h2" clip-path="url(#c)"/></svg>', /clip-path is not supported/],
    ['<svg viewBox="0 0 24 24"><defs><path id="a" d="M1 1h2"/></defs></svg>', /<defs> is not supported; move visible shapes out of <defs>/],
    ['<svg viewBox="0 0 24 24"><use href="#a"/></svg>', /<use> is not supported; replace the <use>/],
    ['<svg viewBox="0 0 24 24"><text x="1" y="1">A</text></svg>', /<text> is not supported; convert the text to outlines/],
    ['<svg viewBox="0 0 24 24"><path d="M0 0h9v9H0zM2 2h5v5H2z" fill="currentColor" fill-rule="evenodd"/></svg>', /evenodd/],
    ['<svg viewBox="0 0 24 24"><path d="M0 0h9v9H0zM2 2h5v5H2z" fillRule="evenodd"/></svg>', /evenodd/],
    ['<svg viewBox="0 0 24 24" style="transform: rotate(90deg)"><path d="M9 6l6 6-6 6"/></svg>', /<svg>: transform in style is not supported/],
    ["<svg viewBox=\"0 0 24 24\" style={{ transform: 'rotate(90deg)' }}><path d=\"M9 6l6 6-6 6\"/></svg>", /<svg>: transform in style is not supported/],
  ];
  for (const [svg, message] of rejected) {
    test(`rejects ${svg.replace(/^<svg viewBox="0 0 24 24"/, "<svg")}`, () => {
      expect(() => canonicalSvg(svg)).toThrow(UnsupportedSvgError);
      expect(() => canonicalSvg(svg)).toThrow(message);
    });
  }

  test("opacity on the root is presentation, like colour", () => {
    expect(canonicalSvg('<svg viewBox="0 0 24 24" opacity="0.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>')).toBe(canonicalSvg(SEARCH));
  });

  test("the default nonzero fill rule is fine", () => {
    expect(() => canonicalSvg('<svg viewBox="0 0 24 24"><path d="M1 1h2" fill-rule="nonzero"/></svg>')).not.toThrow();
  });
});

test("extractDesign lists inline SVGs it cannot take as icons instead of guessing", () => {
  const dir = mkdtempSync(join(tmpdir(), "ds-extract-"));
  writeFileSync(join(dir, "screen.html"), `<svg viewBox="0 0 24 24"><g transform="rotate(45 12 12)"><rect x="4" y="4" width="16" height="16"/></g></svg>\n${SEARCH}\n`);
  const x = extractDesign(dir);
  expect(x.icons.map((i) => i.svg)).toEqual([canonicalSvg(SEARCH)]);
  expect(x.rejectedIcons).toHaveLength(1);
  expect(x.rejectedIcons[0].file).toBe("screen.html");
  expect(x.rejectedIcons[0].reason).toContain("transforms are not supported");
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

  test("every inline icon in the export is supported", () => {
    expect(x.rejectedIcons).toEqual([]);
  });
});

describe("extractDesign modes and noise", () => {
  const x = extractDesign(join(FIX, "modes"));

  test("dark-mode definitions are their own names, not conflicts", () => {
    expect(x.conflicts).toEqual([]);
    expect(x.variables["--bg"]).toEqual(["#f8f6f1"]);
    expect(x.variables["--bg (dark)"]).toEqual(["#26241e"]);
    expect(x.variables["--fg (dark)"]).toEqual(["#f1ede3"]);
    expect(x.variables["--line (dark)"]).toEqual(["rgba(236,232,223,0.12)"]);
  });

  test("font names are real family names, not code", () => {
    expect(x.fonts).toEqual(["DM Sans", "Inter", "Noto Sans Tamil"]);
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
