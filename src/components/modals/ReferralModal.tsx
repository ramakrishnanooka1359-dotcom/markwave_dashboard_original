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
        referral_code?: string;
        role: string;
        is_test?: string;
    };
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    onSubmit: (e: React.FormEvent) => void;
    adminReferralCode?: string;
}



const ReferralModal: React.FC<ReferralModalProps> = (props) => {
    const { formData, onInputChange, onBlur, onSubmit } = props;
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
                        <h3>Add New {formData.role === 'Investor' ? 'Investor' : 'Employee'}</h3>
                        <p>Create a {formData.role === 'Investor' ? 'investor' : 'employee'} account to track their activity</p>
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
                            <div className="form-group">
                                <label className="form-label">
                                    Referral Code
                                </label>
                                <div className="p-3 bg-slate-100 rounded-lg text-slate-700 font-mono tracking-wider font-semibold border border-slate-200">
                                    {props.adminReferralCode || 'N/A'}
                                </div>
                            </div>
                            <div className="form-group mt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_test"
                                        checked={formData.is_test === 'true'}
                                        onChange={onInputChange}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Test Account</span>
                                </label>
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
