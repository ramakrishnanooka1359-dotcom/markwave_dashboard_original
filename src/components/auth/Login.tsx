import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

interface LoginProps {
  onLogin: (session: { mobile: string; role: string | null }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enterMobile' | 'enterOtp'>('enterMobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [serverOtp, setServerOtp] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('ak_dashboard_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.mobile) {
          onLogin({ mobile: parsed.mobile, role: parsed.role || null });
        }
      } catch {
        // ignore invalid
      }
    }
  }, [onLogin]);

  const sendOtp = async () => {
    if (!mobile || mobile.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const baseUrl = API_CONFIG.getBaseUrl();
      const res = await axios.post(`${baseUrl}/otp/send-whatsapp`, {
        mobile,
        appName: 'animalkart_dashboard',
      });

      if (res.data?.statuscode !== 200) {
        setError(res.data?.message || 'Failed to send OTP');
        return;
      }

      const role = res.data?.user?.role || null;
      const otpFromServer = res.data?.otp || null;
      setUserRole(role);
      setServerOtp(otpFromServer);
      setStep('enterOtp');
      setInfo('OTP sent via WhatsApp. Please check your phone.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to send OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = () => {
    if (!otp || otp.length < 4) {
      setError('Please enter the OTP received on WhatsApp');
      return;
    }

    if (!serverOtp) {
      setError('No OTP found from server. Please request a new OTP.');
      return;
    }

    if (otp !== serverOtp) {
      setError('Invalid OTP. Please try again.');
      return;
    }

    const session = { mobile, role: userRole };
    window.localStorage.setItem('ak_dashboard_session', JSON.stringify(session));
    onLogin(session);
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1.5rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: '1rem' }}>Login with WhatsApp OTP</h2>

      {step === 'enterMobile' && (
        <>
          <label style={{ display: 'block', marginBottom: '0.75rem' }}>
            <span style={{ display: 'block', marginBottom: 4 }}>Mobile Number</span>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter admin mobile"
              style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </label>
          <button
            onClick={sendOtp}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: 4,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Sending OTP...' : 'Send OTP via WhatsApp'}
          </button>
        </>
      )}

      {step === 'enterOtp' && (
        <>
          <label style={{ display: 'block', marginBottom: '0.75rem' }}>
            <span style={{ display: 'block', marginBottom: 4 }}>Enter OTP</span>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </label>
          <button
            onClick={verifyOtp}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: 4,
              border: 'none',
              background: '#16a34a',
              color: '#fff',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              marginBottom: '0.75rem',
            }}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('enterMobile');
              setOtp('');
              setInfo(null);
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              color: '#374151',
              fontSize: '0.9rem',
            }}
          >
            Change Mobile Number
          </button>
        </>
      )}

      {info && (
        <div style={{ marginTop: '0.75rem', color: '#16a34a', fontSize: '0.9rem' }}>{info}</div>
      )}
      {error && (
        <div style={{ marginTop: '0.75rem', color: '#dc2626', fontSize: '0.9rem' }}>{error}</div>
      )}
    </div>
  );
};

export default Login;
