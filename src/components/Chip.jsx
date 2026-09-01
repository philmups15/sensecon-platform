const TONES = {
  blue: { bg: '#E4F0EF', fg: '#12484B', dot: '#1F6E72' },
  green: { bg: '#E3F8EC', fg: '#1C8A4E', dot: '#1C8A4E' },
  amber: { bg: '#FBF0DC', fg: '#8A5A16', dot: '#8A5A16' },
  red: { bg: '#FBE7E5', fg: '#A6362E', dot: '#A6362E' },
  violet: { bg: '#E4F0EF', fg: '#2E9E8F', dot: '#2E9E8F' },
  slate: { bg: '#E9F1EF', fg: '#52685F', dot: '#52685F' },
};

export default function Chip({ label, tone }) {
  const t = TONES[tone] || TONES.slate;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px 3px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
        background: t.bg,
        color: t.fg,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dot, flex: 'none' }} />
      {label}
    </span>
  );
}
