
import React from 'react';
import './ReferralLandingPage.css';
import { CheckCircle, ShieldCheck, MapPin } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { createReferralUser } from '../../store/slices/usersSlice';

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Delhi", "Jammu and Kashmir", "Ladakh",
    "Lakshadweep", "Puducherry"
];

const Modal = ({ isOpen, type, message, onClose }: { isOpen: boolean; type: 'success' | 'error'; message: string; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${type === 'success' ? 'bg-green-100' : 'bg-red-100'} mb-4`}>
                    {type === 'success' ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    )}
                </div>
                <h3 className={`text-lg font-bold text-center mb-2 ${type === 'success' ? 'text-gray-900' : 'text-red-900'}`}>
                    {type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className="text-sm text-center text-gray-500 mb-6">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className={`w-full py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all active:scale-95 ${type === 'success'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-200'
                        }`}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

const ReferralLandingPage = () => {
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const referralCode = searchParams.get('referral_code') || '';
    const [loading, setLoading] = React.useState(false);
    const [modalConfig, setModalConfig] = React.useState<{ isOpen: boolean; type: 'success' | 'error'; message: string }>({
        isOpen: false,
        type: 'success',
        message: ''
    });
    const [formData, setFormData] = React.useState({
        name: '',
        mobile: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Referral Code Validation
        if (!referralCode || referralCode.trim() === '') {
            setModalConfig({
                isOpen: true,
                type: 'error',
                message: 'Referral Code is missing. Please ensure you are using a valid referral link.'
            });
            return;
        }

        // Mobile Validation
        if (!/^\d{10}$/.test(formData.mobile)) {
            setModalConfig({
                isOpen: true,
                type: 'error',
                message: 'Please enter a valid 10-digit mobile number.'
            });
            return;
        }

        setLoading(true);

        try {
            // Split name into first and last name for API compatibility
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            const payload = {
                first_name: firstName,
                last_name: lastName,
                mobile: formData.mobile,
                referral_code: referralCode,
                role: 'Investor' // Default role for public signups
            };

            const result = await dispatch(createReferralUser(payload)).unwrap();

            // Explicitly check for "User already exists" message if returned in success payload
            if (result && result.message === 'User already exists') {
                throw new Error('User already exists with this mobile number.');
            }

            setModalConfig({
                isOpen: true,
                type: 'success',
                message: 'User created successfully! Our team will contact you soon.'
            });
            setFormData({ name: '', mobile: '' });
        } catch (error: any) {
            const msg = typeof error === 'string' ? error : (error?.message || 'Failed to register. Please try again.');
            const isExistError = msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('already');

            setModalConfig({
                isOpen: true,
                type: 'error',
                message: isExistError ? 'User already exists with this mobile number.' : msg
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="referral-landing-container">
            {/* Navbar */}
            <nav className="landing-navbar">
                <div className="landing-brand">
                    <span style={{ color: 'white', fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Animalkart</span>
                </div>

                <div className="landing-nav-links hidden md:flex">
                    {/* Links could go here */}
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <MapPin size={16} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Kurnool</span>
                </div>
            </nav>

            {/* Promo Banner moved after header */}
            <div className="promo-banner">
                You have been invited to enjoy sustainable returns with Animalkart! 🥳
            </div>

            {/* Hero Section */}
            <section className="landing-hero">
                {/* Left Content - Image Only */}
                <div className="hero-content">
                    {/* Buffalo Image */}
                    <div className="hero-image-container" style={{ marginTop: 0 }}>
                        <img
                            src="/buffalo-family.jpg"
                            alt="Buffalo Family"
                            className="hero-image"
                        />
                    </div>
                </div>

                {/* Right Form */}
                <div className="hero-form-container">
                    <div className="trial-form-card">
                        <div className="form-header">
                            <h2 className="form-title">Get Started Today</h2>
                            <p className="form-subtitle">
                                Invest in <span className="font-semibold text-slate-800">Sustainable Assets</span>
                            </p>
                            <div className="trust-badge">
                                <ShieldCheck size={16} fill="currentColor" />
                                Trusted by 10k+ farmers & investors
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your name *"
                                className="landing-input"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="tel"
                                name="mobile"
                                placeholder="Enter your mobile number *"
                                className="landing-input"
                                value={formData.mobile}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Referral Code"
                                className="landing-input"
                                value={referralCode}
                                readOnly
                                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-full hover:bg-blue-700 transition mt-6 shadow-lg uppercase tracking-wide mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>

                            <div className="text-center text-xs text-gray-500 mt-2">
                                By clicking submit, you agree to our <Link to="/privacy-policy" className="underline hover:text-blue-600" target="_blank">Terms and Policy</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Whatsapp Float */}
            <div className="whatsapp-float">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.658-.698c1.028.56 2.052.871 3.101.871l.001 0c3.181 0 5.768-2.586 5.768-5.766 0-1.541-.599-2.99-1.687-4.079C15.322 6.771 13.874 6.172 12.031 6.172zm5.723 8.356c-.236.666-1.166 1.258-1.594 1.332-.423.072-.942.203-3.266-.723-2.903-1.157-4.761-4.077-4.907-4.27-.145-.192-1.171-1.558-1.171-2.973 0-1.413.731-2.11 1.026-2.408.236-.239.522-.36.833-.36.145 0 .285.006.406.012.355.019.53.048.746.565.236.566.8 1.956.87 2.099.071.144.119.313.023.504-.095.191-.143.313-.286.481-.143.167-.302.373-.429.504-.144.143-.294.3-.127.585.167.287.742 1.225 1.593 1.983 1.09.972 1.933 1.272 2.208 1.415.275.144.434.12.598-.072.167-.191.716-.838.907-1.125.19-.287.38-.239.641-.144.262.096 1.666.786 1.951.928.286.144.476.216.547.336.072.119.072.694-.164 1.36z"></path>
                </svg>
            </div>

            <Modal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                message={modalConfig.message}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            />
        </div>
    );
};

export default ReferralLandingPage;
