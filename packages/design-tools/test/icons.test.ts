import { describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildIcons,
  COMPONENT_ICONS,
  emitAndroid,
  emitCompose,
  emitFlutter,
  emitIos,
  emitIosSwift,
  emitSprite,
  emitWeb,
  type IconDef,
  loadIcons,
  type Manifest,
  scanUsage,
  shapeToPath,
  validateManifest,
} from "../src/icons";

const FIX = join(import.meta.dir, "fixtures/icons");
const CLI = join(import.meta.dir, "../src/icons-cli.ts");
const manifest = (): Manifest => JSON.parse(readFileSync(join(FIX, "icons.json"), "utf8"));

function workspace(edit?: (m: Manifest) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "ds-icons-"));
  cpSync(FIX, dir, { recursive: true });
  if (edit) {
    const m = manifest();
    edit(m);
    writeFileSync(join(dir, "icons.json"), JSON.stringify(m));
  }
  return dir;
}
const byName = (icons: IconDef[], n: string) => icons.find((i) => i.name === n) as IconDef;

describe("validateManifest", () => {
  test("the fixture is valid", () => {
    expect(validateManifest(manifest())).toEqual([]);
  });

  test("a library must be pinned to an exact version", () => {
    for (const version of ["latest", "^0.469.0", "~0.469.0", "0.x"]) {
      const m = manifest();
      m.source = { library: "lucide", version };
      expect(validateManifest(m).join("\n")).toContain("exact version");
    }
  });

  test("exactly one source", () => {
    const m = manifest();
    m.source = { dir: "svg", library: "lucide", version: "0.469.0" } as unknown as Manifest["source"];
    expect(validateManifest(m).join("\n")).toContain("exactly one of source.dir or source.library");
  });

  test("names are kebab-case and style is sane", () => {
    const m = manifest();
    m.icons.Home = "home";
    m.style.stroke = 0;
    const errors = validateManifest(m).join("\n");
    expect(errors).toContain('icons.Home: names are kebab-case');
    expect(errors).toContain("style.stroke must be > 0");
  });

  test("an unknown schema version is rejected", () => {
    const m = manifest();
    m.schema = 2;
    expect(validateManifest(m).join("\n")).toContain("schema 2 is not supported");
  });
});

describe("shapeToPath", () => {
  test("circle", () => {
    expect(shapeToPath("circle", { cx: "11", cy: "11", r: "7" })).toBe("M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0");
  });
  test("line, polyline, polygon", () => {
    expect(shapeToPath("line", { x1: "6", y1: "6", x2: "18", y2: "18" })).toBe("M6 6L18 18");
    expect(shapeToPath("polyline", { points: "3 10 21 10 21 12" })).toBe("M3 10L21 10L21 12");
    expect(shapeToPath("polygon", { points: "3,10 21,10 12,2" })).toBe("M3 10L21 10L12 2Z");
  });
  test("rect with and without corner radius", () => {
    expect(shapeToPath("rect", { x: "3", y: "5", width: "18", height: "14" })).toBe("M3 5H21V19H3Z");
    expect(shapeToPath("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" })).toBe(
      "M5 5H19A2 2 0 0 1 21 7V17A2 2 0 0 1 19 19H5A2 2 0 0 1 3 17V7A2 2 0 0 1 5 5Z",
    );
  });
  test("ellipse and path", () => {
    expect(shapeToPath("ellipse", { cx: "12", cy: "12", rx: "4", ry: "2" })).toBe("M8 12a4 2 0 1 0 8 0a4 2 0 1 0 -8 0");
    expect(shapeToPath("path", { d: "M1 1L2 2" })).toBe("M1 1L2 2");
  });
});

describe("loadIcons", () => {
  test("custom set: every icon, the manifest stroke applied, geometry kept", () => {
    const { icons } = loadIcons(join(FIX, "icons.json"));
    expect(icons.map((i) => i.name).sort()).toEqual(["card", "chevron-right", "close", "compass", "home", "search"]);
    const search = byName(icons, "search");
    expect(search.stroke).toBe(1.6);
    expect(search.filled).toBe(false);
    expect(search.shapes.map((s) => s.d)).toEqual(["M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0", "M20 20l-3.5-3.5"]);
    const compass = byName(icons, "compass");
    expect(compass.shapes.map((s) => s.filled)).toEqual([false, true]);
  });

  test("a missing file or wrong grid fails loudly", () => {
    const dir = workspace((m) => {
      m.icons.gone = "gone";
    });
    expect(() => loadIcons(join(dir, "icons.json"))).toThrow("icons.gone: svg/gone.svg not found");
    const grid = workspace((m) => {
      m.style.grid = 20;
    });
    expect(() => loadIcons(join(grid, "icons.json"))).toThrow('viewBox "0 0 24 24" is not the 20 grid');
  });

  test("an icon whose drawing would change is refused with the fix, naming the icon", () => {
    const dir = workspace();
    writeFileSync(
      join(dir, "svg/compass.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><g transform="rotate(45 12 12)"><circle cx="12" cy="12" r="9"/></g></svg>',
    );
    expect(() => loadIcons(join(dir, "icons.json"))).toThrow("icons.compass: <g>: transforms are not supported; flatten it in the design tool");
  });

  test("a fill inherited from a group stays on the shape", () => {
    const dir = workspace();
    writeFileSync(
      join(dir, "svg/compass.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><g fill="currentColor"><path d="m15.5 8.5-2 5-5 2 2-5z"/></g></svg>',
    );
    const compass = byName(loadIcons(join(dir, "icons.json")).icons, "compass");
    expect(compass.filled).toBe(false);
    expect(compass.shapes.map((s) => s.filled)).toEqual([false, true]);
  });

  test("a fill on the root makes a filled icon, not a stroked one", () => {
    const dir = workspace();
    writeFileSync(join(dir, "svg/card.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>');
    const card = byName(loadIcons(join(dir, "icons.json")).icons, "card");
    expect(card.filled).toBe(true);
    expect(card.shapes.map((s) => s.filled)).toEqual([true]);
  });

  test("library set: reads the pinned Lucide release", () => {
    const dir = workspace((m) => {
      m.source = { library: "lucide", version: "0.469.0" };
      m.icons = { search: "search", home: "house" };
    });
    const { icons } = loadIcons(join(dir, "icons.json"));
    const search = byName(icons, "search");
    expect(search.shapes.map((s) => s.d)).toEqual(["M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0", "m21 21-4.3-4.3"]);
    expect(search.stroke).toBe(1.6);
    expect(byName(icons, "home").shapes).toHaveLength(2);
  });

  test("library set: a version other than the installed one is refused", () => {
    const dir = workspace((m) => {
      m.source = { library: "lucide", version: "0.400.0" };
      m.icons = { search: "search" };
    });
    expect(() => loadIcons(join(dir, "icons.json"))).toThrow("pinned lucide 0.400.0 but 0.469.0 is installed");
  });
});

describe("scanUsage", () => {
  test("finds icons used from web, SwiftUI, Compose and Flutter code", () => {
    const u = scanUsage([join(FIX, "src")], ["home", "search", "chevron-right", "close", "compass", "card"]);
    expect(u.used.sort()).toEqual(["chevron-right", "close", "compass", "home", "search"]);
    expect(u.missing).toEqual([]);
  });

  test("reports a used icon the manifest does not have", () => {
    const dir = workspace();
    writeFileSync(join(dir, "src/web/Extra.tsx"), 'export const X = () => <DSIcon name="sparkle" />;');
    const u = scanUsage([join(dir, "src")], Object.keys(manifest().icons));
    expect(u.missing).toEqual(["sparkle"]);
  });
});

describe("emitters", () => {
  const { icons } = loadIcons(join(FIX, "icons.json"));
  const used = icons.filter((i) => i.name !== "card");

  test("web/RN data module: typed names, shapes, stroke", () => {
    const ts = emitWeb(used);
    expect(ts).toContain('export type DSIconName = "chevron-right" | "close" | "compass" | "home" | "search";');
    expect(ts).toContain('"search": { viewBox: "0 0 24 24", stroke: 1.6, filled: false, shapes: [["circle", { cx: "11", cy: "11", r: "7" }, false], ["path", { d: "M20 20l-3.5-3.5" }, false]] }');
    expect(ts).not.toContain('"card"');
  });

  test("iOS asset catalog: template vectors with the exact stroke", () => {
    const files = emitIos(used);
    expect(JSON.parse(files["Contents.json"]).info.author).toBe("ds-icons");
    const contents = JSON.parse(files["ds-icon-search.imageset/Contents.json"]);
    expect(contents.properties).toEqual({ "preserves-vector-representation": true, "template-rendering-intent": "template" });
    expect(contents.images[0].filename).toBe("ds-icon-search.svg");
    const svg = files["ds-icon-search.imageset/ds-icon-search.svg"];
    expect(svg).toContain('stroke="#000000"');
    expect(svg).toContain('stroke-width="1.6"');
    expect(svg).toContain('width="24" height="24"');
  });

  test("Swift names", () => {
    const swift = emitIosSwift(used);
    expect(swift).toContain('case chevronRight = "ds-icon-chevron-right"');
    expect(swift).toContain("public enum DSIconName: String, CaseIterable");
  });

  test("Android VectorDrawable: shapes become paths, stroke kept", () => {
    const files = emitAndroid(used);
    const search = files["ds_ic_search.xml"];
    expect(search).toContain('android:viewportWidth="24"');
    expect(search).toContain('android:pathData="M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"');
    expect(search).toContain('android:strokeWidth="1.6"');
    expect(search).toContain('android:strokeLineCap="round"');
    const compass = files["ds_ic_compass.xml"];
    expect(compass).toContain('android:fillColor="#FF000000"');
    expect(Object.keys(files)).not.toContain("ds_ic_card.xml");
  });

  test("Compose ImageVector", () => {
    const kt = emitCompose(used, "com.example.app.design");
    expect(kt).toStartWith("// GENERATED by ds-icons");
    expect(kt).toContain("package com.example.app.design");
    expect(kt).toContain("val ChevronRight: ImageVector by lazy");
    expect(kt).toContain('"M9 6l6 6-6 6"');
    expect(kt).toContain("private const val STROKE = 1.6f");
  });

  test("Flutter assets and names", () => {
    const f = emitFlutter(used, "assets/ds_icons");
    expect(f.assets["search.svg"]).toContain('stroke-width="1.6"');
    expect(f.dart).toContain("static const String chevronRight = 'assets/ds_icons/chevron-right.svg';");
  });

  test("line caps and joins come from the set's style (default round)", () => {
    const dir = workspace((m) => {
      m.style.linecap = "butt";
      m.style.linejoin = "miter";
    });
    const loaded = loadIcons(join(dir, "icons.json")).icons.filter((i) => i.name === "close");
    expect(loaded[0].linecap).toBe("butt");
    expect(emitAndroid(loaded)["ds_ic_close.xml"]).toContain('android:strokeLineCap="butt"');
    expect(emitIos(loaded)["ds-icon-close.imageset/ds-icon-close.svg"]).toContain('stroke-linejoin="miter"');
    expect(emitCompose(loaded, "x")).toContain("StrokeCap.Butt");
    expect(byName(icons, "close").linecap).toBe("round");
  });

  test("sprite for design tools", () => {
    const sprite = emitSprite(used);
    expect(sprite).toContain('<symbol id="search" viewBox="0 0 24 24"');
    expect(sprite).toContain('stroke-width="1.6"');
  });

  test("component icons are a fixed list", () => {
    expect(COMPONENT_ICONS).toContain("chevron-right");
    expect(COMPONENT_ICONS).toContain("close");
  });
});

describe("buildIcons and CLI", () => {
  test("writes only used icons, then --check passes until something changes", () => {
    const dir = workspace();
    const result = buildIcons(join(dir, "icons.json"));
    expect(result.icons.sort()).toEqual(["chevron-right", "close", "compass", "home", "search"]);
    expect(result.warnings.join("\n")).toContain("unused: card");
    expect(existsSync(join(dir, "out/android/res/drawable/ds_ic_home.xml"))).toBe(true);
    expect(existsSync(join(dir, "out/android/res/drawable/ds_ic_card.xml"))).toBe(false);
    expect(existsSync(join(dir, "out/ios/DSIcons.xcassets/ds-icon-home.imageset/ds-icon-home.svg"))).toBe(true);
    expect(buildIcons(join(dir, "icons.json"), { check: true }).stale).toEqual([]);

    writeFileSync(join(dir, "src/web/More.tsx"), 'export const M = () => <DSIcon name="card" />;');
    expect(buildIcons(join(dir, "icons.json"), { check: true }).stale.length).toBeGreaterThan(0);
  });

  test("CLI: exit 1 when code uses an icon the set lacks", () => {
    const dir = workspace();
    writeFileSync(join(dir, "src/web/Extra.tsx"), 'export const X = () => <DSIcon name="sparkle" />;');
    const r = Bun.spawnSync(["bun", CLI, "build", join(dir, "icons.json")]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr.toString()).toContain("used but not in icons.json: sparkle");
  });

  test("CLI: build then --check", () => {
    const dir = workspace();
    expect(Bun.spawnSync(["bun", CLI, "build", join(dir, "icons.json"), "--check"]).exitCode).toBe(1);
    expect(Bun.spawnSync(["bun", CLI, "build", join(dir, "icons.json")]).exitCode).toBe(0);
    expect(Bun.spawnSync(["bun", CLI, "build", join(dir, "icons.json"), "--check"]).exitCode).toBe(0);
    expect(Bun.spawnSync(["bun", CLI]).exitCode).toBe(2);
  });
});
