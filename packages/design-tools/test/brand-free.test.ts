import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * DesignSystem is infrastructure: its component and SDK sources name no product. Product themes
 * still ship from tokens/themes until each app owns its theme; the native SDKs below still use
 * them as defaults and previews and are listed so the list can only shrink.
 */
const ROOT = resolve(import.meta.dir, "../../..");
const SOURCES = ["packages/tokens/scripts", "packages/ui-web/src", "packages/ui-native/src", "packages/design-tools/src", "native/swift/Sources", "native/android/designsystem/src/main", "native/flutter/lib"];
const GENERATED = /DSTokens\.(swift|kt)$|ds_tokens\.g\.dart$/;
const PRODUCT = /\b(bible|church(hq)?|tuition(manager)?|sermons?|students?|attendance|donations?|members?hip)\b/i;
const KNOWN_NATIVE_EXCEPTIONS = [
  "native/android/designsystem/src/main/kotlin/com/abrahamjeyaraj/designsystem/DSGallery.kt",
  "native/android/designsystem/src/main/kotlin/com/abrahamjeyaraj/designsystem/DSTheme.kt",
  "native/flutter/lib/design_system.dart",
  "native/swift/Sources/DesignSystem/DSGallery.swift",
  "native/swift/Sources/DesignSystem/DSTheme.swift",
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

test("no product names in DesignSystem sources", () => {
  const hits = SOURCES.flatMap((s) => files(join(ROOT, s)))
    .filter((f) => !GENERATED.test(f) && /\.(tsx?|swift|kt|dart)$/.test(f))
    .filter((f) => readFileSync(f, "utf8").split("\n").some((line) => PRODUCT.test(line)))
    .map((f) => relative(ROOT, f))
    .sort();
  expect(hits).toEqual(KNOWN_NATIVE_EXCEPTIONS);
});
