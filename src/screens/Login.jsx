import { useState } from 'react';
import { login, register } from '../lib/api';

export default function Login({ onSignIn }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      onSignIn();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <form onSubmit={submit} style={{ width: 380, background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 A10 10 0 0 1 12 22 A7 7 0 0 0 12 2Z" fill="#2563EB" />
            <path d="M12 2 A10 10 0 0 0 12 22 A7 7 0 0 1 12 2Z" fill="#1E4FC4" />
          </svg>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Sensecon</div>
        </div>

        {mode === 'register' && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Full name</div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 14 }}
              placeholder="Jane Mwansa"
            />
          </>
        )}

        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Work email</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 14 }}
          placeholder="you@karibasolar.co.zm"
        />
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Password</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 18 }}
          placeholder="••••••••"
        />

        {error && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12.5 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 10, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: loading ? 'default' : 'pointer', marginBottom: 10, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          onClick={() => { setMode((m) => (m === 'signin' ? 'register' : 'signin')); setError(''); }}
          style={{ width: '100%', padding: 10, background: '#FFFFFF', color: '#334155', border: '1px solid #D2D8DC', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          {mode === 'signin' ? 'Create an account' : 'Back to sign in'}
        </button>
      </form>
    </div>
  );
}
