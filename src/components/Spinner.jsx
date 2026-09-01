export default function Spinner({ size = 16, color = '#1F6E72' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: 'spin 0.7s linear infinite', flex: 'none' }}
    >
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
      <path d="M12 2 A10 10 0 0 1 22 12" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
