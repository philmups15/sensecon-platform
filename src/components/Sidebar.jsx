import { navGroups } from '../lib/mockData';
import { canViewScreen } from '../lib/api';

export default function Sidebar({ screen, onNavigate, onLogout, currentUser }) {
  const role = currentUser?.role;

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(([, key]) => canViewScreen(role, key)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      style={{
        width: 236,
        flex: 'none',
        background: '#FFFFFF',
        borderRight: '1px solid #D7E4E1',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 20px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2 A10 10 0 0 1 12 22 A7 7 0 0 0 12 2Z" fill="#1F6E72" />
          <path d="M12 2 A10 10 0 0 0 12 22 A7 7 0 0 1 12 2Z" fill="#12484B" />
        </svg>
        <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15.5, fontWeight: 800, letterSpacing: -0.3, color: '#12484B' }}>Sencecon</div>
      </div>

      {visibleGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 0.6,
              color: '#78908A',
              textTransform: 'uppercase',
              padding: '6px 10px 6px',
            }}
          >
            {group.label}
          </div>
          {group.items.map(([label, key]) => {
            const active = screen === key;
            return (
              <div
                key={key}
                onClick={() => onNavigate(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 1,
                  background: active ? '#E4F0EF' : 'transparent',
                  color: active ? '#12484B' : '#52685F',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 2,
                    background: active ? '#1F6E72' : '#D7E4E1',
                    flex: 'none',
                  }}
                />
                {label}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: 'auto', padding: 10, borderTop: '1px solid #D7E4E1' }}>
        <div onClick={onLogout} style={{ fontSize: 12.5, color: '#52685F', cursor: 'pointer', padding: '6px 10px' }}>
          Log out
        </div>
      </div>
    </div>
  );
}
