import { useState } from 'react';
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

const SCREENS = {
  dashboard: Dashboard,
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

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [tenantOpen, setTenantOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const go = (next) => {
    setScreen(next);
    setTenantOpen(false);
    setNotifOpen(false);
  };

  if (screen === 'login') {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#F4F6F8', overflow: 'hidden', fontSize: 14 }}>
        <Login onSignIn={() => go('dashboard')} />
      </div>
    );
  }

  const Screen = SCREENS[screen] || Dashboard;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#F4F6F8', overflow: 'hidden', position: 'relative', fontSize: 14 }}>
      <Sidebar screen={screen} onNavigate={go} onLogout={() => go('login')} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          screen={screen}
          tenantOpen={tenantOpen}
          notifOpen={notifOpen}
          onToggleTenant={() => { setTenantOpen((v) => !v); setNotifOpen(false); }}
          onToggleNotif={() => { setNotifOpen((v) => !v); setTenantOpen(false); }}
        />

        <div style={{ flex: 1, overflow: 'auto', padding: '22px 26px', background: '#F4F6F8' }}>
          <Screen />
        </div>
      </div>
    </div>
  );
}
