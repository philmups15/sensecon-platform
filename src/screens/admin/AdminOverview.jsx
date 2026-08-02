import { useEffect, useState } from 'react';
import Chip from '../../components/Chip';
import Spinner from '../../components/Spinner';
import { getUsers, getAuditLog, getIntegrationSettings, toAuditLogView } from '../../lib/api';
import { tenants, templates } from '../../lib/mockData';
import { cardStyle, linkBtnStyle } from './shared';

const cardHeadStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #E4E8EB' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #F0F2F4', fontSize: 13 };

export default function AdminOverview({ onNavigate }) {
  const [userCount, setUserCount] = useState(null);
  const [roleCount, setRoleCount] = useState(null);
  const [recentAudit, setRecentAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [integrations, setIntegrations] = useState([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then((dtos) => {
        setUserCount(dtos.length);
        setRoleCount(new Set(dtos.map((d) => d.role)).size);
      })
      .catch(() => {});

    getAuditLog()
      .then((dtos) => setRecentAudit(dtos.slice(0, 3).map(toAuditLogView)))
      .catch(() => {})
      .finally(() => setAuditLoading(false));

    getIntegrationSettings()
      .then(setIntegrations)
      .catch(() => {})
      .finally(() => setIntegrationsLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 700, borderBottom: '1px solid #E4E8EB' }}>Tenants</div>
        {tenants.map((t, i) => (
          <div key={i} style={{ ...rowStyle, borderBottom: i === tenants.length - 1 ? 'none' : rowStyle.borderBottom }}>
            <div style={{ fontWeight: 600 }}>{t.name}</div>
            <div style={{ color: '#6A7178' }}>{t.plants} plants · {t.users} users</div>
            <Chip label={t.status} tone={t.tone} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={cardHeadStyle}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Users & roles</div>
            <button type="button" onClick={() => onNavigate('users')} style={linkBtnStyle}>Open →</button>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {userCount === null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA0A6' }}><Spinner size={13} />Loading…</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>{userCount} user{userCount === 1 ? '' : 's'}</div>
                <Chip label={`${roleCount} role${roleCount === 1 ? '' : 's'}`} tone="slate" />
              </div>
            )}
            <div style={{ color: '#9AA0A6', fontSize: 12.5, marginTop: 8 }}>Manage accounts, reset passwords, and control access from one place.</div>
          </div>
        </div>

        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 700, borderBottom: '1px solid #E4E8EB' }}>Templates</div>
          {templates.map((tp, i) => (
            <div key={i} style={{ ...rowStyle, borderBottom: i === templates.length - 1 ? 'none' : rowStyle.borderBottom }}>
              <div>{tp.name}</div>
              <Chip label={tp.kind} tone="slate" />
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={cardHeadStyle}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Integrations</div>
            <button type="button" onClick={() => onNavigate('integrations')} style={linkBtnStyle}>Open →</button>
          </div>
          {integrationsLoading && <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA0A6' }}><Spinner size={13} />Loading…</div>}
          {!integrationsLoading && integrations.map((i2, i) => (
            <div key={i2.key} style={{ ...rowStyle, borderBottom: i === integrations.length - 1 ? 'none' : rowStyle.borderBottom }}>
              <div>{i2.name}</div>
              <Chip label={i2.status} tone={i2.status === 'Connected' ? 'green' : 'slate'} />
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={cardHeadStyle}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>Audit log</div>
            <button type="button" onClick={() => onNavigate('audit')} style={linkBtnStyle}>Open →</button>
          </div>
          {auditLoading && <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA0A6' }}><Spinner size={13} />Loading…</div>}
          {!auditLoading && recentAudit.length === 0 && (
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#9AA0A6' }}>No activity recorded yet.</div>
          )}
          {recentAudit.map((a, i) => (
            <div key={a.entityId} style={{ padding: '10px 16px', borderBottom: i === recentAudit.length - 1 ? 'none' : '1px solid #F0F2F4', fontSize: 12.5 }}>
              <b>{a.who}</b> · {a.action}
              <div style={{ color: '#9AA0A6', fontSize: 11, marginTop: 2 }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
