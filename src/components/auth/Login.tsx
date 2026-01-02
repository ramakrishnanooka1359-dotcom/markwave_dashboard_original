import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Smartphone, Lock, CheckCircle, AlertCircle } from 'lucide-react'; // Added icons
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

  const [loginSuccess, setLoginSuccess] = useState(false);

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
      setInfo('OTP sent via WhatsApp.');
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

    // Show success animation
    setLoginSuccess(true);

    // Delay actual login to show animation
    setTimeout(() => {
      onLogin(session);
    }, 2500);
  };

  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decor - Reuse for consistency */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000_100%)] z-10"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        </div>

        <div className="relative z-20 text-center animate-fade-in-up">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Welcome to <span className="text-blue-500">AnimalKart</span>
          </h1>
          <p className="text-gray-400 text-lg">Redirecting to Dashboard...</p>

          <div className="absolute bottom-7 left-0 right-0 text-center">
            <p className="text-gray-700 text-xs tracking-widest uppercase">@Powered by Markwave</p>
          </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor - Abstract Circuit Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000_100%)] z-10"></div>
        {/* Simulating the connection nodes from input image */}
        <div className="absolute top-1/4 left-10 w-24 h-[1px] bg-gray-800 opacity-50 hidden md:block"></div>
        <div className="absolute top-1/4 right-10 w-24 h-[1px] bg-gray-800 opacity-50 hidden md:block"></div>
        <div className="absolute bottom-1/4 left-10 w-24 h-[1px] bg-gray-800 opacity-50 hidden md:block"></div>
        <div className="absolute bottom-1/4 right-10 w-24 h-[1px] bg-gray-800 opacity-50 hidden md:block"></div>

        {/* Subtle grid or dots */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>

        {/* Ambient Lighting Glow - Blue Spotlight */}
        {/* Outer soft glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
        {/* Inner core glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[60px] pointer-events-none mix-blend-overlay"></div>
      </div>

      <div className="relative z-20 w-full max-w-md bg-[#0F0F0F] rounded-2xl border border-gray-800 shadow-2xl p-8 backdrop-blur-sm">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-start" style={{ paddingLeft: '25px' }}>
            <img
              src="/login-logo.png"
              alt="Markwave Logo"
              style={{ height: '50px', filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        </div>

        {/* Form Section */}
        <div className="space-y-4">

          {/* Enter Mobile Component */}
          {step === 'enterMobile' && (
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Smartphone className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="block w-full pl-14 pr-3 py-3 border border-gray-700 rounded-lg bg-[#1A1A1A] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Mobile Number"
                />
              </div>
            </div>
          )}

          {/* Enter OTP Component */}
          {step === 'enterOtp' && (
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full pl-14 pr-3 py-3 border border-gray-700 rounded-lg bg-[#1A1A1A] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="6-digit OTP"
                />
              </div>
            </div>
          )}

          {/* Error/Info Messages */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/10 p-2 rounded">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/10 p-2 rounded">
              <CheckCircle size={16} />
              <span>{info}</span>
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={step === 'enterMobile' ? sendOtp : verifyOtp}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              'Please wait...'
            ) : (
              step === 'enterMobile' ? 'Login' : 'Verify Login'
            )}
          </button>

          {/* Back Button for OTP step */}
          {step === 'enterOtp' && (
            <button
              onClick={() => {
                setStep('enterMobile');
                setOtp('');
                setInfo(null);
                setError(null);
              }}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Change Mobile Number
            </button>
          )}

          {/* Powered By Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-xs tracking-wider">@Powered by Markwave</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
