import React, { useState, useEffect } from 'react';
import './UserTabs.css';
import BuffaloTree from './BuffaloTree';
import axios from 'axios';

const UserTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nonVerified' | 'existing' | 'tree' | 'products'>('nonVerified');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    mobile: '',
    first_name: '',
    last_name: '',
    refered_by_mobile: '',
    refered_by_name: '',
  });
  const [referralUsers, setReferralUsers] = useState<any[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchReferralUsers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/users/referrals');
        setReferralUsers(response.data.users || []);
      } catch (error) {
        setReferralUsers([]); // Clear users on error
      }
    };

    const fetchExistingCustomers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/users/customers');
        setExistingCustomers(response.data.users || []);
      } catch (error) {
        setExistingCustomers([]); // Clear users on error
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/products');
        // Extract products array from the response structure
        const productsData = response.data?.products || [];
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]); // Clear products on error
      }
    };

    // Only fetch data for the user-related tabs. The 'tree' tab is client-side.
    if (activeTab === 'nonVerified') {
      fetchReferralUsers();
    } else if (activeTab === 'existing') {
      fetchExistingCustomers();
    } else if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  const handleCreateClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/users/', {
        ...formData,
        verified: false,
      });
      console.log('User created:', response.data);
      setShowModal(false);
      // Reset form data
      setFormData({
        mobile: '',
        first_name: '',
        last_name: '',
        refered_by_mobile: '',
        refered_by_name: '',
      });
      // Refresh the referral users list
      if (activeTab === 'nonVerified') {
        const refreshResponse = await axios.get('http://localhost:8000/users/referrals');
        setReferralUsers(refreshResponse.data.users || []);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    }
  };

  return (
    <div>
      <div className="tabs">
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
        {activeTab === 'nonVerified' ? (
          <div>
            <h2>Referrals</h2>
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Referred By</th>
                    <th>Referrer Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {referralUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No users found</td>
                    </tr>
                  ) : (
                    referralUsers.map((user: any, index: number) => (
                      <tr key={index}>
                        <td>{user.first_name} {user.last_name}</td>
                        <td>{user.mobile}</td>
                        <td>{user.refered_by_name || '-'}</td>
                        <td>{user.refered_by_mobile || '-'}</td>
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
                        border: '1px solid #e5e7eb'
                      }}>
                        {/* Product Image */}
                        {product.buffalo_images && product.buffalo_images.length > 0 && (
                          <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                            <img 
                              src={product.buffalo_images[0]} 
                              alt={product.breed}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }}
                            />
                            {!product.inStock && (
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

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New User</h3>
            <form onSubmit={handleSubmit}>
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
                Referred By Mobile:
                <input
                  type="tel"
                  name="refered_by_mobile"
                  value={formData.refered_by_mobile}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter referrer's mobile"
                />
              </label>
              <label>
                Referred By Name:
                <input
                  type="text"
                  name="refered_by_name"
                  value={formData.refered_by_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter referrer's name"
                />
              </label>
              <button type="submit">Submit</button>
              <button type="button" onClick={handleCloseModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTabs;