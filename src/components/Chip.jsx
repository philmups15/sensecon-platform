const TONES = {
  blue: { bg: '#EAF0FE', fg: '#1E4FC4', dot: '#2563EB' },
  green: { bg: '#E7F4EC', fg: '#15803D', dot: '#15803D' },
  amber: { bg: '#FBF0E2', fg: '#B45309', dot: '#B45309' },
  red: { bg: '#FBE9E7', fg: '#B42318', dot: '#B42318' },
  violet: { bg: '#F0EAFB', fg: '#6D28D9', dot: '#6D28D9' },
  slate: { bg: '#EEF1F4', fg: '#334155', dot: '#334155' },
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
