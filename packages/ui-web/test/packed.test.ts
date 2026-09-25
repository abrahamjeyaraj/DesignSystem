import { afterAll, beforeAll, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const pkg = resolve(import.meta.dir, '..');

function run(cmd: string[], cwd: string): string {
  const r = Bun.spawnSync(cmd, { cwd });
  if (r.exitCode !== 0) throw new Error(`${cmd.join(' ')}\n${r.stderr.toString()}`);
  return r.stdout.toString();
}

// A consumer that sees only what ships: `bun pm pack` applies "files". It lives outside the
// workspace so nothing resolves back to packages/ui-web; tailwindcss, the CLI and the tokens theme
// are linked in from the workspace because they are not under test.
let consumer: string;
let installed: string;

beforeAll(() => {
  consumer = mkdtempSync(join(tmpdir(), 'ui-web-consumer-'));
  const packDir = mkdtempSync(join(tmpdir(), 'ui-web-pack-'));
  run(['bun', 'pm', 'pack', '--destination', packDir, '--quiet'], pkg);
  const tarball = readdirSync(packDir).find((f) => f.endsWith('.tgz'));
  if (!tarball) throw new Error('bun pm pack produced no tarball');

  const modules = join(consumer, 'node_modules');
  installed = join(modules, '@abrahamjeyaraj', 'ui-web');
  mkdirSync(installed, { recursive: true });
  run(['tar', '-xzf', join(packDir, tarball), '-C', installed, '--strip-components', '1'], consumer);
  rmSync(packDir, { recursive: true, force: true });

  const link = (name: string, target: string) => {
    mkdirSync(dirname(join(modules, name)), { recursive: true });
    symlinkSync(realpathSync(target), join(modules, name));
  };
  link('tailwindcss', join(pkg, 'node_modules', 'tailwindcss'));
  link('@tailwindcss/cli', join(pkg, 'node_modules', '@tailwindcss', 'cli'));
  link('@abrahamjeyaraj/tokens', join(pkg, '..', 'tokens'));
  writeFileSync(join(consumer, '.gitignore'), 'node_modules\n');
});

afterAll(() => rmSync(consumer, { recursive: true, force: true }));

test('every @source in the shipped styles.css points at a directory that ships', () => {
  const sources = [...readFileSync(join(installed, 'styles.css'), 'utf8').matchAll(/@source\s+"([^"]+)"/g)].map((m) => m[1]);
  expect(sources.length).toBeGreaterThan(0);
  for (const source of sources) expect(existsSync(join(installed, source))).toBe(true);
  expect(existsSync(join(installed, 'src', 'button.tsx'))).toBe(true);
});

test('a consumer Tailwind build picks up ui-web component classes', () => {
  writeFileSync(
    join(consumer, 'in.css'),
    '@import "tailwindcss";\n@import "@abrahamjeyaraj/tokens/css/bible.css";\n@import "@abrahamjeyaraj/ui-web/styles.css";\n',
  );
  // Output outside the consumer, or Tailwind's automatic source detection would scan it next time.
  const out = join(mkdtempSync(join(tmpdir(), 'ui-web-out-')), 'out.css');
  run(['bun', join(consumer, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs'), '-i', 'in.css', '-o', out], consumer);
  const css = readFileSync(out, 'utf8');
  rmSync(dirname(out), { recursive: true, force: true });

  // Button utilities: nothing in the consumer uses them, so they come from scanning ui-web.
  expect(css).toContain('.rounded-button');
  expect(css).toContain('.hover\\:bg-action\\/80');
});
