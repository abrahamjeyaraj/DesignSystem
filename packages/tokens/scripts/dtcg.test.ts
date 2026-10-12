import { describe, expect, test } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Base, resolveTheme, ROOT, type ThemeSource, themeCss } from "./build";
import { generateCss } from "./cli";
import { fromDtcg, isDtcg, ROLE_MAP, SCHEMA_VERSION, SEMANTIC_CATEGORIES, toDtcg, validateDtcg } from "./dtcg";

const base = JSON.parse(readFileSync(join(ROOT, "tokens/base.json"), "utf8")) as Base;
const sources: ThemeSource[] = readdirSync(join(ROOT, "tokens/themes"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(ROOT, "tokens/themes", f), "utf8")));
const bible = sources.find((s) => s.name === "bible") as ThemeSource;
const CLI = join(import.meta.dir, "cli.ts");
const run = (cwd: string, ...args: string[]) => Bun.spawnSync(["bun", CLI, ...args], { cwd });

describe("role rename map", () => {
  test("maps every base role exactly once, to unique semantic names", () => {
    expect(Object.keys(ROLE_MAP).sort()).toEqual([...base.roles].sort());
    const names = Object.values(ROLE_MAP);
    expect(new Set(names).size).toBe(names.length);
  });

  test("semantic names follow color.<category>.<role> with no hue or look words", () => {
    for (const name of Object.values(ROLE_MAP)) {
      const [group, category, role, ...rest] = name.split(".");
      expect(group).toBe("color");
      expect(SEMANTIC_CATEGORIES as readonly string[]).toContain(category);
      expect(role).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(rest).toEqual([]);
      expect(name).not.toMatch(/sand|pine|cream|gold|brown|blue|red|green|oxblood|cocoa|ink-900/);
    }
  });
});

describe("toDtcg", () => {
  const doc = toDtcg(bible);

  test("pins the schema version and carries the theme name", () => {
    expect(doc.$extensions.ds.schema).toBe(SCHEMA_VERSION);
    expect(doc.$extensions.ds.name).toBe("bible");
    expect(isDtcg(doc)).toBe(true);
    expect(isDtcg(bible)).toBe(false);
  });

  test("roles become typed semantic tokens with a dark mode and the old name", () => {
    const page = doc.color.surface.page;
    expect(page.$type).toBe("color");
    expect(page.$value).toBe(bible.light.background);
    expect(page.$extensions.ds.legacy).toBe("background");
    expect(page.$extensions.ds.dark).toBe(bible.dark.background);
  });

  test("palette references become DTCG aliases", () => {
    const card = doc.color.surface.card;
    expect(bible.light.card).toBe("{white}");
    expect(card.$value).toBe("{palette.white}");
  });

  test("dimensions carry units and shadows use DTCG shadow values", () => {
    expect(doc.radius.button.$type).toBe("dimension");
    expect(doc.radius.button.$value).toEqual({ value: bible.radius?.button, unit: "px" });
    const card = doc.shadow.card.$value[0];
    expect(card.color).toMatchObject({ colorSpace: "srgb", components: [0, 0, 0] });
    expect(card.offsetY).toEqual({ value: bible.shadow?.card?.[0].y, unit: "px" });
  });
});

describe("round trip", () => {
  for (const src of sources) {
    test(`${src.name}: legacy -> DTCG -> legacy resolves to the same theme and CSS`, () => {
      const back = fromDtcg(toDtcg(src));
      expect(resolveTheme(back, base)).toEqual(resolveTheme(src, base));
      expect(themeCss(base, resolveTheme(back, base))).toBe(themeCss(base, resolveTheme(src, base)));
    });
  }
});

describe("validateDtcg", () => {
  const good = () => structuredClone(toDtcg(bible));

  test("migrated themes are valid", () => {
    for (const src of sources) expect(validateDtcg(toDtcg(src), base)).toEqual([]);
  });

  test("reports a missing semantic token", () => {
    const doc = good();
    delete (doc.color.text as Record<string, unknown>).muted;
    expect(validateDtcg(doc, base)).toContain("color.text.muted: missing");
  });

  test("reports an unknown semantic token", () => {
    const doc = good();
    (doc.color.surface as Record<string, unknown>).sparkle = { $type: "color", $value: "#ffffff" };
    expect(validateDtcg(doc, base)).toContain("color.surface.sparkle: not in the contract (brand-only colours go in extra)");
  });

  test("reports an alias that does not resolve", () => {
    const doc = good();
    doc.color.surface.page.$value = "{palette.nowhere.500}";
    expect(validateDtcg(doc, base).join("\n")).toContain("color.surface.page: alias {palette.nowhere.500} does not resolve");
  });

  test("reports a token without $type", () => {
    const doc = good();
    delete (doc.color.surface.page as { $type?: string }).$type;
    expect(validateDtcg(doc, base)).toContain("color.surface.page: missing $type");
  });

  test("reports a schema version it does not support", () => {
    const doc = good();
    doc.$extensions.ds.schema = SCHEMA_VERSION + 1;
    expect(validateDtcg(doc, base).join("\n")).toContain(`schema ${SCHEMA_VERSION + 1} is not supported`);
  });

  test("reports a malformed colour", () => {
    const doc = good();
    doc.color.surface.page.$value = "cream";
    expect(validateDtcg(doc, base).join("\n")).toContain('color.surface.page: "cream" is not #rrggbb or an alias');
  });
});

describe("ds-tokens CLI with DTCG", () => {
  const workspace = () => mkdtempSync(join(tmpdir(), "ds-dtcg-"));

  test("css accepts a DTCG theme and produces the same CSS as the legacy file", () => {
    const dir = workspace();
    writeFileSync(join(dir, "legacy.json"), JSON.stringify(bible));
    writeFileSync(join(dir, "theme.json"), JSON.stringify(toDtcg(bible)));
    const legacy = generateCss("legacy.json", "out.css", dir);
    const dtcg = generateCss("theme.json", "out.css", dir);
    expect(dtcg.replace("theme.json", "legacy.json")).toBe(legacy);
  });

  test("migrate writes a DTCG theme that validates", () => {
    const dir = workspace();
    writeFileSync(join(dir, "legacy.json"), JSON.stringify(bible));
    expect(run(dir, "migrate", "legacy.json", "theme.json").exitCode).toBe(0);
    const doc = JSON.parse(readFileSync(join(dir, "theme.json"), "utf8"));
    expect(isDtcg(doc)).toBe(true);
    expect(run(dir, "validate", "theme.json").exitCode).toBe(0);
  });

  test("validate fails with the errors listed", () => {
    const dir = workspace();
    const doc = toDtcg(bible);
    delete (doc.color.text as Record<string, unknown>).muted;
    writeFileSync(join(dir, "theme.json"), JSON.stringify(doc));
    const result = run(dir, "validate", "theme.json");
    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("color.text.muted: missing");
  });
});
