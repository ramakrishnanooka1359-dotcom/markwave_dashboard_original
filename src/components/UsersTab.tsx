import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { User } from '../types';
import { Plus } from 'lucide-react';

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    referral_type: 'new_referral',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (mobile: string) => {
    try {
      await userService.verifyUser(mobile);
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error verifying user:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (!formData.name || !formData.mobile) {
        setError('Please fill in all fields');
        setCreating(false);
        return;
      }
      await userService.createUser({
        name: formData.name,
        mobile: formData.mobile,
        referral_type: 'new_referral',
      });
      setShowModal(false);
      setFormData({ name: '', mobile: '', referral_type: 'new_referral' });
      fetchUsers();
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading customers...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: '1.5rem', position: 'relative' }}>
      {/* Floating Plus Icon */}
      <button
        className="floating-create-icon"
        style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 40, background: '#2563eb', color: 'white', border: 'none', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 4px 16px rgba(37,99,235,0.15)' }}
        onClick={() => setShowModal(true)}
        aria-label="Add User"
        id="plus-fab"
      >
        <Plus />
      </button>
      {/* Modal anchored above plus icon */}
      {showModal && (
        <>
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 50 }} onClick={() => setShowModal(false)} />
          <div
            className="modal"
            style={{
              background: 'white',
              borderRadius: '1rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              width: '100%',
              maxWidth: 360,
              position: 'fixed',
              right: 32,
              bottom: 104, // 56px (fab) + 16px gap + 32px bottom
              margin: 0,
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 100
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#6b7280', cursor: 'pointer' }}
              aria-label="Close"
            >
              ×
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#2563eb' }}>Add New Customer</h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              {error && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '0.75rem', borderRadius: 8 }}>{error}</div>}
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '1rem' }}
                required
              />
              <input
                type="tel"
                name="mobile"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={handleInputChange}
                style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '1rem' }}
                required
              />
              <button
                type="submit"
                disabled={creating}
                style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '0.75rem', fontWeight: 600, fontSize: '1rem', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}
              >
                {creating ? 'Adding...' : 'Add User'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersTab;
