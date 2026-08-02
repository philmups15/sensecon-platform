import { useEffect, useState } from 'react';
import Chip from '../../components/Chip';
import { ALL_ROLES, USER_ROLE_META, MODULE_ACCESS, getUsers } from '../../lib/api';
import { cardStyle, sectionHeaderStyle, bannerStyle, thStyle, tdStyle } from './shared';

// Mirrors the nav labels in src/lib/mockData.js's navGroups, translated to the
// MODULE_ACCESS keys in src/lib/api.js. Presentation-only — the actual access
// rules live in MODULE_ACCESS (which mirrors the backend's Roles.cs).
const MODULE_LABELS = {
  opportunities: 'Opportunities',
  surveys: 'Site surveys',
  designs: 'Design',
  bomItems: 'BOM & procurement',
  projects: 'Projects',
  plants: 'Plants',
  workOrders: 'Work orders',
  nonConformities: 'Commissioning & handover',
  reports: 'Reports',
};

const MODULES = Object.keys(MODULE_ACCESS);

export default function AdminRoles() {
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [roleCounts, setRoleCounts] = useState({});

  useEffect(() => {
    getUsers()
      .then((dtos) => {
        const counts = {};
        dtos.forEach((d) => { counts[d.role] = (counts[d.role] || 0) + 1; });
        setRoleCounts(counts);
      })
      .catch(() => {}); // user counts are a nice-to-have on top of the read-only viewer, not load-bearing
  }, []);

  const roleMeta = USER_ROLE_META[selectedRole];

  return (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Roles & Permissions</div>
          <div style={{ fontSize: 12.5, color: '#9AA0A6', marginTop: 2 }}>What each of the 5 fixed roles can see and change.</div>
        </div>
      </div>

      <div style={bannerStyle}>
        👁 Roles are a fixed set of 5 defined by the backend, not an editable table — this page is a read-only view of the same access rules the API enforces. There's no "create role" or per-permission editing here because there's nowhere yet to persist changes.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {ALL_ROLES.map((r) => {
            const active = r === selectedRole;
            const count = roleCounts[r] || 0;
            return (
              <div
                key={r}
                onClick={() => setSelectedRole(r)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: '1px solid #F0F2F4',
                  cursor: 'pointer',
                  fontSize: 13,
                  background: active ? '#EEF2FF' : 'transparent',
                }}
              >
                <span style={{ fontWeight: active ? 700 : 500 }}>{USER_ROLE_META[r].label}</span>
                <span style={{ color: '#9AA0A6', fontSize: 11.5 }}>{count} user{count === 1 ? '' : 's'}</span>
              </div>
            );
          })}
        </div>

        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E4E8EB', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{roleMeta.label}</div>
            <Chip label={roleMeta.label} tone={roleMeta.tone} />
          </div>
          <div style={{ padding: '4px 16px 14px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Module</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>View</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Create / edit / delete</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => {
                  const canRead = MODULE_ACCESS[m].read.includes(selectedRole);
                  const canWrite = MODULE_ACCESS[m].write.includes(selectedRole);
                  return (
                    <tr key={m}>
                      <td style={tdStyle}>{MODULE_LABELS[m] || m}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {canRead ? <Chip label="Yes" tone="green" /> : <span style={{ color: '#C3C8CD' }}>—</span>}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {canWrite ? <Chip label="Yes" tone="green" /> : <span style={{ color: '#C3C8CD' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
