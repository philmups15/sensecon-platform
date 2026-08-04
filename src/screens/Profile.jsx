import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import { getCurrentUser, updateProfile, uploadAvatar, deleteAvatar, changePassword, USER_ROLE_META } from '../lib/api';

const cardStyle = { background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: '20px 22px', marginBottom: 16 };
const fieldLabelStyle = { fontSize: 11, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 };
const fieldValueStyle = { fontSize: 14, color: '#141719' };
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', border: '1px solid #D2D8DC', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
const secondaryBtnStyle = { padding: '8px 16px', background: '#FFFFFF', color: '#334155', border: '1px solid #D2D8DC', borderRadius: 8, fontWeight: 600, fontSize: 12.5, cursor: 'pointer' };
const linkBtnStyle = { background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', padding: 0 };
const errorStyle = { marginBottom: 14, padding: '9px 11px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12.5 };
const noticeStyle = { marginBottom: 14, padding: '9px 11px', background: '#E7F4EC', color: '#15803D', borderRadius: 8, fontSize: 12.5 };

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const FIELDS = [
  { key: 'username', label: 'Username' },
  { key: 'phoneNumber', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'jobDescription', label: 'Job description' },
];

export default function Profile({ currentUser, onUserUpdate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: '', username: '', phoneNumber: '', address: '', jobDescription: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const applyUser = (dto) => {
    setUser(dto);
    onUserUpdate?.(dto);
  };

  useEffect(() => {
    getCurrentUser()
      .then(applyUser)
      .catch((err) => setError(err.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = () => {
    setForm({
      displayName: user.displayName || '',
      username: user.username || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      jobDescription: user.jobDescription || '',
    });
    setSaveError('');
    setNotice('');
    setEditing(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateProfile(form);
      applyUser(updated);
      setEditing(false);
      setNotice('Profile updated.');
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError('');
    try {
      const updated = await uploadAvatar(file);
      applyUser(updated);
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload picture.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true);
    setAvatarError('');
    try {
      const updated = await deleteAvatar();
      applyUser(updated);
    } catch (err) {
      setAvatarError(err.message || 'Failed to remove picture.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice('Password changed.');
    } catch (err) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: '#6A7178' }}><Spinner size={18} />Loading profile…</div>;
  }
  if (error) {
    return <div style={{ padding: 20, color: '#B42318' }}>{error}</div>;
  }

  const roleMeta = USER_ROLE_META[user.role] || USER_ROLE_META.User;

  return (
    <div style={{ maxWidth: 720 }}>
      {notice && <div style={noticeStyle}>{notice}</div>}

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Avatar userId={currentUser?.id || user.id} name={user.displayName} hasAvatar={user.hasAvatar} size={72} fontSize={24} />
            {avatarBusy && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size={18} />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#141719' }}>{user.displayName}</div>
            {user.jobDescription && <div style={{ fontSize: 13, color: '#6A7178', marginTop: 2 }}>{user.jobDescription}</div>}
            <div style={{ marginTop: 8 }}>
              <Chip label={roleMeta.label} tone={roleMeta.tone} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarBusy} style={linkBtnStyle}>
              {user.hasAvatar ? 'Change photo' : 'Add photo'}
            </button>
            {user.hasAvatar && (
              <button type="button" onClick={handleRemoveAvatar} disabled={avatarBusy} style={{ ...linkBtnStyle, color: '#B42318' }}>
                Remove photo
              </button>
            )}
          </div>
        </div>
        {avatarError && <div style={{ ...errorStyle, marginTop: 14, marginBottom: 0 }}>{avatarError}</div>}
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Profile details</div>
          {!editing && <button type="button" onClick={startEdit} style={linkBtnStyle}>Edit</button>}
        </div>

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <div style={fieldLabelStyle}>Full name</div>
              <div style={fieldValueStyle}>{user.displayName || '—'}</div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Email</div>
              <div style={fieldValueStyle}>{user.email}</div>
            </div>
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div style={fieldLabelStyle}>{f.label}</div>
                <div style={fieldValueStyle}>{user[f.key] || '—'}</div>
              </div>
            ))}
            <div>
              <div style={fieldLabelStyle}>Member since</div>
              <div style={fieldValueStyle}>{formatDate(user.created)}</div>
            </div>
          </div>
        ) : (
          <form onSubmit={saveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <div style={fieldLabelStyle}>Full name</div>
                <input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} required style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Email</div>
                <div style={{ ...fieldValueStyle, padding: '9px 0', color: '#9AA0A6' }}>{user.email} (can't be changed here)</div>
              </div>
              <div>
                <div style={fieldLabelStyle}>Username</div>
                <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Phone</div>
                <input value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Address</div>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Job description</div>
                <input value={form.jobDescription} onChange={(e) => setForm((f) => ({ ...f, jobDescription: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            {saveError && <div style={errorStyle}>{saveError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} style={{ ...primaryBtnStyle, opacity: saving ? 0.6 : 1 }}>
                {saving && <Spinner size={11} color="#fff" />}Save changes
              </button>
              <button type="button" onClick={() => setEditing(false)} disabled={saving} style={secondaryBtnStyle}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pwOpen ? 16 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Password</div>
          {!pwOpen && <button type="button" onClick={() => { setPwOpen(true); setPwError(''); }} style={linkBtnStyle}>Change password</button>}
        </div>

        {pwOpen && (
          <form onSubmit={savePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <div style={fieldLabelStyle}>Current password</div>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>New password</div>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} style={inputStyle} />
              </div>
              <div>
                <div style={fieldLabelStyle}>Confirm new password</div>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} style={inputStyle} />
              </div>
            </div>
            {pwError && <div style={errorStyle}>{pwError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={pwSaving} style={{ ...primaryBtnStyle, opacity: pwSaving ? 0.6 : 1 }}>
                {pwSaving && <Spinner size={11} color="#fff" />}Update password
              </button>
              <button type="button" onClick={() => setPwOpen(false)} disabled={pwSaving} style={secondaryBtnStyle}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
