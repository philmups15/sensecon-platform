import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import Chip from './Chip';
import Spinner from './Spinner';
import { getCurrentUser, changePassword, USER_ROLE_META } from '../lib/api';

export default function ProfileMenu({ open, onToggle, onNavigate, onLogout }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('view');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setMode('view');
      setError('');
      setNotice('');
    }
  }, [open]);

  const openMode = (next) => {
    setError('');
    setNotice('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMode(next);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setNotice('Password changed.');
      setMode('view');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const roleMeta = user ? USER_ROLE_META[user.role] || USER_ROLE_META.User : null;

  return (
    <>
      <div onClick={onToggle} style={{ cursor: 'pointer' }}>
        <Avatar userId={user?.id} name={user?.displayName} hasAvatar={user?.hasAvatar} size={32} />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 20,
            width: 280,
            background: '#FFFFFF',
            border: '1px solid #E4E8EB',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(20,23,25,0.12)',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          {mode === 'view' && (
            <>
              <div style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar userId={user?.id} name={user?.displayName} hasAvatar={user?.hasAvatar} size={40} fontSize={14} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#141719', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName || 'Loading…'}</div>
                  <div style={{ fontSize: 11.5, color: '#9AA0A6', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                </div>
              </div>
              {roleMeta && (
                <div style={{ padding: '0 16px 14px' }}>
                  <Chip label={roleMeta.label} tone={roleMeta.tone} />
                </div>
              )}
              {notice && <div style={{ margin: '0 16px 12px', padding: '8px 10px', background: '#E7F4EC', color: '#15803D', borderRadius: 8, fontSize: 12 }}>{notice}</div>}
              <div style={{ borderTop: '1px solid #E4E8EB' }}>
                <div onClick={() => onNavigate('profile')} style={{ padding: '11px 16px', fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                  View full profile
                </div>
                <div onClick={() => openMode('change-password')} style={{ padding: '11px 16px', fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                  Change password
                </div>
              </div>
              <div style={{ borderTop: '1px solid #E4E8EB' }}>
                <div onClick={onLogout} style={{ padding: '11px 16px', fontSize: 13, color: '#B42318', cursor: 'pointer', fontWeight: 600 }}>
                  Log out
                </div>
              </div>
            </>
          )}

          {mode === 'change-password' && (
            <form onSubmit={savePassword} style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Change password</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Current password</div>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 10 }}
              />
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>New password</div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 10 }}
              />
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Confirm new password</div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, marginBottom: 12 }}
              />
              {error && <div style={{ marginBottom: 12, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => openMode('view')} style={{ flex: 1, padding: 9, background: '#FFFFFF', color: '#334155', border: '1px solid #D2D8DC', borderRadius: 8, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: 9, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {saving && <Spinner size={12} color="#fff" />}
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
