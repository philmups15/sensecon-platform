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
        background: '#FAFBFC',
        borderRight: '1px solid #E4E8EB',
        display: 'flex',
        flexDirection: 'column',
        padding: '18px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 20px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2 A10 10 0 0 1 12 22 A7 7 0 0 0 12 2Z" fill="#2563EB" />
          <path d="M12 2 A10 10 0 0 0 12 22 A7 7 0 0 1 12 2Z" fill="#1E4FC4" />
        </svg>
        <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: -0.3, color: '#141719' }}>Sensecon</div>
      </div>

      {visibleGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 0.6,
              color: '#9AA0A6',
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
                  background: active ? '#EAF0FE' : 'transparent',
                  color: active ? '#1E4FC4' : '#334155',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 2,
                    background: active ? '#2563EB' : '#D2D8DC',
                    flex: 'none',
                  }}
                />
                {label}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: 'auto', padding: 10, borderTop: '1px solid #E4E8EB' }}>
        <div onClick={onLogout} style={{ fontSize: 12.5, color: '#6A7178', cursor: 'pointer', padding: '6px 10px' }}>
          Log out
        </div>
      </div>
    </div>
  );
}
