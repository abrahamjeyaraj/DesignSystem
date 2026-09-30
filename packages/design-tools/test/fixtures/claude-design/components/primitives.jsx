// Shared primitives
const T = {
  ink: '#1A1A1A',
  accent: '#8B5D2E',
  soft: 'rgba(200, 180, 150, 0.18)',
  fBody: "'Geist', -apple-system, sans-serif",
};

function Nav({ color }) {
  const s = { width: 22, height: 22, stroke: color, strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' };
  return <svg viewBox="0 0 24 24" style={s}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
}
