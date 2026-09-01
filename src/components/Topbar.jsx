import ProfileMenu from './ProfileMenu';
import { notifications, pageTitles } from '../lib/mockData';

export default function Topbar({
  screen,
  tenantOpen,
  notifOpen,
  profileOpen,
  onToggleTenant,
  onToggleNotif,
  onToggleProfile,
  onNavigate,
  onLogout,
}) {
  return (
    <div
      style={{
        height: 56,
        flex: 'none',
        borderBottom: '1px solid #D7E4E1',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 20px',
        position: 'relative',
      }}
    >
      <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, fontWeight: 700, color: '#12201F' }}>{pageTitles[screen] || ''}</div>
      <div
        style={{
          flex: 1,
          maxWidth: 360,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#F4F8F7',
          border: '1px solid #D7E4E1',
          borderRadius: 8,
          padding: '7px 10px',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#78908A" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <span style={{ fontSize: 13, color: '#78908A' }}>Search plants, work orders, opportunities…</span>
      </div>
      <div style={{ flex: 1 }} />

      <div
        onClick={onToggleTenant}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          border: '1px solid #D7E4E1',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 12.5,
          fontWeight: 600,
          color: '#52685F',
        }}
      >
        Kariba Solar Services
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52685F" strokeWidth="2.2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {tenantOpen && (
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 150,
            width: 220,
            background: '#FFFFFF',
            border: '1px solid #D7E4E1',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(18,32,31,0.12)',
            padding: 6,
            zIndex: 20,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: '#78908A',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              padding: '6px 10px',
            }}
          >
            Switch tenant
          </div>
          <div style={{ padding: '8px 10px', borderRadius: 8, background: '#E4F0EF', color: '#12484B', fontWeight: 600, fontSize: 13 }}>
            Kariba Solar Services
          </div>
          <div style={{ padding: '8px 10px', borderRadius: 8, color: '#52685F', fontSize: 13, cursor: 'pointer' }}>Zamsun Power Ltd</div>
          <div style={{ padding: '8px 10px', borderRadius: 8, color: '#52685F', fontSize: 13, cursor: 'pointer' }}>Copperbelt Energy Co-op</div>
        </div>
      )}

      <div
        onClick={onToggleNotif}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid #D7E4E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52685F" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 01-3.4 0" />
        </svg>
        <span style={{ position: 'absolute', top: 5, right: 6, width: 7, height: 7, borderRadius: 999, background: '#A6362E' }} />
      </div>
      {notifOpen && (
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 76,
            width: 320,
            maxHeight: 360,
            overflow: 'auto',
            background: '#FFFFFF',
            border: '1px solid #D7E4E1',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(18,32,31,0.12)',
            zIndex: 20,
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #D7E4E1', fontWeight: 700, fontSize: 13 }}>Notifications</div>
          {notifications.map((n, i) => (
            <div key={i} style={{ padding: '11px 14px', borderBottom: '1px solid #E9F1EF', fontSize: 12.5 }}>
              <div style={{ fontWeight: 600, color: '#12201F' }}>{n.title}</div>
              <div style={{ color: '#52685F', marginTop: 2 }}>{n.body}</div>
              <div style={{ color: '#78908A', marginTop: 3, fontSize: 11 }}>
                {n.channel} · {n.time}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileMenu open={profileOpen} onToggle={onToggleProfile} onNavigate={onNavigate} onLogout={onLogout} />
    </div>
  );
}
