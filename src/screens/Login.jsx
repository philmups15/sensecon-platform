export default function Login({ onSignIn }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 380, background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 A10 10 0 0 1 12 22 A7 7 0 0 0 12 2Z" fill="#2563EB" />
            <path d="M12 2 A10 10 0 0 0 12 22 A7 7 0 0 1 12 2Z" fill="#1E4FC4" />
          </svg>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Sensecon</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Work email</div>
        <input
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 14 }}
          placeholder="you@karibasolar.co.zm"
        />
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Password</div>
        <input
          type="password"
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 18 }}
          placeholder="••••••••"
        />
        <button
          onClick={onSignIn}
          style={{ width: '100%', padding: 10, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', marginBottom: 10 }}
        >
          Sign in
        </button>
        <button style={{ width: '100%', padding: 10, background: '#FFFFFF', color: '#334155', border: '1px solid #D2D8DC', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Continue with SSO
        </button>
      </div>
    </div>
  );
}
