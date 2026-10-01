import { describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildArt, extractScene, type Scene, validateScene } from "../src/art";

const FIX = join(import.meta.dir, "fixtures/art");
const CLI = join(import.meta.dir, "../src/art-cli.ts");
const scene = (): Scene => JSON.parse(readFileSync(join(FIX, "scenes/sunrise.json"), "utf8"));

describe("validateScene", () => {
  test("the fixture is valid", () => {
    expect(validateScene(scene())).toEqual([]);
  });

  test("windows, widths, faintness and paths are checked", () => {
    const s = scene();
    s.strokes[0].window = [0.5, 0.2];
    s.strokes[1].width = 0;
    s.strokes[2].faint = 1.5;
    s.strokes[3].d = "L0 0";
    s.flies = [{ from: [0, 0], ctrl: [0, 0], to: [0, 0], radius: 2, window: [0.9, 1.2] }];
    const e = validateScene(s).join("\n");
    expect(e).toContain("strokes[0].window: start 0.5 after end 0.2");
    expect(e).toContain("strokes[1].width must be > 0");
    expect(e).toContain("strokes[2].faint must be between 0 and 1");
    expect(e).toContain('strokes[3].d must start with M');
    expect(e).toContain("flies[0].window must be within 0..1");
  });

  test("group keyframes are ordered and groups exist", () => {
    const s = scene();
    s.groups = { rays: { keyframes: [{ t: 1 }, { t: 0.5 }] } };
    s.strokes[0].group = "ghost";
    const e = validateScene(s).join("\n");
    expect(e).toContain("groups.rays.keyframes must be in time order");
    expect(e).toContain('strokes[0].group "ghost" has no entry in groups');
  });

  test("schema and id are required", () => {
    const s = scene();
    s.schema = 9;
    s.id = "Sun Rise";
    const e = validateScene(s).join("\n");
    expect(e).toContain("schema 9 is not supported");
    expect(e).toContain("id must be kebab-case");
  });
});

describe("extractScene (annotated SVG from a design tool)", () => {
  test("reads paths, circles, windows, faintness, groups and fills", () => {
    const s = extractScene(readFileSync(join(FIX, "sunrise.svg"), "utf8"), "sunrise");
    const expected = scene();
    expect(s.viewBox).toEqual(expected.viewBox);
    expect(s.strokes).toEqual(expected.strokes);
    expect(validateScene({ ...s, groups: { rays: { keyframes: [] } } })).toEqual([]);
  });

  test("an element without a window is an error, not a guess", () => {
    expect(() => extractScene('<svg viewBox="0 0 10 10"><path d="M0 0L1 1"/></svg>', "x")).toThrow("has no data-window");
  });

  test("stroke width and fill are inherited from groups and the root, nearest first", () => {
    const s = extractScene(
      `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1">
        <path d="M0 0L1 1" data-window="0 0.2"/>
        <g stroke-width="2" fill="currentColor" data-group="a">
          <circle cx="5" cy="5" r="1" data-window="0.2 0.4"/>
          <g stroke-width="3"><path d="M2 2L3 3" fill="none" data-window="0.4 0.6"/></g>
        </g>
      </svg>`,
      "inherit",
    );
    expect(s.strokes.map((k) => k.width)).toEqual([1, 2, 3]);
    expect(s.strokes.map((k) => k.fill ?? false)).toEqual([false, true, false]);
    expect(s.strokes.map((k) => k.group)).toEqual([undefined, "a", "a"]);
  });

  test("stroke width and fill set in an inline style are read, and win over attributes", () => {
    const s = extractScene(
      '<svg viewBox="0 0 10 10" style="stroke-width: 2"><path d="M0 0L1 1" data-window="0 0.5"/><circle cx="5" cy="5" r="1" stroke-width="1" style="stroke-width: 3; fill: currentColor" data-window="0.5 1"/></svg>',
      "styled",
    );
    expect(s.strokes.map((k) => k.width)).toEqual([2, 3]);
    expect(s.strokes.map((k) => k.fill ?? false)).toEqual([false, true]);
  });

  test("a fill on the root reaches every shape", () => {
    const s = extractScene('<svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="2" data-window="0 1"/></svg>', "dot");
    expect(s.strokes[0].fill).toBe(true);
  });

  const rejected: [string, string][] = [
    ['<svg viewBox="0 0 10 10" transform="scale(2)"><path d="M0 0L1 1" data-window="0 1"/></svg>', "<svg>: transforms are not supported; flatten it in the design tool"],
    ['<svg viewBox="0 0 10 10"><g data-group="a" transform="rotate(10)"><path d="M0 0L1 1" data-window="0 1"/></g></svg>', "<g>: transforms are not supported"],
    ['<svg viewBox="0 0 10 10"><path d="M0 0L1 1" transform="translate(1 1)" data-window="0 1"/></svg>', "<path>: transforms are not supported"],
    ['<svg viewBox="0 0 10 10"><g opacity="0.4"><path d="M0 0L1 1" data-window="0 1"/></g></svg>', "opacity on a group is not carried"],
    ['<svg viewBox="0 0 10 10"><path d="M0 0L1 1" stroke-opacity="0.5" data-window="0 1"/></svg>', 'use data-faint="0..1"'],
    ['<svg viewBox="0 0 10 10" opacity="0.5"><path d="M0 0L1 1" data-window="0 1"/></svg>', "<svg>: opacity is not carried into the scene"],
    ['<svg viewBox="0 0 10 10" stroke="currentColor"><circle cx="5" cy="5" r="1" fill="currentColor" stroke="none" data-window="0 1"/></svg>', 'stroke="none" cannot be drawn on'],
    ['<svg viewBox="0 0 10 10"><path d="M0 0L1 1" style="opacity: 0.3" data-window="0 1"/></svg>', 'use data-faint="0..1"'],
    ['<svg viewBox="0 0 10 10"><clipPath id="c"><rect width="5" height="5"/></clipPath><path d="M0 0L1 1" data-window="0 1"/></svg>', "<clipPath> is not supported"],
    ['<svg viewBox="0 0 10 10"><defs><path id="p" d="M0 0L1 1" data-window="0 1"/></defs></svg>', "<defs> is not supported"],
  ];
  for (const [svg, message] of rejected) {
    test(`rejects ${message}`, () => {
      expect(() => extractScene(svg, "x")).toThrow(`scene x: `);
      expect(() => extractScene(svg, "x")).toThrow(message);
    });
  }
});

describe("buildArt", () => {
  function workspace() {
    const dir = mkdtempSync(join(tmpdir(), "ds-art-"));
    cpSync(FIX, dir, { recursive: true });
    return dir;
  }

  test("writes a typed web module and one JSON per scene for native bundles", () => {
    const dir = workspace();
    buildArt(join(dir, "art.json"));
    const ts = readFileSync(join(dir, "out/web/scenes.ts"), "utf8");
    expect(ts).toStartWith("// GENERATED by ds-art");
    expect(ts).toContain('export type DSSceneId = "sunrise";');
    expect(ts).toContain('"sunrise": {');
    const json = JSON.parse(readFileSync(join(dir, "out/native/sunrise.json"), "utf8"));
    expect(json).toEqual(scene());
    expect(buildArt(join(dir, "art.json"), { check: true }).stale).toEqual([]);
  });

  test("--check notices a changed scene", () => {
    const dir = workspace();
    buildArt(join(dir, "art.json"));
    const s = scene();
    s.strokes[0].width = 2;
    writeFileSync(join(dir, "scenes/sunrise.json"), JSON.stringify(s));
    expect(buildArt(join(dir, "art.json"), { check: true }).stale.length).toBeGreaterThan(0);
  });

  test("an invalid scene fails the build", () => {
    const dir = workspace();
    const s = scene();
    s.strokes[0].window = [0.9, 0.1];
    writeFileSync(join(dir, "scenes/sunrise.json"), JSON.stringify(s));
    expect(() => buildArt(join(dir, "art.json"))).toThrow("start 0.9 after end 0.1");
  });

  test("CLI: extract, build, check", () => {
    const dir = workspace();
    const out = join(dir, "extracted.json");
    expect(Bun.spawnSync(["bun", CLI, "extract", join(dir, "sunrise.svg"), "--id", "sunrise", "--out", out]).exitCode).toBe(0);
    expect(existsSync(out)).toBe(true);
    expect(Bun.spawnSync(["bun", CLI, "build", join(dir, "art.json"), "--check"]).exitCode).toBe(1);
    expect(Bun.spawnSync(["bun", CLI, "build", join(dir, "art.json")]).exitCode).toBe(0);
    expect(Bun.spawnSync(["bun", CLI, "build", join(dir, "art.json"), "--check"]).exitCode).toBe(0);
    expect(Bun.spawnSync(["bun", CLI]).exitCode).toBe(2);
  });
});
