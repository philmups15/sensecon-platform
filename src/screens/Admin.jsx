import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import Spinner from '../components/Spinner';
import { getUsers, getAuditLog, updateUserRole, adminCreateUser, toUserView, toAuditLogView, USER_ROLE_META, ALL_ROLES } from '../lib/api';
import { tenants, templates, integrations } from '../lib/mockData';

const selectStyle = {
  padding: '5px 8px',
  border: '1px solid #D2D8DC',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  color: '#334155',
  background: '#FFFFFF',
  cursor: 'pointer',
};

const inputStyle = {
  border: '1px solid #D2D8DC',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 12.5,
  fontFamily: 'inherit',
};

const primaryBtnStyle = {
  padding: '7px 14px',
  background: '#2563EB',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 12,
  cursor: 'pointer',
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#2563EB',
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
};

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function Admin({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditError, setAuditError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [roleError, setRoleError] = useState('');

  const [creatingOpen, setCreatingOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdCredential, setCreatedCredential] = useState(null);

  useEffect(() => {
    getUsers()
      .then((dtos) => setUsers(dtos.map(toUserView)))
      .catch((err) => setError(err.message || 'Failed to load users.'))
      .finally(() => setLoading(false));

    getAuditLog()
      .then((dtos) => setAuditLog(dtos.map(toAuditLogView)))
      .catch((err) => setAuditError(err.message || 'Failed to load audit log.'))
      .finally(() => setAuditLoading(false));
  }, []);

  const handleRoleChange = async (user, newRoleKey) => {
    if (newRoleKey === user.roleKey) return;
    const previous = users;
    setSavingId(user.entityId);
    setRoleError('');
    const meta = USER_ROLE_META[newRoleKey];
    setUsers((prev) => prev.map((u) => (u.entityId === user.entityId ? { ...u, roleKey: newRoleKey, role: meta.label, tone: meta.tone } : u)));
    try {
      await updateUserRole(user.entityId, newRoleKey);
    } catch (err) {
      setUsers(previous);
      setRoleError(err.message || 'Failed to change role.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !newEmail.trim()) return;
    setCreating(true);
    setCreateError('');
    const password = generatePassword();
    try {
      const result = await adminCreateUser(newEmail.trim(), password, newDisplayName.trim());
      if (newRole !== 'User') {
        await updateUserRole(result.userId, newRole);
      }
      const meta = USER_ROLE_META[newRole];
      setUsers((prev) => [...prev, { entityId: result.userId, name: newDisplayName.trim(), email: result.email, role: meta.label, roleKey: newRole, tone: meta.tone }]);
      setCreatedCredential({ email: result.email, password });
      setNewDisplayName('');
      setNewEmail('');
      setNewRole('User');
      setCreatingOpen(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 700, borderBottom: '1px solid #E4E8EB' }}>Tenants</div>
        {tenants.map((t, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{t.name}</div>
            <div style={{ color: '#6A7178' }}>{t.plants} plants · {t.users} users</div>
            <Chip label={t.status} tone={t.tone} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Users & roles</div>
            {!creatingOpen && <button type="button" onClick={() => { setCreatingOpen(true); setCreateError(''); }} style={linkBtnStyle}>+ Create user</button>}
          </div>

          {createdCredential && (
            <div style={{ marginBottom: 10, padding: '9px 11px', background: '#EAF6EE', border: '1px solid #BFE5CB', borderRadius: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <b>{createdCredential.email}</b> created. Temporary password: <span style={{ fontFamily: 'SF Mono, Consolas, monospace' }}>{createdCredential.password}</span>
                  <div style={{ color: '#3A7A4E', marginTop: 2 }}>Save this now — it won't be shown again.</div>
                </div>
                <button type="button" onClick={() => setCreatedCredential(null)} style={{ ...linkBtnStyle, color: '#3A7A4E' }}>Dismiss</button>
              </div>
            </div>
          )}

          {creatingOpen && (
            <form onSubmit={handleCreateUser} style={{ marginBottom: 12, padding: 12, background: '#F7F8F9', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Full name"
                style={inputStyle}
                autoFocus
              />
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                style={inputStyle}
              />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={selectStyle}>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{USER_ROLE_META[r].label}</option>
                ))}
              </select>
              {createError && <div style={{ padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{createError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={creating || !newDisplayName.trim() || !newEmail.trim()} style={{ ...primaryBtnStyle, opacity: creating || !newDisplayName.trim() || !newEmail.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {creating && <Spinner size={11} color="#fff" />}Create
                </button>
                <button type="button" onClick={() => { setCreatingOpen(false); setCreateError(''); }} disabled={creating} style={{ ...linkBtnStyle, color: '#9AA0A6' }}>Cancel</button>
              </div>
            </form>
          )}

          {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA0A6' }}><Spinner size={14} />Loading…</div>}
          {error && <div style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}
          {roleError && <div style={{ marginBottom: 8, padding: '7px 10px', background: '#FBE9E7', color: '#B42318', borderRadius: 8, fontSize: 12 }}>{roleError}</div>}
          {!loading && !error && users.length === 0 && (
            <div style={{ fontSize: 13, color: '#9AA0A6' }}>No users registered yet.</div>
          )}
          {users.map((u) => {
            const isSelf = u.entityId === currentUser?.id;
            return (
              <div key={u.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
                <div>
                  {u.name}
                  <div style={{ fontSize: 11, color: '#9AA0A6' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {savingId === u.entityId && <Spinner size={12} />}
                  <select
                    value={u.roleKey}
                    disabled={isSelf || savingId === u.entityId}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                    title={isSelf ? "You can't change your own role." : undefined}
                    style={{ ...selectStyle, opacity: isSelf || savingId === u.entityId ? 0.6 : 1 }}
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>{USER_ROLE_META[r].label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Templates</div>
          {templates.map((tp, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
              {tp.name} <span style={{ color: '#9AA0A6', fontSize: 11 }}>{tp.kind}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Integrations</div>
          {integrations.map((i2, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
              {i2.name}
              <Chip label={i2.status} tone={i2.tone} />
            </div>
          ))}
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E8EB', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Audit log</div>
          {auditLoading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA0A6' }}><Spinner size={14} />Loading…</div>}
          {auditError && <div style={{ fontSize: 13, color: '#B42318' }}>{auditError}</div>}
          {!auditLoading && !auditError && auditLog.length === 0 && (
            <div style={{ fontSize: 13, color: '#9AA0A6' }}>No activity recorded yet.</div>
          )}
          {auditLog.map((a) => (
            <div key={a.entityId} style={{ padding: '8px 0', borderBottom: '1px solid #F0F2F4', fontSize: 12.5 }}>
              <b>{a.who}</b> {a.action}
              <div style={{ color: '#9AA0A6', fontSize: 11 }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
