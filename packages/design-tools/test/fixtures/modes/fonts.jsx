const FONT = { sans: "'Inter', system-ui, sans-serif" };
function A({ isTa }) {
  return <div style={{ fontFamily: FONT.sans }}><span style={{ fontFamily: isTa ? "'Noto Sans Tamil', sans-serif" : FONT.sans }} /><b style={{ fontFamily: `${FONT.sans}` }} /></div>;
}
const S = { fontStyle: 'italic', fontSmoothing: 'antialiased', flexDirection: 'column', whiteSpace: 'nowrap', fontWeight: 'bold' };
const B = () => <i style={{ fontFamily: FONT.sans, textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: 'pointer' }} />;
const C = ({ lang }) => <p style={{ fontFamily: lang === 'ta' ? "'Noto Sans Tamil', sans-serif" : FONT.sans }} />;
