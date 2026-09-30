import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { DSStrokeScene, type DSScene, flyPoint, groupState, strokeProgress } from '../src/stroke-scene';

const scene: DSScene = {
  schema: 1,
  id: 'sample',
  viewBox: [0, 0, 100, 100],
  strokes: [
    { d: 'M0 0L10 10', width: 2, window: [0, 0.4] },
    { d: 'M10 10L20 20', width: 1, window: [0.4, 0.8], faint: 0.5, group: 'g' },
    { d: 'M20 20L30 30', width: 1, window: [0.8, 1], fill: true },
  ],
  flies: [{ from: [0, 0], ctrl: [50, 100], to: [100, 0], radius: 2, window: [0.5, 1] }],
  groups: { g: { keyframes: [{ t: 0.5, rotate: 0, origin: [10, 10], opacity: 1 }, { t: 1, rotate: 90, origin: [10, 10], opacity: 0 }] } },
};

describe('timeline maths (same model as SwiftUI trim / Compose PathMeasure)', () => {
  test('strokeProgress windows the global timeline', () => {
    expect(strokeProgress(0, [0.2, 0.6])).toBe(0);
    expect(strokeProgress(0.4, [0.2, 0.6])).toBeCloseTo(0.5);
    expect(strokeProgress(0.9, [0.2, 0.6])).toBe(1);
    expect(strokeProgress(0.5, [0.5, 0.5])).toBe(1);
    expect(strokeProgress(0.49, [0.5, 0.5])).toBe(0);
  });

  test('flyPoint follows the quadratic curve', () => {
    const f = scene.flies?.[0];
    if (!f) throw new Error('fixture');
    expect(flyPoint(f, 0)).toEqual([0, 0]);
    expect(flyPoint(f, 1)).toEqual([100, 0]);
    expect(flyPoint(f, 0.5)).toEqual([50, 50]);
  });

  test('groupState interpolates keyframes and holds the ends', () => {
    const g = scene.groups?.g;
    if (!g) throw new Error('fixture');
    expect(groupState(g, 0.2)).toEqual({ rotate: 0, translate: [0, 0], origin: [10, 10], opacity: 1 });
    expect(groupState(g, 0.75)).toEqual({ rotate: 45, translate: [0, 0], origin: [10, 10], opacity: 0.5 });
    expect(groupState(g, 1)).toEqual({ rotate: 90, translate: [0, 0], origin: [10, 10], opacity: 0 });
  });
});

describe('DSStrokeScene', () => {
  const html = renderToStaticMarkup(<DSStrokeScene scene={scene} progress={0.6} label="Sample drawing" />);

  test('draws with currentColor, labelled for assistive tech', () => {
    expect(html).toContain('viewBox="0 0 100 100"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Sample drawing"');
    expect(html).toContain('stroke="currentColor"');
  });

  test('each stroke is trimmed to its own progress', () => {
    const paths = [...html.matchAll(/<path d="([^"]+)"[^>]*stroke-dashoffset="([\d.]+)"/g)].map((m) => [m[1], Number(m[2])]);
    expect(paths).toEqual([
      ['M0 0L10 10', 0],
      ['M10 10L20 20', 0.5],
      ['M20 20L30 30', 1],
    ]);
    expect(html).toContain('pathLength="1"');
  });

  test('faint strokes and groups get opacity and transforms', () => {
    expect(html).toMatch(/<g transform="rotate\(9 10 10\)" opacity="0.8">/);
    expect(html).toMatch(/stroke-opacity="0.5"/);
  });

  test('a fly dot appears once its window starts', () => {
    expect(html).toMatch(/<circle cx="[\d.]+" cy="[\d.]+" r="2" fill="currentColor"/);
    const before = renderToStaticMarkup(<DSStrokeScene scene={scene} progress={0.4} label="x" />);
    expect(before).not.toContain('<circle');
  });

  test('decorative scenes are hidden from assistive tech', () => {
    const decorative = renderToStaticMarkup(<DSStrokeScene scene={scene} progress={1} />);
    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).not.toContain('role="img"');
  });
});
