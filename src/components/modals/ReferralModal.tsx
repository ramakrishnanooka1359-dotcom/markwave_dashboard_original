import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { setReferralModalOpen } from '../../store/slices/uiSlice';
import './ReferralModal.css';

interface ReferralModalProps {
    formData: {
        mobile: string;
        first_name: string;
        last_name: string;
        refered_by_mobile: string;
        refered_by_name: string;
        role: string;
    };
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    onSubmit: (e: React.FormEvent) => void;
}



const ReferralModal: React.FC<ReferralModalProps> = ({
    formData,
    onInputChange,
    onBlur,
    onSubmit
}) => {
    const dispatch = useAppDispatch();
    const showModal = useAppSelector((state: RootState) => state.ui.modals.referral);

    const onClose = () => {
        dispatch(setReferralModalOpen(false));
    };

    return (
        <div className={`referral-modal-container ${showModal ? 'visible' : ''}`}>
            <div className={`referral-overlay ${showModal ? 'visible' : ''}`} onClick={onClose} />

            <div className={`referral-drawer ${showModal ? 'open' : ''}`}>
                {/* Header */}
                <div className="referral-header">
                    <div>
                        <h3>Add New Referral</h3>
                        <p>Create a user to track their orders</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="close-btn"
                    >
                        <span className="close-icon">×</span>
                    </button>
                </div>

                {/* Form Content */}
                <div className="referral-content">
                    <form onSubmit={onSubmit} className="referral-form">
                        <div className="form-group">
                            <label className="form-label">
                                Role
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={onInputChange}
                                required
                                className="form-input"
                            >
                                <option value="Investor">Investor</option>
                                <option value="Admin">Admin</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Employee">Employee</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={onInputChange}
                                required
                                placeholder="Enter mobile number"
                                className="form-input"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="form-col">
                                <label className="form-label">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={onInputChange}
                                    required
                                    placeholder="First Name"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-col">
                                <label className="form-label">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={onInputChange}
                                    required
                                    placeholder="Last Name"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="referrer-section">
                            <h4 className="section-title">Referrer Details</h4>
                            <div className="form-group form-group-mb">
                                <label className="form-label">
                                    Referrer Mobile
                                </label>
                                <input
                                    type="tel"
                                    name="refered_by_mobile"
                                    value={formData.refered_by_mobile}
                                    onChange={onInputChange}
                                    onBlur={onBlur}
                                    required
                                    placeholder="Enter referrer's mobile"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Referrer Name
                                </label>
                                <input
                                    type="text"
                                    name="refered_by_name"
                                    value={formData.refered_by_name}
                                    onChange={onInputChange}
                                    required
                                    placeholder="Enter referrer's name"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-submit"
                            >
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReferralModal;
