import { useEffect, useState } from 'react';
import Chip from '../components/Chip';
import { getUsers, getAuditLog, toUserView, toAuditLogView } from '../lib/api';
import { tenants, templates, integrations } from '../lib/mockData';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditError, setAuditError] = useState('');

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
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Users & roles</div>
          {loading && <div style={{ fontSize: 13, color: '#9AA0A6' }}>Loading…</div>}
          {error && <div style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}
          {!loading && !error && users.length === 0 && (
            <div style={{ fontSize: 13, color: '#9AA0A6' }}>No users registered yet.</div>
          )}
          {users.map((u) => (
            <div key={u.entityId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F2F4', fontSize: 13 }}>
              <div>
                {u.name}
                <div style={{ fontSize: 11, color: '#9AA0A6' }}>{u.email}</div>
              </div>
              <Chip label={u.role} tone={u.tone} />
            </div>
          ))}
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
          {auditLoading && <div style={{ fontSize: 13, color: '#9AA0A6' }}>Loading…</div>}
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
