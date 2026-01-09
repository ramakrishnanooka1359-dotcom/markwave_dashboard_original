import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setShowAdminDetails } from '../../store/slices/uiSlice';
import './AdminDetailsModal.css';

interface AdminDetailsModalProps {
    adminName?: string;
    adminMobile?: string;
    adminRole?: string;
    lastLogin?: string;
    presentLogin?: string;
    adminReferralCode?: string;
}

const AdminDetailsModal: React.FC<AdminDetailsModalProps> = (props) => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state: RootState) => state.ui.showAdminDetails);
    const auth = useAppSelector((state: RootState) => state.auth);

    const adminName = props.adminName || auth.adminName;
    const adminMobile = props.adminMobile || auth.adminMobile;
    const adminRole = props.adminRole || auth.adminRole;
    const lastLogin = props.lastLogin || auth.lastLogin;
    const presentLogin = props.presentLogin || auth.presentLogin;
    const adminReferralCode = props.adminReferralCode;

    const onClose = () => {
        dispatch(setShowAdminDetails(false));
    };
    if (!isOpen) return null;

    return (
        <div onClick={onClose} className="admin-modal-overlay">
            <div
                className="admin-popover admin-modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="admin-modal-close-btn"
                >
                    ×
                </button>
                <div className="admin-modal-header">
                    <div className="admin-avatar">
                        {adminName.charAt(0)}
                    </div>
                    <div className="admin-info">
                        <h2 className="admin-name">{adminName}</h2>
                        <p className="admin-mobile">{adminMobile}</p>
                    </div>
                </div>

                <div className="admin-details-card">
                    <div>
                        <div className="admin-detail-label">Role</div>
                        <div className="admin-detail-value">{adminRole}</div>
                    </div>
                    <div>
                        <div className="admin-detail-label">Referral Code</div>
                        <div className="admin-detail-value font-mono tracking-wider">{adminReferralCode || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="admin-detail-label">Last Login</div>
                        <div className="admin-detail-value">{lastLogin || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="admin-detail-label">Present Login</div>
                        <div className="admin-detail-value">{presentLogin || 'N/A'}</div>
                    </div>
                </div>
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>v1.0.1</span>
                </div>
            </div>
        </div>
    );
};

export default AdminDetailsModal;
