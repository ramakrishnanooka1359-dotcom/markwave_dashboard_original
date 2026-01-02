import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
  const [session, setSession] = useState<Session | null>(() => {
    const saved = window.localStorage.getItem('ak_dashboard_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        window.localStorage.removeItem('ak_dashboard_session');
      }
    }
    return null;
  });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session) {
      dispatch(setReduxSession({
        adminMobile: session.mobile,
        adminName: session.name || 'Admin',
        adminRole: session.role || 'Admin',
        lastLogin: session.lastLoginTime || 'First Login',
        presentLogin: session.currentLoginTime || new Date().toLocaleString(),
      }));
    }
  }, [dispatch, session]);

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

    // Navigate to origin
    const from = (location.state as any)?.from?.pathname || '/dashboard/orders';
    navigate(from, { replace: true });
  }, [dispatch, location.state, navigate]);

  const handleLogout = () => {
    window.localStorage.removeItem('ak_dashboard_session');
    setSession(null);
  };

  const isAdmin = session?.role === 'Admin';

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={
          session ? <Navigate to="/dashboard/orders" replace /> : <Login onLogin={handleLogin} />
        } />

        <Route path="/dashboard/*" element={
          !session ? (
            <Navigate to="/login" replace state={{ from: location }} />
          ) : !isAdmin ? (
            <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '0.75rem' }}>Access Restricted</h2>
              <p style={{ marginBottom: 0 }}>Only Admin users can access this dashboard. Please login with an Admin mobile.</p>
              <button onClick={handleLogout} style={{ marginTop: '1rem', padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
            </div>
          ) : (
            <UserTabs
              adminMobile={session.mobile}
              adminName={session.name || 'Admin'}
              adminRole={session.role || 'Admin'}
              lastLogin={session.lastLoginTime || 'First Login'}
              presentLogin={session.currentLoginTime || new Date().toLocaleString()}
              onLogout={handleLogout}
            />
          )
        } />

        {/* Redirect root to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard/orders" replace />} />
      </Routes>
    </div>
  );
}

export default App;
