import React, { useState, useEffect } from 'react';
import './UserTabs.css';
import BuffaloTree from './BuffaloTree';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

interface UserTabsProps {
  adminMobile: string;
}

// Product Image Carousel Component
const ProductImageCarousel: React.FC<{ images: string[], breed: string, inStock: boolean }> = ({ images, breed, inStock }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
      <img
        src={images[currentImageIndex]}
        alt={`${breed} - Image ${currentImageIndex + 1}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: inStock ? 'none' : 'grayscale(30%)'
        }}
      />

      {/* Navigation arrows - only show if multiple images */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ‹
          </button>
          <button
            onClick={nextImage}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Image indicators - only show if multiple images */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '4px'
        }}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                background: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      )}

      {/* Out of stock overlay */}
      {!inStock && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#dc2626',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          Out of Stock
        </div>
      )}
    </div>
  );
};

const UserTabs: React.FC<UserTabsProps> = ({ adminMobile }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'nonVerified' | 'existing' | 'tree' | 'products'>('orders');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
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

  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingUnitId, setApprovingUnitId] = useState<string | null>(null);
  const [approvalData, setApprovalData] = useState({
    shedNumber: '',
    farmName: '',
    farmLocation: '',
  });


  const [referralUsers, setReferralUsers] = useState<any[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [pendingUnits, setPendingUnits] = useState<any[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferralUsers = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.getReferrals());
        setReferralUsers(response.data.users || []);
      } catch (error) {
        setReferralUsers([]); // Clear users on error
      }
    };

    const fetchPendingUnits = async () => {
      try {
        setOrdersError(null);
        const response = await axios.get(API_ENDPOINTS.getPendingUnits(), {
          headers: {
            'X-Admin-Mobile': adminMobile,
          },
        });
        const units = response.data?.units || [];
        setPendingUnits(units);
      } catch (error: any) {
        console.error('Error fetching pending units:', error);
        const rawDetail = error?.response?.data?.detail;
        let msg: string;
        if (typeof rawDetail === 'string') {
          msg = rawDetail;
        } else if (Array.isArray(rawDetail)) {
          const first = rawDetail[0];
          if (first && typeof first === 'object' && 'msg' in first) {
            msg = String(first.msg);
          } else {
            msg = 'Failed to load orders';
          }
        } else if (rawDetail && typeof rawDetail === 'object' && 'msg' in rawDetail) {
          msg = String(rawDetail.msg);
        } else {
          msg = 'Failed to load orders';
        }
        setOrdersError(msg);
        setPendingUnits([]);
      }
    };

    const fetchExistingCustomers = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.getUsers());
        setExistingCustomers(response.data.users || []);
      } catch (error) {
        setExistingCustomers([]); // Clear users on error
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.getProducts());
        // Extract products array from the response structure
        const productsData = response.data?.products || [];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]); // Clear products on error
      }
    };

    // Only fetch data for the user-related tabs. The 'tree' tab is client-side.
    if (activeTab === 'orders') {
      fetchPendingUnits();
    } else if (activeTab === 'nonVerified') {
      fetchReferralUsers();
    } else if (activeTab === 'existing') {
      fetchExistingCustomers();
    } else if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchPendingUnits = async () => {
    try {
      setOrdersError(null);
      const response = await axios.get(API_ENDPOINTS.getPendingUnits(), {
        headers: {
          'X-Admin-Mobile': adminMobile,
        },
      });
      const units = response.data?.units || [];
      setPendingUnits(units);
    } catch (error: any) {
      console.error('Error fetching pending units:', error);
      const rawDetail = error?.response?.data?.detail;
      let msg: string;
      if (typeof rawDetail === 'string') {
        msg = rawDetail;
      } else if (Array.isArray(rawDetail)) {
        const first = rawDetail[0];
        if (first && typeof first === 'object' && 'msg' in first) {
          msg = String(first.msg);
        } else {
          msg = 'Failed to load orders';
        }
      } else if (rawDetail && typeof rawDetail === 'object' && 'msg' in rawDetail) {
        msg = String(rawDetail.msg);
      } else {
        msg = 'Failed to load orders';
      }
      setOrdersError(msg);
      setPendingUnits([]);
    }
  };

  const handleApproveClick = (unitId: string) => {
    setApprovingUnitId(unitId);
    setApprovalData({
      shedNumber: '',
      farmName: '',
      farmLocation: '',
    });
    setShowApproveModal(true);
  };

  const handleApprovalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApprovalData({ ...approvalData, [name]: value });
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingUnitId) return;

    try {
      await axios.post(API_ENDPOINTS.approveUnit(approvingUnitId), approvalData, {
        headers: {
          'X-Admin-Mobile': adminMobile,
        }
      });
      alert('Order approved successfully!');
      setShowApproveModal(false);
      setApprovingUnitId(null);
      fetchPendingUnits();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order.');
    }
  };

  const handleCloseApproveModal = () => {
    setShowApproveModal(false);
    setApprovingUnitId(null);
  };

  const handleReject = async (unitId: string) => {
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    try {
      await axios.post(API_ENDPOINTS.rejectUnit(unitId), {}, {
        headers: {
          'X-Admin-Mobile': adminMobile,
        }
      });
      alert('Order rejected successfully!');
      fetchPendingUnits();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order.');
    }
  };

  const handleCreateClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const fetchReferrerDetails = async (mobile: string, isEditMode: boolean = false) => {
    if (!mobile || mobile.length < 10) return;

    try {
      const response = await axios.get(`http://localhost:8000/users/${mobile}`);
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
      // Optional: Clear the name field if user not found? 
      // For now, let's keep the user input or allow manual entry if API fails.
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
      const response = await axios.post(API_ENDPOINTS.createUser(), {
        mobile: formData.mobile,
        first_name: formData.first_name,
        last_name: formData.last_name,
        refered_by_mobile: formData.refered_by_mobile,
        refered_by_name: formData.refered_by_name,
        role: formData.role,
      });

      console.log('User response:', response.data);

      // Check if user already exists
      if (response.data.message === 'User already exists') {
        alert('User already exists with this mobile number.');
      } else {
        alert('User created successfully!');
      }

      // Close modal and reset form
      setShowModal(false);
      setFormData({
        mobile: '',
        first_name: '',
        last_name: '',
        refered_by_mobile: '',
        refered_by_name: '',
        role: 'Investor',
      });

      // Refresh the referral users list
      if (activeTab === 'nonVerified') {
        const refreshResponse = await axios.get(API_ENDPOINTS.getReferrals());
        setReferralUsers(refreshResponse.data.users || []);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    }
  };

  const handleRowClick = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      mobile: user.mobile,
      first_name: user.first_name,
      last_name: user.last_name,
      refered_by_mobile: user.refered_by_mobile || '',
      refered_by_name: user.refered_by_name || '',
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:8000/users/${editingUser.mobile}`, {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        refered_by_mobile: editFormData.refered_by_mobile,
        refered_by_name: editFormData.refered_by_name,
      });

      console.log('User updated:', response.data);
      alert('User updated successfully!');

      // Close modal and reset form
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({
        mobile: '',
        first_name: '',
        last_name: '',
        refered_by_mobile: '',
        refered_by_name: '',
      });

      // Refresh the referral users list
      const refreshResponse = await axios.get('http://localhost:8000/users/referrals');
      setReferralUsers(refreshResponse.data.users || []);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  return (
    <div>
      <div className="tabs">
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={activeTab === 'nonVerified' ? 'active' : ''}
          onClick={() => setActiveTab('nonVerified')}
        >
          Referral
        </button>
        <button
          className={activeTab === 'existing' ? 'active' : ''}
          onClick={() => setActiveTab('existing')}
        >
          Verified Users
        </button>
        <button
          className={activeTab === 'tree' ? 'active' : ''}
          onClick={() => setActiveTab('tree')}
        >
          Buffalo Tree
        </button>
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'orders' ? (
          <div>
            <h2>Live Orders (Pending Approval)</h2>
            {ordersError && (
              <div style={{ marginBottom: '0.75rem', color: '#dc2626' }}>{ordersError}</div>
            )}
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Unit ID</th>
                    <th>User Mobile</th>
                    <th>Buffalo ID</th>
                    <th>Units</th>
                    <th>Amount</th>
                    <th>Payment Type</th>
                    <th>Lat</th>
                    <th>Lng</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUnits.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', color: '#888' }}>No pending orders</td>
                    </tr>
                  ) : (
                    pendingUnits.map((entry: any, index: number) => {
                      const unit = entry.unit || {};
                      const tx = entry.transaction || {};
                      return (
                        <tr key={unit.id || index}>
                          <td>{unit.id}</td>
                          <td>{unit.userId}</td>
                          <td>{unit.buffaloId}</td>
                          <td>{unit.numUnits}</td>
                          <td>{tx.amount ?? '-'}</td>
                          <td>{tx.paymentType || '-'}</td>
                          <td>{unit.lat ?? '-'}</td>
                          <td>{unit.lng ?? '-'}</td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: '#fef3c7',
                              color: '#d97706'
                            }}>
                              {unit.paymentStatus || '-'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleApproveClick(unit.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#10b981',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(unit.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#ef4444',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'nonVerified' ? (
          <div>
            <h2>Referrals</h2>
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th>Referred By</th>
                    <th>Referrer Mobile</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {referralUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No users found</td>
                    </tr>
                  ) : (
                    referralUsers.map((user: any, index: number) => (
                      <tr key={index}>
                        <td>{user.first_name} {user.last_name}</td>
                        <td>{user.mobile}</td>
                        <td>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#f3f4f6',
                            fontSize: '11px',
                            fontWeight: '500',
                            color: '#374151',
                            border: '1px solid #e5e7eb'
                          }}>
                            {user.role || 'Investor'}
                          </span>
                        </td>
                        <td>{user.refered_by_name || '-'}</td>
                        <td>{user.refered_by_mobile || '-'}</td>
                        <td>
                          <button
                            onClick={() => handleRowClick(user)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2563eb';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'existing' ? (
          <div>
            <h2>Verified Users</h2>
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>First Name</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Last Name</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Mobile</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Form Filled</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Referred By</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Referrer Mobile</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {existingCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No users found</td>
                    </tr>
                  ) : (
                    existingCustomers.map((user: any, index: number) => (
                      <tr key={index}>
                        <td>{user.first_name || '-'}</td>
                        <td>{user.last_name || '-'}</td>
                        <td>{user.mobile}</td>
                        <td>{user.isFormFilled ? 'Yes' : 'No'}</td>
                        <td>{user.refered_by_name || '-'}</td>
                        <td>{user.refered_by_mobile || '-'}</td>
                        <td>{user.verified ? 'Yes' : 'No'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'tree' ? (
          <div>
            {/* Buffalo Tree tab content */}
            <div style={{ padding: '1rem' }}>
              <h2>Buffalo Family Tree</h2>
              <div className="tree-wrapper">
                {/* Render BuffaloTree component */}
                <div id="buffalo-tree-root">
                  <BuffaloTree />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Products tab content */}
            {activeTab === 'products' && (
              <div style={{ padding: '1rem' }}>
                <h2>Products</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  marginTop: '1rem'
                }}>
                  {products.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: '2rem' }}>
                      No products found
                    </div>
                  ) : (
                    products.map((product: any, index: number) => (
                      <div key={product.id || index} style={{
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb',
                        opacity: product.inStock ? 1 : 0.6,
                        filter: product.inStock ? 'none' : 'grayscale(50%)'
                      }}>
                        {/* Product Image Carousel */}
                        {product.buffalo_images && product.buffalo_images.length > 0 && (
                          <ProductImageCarousel
                            images={product.buffalo_images}
                            breed={product.breed}
                            inStock={product.inStock}
                          />
                        )}

                        {/* Product Details */}
                        <div style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#111' }}>
                              {product.breed}
                            </h3>
                            <span style={{
                              background: product.inStock ? '#10b981' : '#dc2626',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>

                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>
                              <strong>Age:</strong> {product.age} years
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>
                              <strong>Location:</strong> {product.location}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              <strong>ID:</strong> {product.id}
                            </div>
                          </div>

                          <p style={{
                            fontSize: '0.875rem',
                            color: '#374151',
                            lineHeight: '1.4',
                            margin: '0 0 1rem 0',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {product.description}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111' }}>
                                ₹{product.price?.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Insurance: ₹{product.insurance?.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating + Icon at bottom left - only show on Referral tab */}
      {activeTab === 'nonVerified' && (
        <button
          onClick={handleCreateClick}
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '32px',
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

      {showModal && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#9ca3af',
                cursor: 'pointer',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              ×
            </button>
            <h3>Add New Referral</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Role:
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="Investor">Investor</option>
                  <option value="Admin">Admin</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Employee">Employee</option>
                </select>
              </label>
              <label>
                Mobile:
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter mobile number"
                />
              </label>
              <label>
                First Name:
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter first name"
                />
              </label>
              <label>
                Last Name:
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter last name"
                />
              </label>
              <label>
                Referral(Mobile):
                <input
                  type="tel"
                  name="refered_by_mobile"
                  value={formData.refered_by_mobile}
                  onChange={handleInputChange}
                  onBlur={handleReferralMobileBlur}
                  required={formData.role === 'Investor'}
                  placeholder="Enter referrer's mobile"
                />
              </label>
              <label>
                Referral(Name):
                <input
                  type="text"
                  name="refered_by_name"
                  value={formData.refered_by_name}
                  onChange={handleInputChange}
                  required={formData.role === 'Investor'}
                  placeholder="Enter referrer's name"
                />
              </label>
              <button type="submit">Submit</button>
              <button type="button" onClick={handleCloseModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="modal" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCloseEditModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#9ca3af',
                cursor: 'pointer',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              ×
            </button>
            <h3>Edit Referral</h3>
            <form onSubmit={handleEditSubmit}>
              <label>
                Mobile:
                <input
                  type="tel"
                  name="mobile"
                  value={editFormData.mobile}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                  placeholder="Mobile number (cannot be changed)"
                />
              </label>
              <label>
                Role:
                <input
                  type="text"
                  name="role"
                  value={editingUser.role || 'Investor'}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </label>
              <label>
                First Name:
                <input
                  type="text"
                  name="first_name"
                  value={editFormData.first_name}
                  onChange={handleEditInputChange}
                  required
                  placeholder="Enter first name"
                />
              </label>
              <label>
                Last Name:
                <input
                  type="text"
                  name="last_name"
                  value={editFormData.last_name}
                  onChange={handleEditInputChange}
                  required
                  placeholder="Enter last name"
                />
              </label>
              <label>
                Referred By(Mobile):
                <input
                  type="tel"
                  name="refered_by_mobile"
                  value={editFormData.refered_by_mobile}
                  onChange={handleEditInputChange}
                  onBlur={handleEditReferralMobileBlur}
                  required
                  placeholder="Enter referrer's mobile"
                />
              </label>
              <label>
                Referred By(Name):
                <input
                  type="text"
                  name="refered_by_name"
                  value={editFormData.refered_by_name}
                  onChange={handleEditInputChange}
                  required
                  placeholder="Enter referrer's name"
                />
              </label>
              <button type="submit">Update</button>
              <button type="button" onClick={handleCloseEditModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Approve Order Modal */}
      {showApproveModal && (
        <div className="modal" onClick={handleCloseApproveModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCloseApproveModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#9ca3af',
                cursor: 'pointer',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              ×
            </button>
            <h3>Approve Order</h3>
            <form onSubmit={handleApproveSubmit}>
              <label>
                Shed Number:
                <input
                  type="text"
                  name="shedNumber"
                  value={approvalData.shedNumber}
                  onChange={handleApprovalInputChange}
                  required
                  placeholder="Enter Shed Number"
                />
              </label>
              <label>
                Farm Name:
                <input
                  type="text"
                  name="farmName"
                  value={approvalData.farmName}
                  onChange={handleApprovalInputChange}
                  required
                  placeholder="Enter Farm Name"
                />
              </label>
              <label>
                Farm Location:
                <input
                  type="text"
                  name="farmLocation"
                  value={approvalData.farmLocation}
                  onChange={handleApprovalInputChange}
                  required
                  placeholder="Enter Farm Location"
                />
              </label>
              <button type="submit" style={{ backgroundColor: '#10b981' }}>Confirm Approval</button>
              <button type="button" onClick={handleCloseApproveModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTabs;