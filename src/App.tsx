import { useAppDispatch } from './store/hooks';
import { setSession as setReduxSession } from './store/slices/authSlice';
import React, { useState, useCallback, useEffect } from 'react';
import HealthStatus from './components/HealthStatus';
import UserTabs from './components/UserTabs/UserTabs';
import Login from './components/auth/Login';

interface Session {
  mobile: string;
  role: string | null;
  name?: string;
  lastLoginTime?: string;
  currentLoginTime?: string;
}


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const saved = window.localStorage.getItem('ak_dashboard_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSession(parsed);
        dispatch(setReduxSession({
          adminMobile: parsed.mobile,
          adminName: parsed.name || 'Admin',
          adminRole: parsed.role || 'Admin',
          lastLogin: parsed.lastLoginTime || 'First Login',
          presentLogin: parsed.currentLoginTime || new Date().toLocaleString(),
        }));
      } catch (e) {
        window.localStorage.removeItem('ak_dashboard_session');
      }
    }
  }, [dispatch]);

  const handleLogin = useCallback((s: Session) => {
    // Determine last login (from previous session or current if new)
    const prevSessionStr = window.localStorage.getItem('ak_dashboard_session');
    let lastLoginTime = new Date().toLocaleString();

    if (prevSessionStr) {
      try {
        const prevSession = JSON.parse(prevSessionStr);
        if (prevSession.currentLoginTime) {
          lastLoginTime = prevSession.currentLoginTime;
        }
      } catch (e) { }
    }

    const newSession = {
      ...s,
      currentLoginTime: new Date().toLocaleString(),
      lastLoginTime: lastLoginTime
    };

    window.localStorage.setItem('ak_dashboard_session', JSON.stringify(newSession));
    setSession(newSession);
    dispatch(setReduxSession({
      adminMobile: newSession.mobile,
      adminName: newSession.name || 'Admin',
      adminRole: newSession.role || 'Admin',
      lastLogin: newSession.lastLoginTime || 'First Login',
      presentLogin: newSession.currentLoginTime || new Date().toLocaleString(),
    }));
  }, [dispatch]);

  const handleLogout = () => {
    window.localStorage.removeItem('ak_dashboard_session');
    setSession(null);
  };

  const isAdmin = session?.role === 'Admin';

  return (
    <div className="App">
      {/* Global Header Removed for Soft UI Theme - Moved to UserTabs */}

      {!session && (
        <Login onLogin={handleLogin} />
      )}

      {session && !isAdmin && (
        <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Access Restricted</h2>
          <p style={{ marginBottom: 0 }}>Only Admin users can access this dashboard. Please login with an Admin mobile.</p>
        </div>
      )}

      {session && isAdmin && (
        <UserTabs
          adminMobile={session.mobile}
          adminName={session.name || 'Admin'}
          adminRole={session.role || 'Admin'}
          lastLogin={session.lastLoginTime || 'First Login'}
          presentLogin={session.currentLoginTime || new Date().toLocaleString()}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
