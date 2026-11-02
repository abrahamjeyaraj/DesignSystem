import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const pkg = resolve(import.meta.dir, '..');

/** Compiles the way a consumer app would: tailwindcss + one theme + this package. */
function compile(theme: string): string {
  mkdirSync(join(pkg, '.tmp'), { recursive: true });
  const dir = mkdtempSync(join(pkg, '.tmp', 'css-'));
  const input = join(dir, 'in.css');
  const output = join(dir, 'out.css');
  writeFileSync(
    input,
    `@import "tailwindcss";\n@import "@abrahamjeyaraj/tokens/css/${theme}.css";\n@import "${join(pkg, "styles.css")}";\n@source inline("dark:bg-ink");\n`,
  );
  const run = Bun.spawnSync(['bunx', '@tailwindcss/cli', '-i', input, '-o', output], { cwd: pkg });
  if (run.exitCode !== 0) throw new Error(run.stderr.toString());
  return readFileSync(output, 'utf8');
}

describe('default theme compiles with ui-web', () => {
  const css = compile('default');

  test('component utilities resolve to theme variables', () => {
    for (const cls of ['.bg-action', '.text-action-foreground', '.rounded-button', '.rounded-control', '.rounded-card', '.shadow-card', '.border-line', '.bg-subtle', '.text-ink', '.label-text']) {
      expect(css).toContain(cls);
    }
    expect(css).toContain('text-transform: var(--label-case)');
    expect(css).toContain('font-size: var(--label-size)');
  });

  test('class-based dark mode: variables flip under .dark and dark: variant targets .dark', () => {
    expect(css).toContain('.dark');
    expect(css).toMatch(/:where\(\.dark, \.dark \*\)/);
    expect(css).toContain('--color-action: #2563eb;');
    expect(css).toContain('--label-case: none;');
  });
});
