import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { DSIcon, DSIconProvider, type DSIconSet } from '../src/icon';

// Shape of the module ds-icons generates for an app (web/RN output).
const icons: DSIconSet = {
  search: { viewBox: '0 0 24 24', stroke: 1.6, filled: false, shapes: [['circle', { cx: '11', cy: '11', r: '7' }, false], ['path', { d: 'M20 20l-3.5-3.5' }, false]] },
  compass: { viewBox: '0 0 24 24', stroke: 1.6, filled: false, shapes: [['circle', { cx: '12', cy: '12', r: '9' }, false], ['path', { d: 'm15.5 8.5-2 5-5 2 2-5z' }, true]] },
  dot: { viewBox: '0 0 24 24', stroke: 1.6, filled: true, shapes: [['circle', { cx: '12', cy: '12', r: '4' }, true]] },
};
const style = { linecap: 'round', linejoin: 'round' } as const;
const render = (node: React.ReactNode) => renderToStaticMarkup(<DSIconProvider icons={icons} style={style}>{node}</DSIconProvider>);

describe('DSIcon', () => {
  test('draws the frozen geometry with the set stroke, in currentColor', () => {
    const html = render(<DSIcon name="search" />);
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="1.6"');
    expect(html).toContain('stroke-linecap="round"');
    expect(html).toContain('<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>');
  });

  test('sizes: sm 16, md 20 (default), lg 24, or a number', () => {
    expect(render(<DSIcon name="search" />)).toContain('width="20" height="20"');
    expect(render(<DSIcon name="search" size="sm" />)).toContain('width="16" height="16"');
    expect(render(<DSIcon name="search" size="lg" />)).toContain('width="24" height="24"');
    expect(render(<DSIcon name="search" size={32} />)).toContain('width="32" height="32"');
  });

  test('filled shapes inside a line icon, and fully filled icons', () => {
    expect(render(<DSIcon name="compass" />)).toContain('<path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor"></path>');
    const dot = render(<DSIcon name="dot" />);
    expect(dot).toContain('fill="currentColor"');
    expect(dot).not.toContain('stroke="currentColor"');
  });

  test('decorative by default; a label makes it an image', () => {
    expect(render(<DSIcon name="search" />)).toContain('aria-hidden="true"');
    const labelled = render(<DSIcon name="search" label="Search" />);
    expect(labelled).toContain('role="img"');
    expect(labelled).toContain('aria-label="Search"');
  });

  test('an unknown name or a missing provider fails loudly instead of drawing something else', () => {
    expect(() => render(<DSIcon name="sparkle" />)).toThrow('"sparkle" is not in the app\'s icon set');
    expect(() => renderToStaticMarkup(<DSIcon name="search" />)).toThrow('DSIconProvider');
  });
});
