import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const pkg = resolve(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
const MODULES = ['core', 'controls', 'content', 'navigation', 'icons', 'art'] as const;

describe('ui-web modules', () => {
  test('each module is a package subpath', () => {
    for (const m of MODULES) {
      expect(manifest.exports[`./${m}`]).toEqual({
        source: `./src/modules/${m}.ts`,
        types: `./dist/modules/${m}.d.ts`,
        default: `./dist/modules/${m}.js`,
      });
    }
  });

  test('together the modules export exactly the root API, each name once', async () => {
    const root = Object.keys(await import('../src/index.ts')).sort();
    const seen = new Map<string, string>();
    for (const m of MODULES) {
      for (const name of Object.keys(await import(`../src/modules/${m}.ts`))) {
        expect(seen.get(name)).toBeUndefined();
        seen.set(name, m);
      }
    }
    expect([...seen.keys()].sort()).toEqual(root);
  });

  async function bundle(importLine: string): Promise<string> {
    const dir = mkdtempSync(join(pkg, '.tmp-bundle-'));
    const entry = join(dir, 'entry.ts');
    writeFileSync(entry, `${importLine}\nconsole.log(x);\n`);
    try {
      const out = await Bun.build({
        entrypoints: [entry],
        external: ['react', 'react-dom', 'react/jsx-runtime', '@radix-ui/*', 'class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react'],
        minify: false,
      });
      if (!out.success) throw new Error(out.logs.join('\n'));
      return await out.outputs[0].text();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  test('an app that only plays scenes ships no controls, menus or Radix', async () => {
    const js = await bundle(`import { DSStrokeScene as x } from '${join(pkg, 'src/modules/art.ts')}';`);
    expect(js).toContain('strokeProgress');
    expect(js).not.toContain('@radix-ui');
    expect(js).not.toContain('buttonVariants');
    expect(js).not.toContain('DropdownMenu');
  });

  test('an app that only uses controls ships no scenes or menus', async () => {
    const js = await bundle(`import { Button as x } from '${join(pkg, 'src/modules/controls.ts')}';`);
    expect(js).toContain('buttonVariants');
    expect(js).not.toContain('strokeProgress');
    expect(js).not.toContain('react-dropdown-menu');
  });

  test('the icons module carries no icon data of its own', async () => {
    const js = await bundle(`import { DSIcon as x } from '${join(pkg, 'src/modules/icons.ts')}';`);
    expect(js).not.toMatch(/M\d/);
    expect(js.length).toBeLessThan(6000);
  });
});
