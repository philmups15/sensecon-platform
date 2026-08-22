import { useEffect, useState } from 'react';
import { isAuthenticated, logout, getCurrentUser, getRolePermissions, setRolePermissionsCache } from './lib/api';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './screens/Dashboard';
import Opportunities from './screens/Opportunities';
import Surveys from './screens/Surveys';
import Design from './screens/Design';
import Bom from './screens/Bom';
import Projects from './screens/Projects';
import Plants from './screens/Plants';
import WorkOrders from './screens/WorkOrders';
import Commissioning from './screens/Commissioning';
import Reports from './screens/Reports';
import Portal from './screens/Portal';
import Admin from './screens/Admin';
import EmptyStates from './screens/EmptyStates';
import Login from './screens/Login';
import ResetPassword from './screens/ResetPassword';
import Profile from './screens/Profile';

const SCREENS = {
  dashboard: Dashboard,
  profile: Profile,
  opportunities: Opportunities,
  surveys: Surveys,
  design: Design,
  bom: Bom,
  projects: Projects,
  plants: Plants,
  workorders: WorkOrders,
  commissioning: Commissioning,
  reports: Reports,
  portal: Portal,
  admin: Admin,
  empty: EmptyStates,
};

function initialScreen() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('resetToken')) return 'reset-password';
  return isAuthenticated() ? 'dashboard' : 'login';
}

export default function App() {
  const [screen, setScreen] = useState(initialScreen);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [permissionsVersion, setPermissionsVersion] = useState(0);

  const loadPermissions = () => {
    getRolePermissions()
      .then((rows) => {
        setRolePermissionsCache(rows);
        setPermissionsVersion((v) => v + 1);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isAuthenticated()) {
      getCurrentUser().then(setCurrentUser).catch(() => {});
      loadPermissions();
    }
  }, []);

  const go = (next) => {
    setScreen(next);
    setTenantOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  const handleSignIn = () => {
    getCurrentUser().then(setCurrentUser).catch(() => {});
    loadPermissions();
    go('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    go('login');
  };

  const handleResetDone = () => {
    window.history.replaceState({}, '', window.location.pathname);
    go('login');
  };

  if (screen === 'reset-password') {
    const token = new URLSearchParams(window.location.search).get('resetToken');
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#F4F6F8', overflow: 'hidden', fontSize: 14 }}>
        <ResetPassword token={token} onDone={handleResetDone} />
      </div>
    );
  }

  if (screen === 'login') {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#F4F6F8', overflow: 'hidden', fontSize: 14 }}>
        <Login onSignIn={handleSignIn} />
      </div>
    );
  }

  const Screen = SCREENS[screen] || Dashboard;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#F4F6F8', overflow: 'hidden', position: 'relative', fontSize: 14 }}>
      <Sidebar screen={screen} onNavigate={go} onLogout={handleLogout} currentUser={currentUser} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          screen={screen}
          tenantOpen={tenantOpen}
          notifOpen={notifOpen}
          profileOpen={profileOpen}
          onToggleTenant={() => { setTenantOpen((v) => !v); setNotifOpen(false); setProfileOpen(false); }}
          onToggleNotif={() => { setNotifOpen((v) => !v); setTenantOpen(false); setProfileOpen(false); }}
          onToggleProfile={() => { setProfileOpen((v) => !v); setTenantOpen(false); setNotifOpen(false); }}
          onNavigate={go}
          onLogout={handleLogout}
        />

        <div style={{ flex: 1, overflow: 'auto', padding: '22px 26px', background: '#F4F6F8' }}>
          <Screen currentUser={currentUser} onUserUpdate={setCurrentUser} onNavigate={go} />
        </div>
      </div>
    </div>
  );
}
