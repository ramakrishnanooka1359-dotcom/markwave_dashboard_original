import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { setSession as setReduxSession } from './store/slices/authSlice';
import React, { useState, useCallback, useEffect } from 'react';
import HealthStatus from './components/HealthStatus';
import UserTabs from './components/UserTabs/UserTabs';
import Login from './components/auth/Login';

// Tabs
import OrdersTab from './components/sidebar-tabs/OrdersTab';
import UserManagementTab from './components/sidebar-tabs/UserManagementTab';
import ProductsTab from './components/sidebar-tabs/ProductsTab';
import BuffaloVisualizationTab from './components/sidebar-tabs/BuffaloVisualizationTab';
import EmiCalculatorTab from './components/sidebar-tabs/EmiCalculatorTab';
import AcfCalculatorTab from './components/sidebar-tabs/AcfCalculatorTab';

// Public Pages
import ReferralLandingPage from './components/public/ReferralLandingPage';

// Redux
import { approveOrder, rejectOrder } from './store/slices/ordersSlice';

// Privacy
import PrivacyPolicy from './components/PrivacyPolicy';
import Support from './components/Support';

// Skeletons
import OrdersPageSkeleton from './components/common/skeletons/OrdersPageSkeleton';
import UsersPageSkeleton from './components/common/skeletons/UsersPageSkeleton';
import ProductsPageSkeleton from './components/common/skeletons/ProductsPageSkeleton';
import BuffaloVizSkeleton from './components/common/skeletons/BuffaloVizSkeleton';
import EmiCalculatorSkeleton from './components/common/skeletons/EmiCalculatorSkeleton';

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
    const from = (location.state as any)?.from?.pathname || '/orders';
    navigate(from, { replace: true });
  }, [dispatch, location.state, navigate]);

  const handleLogout = () => {
    window.localStorage.removeItem('ak_dashboard_session');
    setSession(null);
  };

  const isAdmin = session?.role === 'Admin';

  const getSortIcon = (key: string, currentSortConfig: any) => {
    if (currentSortConfig.key !== key) return '';
    return currentSortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const renderWithLayout = (component: React.ReactNode) => (
    <UserTabs
      adminMobile={session?.mobile || undefined}
      adminName={session?.name}
      adminRole={session?.role || undefined}
      lastLogin={session?.lastLoginTime}
      presentLogin={session?.currentLoginTime}
      onLogout={handleLogout}
    >
      {component}
    </UserTabs>
  );

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!session) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    if (!isAdmin) {
      return (
        <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Access Restricted</h2>
          <p style={{ marginBottom: 0 }}>Only Admin users can access this dashboard. Please login with an Admin mobile.</p>
          <button onClick={handleLogout} style={{ marginTop: '1rem', padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      );
    }
    return <>{renderWithLayout(children)}</>;
  };

  const ConditionalLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    const shouldShowLayout = location.state?.fromDashboard && session;

    if (shouldShowLayout) {
      return (
        <UserTabs
          adminMobile={session?.mobile || undefined}
          adminName={session?.name}
          adminRole={session?.role || undefined}
          lastLogin={session?.lastLoginTime}
          presentLogin={session?.currentLoginTime}
          onLogout={handleLogout}
        >
          {children}
        </UserTabs>
      );
    }

    return <>{children}</>;
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={
          session ? <Navigate to="/orders" replace /> : <Login onLogin={handleLogin} />
        } />

        {/* Protected Dashboard Routes */}
        <Route path="/orders" element={
          <ProtectedRoute>
            <React.Suspense fallback={<OrdersPageSkeleton />}>
              <OrdersTab
                handleApproveClick={async (id: string) => {
                  const result = await dispatch(approveOrder({ unitId: id, adminMobile: session!.mobile }));
                  if (approveOrder.fulfilled.match(result)) {
                    window.alert('Order Approved Successfully!');
                  }
                }}
                handleReject={async (id: string) => {
                  const result = await dispatch(rejectOrder({ unitId: id, adminMobile: session!.mobile, reason: 'Rejected by admin' }));
                  if (rejectOrder.fulfilled.match(result)) {
                    window.alert('Order Rejected Successfully!');
                  }
                }}
              />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/user-management" element={
          <ProtectedRoute>
            <React.Suspense fallback={<UsersPageSkeleton />}>
              <UserManagementTab getSortIcon={getSortIcon} />
            </React.Suspense>
          </ProtectedRoute>
        } />

        <Route path="/products" element={
          <ProtectedRoute>
            <React.Suspense fallback={<ProductsPageSkeleton />}>
              <ProductsTab />
            </React.Suspense>
          </ProtectedRoute>
        } />

        {/* Publically Accessible Visualization Routes */}
        <Route path="/buffalo-viz" element={
          <ConditionalLayoutWrapper>
            <React.Suspense fallback={<BuffaloVizSkeleton />}>
              <BuffaloVisualizationTab />
            </React.Suspense>
          </ConditionalLayoutWrapper>
        } />

        <Route path="/emi-calculator" element={
          <ConditionalLayoutWrapper>
            <React.Suspense fallback={<EmiCalculatorSkeleton />}>
              <EmiCalculatorTab />
            </React.Suspense>
          </ConditionalLayoutWrapper>
        } />

        <Route path="/acf-calculator" element={
          <ConditionalLayoutWrapper>
            <React.Suspense fallback={<EmiCalculatorSkeleton />}>
              <AcfCalculatorTab />
            </React.Suspense>
          </ConditionalLayoutWrapper>
        } />

        <Route path="/referral-landing" element={
          <ConditionalLayoutWrapper>
            <ReferralLandingPage />
          </ConditionalLayoutWrapper>
        } />

        {/* Backward Compatibility Redirects */}
        <Route path="/dashboard/orders" element={<Navigate to="/orders" replace />} />
        <Route path="/dashboard/user-management" element={<Navigate to="/user-management" replace />} />
        <Route path="/dashboard/products" element={<Navigate to="/products" replace />} />
        <Route path="/dashboard/buffalo-viz" element={<Navigate to="/buffalo-viz" replace />} />
        <Route path="/dashboard/emi-calculator" element={<Navigate to="/emi-calculator" replace />} />
        <Route path="/dashboard/acf-calculator" element={<Navigate to="/acf-calculator" replace />} />
        <Route path="/dashboard/*" element={<Navigate to="/orders" replace />} />

        {/* Privacy Policy - Standalone, no UserTabs, accessible publicly if needed */}
        <Route path="/privacy-policy" element={
          <ConditionalLayoutWrapper>
            <PrivacyPolicy />
          </ConditionalLayoutWrapper>
        } />

        {/* Support Page - Context Aware */}
        <Route path="/support" element={
          <ConditionalLayoutWrapper>
            <Support />
          </ConditionalLayoutWrapper>
        } />

        {/* Default redirect to orders or login */}
        <Route path="/" element={<Navigate to={session ? "/orders" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={session ? "/orders" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

export default App;
