import { useState } from 'react';
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminRoles from './admin/AdminRoles';
import AdminAuditLog from './admin/AdminAuditLog';
import AdminIntegrations from './admin/AdminIntegrations';
import { TabStrip } from './admin/shared';

const TABS = [
  ['overview', 'Overview'],
  ['users', 'Users'],
  ['roles', 'Roles & Permissions'],
  ['audit', 'Audit Log'],
  ['integrations', 'Integrations'],
];

export default function Admin({ currentUser }) {
  const [tab, setTab] = useState('overview');

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <TabStrip tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && <AdminOverview onNavigate={setTab} />}
      {tab === 'users' && <AdminUsers currentUser={currentUser} />}
      {tab === 'roles' && <AdminRoles currentUser={currentUser} />}
      {tab === 'audit' && <AdminAuditLog />}
      {tab === 'integrations' && <AdminIntegrations />}
    </div>
  );
}
