import React, { useState, useCallback, useEffect } from 'react';
import HealthStatus from './components/HealthStatus';
import UserTabs from './components/UserTabs';
import Login from './components/Login';

interface Session {
  mobile: string;
  role: string | null;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('ak_dashboard_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        window.localStorage.removeItem('ak_dashboard_session');
      }
    }
  }, []);

  const handleLogin = useCallback((s: Session) => {
    window.localStorage.setItem('ak_dashboard_session', JSON.stringify(s));
    setSession(s);
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem('ak_dashboard_session');
    setSession(null);
  };

  const isAdmin = session?.role === 'Admin';

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 className="title">Animalkart Dashboard</h1>
            <HealthStatus />
          </div>
          {session && (
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                Logged in as {session.mobile} ({session.role || 'Unknown'})
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: 4,
                  border: '1px solid #9ca3af',
                  background: 'transparent',
                  color: '#374151',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

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
        <UserTabs adminMobile={session.mobile} />
      )}
    </div>
  );
}

export default App;
