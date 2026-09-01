import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner';
import { ALL_ROLES, USER_ROLE_META, getUsers, getRolePermissions, updateRolePermission, setRolePermissionsCache } from '../../lib/api';
import { cardStyle, sectionHeaderStyle, bannerStyle, errorBannerStyle, thStyle, tdStyle } from './shared';

// Mirrors the nav labels in src/lib/mockData.js's navGroups, translated to the
// module keys used by the backend's RolePermissions table (and src/lib/api.js's
// canAccess). Presentation-only, in a fixed display order.
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

const MODULE_KEYS = Object.keys(MODULE_LABELS);

const checkboxCellStyle = { textAlign: 'center' };

export default function AdminRoles({ currentUser }) {
  const isAdmin = currentUser?.role === 'Admin';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [roleCounts, setRoleCounts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    getRolePermissions()
      .then(setRows)
      .catch((err) => setError(err.message || 'Failed to load roles.'))
      .finally(() => setLoading(false));

    getUsers()
      .then((dtos) => {
        const counts = {};
        dtos.forEach((d) => { counts[d.role] = (counts[d.role] || 0) + 1; });
        setRoleCounts(counts);
      })
      .catch(() => {}); // user counts are a nice-to-have, not load-bearing
  }, []);

  const cellFor = (role, module) => rows.find((r) => r.role === role && r.module === module) || { canRead: false, canWrite: false };

  const handleToggle = async (module, field, checked) => {
    if (!isAdmin) return;
    const current = cellFor(selectedRole, module);
    const next = { canRead: current.canRead, canWrite: current.canWrite, [field]: checked };
    if (field === 'canRead' && !checked) next.canWrite = false; // can't write without read
    if (field === 'canWrite' && checked) next.canRead = true; // write implies read

    const key = `${selectedRole}:${module}`;
    const previous = rows;
    const updated = rows.map((r) => (r.role === selectedRole && r.module === module ? { ...r, ...next } : r));

    setSavingKey(key);
    setSaveError('');
    setRows(updated);
    try {
      await updateRolePermission(selectedRole, module, next);
      // Refresh the live cache canAccess()/Sidebar read from, so this change
      // takes effect immediately for anyone currently using the app, not just
      // after their next login.
      setRolePermissionsCache(updated);
    } catch (err) {
      setRows(previous);
      setSaveError(err.message || 'Failed to save.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Roles & Permissions</div>
          <div style={{ fontSize: 12.5, color: '#78908A', marginTop: 2 }}>What each of the 5 fixed roles can see and change.</div>
        </div>
      </div>

      <div style={bannerStyle}>
        {isAdmin
          ? '👁 Changes here take effect immediately for everyone with that role. There are still only 5 fixed roles — this edits what each one can do, not who\'s in it (that\'s on the Users tab).'
          : "👁 You can view what each role can access. Only Admins can change it."}
      </div>

      {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78908A', padding: '8px 0' }}><Spinner size={14} />Loading…</div>}
      {error && <div style={errorBannerStyle}>{error}</div>}

      {!loading && !error && (
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
                    borderBottom: '1px solid #E9F1EF',
                    cursor: 'pointer',
                    fontSize: 13,
                    background: active ? '#E4F0EF' : 'transparent',
                  }}
                >
                  <span style={{ fontWeight: active ? 700 : 500 }}>{USER_ROLE_META[r].label}</span>
                  <span style={{ color: '#78908A', fontSize: 11.5 }}>{count} user{count === 1 ? '' : 's'}</span>
                </div>
              );
            })}
          </div>

          <div style={cardStyle}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #D7E4E1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{USER_ROLE_META[selectedRole].label}</div>
              {selectedRole === 'Admin' && isAdmin && (
                <span style={{ fontSize: 11.5, color: '#8A5A16' }}>Careful — this affects every Admin, including you.</span>
              )}
            </div>
            {saveError && <div style={{ ...errorBannerStyle, margin: '12px 16px 0' }}>{saveError}</div>}
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
                  {MODULE_KEYS.map((m) => {
                    const cell = cellFor(selectedRole, m);
                    const key = `${selectedRole}:${m}`;
                    const rowSaving = savingKey === key;
                    return (
                      <tr key={m}>
                        <td style={tdStyle}>
                          {MODULE_LABELS[m]}
                          {rowSaving && <Spinner size={11} />}
                        </td>
                        <td style={{ ...tdStyle, ...checkboxCellStyle }}>
                          <input
                            type="checkbox"
                            checked={cell.canRead}
                            disabled={!isAdmin || rowSaving}
                            onChange={(e) => handleToggle(m, 'canRead', e.target.checked)}
                            style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                          />
                        </td>
                        <td style={{ ...tdStyle, ...checkboxCellStyle }}>
                          <input
                            type="checkbox"
                            checked={cell.canWrite}
                            disabled={!isAdmin || rowSaving}
                            onChange={(e) => handleToggle(m, 'canWrite', e.target.checked)}
                            style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
