import { expect, test } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * DesignSystem is infrastructure: tracked sources must not embed product or legacy theme names.
 * Only this guard file may list those strings (in the scan regex below).
 */
const ROOT = resolve(import.meta.dir, "../../..");
const GUARD = relative(ROOT, import.meta.filename);
const GENERATED = /(^|\/)(DSTokens\.(swift|kt)$|ds_tokens\.g\.dart$|packages\/tokens\/generated\/)/;
const PRODUCT =
  /\b(church(hq)?|chq|bible|tuition(manager)?|parchment|pine|rust|chapel|sermons?|scripture|praise(studios)?|verses?|prayers?|ministr(y|ies)|congregations?|students?|fees|attendance|shisam)\b/i;
const KNOWN_EXCEPTIONS: string[] = [];

function trackedFiles(): string[] {
  return execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map((f) => join(ROOT, f));
}

function isTextSource(path: string): boolean {
  if (!existsSync(path)) return false;
  if (GENERATED.test(path)) return false;
  if (/\.(png|svg|ico|woff2?|ttf|pdf|zip|jar|aar|xcframework)$/i.test(path)) return false;
  if (!statSync(path).isFile()) return false;
  return true;
}

test("no product names in DesignSystem tracked files", () => {
  const hits = trackedFiles()
    .filter(isTextSource)
    .filter((f) => relative(ROOT, f) !== GUARD)
    .filter((f) => readFileSync(f, "utf8").split("\n").some((line) => PRODUCT.test(line)))
    .map((f) => relative(ROOT, f))
    .sort();
  expect(hits).toEqual(KNOWN_EXCEPTIONS);
});
