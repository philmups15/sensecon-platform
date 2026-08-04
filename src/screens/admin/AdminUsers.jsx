import { useEffect, useMemo, useState } from 'react';
import Avatar from '../../components/Avatar';
import Chip from '../../components/Chip';
import Spinner from '../../components/Spinner';
import {
  getUsers,
  toUserView,
  updateUserRole,
  adminCreateUser,
  setUserStatus,
  adminSetPassword,
  sendPasswordReset,
  USER_ROLE_META,
  ALL_ROLES,
} from '../../lib/api';
import {
  selectStyle,
  inputStyle,
  primaryBtnStyle,
  secondaryBtnStyle,
  linkBtnStyle,
  cardStyle,
  sectionHeaderStyle,
  toolbarStyle,
  errorBannerStyle,
  thStyle,
  tdStyle,
  Modal,
  ModalField,
  KebabMenu,
  Pagination,
  ExportMenu,
} from './shared';

const STATUS_OPTIONS = ['Active', 'Disabled'];

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const [savingRoleId, setSavingRoleId] = useState(null);
  const [roleError, setRoleError] = useState('');

  const [creatingOpen, setCreatingOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [newUsername, setNewUsername] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newJobDescription, setNewJobDescription] = useState('');
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdCredential, setCreatedCredential] = useState(null);

  const [viewingUser, setViewingUser] = useState(null);

  const [passwordModal, setPasswordModal] = useState(null); // { user, mode: 'change' | 'reset' }
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState('');

  const [statusModal, setStatusModal] = useState(null); // user
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    getUsers()
      .then((dtos) => setUsers(dtos.map(toUserView)))
      .catch((err) => setError(err.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (!roleFilter || u.roleKey === roleFilter) &&
        (!statusFilter || u.status === statusFilter)
    );
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRoleChange = async (user, newRoleKey) => {
    if (newRoleKey === user.roleKey) return;
    const previous = users;
    setSavingRoleId(user.entityId);
    setRoleError('');
    const meta = USER_ROLE_META[newRoleKey];
    setUsers((prev) => prev.map((u) => (u.entityId === user.entityId ? { ...u, roleKey: newRoleKey, role: meta.label, tone: meta.tone } : u)));
    try {
      await updateUserRole(user.entityId, newRoleKey);
    } catch (err) {
      setUsers(previous);
      setRoleError(err.message || 'Failed to change role.');
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !newEmail.trim()) return;
    setCreating(true);
    setCreateError('');
    const password = generatePassword();
    const profile = {
      username: newUsername.trim() || undefined,
      phoneNumber: newPhone.trim() || undefined,
      address: newAddress.trim() || undefined,
      jobDescription: newJobDescription.trim() || undefined,
    };
    try {
      const result = await adminCreateUser(newEmail.trim(), password, newDisplayName.trim(), profile);
      if (newRole !== 'User') {
        await updateUserRole(result.userId, newRole);
      }
      const meta = USER_ROLE_META[newRole];
      setUsers((prev) => [...prev, {
        entityId: result.userId,
        name: newDisplayName.trim(),
        email: result.email,
        role: meta.label,
        roleKey: newRole,
        tone: meta.tone,
        status: 'Active',
        username: profile.username || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        jobDescription: profile.jobDescription || '',
        hasAvatar: false,
      }]);
      setCreatedCredential({ email: result.email, password });
      setNewDisplayName('');
      setNewEmail('');
      setNewRole('User');
      setNewUsername('');
      setNewPhone('');
      setNewAddress('');
      setNewJobDescription('');
      setMoreDetailsOpen(false);
      setCreatingOpen(false);
      setPage(1);
    } catch (err) {
      setCreateError(err.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const openPasswordModal = (user, mode) => {
    setPasswordModal({ user, mode });
    setPwNew('');
    setPwConfirm('');
    setPwError('');
  };

  const handlePasswordConfirm = async () => {
    if (!passwordModal) return;
    setPwError('');
    if (passwordModal.mode === 'change') {
      if (pwNew.length < 8) {
        setPwError('Password must be at least 8 characters.');
        return;
      }
      if (pwNew !== pwConfirm) {
        setPwError('Passwords do not match.');
        return;
      }
    }
    setPwSubmitting(true);
    try {
      if (passwordModal.mode === 'change') {
        await adminSetPassword(passwordModal.user.entityId, pwNew);
      } else {
        await sendPasswordReset(passwordModal.user.entityId);
      }
      setPasswordModal(null);
    } catch (err) {
      setPwError(err.message || 'Request failed.');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleStatusConfirm = async () => {
    if (!statusModal) return;
    const disabling = statusModal.status === 'Active';
    setStatusSubmitting(true);
    setStatusError('');
    try {
      const result = await setUserStatus(statusModal.entityId, !disabling);
      const newStatus = result.isActive === false ? 'Disabled' : 'Active';
      setUsers((prev) => prev.map((u) => (u.entityId === statusModal.entityId ? { ...u, status: newStatus } : u)));
      setStatusModal(null);
    } catch (err) {
      setStatusError(err.message || 'Request failed.');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const exportRows = filtered.map((u) => ({ Name: u.name, Email: u.email, Role: u.role, Status: u.status }));
  const roleCount = new Set(users.map((u) => u.roleKey)).size;

  return (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Users</div>
          <div style={{ fontSize: 12.5, color: '#9AA0A6', marginTop: 2 }}>
            {users.length} user{users.length === 1 ? '' : 's'}{roleCount ? ` across ${roleCount} role${roleCount === 1 ? '' : 's'}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <ExportMenu rows={exportRows} sheetName="Users" fileBaseName="users" title="Users" />
          <button type="button" onClick={() => { setCreatingOpen(true); setCreateError(''); }} style={primaryBtnStyle}>+ Create user</button>
        </div>
      </div>

      {createdCredential && (
        <div style={{ marginBottom: 14, padding: '9px 11px', background: '#EAF6EE', border: '1px solid #BFE5CB', borderRadius: 8, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <b>{createdCredential.email}</b> created. Temporary password: <span style={{ fontFamily: 'SF Mono, Consolas, monospace' }}>{createdCredential.password}</span>
              <div style={{ color: '#3A7A4E', marginTop: 2 }}>Save this now — it won't be shown again.</div>
            </div>
            <button type="button" onClick={() => setCreatedCredential(null)} style={{ ...linkBtnStyle, color: '#3A7A4E' }}>Dismiss</button>
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={toolbarStyle}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email"
            style={{ ...inputStyle, minWidth: 220 }}
          />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{USER_ROLE_META[r].label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9AA0A6', padding: '8px 0' }}><Spinner size={14} />Loading…</div>}
        {error && <div style={errorBannerStyle}>{error}</div>}
        {roleError && <div style={{ ...errorBannerStyle, marginBottom: 10 }}>{roleError}</div>}

        {!loading && !error && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '26px 0', textAlign: 'center', color: '#9AA0A6', fontSize: 13 }}>No users match your filters.</td>
                    </tr>
                  )}
                  {pageItems.map((u) => {
                    const isSelf = u.entityId === currentUser?.id;
                    return (
                      <tr key={u.entityId}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 11.5, color: '#9AA0A6' }}>{u.email}</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {savingRoleId === u.entityId && <Spinner size={12} />}
                            <select
                              value={u.roleKey}
                              disabled={isSelf || savingRoleId === u.entityId}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              title={isSelf ? "You can't change your own role." : undefined}
                              style={{ ...selectStyle, opacity: isSelf || savingRoleId === u.entityId ? 0.6 : 1 }}
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>{USER_ROLE_META[r].label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <Chip label={u.status} tone={u.status === 'Active' ? 'green' : 'red'} />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <KebabMenu
                            items={[
                              { label: '👤 View details', onClick: () => setViewingUser(u) },
                              { label: '🔑 Change password', disabled: isSelf, onClick: () => openPasswordModal(u, 'change') },
                              { label: '✉️ Reset password', disabled: isSelf, onClick: () => openPasswordModal(u, 'reset') },
                              { divider: true },
                              {
                                label: u.status === 'Active' ? '🚫 Disable user' : '✅ Enable user',
                                danger: u.status === 'Active',
                                disabled: isSelf,
                                onClick: () => { setStatusError(''); setStatusModal(u); },
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            />
          </>
        )}
      </div>

      {creatingOpen && (
        <Modal
          title="Create user"
          onClose={() => { setCreatingOpen(false); setCreateError(''); }}
          footer={
            <>
              <button type="button" onClick={() => { setCreatingOpen(false); setCreateError(''); }} disabled={creating} style={secondaryBtnStyle}>Cancel</button>
              <button type="submit" form="create-user-form" disabled={creating || !newDisplayName.trim() || !newEmail.trim()} style={{ ...primaryBtnStyle, opacity: creating || !newDisplayName.trim() || !newEmail.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {creating && <Spinner size={11} color="#fff" />}Create user
              </button>
            </>
          }
        >
          <form id="create-user-form" onSubmit={handleCreateUser}>
            <ModalField label="Full name">
              <input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder="e.g. Chipo Banda" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} autoFocus />
            </ModalField>
            <ModalField label="Email address">
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="name@company.com" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </ModalField>
            <ModalField label="Assign role">
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{USER_ROLE_META[r].label}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 4 }}>Role determines which pages and actions this user can access.</div>
            </ModalField>

            {!moreDetailsOpen ? (
              <button type="button" onClick={() => setMoreDetailsOpen(true)} style={linkBtnStyle}>+ Add more details (optional)</button>
            ) : (
              <>
                <ModalField label="Username">
                  <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Optional" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                </ModalField>
                <ModalField label="Phone">
                  <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Optional" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                </ModalField>
                <ModalField label="Address">
                  <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Optional" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                </ModalField>
                <ModalField label="Job description">
                  <input value={newJobDescription} onChange={(e) => setNewJobDescription(e.target.value)} placeholder="Optional" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                </ModalField>
              </>
            )}

            {createError && <div style={errorBannerStyle}>{createError}</div>}
          </form>
        </Modal>
      )}

      {viewingUser && (
        <Modal title="User details" onClose={() => setViewingUser(null)} footer={<button type="button" onClick={() => setViewingUser(null)} style={secondaryBtnStyle}>Close</button>}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Avatar userId={viewingUser.entityId} name={viewingUser.name} hasAvatar={viewingUser.hasAvatar} size={64} fontSize={22} />
          </div>
          <ModalField label="Name">{viewingUser.name}</ModalField>
          <ModalField label="Email">{viewingUser.email}</ModalField>
          <ModalField label="Role"><Chip label={viewingUser.role} tone={viewingUser.tone} /></ModalField>
          <ModalField label="Status"><Chip label={viewingUser.status} tone={viewingUser.status === 'Active' ? 'green' : 'red'} /></ModalField>
          {viewingUser.username && <ModalField label="Username">{viewingUser.username}</ModalField>}
          {viewingUser.phoneNumber && <ModalField label="Phone">{viewingUser.phoneNumber}</ModalField>}
          {viewingUser.address && <ModalField label="Address">{viewingUser.address}</ModalField>}
          {viewingUser.jobDescription && <ModalField label="Job description">{viewingUser.jobDescription}</ModalField>}
        </Modal>
      )}

      {passwordModal && (
        <Modal
          title={`${passwordModal.mode === 'change' ? 'Change password' : 'Reset password'} — ${passwordModal.user.name}`}
          onClose={() => setPasswordModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setPasswordModal(null)} disabled={pwSubmitting} style={secondaryBtnStyle}>Cancel</button>
              <button type="button" onClick={handlePasswordConfirm} disabled={pwSubmitting} style={{ ...primaryBtnStyle, opacity: pwSubmitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {pwSubmitting && <Spinner size={11} color="#fff" />}Confirm
              </button>
            </>
          }
        >
          {passwordModal.mode === 'change' ? (
            <>
              <ModalField label="New password">
                <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="Enter new password" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </ModalField>
              <ModalField label="Confirm password">
                <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Confirm new password" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </ModalField>
              <div style={{ fontSize: 11.5, color: '#9AA0A6', marginBottom: 10 }}>Takes effect on their next sign-in — any session they're already signed into stays active until its token expires.</div>
            </>
          ) : (
            <p style={{ fontSize: 13, margin: '0 0 10px' }}>
              Send a password reset link to <b>{passwordModal.user.email}</b>? The link expires in 24 hours.
            </p>
          )}
          {pwError && <div style={errorBannerStyle}>{pwError}</div>}
        </Modal>
      )}

      {statusModal && (
        <Modal
          title={statusModal.status === 'Active' ? 'Disable user' : 'Enable user'}
          onClose={() => setStatusModal(null)}
          footer={
            <>
              <button type="button" onClick={() => setStatusModal(null)} disabled={statusSubmitting} style={secondaryBtnStyle}>Cancel</button>
              <button
                type="button"
                onClick={handleStatusConfirm}
                disabled={statusSubmitting}
                style={{ ...primaryBtnStyle, background: '#B42318', opacity: statusSubmitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {statusSubmitting && <Spinner size={11} color="#fff" />}{statusModal.status === 'Active' ? 'Disable user' : 'Enable user'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13.5, margin: '0 0 10px' }}>
            {statusModal.status === 'Active'
              ? `${statusModal.name} will lose access immediately. They can be re-enabled at any time.`
              : `${statusModal.name} will regain access immediately.`}
          </p>
          {statusError && <div style={errorBannerStyle}>{statusError}</div>}
        </Modal>
      )}
    </div>
  );
}
