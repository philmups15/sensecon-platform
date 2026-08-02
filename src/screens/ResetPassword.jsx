import { useState } from 'react';
import Spinner from '../components/Spinner';
import { resetPassword } from '../lib/api';

const cardStyle = { width: 380, background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 32 };
const labelStyle = { fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 };
const fieldStyle = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 14 };

export default function ResetPassword({ token, onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 A10 10 0 0 1 12 22 A7 7 0 0 0 12 2Z" fill="#2563EB" />
            <path d="M12 2 A10 10 0 0 0 12 22 A7 7 0 0 1 12 2Z" fill="#1E4FC4" />
          </svg>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Sensecon</div>
        </div>

        {!token ? (
          <div style={{ fontSize: 13, color: '#B42318' }}>This reset link is missing its token.</div>
        ) : done ? (
          <>
            <div style={{ fontSize: 13.5, color: '#15803D', marginBottom: 18 }}>
              Password updated. You can now sign in with your new password.
            </div>
            <button
              type="button"
              onClick={onDone}
              style={{ width: '100%', padding: 10, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <div style={{ fontSize: 13, color: '#6A7178', marginBottom: 18 }}>Set a new password for your account.</div>

            <div style={labelStyle}>New password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={fieldStyle}
              placeholder="••••••••"
            />

            <div style={labelStyle}>Confirm password</div>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              style={{ ...fieldStyle, marginBottom: 18 }}
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
              style={{ width: '100%', padding: 10, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading && <Spinner size={14} color="#fff" />}
              {loading ? 'Please wait…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
