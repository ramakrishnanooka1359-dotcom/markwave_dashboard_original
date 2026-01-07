import React, { useState, useEffect } from 'react';
import './UserTabs.css';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { LayoutDashboard, Users, TreePine, ShoppingBag, LogOut, UserCheck, Menu, X, MapPin, Calculator, MonitorPlay, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
  setActiveTab,
  toggleSidebar,
  setSidebarOpen,
  setShowAdminDetails,
  setReferralModalOpen,
  setEditReferralModal,
  setProofModal,
  setRejectionModal,
} from '../../store/slices/uiSlice';
import {
  fetchPendingUnits,
  approveOrder,
  rejectOrder,
  updateTrackingData,
} from '../../store/slices/ordersSlice';
import {
  fetchReferralUsers,
  fetchExistingCustomers,
  createReferralUser,
  setReferralUsers
} from '../../store/slices/usersSlice';
import { fetchProducts } from '../../store/slices/productsSlice';

// Extracted Components
import ImageNamesModal from '../modals/ImageNamesModal';
import AdminDetailsModal from '../modals/AdminDetailsModal';
import ReferralModal from '../modals/ReferralModal';
import EditReferralModal from '../modals/EditReferralModal';
import RejectionModal from '../modals/RejectionModal';
import LogoutModal from '../modals/LogoutModal';
import OrdersPageSkeleton from '../common/skeletons/OrdersPageSkeleton';
import ProductsPageSkeleton from '../common/skeletons/ProductsPageSkeleton';
import UsersPageSkeleton from '../common/skeletons/UsersPageSkeleton';
import TrackingPageSkeleton from '../common/skeletons/TrackingPageSkeleton';
import BuffaloVizSkeleton from '../common/skeletons/BuffaloVizSkeleton';
import EmiCalculatorSkeleton from '../common/skeletons/EmiCalculatorSkeleton';
import TablePageSkeleton from '../common/TablePageSkeleton';

// Lazy Load Tabs
const OrdersTab = React.lazy(() => import('../sidebar-tabs/OrdersTab'));
const NonVerifiedUsersTab = React.lazy(() => import('../sidebar-tabs/NonVerifiedUsersTab'));
const ExistingCustomersTab = React.lazy(() => import('../sidebar-tabs/ExistingCustomersTab'));
const ProductsTab = React.lazy(() => import('../sidebar-tabs/ProductsTab'));
// const BuffaloTreeTab = React.lazy(() => import('../sidebar-tabs/BuffaloTreeTab'));

const BuffaloVisualizationTab = React.lazy(() => import('../sidebar-tabs/BuffaloVisualizationTab'));
const EmiCalculatorTab = React.lazy(() => import('../sidebar-tabs/EmiCalculatorTab'));
const AcfCalculatorTab = React.lazy(() => import('../sidebar-tabs/AcfCalculatorTab'));


interface UserTabsProps {
  adminMobile: string;
  adminName: string;
  adminRole: string;
  lastLogin?: string;
  presentLogin?: string;
  onLogout: () => void;
}


const UserTabs: React.FC<UserTabsProps> = ({ adminMobile, adminName, adminRole, lastLogin, presentLogin, onLogout }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Local State for Admin Name (dynamic fetch)
  const [displayAdminName, setDisplayAdminName] = useState(adminName);

  // UI State from Redux
  const { isSidebarOpen } = useAppSelector((state: RootState) => state.ui);
  const { referral: showModal, editReferral: { isOpen: showEditModal, user: editingUser } } = useAppSelector((state: RootState) => state.ui.modals);

  // Business Logic State from Redux
  const { referralUsers, existingCustomers } = useAppSelector((state: RootState) => state.users);
  const trackingData = useAppSelector((state: RootState) => state.orders.trackingData);

  // Determine active tab for Sidebar highlighting based on path
  const currentPath = location.pathname;
  let activeTab = 'orders';
  if (currentPath.includes('/referrals')) activeTab = 'nonVerified';
  else if (currentPath.includes('/investors')) activeTab = 'existing';
  else if (currentPath.includes('/products')) activeTab = 'products';
  else if (currentPath.includes('/dashboard/visualizer')) activeTab = 'buffaloViz';
  else if (currentPath.includes('/dashboard/emi')) activeTab = 'emi';
  else if (currentPath.includes('/dashboard/acf')) activeTab = 'acf';
  else if (currentPath.includes('/orders')) activeTab = 'orders';

  const [formData, setFormData] = useState({
    mobile: '',
    first_name: '',
    last_name: '',
    refered_by_mobile: '',
    refered_by_name: '',
    role: 'Investor',
  });

  const [editFormData, setEditFormData] = useState({
    mobile: '',
    first_name: '',
    last_name: '',
    refered_by_mobile: '',
    refered_by_name: '',
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    // Initial state check
    if (window.innerWidth <= 768) {
      dispatch(setSidebarOpen(false));
    } else {
      dispatch(setSidebarOpen(true));
    }

    const handleResize = () => {
      if (window.innerWidth <= 768) {
        dispatch(setSidebarOpen(false));
      }
      // On desktop, we don't force open/close to allow user preference (collapsed vs open)
      // to persist during resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // Fetch Admin Details to get latest name
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.getUserDetails(adminMobile));
        if (response.data && response.data.user) {
          const user = response.data.user;
          let fullName = '';
          if (user.first_name || user.last_name) {
            fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
          } else if (user.name) {
            fullName = user.name;
          }
          if (fullName) {
            setDisplayAdminName(fullName);
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin details:', error);
      }
    };

    if (adminMobile) {
      fetchAdminDetails();
    }
  }, [adminMobile]);

  // Fetch data based on active route
  useEffect(() => {
    if (location.pathname.includes('/referrals')) {
      dispatch(fetchReferralUsers());
    } else if (location.pathname.includes('/investors')) {
      dispatch(fetchExistingCustomers());
      dispatch(fetchReferralUsers());
    } else if (location.pathname.includes('/products')) {
      dispatch(fetchProducts());
    }
  }, [location.pathname, dispatch, adminMobile]);

  const getSortIcon = (key: string, currentSortConfig: any) => {
    if (currentSortConfig.key !== key) return '';
    return currentSortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleApproveClick = async (unitId: string) => {
    try {
      await dispatch(approveOrder({ unitId, adminMobile })).unwrap();
      alert('Order approved successfully!');
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order.');
    }
  };
  const handleReject = (unitId: string) => {
    dispatch(setRejectionModal({ isOpen: true, unitId }));
  };

  const handleCreateClick = () => {
    dispatch(setReferralModalOpen(true));
  };

  const handleCloseModal = () => {
    dispatch(setReferralModalOpen(false));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const fetchReferrerDetails = async (mobile: string, isEditMode: boolean = false) => {
    if (!mobile || mobile.length < 10) return;

    try {
      const response = await axios.get(API_ENDPOINTS.getUserDetails(mobile));
      if (response.data && response.data.user) {
        const user = response.data.user;
        let fullName = '';

        if (user.first_name || user.last_name) {
          fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } else if (user.name) {
          fullName = user.name;
        }

        if (isEditMode) {
          setEditFormData(prev => ({
            ...prev,
            refered_by_name: fullName
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            refered_by_name: fullName
          }));
        }
      }
    } catch (error) {
      console.log('Referrer not found or error fetching details');
    }
  };

  const handleReferralMobileBlur = () => {
    fetchReferrerDetails(formData.refered_by_mobile, false);
  };

  const handleEditReferralMobileBlur = () => {
    fetchReferrerDetails(editFormData.refered_by_mobile, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await dispatch(createReferralUser(formData)).unwrap();

      // Check checks handled in thunk rejection or success
      if (result.message === 'User already exists') {
        alert('User already exists with this mobile number.');
      } else {
        alert('User created successfully!');
      }

      // Close modal and reset form
      dispatch(setReferralModalOpen(false));
      setFormData({
        mobile: '',
        first_name: '',
        last_name: '',
        refered_by_mobile: '',
        refered_by_name: '',
        role: 'Investor',
      });

    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error || 'Error creating user. Please try again.');
    }
  };

  const handleRowClick = (user: any) => {
    setEditFormData({
      mobile: user.mobile,
      first_name: user.first_name,
      last_name: user.last_name,
      refered_by_mobile: user.refered_by_mobile || '',
      refered_by_name: user.refered_by_name || '',
    });
    dispatch(setEditReferralModal({ isOpen: true, user }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.put(API_ENDPOINTS.updateUser(editingUser.mobile), {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        refered_by_mobile: editFormData.refered_by_mobile,
        refered_by_name: editFormData.refered_by_name,
      });

      console.log('User updated:', response.data);
      alert('User updated successfully!');

      // Close modal and reset form
      dispatch(setEditReferralModal({ isOpen: false }));
      setEditFormData({
        mobile: '',
        first_name: '',
        last_name: '',
        refered_by_mobile: '',
        refered_by_name: '',
      });

      // Refresh the referral users list
      const refreshResponse = await axios.get(API_ENDPOINTS.getReferrals());
      dispatch(setReferralUsers(refreshResponse.data.users || []));
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    }
  };

  const handleCloseEditModal = () => {
    dispatch(setEditReferralModal({ isOpen: false }));
  };

  // Helper to format date/time
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const time = now.toLocaleTimeString('en-GB');
    return { date, time };
  };

  // Initialize tracking for a buffalo if not present
  const getTrackingForBuffalo = (orderId: string, buffaloNum: number, initialStatus: string) => {
    const key = `${orderId}-${buffaloNum}`;

    // Lazy initialization logic inside render or handler usually, but here accessing state directly
    // If not exists, return default based on paymentStatus
    if (trackingData[key]) {
      return trackingData[key];
    }

    // Default mapping - Always start at Stage 1
    let stageId = 1; // Order Placed
    const history: any = {
      1: { date: '24-05-2025', time: '10:30:00' } // Mock initial
    };

    // Note: Previous logic to auto-advance based on paymentStatus is removed 
    // to allow full manual "Update" flow from the start.

    // We return a transient object if not in state, but ideally we should set state.
    // However, to avoid infinite loops, we'll return this derived state.
    // The "Update" action will commit it to state.
    return { currentStageId: stageId, history };
  };

  const handleStageUpdate = (orderId: string, buffaloNum: number, nextStageId: number) => {
    const key = `${orderId}-${buffaloNum}`;
    const { date, time } = getCurrentDateTime();
    dispatch(updateTrackingData({ key, stageId: nextStageId, date, time }));
  };

  const handleViewProof = (transaction: any, investor: any) => {
    dispatch(setProofModal({ isOpen: true, data: { ...transaction, name: investor.name } }));
  };

  const handleCloseProofModal = () => {
    dispatch(setProofModal({ isOpen: false }));
  };

  return (
    <div className="app-container">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => dispatch(setSidebarOpen(false))}
      />

      {/* Global Header - Top Full Width */}
      <header className="app-header">
        {/* Left: Mobile Toggle, Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            className="sidebar-toggle-btn"
            onClick={() => dispatch(toggleSidebar())}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '12px 16px',
              height: 'auto',
              width: 'auto',
              filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))'
            }}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <img
            src="/markwave_dashboard/header-logo-new.png"
            alt="Markwave Logo"
            className="header-logo"
            style={{ marginLeft: '0px', filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Center: Title */}
        {/* Centered Title */}
        <div className="header-center-title">
          <h6 className="header-brand-text">
            Animalkart Dashboard
          </h6>
        </div>

        {/* Right Status & Profile */}
        <div className="header-right">
          <div className="status-pill">
            <div className="status-dot-green"></div>
            <span className="status-text">Online</span>
          </div>

          {/* Admin Profile in Header (Right of Online) */}
          <div
            onClick={() => dispatch(setShowAdminDetails(true))}
            className="admin-header-profile"
          >
            <div className="admin-name-container">
              <span className="admin-name-text">{displayAdminName}</span>
            </div>
            <div className="avatar-circle admin-avatar-small">
              {displayAdminName ? displayAdminName.substring(0, 2).toUpperCase() : 'AD'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Body (Row: Sidebar + Content) */}
      <div className="layout-body">
        {/* Sidebar */}
        <nav
          className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}
          onClick={() => dispatch(toggleSidebar())}
        >
          <div className="sidebar-header">
            <button
              className="sidebar-close-btn-mobile"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(setSidebarOpen(false));
              }}
            >
              <X size={20} />
            </button>
            <img
              src="/markwave_dashboard/header-logo-new.png"
              alt="Markwave Logo"
              className="header-logo-sidebar"
              style={{ height: '28px', filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <ul className="sidebar-menu" style={{ marginTop: '10px' }}>
            {/* Sidebar Toggle Button at the top */}


            {/* Dashboard (Orders) */}
            <li>
              <button
                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/orders');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <LayoutDashboard size={18} />
                  <span className="nav-text">Orders</span>
                </div>
              </button>
            </li>



            {/* Referrals */}
            <li>
              <button
                className={`nav-item ${activeTab === 'nonVerified' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/referrals');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Users size={18} />
                  <span className="nav-text">Referrals</span>
                </div>
              </button>
            </li>

            {/* Investors */}
            <li>
              <button
                className={`nav-item ${activeTab === 'existing' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/investors');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <UserCheck size={18} />
                  <span className="nav-text">Investors</span>
                </div>
              </button>
            </li>



            {/* Buffalo Tree */}
            {/* <li>
              <button
                className={`nav-item ${activeTab === 'tree' ? 'active-main' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  // dispatch(setActiveTab('tree'));
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <TreePine size={18} />
                  <span className="nav-text">Buffalo Tree</span>
                </div>
              </button>
            </li> */}

            {/* Products */}
            <li>
              <button
                className={`nav-item ${activeTab === 'products' ? 'active-main' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/products');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <ShoppingBag size={18} />
                  <span className="nav-text">Products</span>
                </div>
              </button>
            </li>

            {/* Buffalo Visualization */}
            <li>
              <button
                className={`nav-item ${activeTab === 'buffaloViz' ? 'active-main' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/dashboard/visualizer');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <MonitorPlay size={18} />
                  <span className="nav-text">Buffalo Vis</span>
                </div>
              </button>
            </li>

            {/* EMI Calculator */}
            <li>
              <button
                className={`nav-item ${activeTab === 'emi' ? 'active-main' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/dashboard/emi');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Calculator size={18} />
                  <span className="nav-text">EMI Calculator</span>
                </div>
              </button>
            </li>

            {/* ACF Calculator */}
            <li>
              <button
                className={`nav-item ${activeTab === 'acf' ? 'active-main' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/dashboard/acf');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Calculator size={18} />
                  <span className="nav-text">ACF Calculator</span>
                </div>
              </button>
            </li>
          </ul>

          <div className="sidebar-footer">
            <button
              className="nav-item logout"
              onClick={(e) => {
                e.stopPropagation();
                setIsLogoutModalOpen(true);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LogOut size={18} />
                <span className="nav-text">Logout</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="orders" element={
              <React.Suspense fallback={<OrdersPageSkeleton />}>
                <OrdersTab
                  handleApproveClick={handleApproveClick}
                  handleReject={handleReject}
                />
              </React.Suspense>
            } />

            <Route path="referrals" element={
              <React.Suspense fallback={<UsersPageSkeleton />}>
                <NonVerifiedUsersTab getSortIcon={getSortIcon} />
              </React.Suspense>
            } />
            <Route path="investors" element={
              <React.Suspense fallback={<UsersPageSkeleton />}>
                <ExistingCustomersTab getSortIcon={getSortIcon} />
              </React.Suspense>
            } />
            <Route path="products" element={
              <React.Suspense fallback={<ProductsPageSkeleton />}>
                <ProductsTab />
              </React.Suspense>
            } />
            <Route path="/dashboard/visualizer" element={
              <React.Suspense fallback={<BuffaloVizSkeleton />}>
                <BuffaloVisualizationTab />
              </React.Suspense>
            } />
            <Route path="/dashboard/emi" element={
              <React.Suspense fallback={<EmiCalculatorSkeleton />}>
                <EmiCalculatorTab />
              </React.Suspense>
            } />
            <Route path="/dashboard/acf" element={
              <React.Suspense fallback={<EmiCalculatorSkeleton />}>
                <AcfCalculatorTab />
              </React.Suspense>
            } />

            {/* Default redirect to orders if just /dashboard is accessed */}
            <Route path="/" element={<Navigate to="orders" replace />} />
            {/* Catch all to orders or 404 */}
            <Route path="*" element={<Navigate to="orders" replace />} />
          </Routes>

          {/* Floating + Icon at bottom left - only show on Referral tab */}
          {activeTab === 'nonVerified' && (
            <button
              onClick={handleCreateClick}
              style={{
                position: 'fixed',
                bottom: '32px',
                right: '32px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              aria-label="Add New Referral"
            >
              +
            </button>
          )}
        </main>
      </div>

      <ReferralModal
        formData={formData}
        onInputChange={handleInputChange}
        onBlur={handleReferralMobileBlur}
        onSubmit={handleSubmit}
      />

      {/* Edit Modal */}
      <EditReferralModal
        editFormData={editFormData}
        onInputChange={handleEditInputChange}
        onBlur={handleEditReferralMobileBlur}
        onSubmit={handleEditSubmit}
      />

      <ImageNamesModal />

      <AdminDetailsModal
        adminName={displayAdminName}
        adminMobile={adminMobile}
        adminRole={adminRole}
        lastLogin={lastLogin}
        presentLogin={presentLogin}
      />

      <RejectionModal />

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
      />

    </div >
  );
};

export default UserTabs;