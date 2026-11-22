import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { API_MODE, apiRequest } from '../../services/apiClient';

export const LoginPage: React.FC = () => {
  const { login, signup, t, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialMode =
    searchParams.get('mode') === 'signup'
      ? 'signup'
      : searchParams.get('mode') === 'forgot'
      ? 'forgot'
      : 'login';
  const redirectParam = searchParams.get('redirect');

  const [authTab, setAuthTab] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [selectedRoleTab, setSelectedRoleTab] = useState<'buyer' | 'seller'>('buyer');
  const [email, setEmail] = useState('ananya@dharitrisentu.in');
  const [password, setPassword] = useState('Demo123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signup form states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'buyer' | 'seller'>('buyer');
  const [signupDistrict, setSignupDistrict] = useState('Kamrup');

  // Forgot password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'seller') {
      setSelectedRoleTab('seller');
      setSignupRole('seller');
      setEmail('pranabjyoti@dharitrisentu.in');
      setPassword('Demo123!');
    } else if (r === 'buyer') {
      setSelectedRoleTab('buyer');
      setSignupRole('buyer');
      setEmail('ananya@dharitrisentu.in');
      setPassword('Demo123!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const navigateAfterAuth = (role: 'buyer' | 'seller' | 'reviewer') => {
    if (redirectParam) {
      // Only honor redirect if permitted for this role
      if (role === 'buyer' && !redirectParam.startsWith('/dashboard/seller') && !redirectParam.startsWith('/admin') && !redirectParam.startsWith('/official') && !redirectParam.startsWith('/sell/new')) {
        navigate(redirectParam);
        return;
      }
      if (role === 'seller' && !redirectParam.startsWith('/dashboard/buyer') && !redirectParam.startsWith('/admin') && !redirectParam.startsWith('/official') && !redirectParam.startsWith('/price-explorer')) {
        navigate(redirectParam);
        return;
      }
      if (role === 'reviewer' && (redirectParam.startsWith('/admin') || redirectParam.startsWith('/official'))) {
        navigate(redirectParam);
        return;
      }
    }
    if (role === 'buyer') navigate('/dashboard/buyer');
    else if (role === 'seller') navigate('/dashboard/seller');
    else navigate('/official/dashboard');
  };

  const handleSelectRoleTab = (role: 'buyer' | 'seller') => {
    setSelectedRoleTab(role);
    setError(null);
    if (role === 'buyer') {
      setEmail('ananya@dharitrisentu.in');
      setPassword('Demo123!');
    } else {
      setEmail('pranabjyoti@dharitrisentu.in');
      setPassword('Demo123!');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(email, password);
    if (!res.ok || !res.user) {
      setError(res.message);
      return;
    }
    navigateAfterAuth(res.user.role);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (signupPassword && signupPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    const res = await signup(signupName, signupEmail, signupRole, signupDistrict, signupPassword);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    navigateAfterAuth(signupRole);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resetEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    if (API_MODE) {
      try {
        await apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: resetEmail.trim() }) });
        setResetSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Password reset is not configured. No email has been sent.');
      }
      return;
    }
    setError('Password reset email is not configured in demo mode. No email has been sent.');
  };



  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-[#DFD6C3] p-7 sm:p-9 shadow-xl space-y-6">
        <div className="text-center space-y-1.5">
          <img src="/assets/logo.svg" alt="Dharitri Sentu" className="w-12 h-12 mx-auto" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen">
            {t('welcomeBack')}
          </h1>
          <p className="text-xs sm:text-sm text-secondarytext">{t('loginSubtitle')}</p>
        </div>

        {/* Top-Level Auth Mode Tabs Required by Part 3: Log In / Create Account / Forgot Password */}
        <div
          role="tablist"
          aria-label="Authentication Mode"
          className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-warmivory border border-cream"
        >
          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'login'}
            onClick={() => {
              setAuthTab('login');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              authTab === 'login'
                ? 'bg-evergreen text-warmivory shadow-sm'
                : 'text-maintext hover:bg-cream'
            }`}
          >
            🔑 {t('tabLogin')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'signup'}
            onClick={() => {
              setAuthTab('signup');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              authTab === 'signup'
                ? 'bg-[#D97706] text-white shadow-sm'
                : 'text-maintext hover:bg-cream'
            }`}
          >
            📝 {t('tabCreateAccount')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'forgot'}
            onClick={() => {
              setAuthTab('forgot');
              setError(null);
              setResetSent(false);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              authTab === 'forgot'
                ? 'bg-teagreen text-warmivory shadow-sm'
                : 'text-maintext hover:bg-cream'
            }`}
          >
            🔄 {t('tabForgotPassword')}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-semibold"
          >
            {error}
          </div>
        )}

        {/* TAB 1: LOG IN */}
        {authTab === 'login' && (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-secondarytext text-center">
                Select Account Type to Log In
              </div>
              <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-warmivory border border-cream">
                <button
                  type="button"
                  onClick={() => handleSelectRoleTab('buyer')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                    selectedRoleTab === 'buyer'
                      ? 'bg-evergreen text-warmivory shadow-md'
                      : 'text-maintext hover:bg-cream'
                  }`}
                >
                  <span className="text-base">👤</span>
                  <span>Buyer Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRoleTab('seller')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                    selectedRoleTab === 'seller'
                      ? 'bg-[#D97706] text-white shadow-md'
                      : 'text-maintext hover:bg-cream'
                  }`}
                >
                  <span className="text-base">🏡</span>
                  <span>Seller Login</span>
                </button>


              </div>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="p-3 rounded-xl bg-forest/5 border border-forest/15 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-forest flex items-center gap-1">
                  <span>⚡</span> Quick Demo Credentials
                </span>
                <span className="text-[11px] font-mono text-muted-foreground bg-white px-2 py-0.5 rounded border border-border">
                  Password: <strong>Demo123!</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectRoleTab('buyer');
                    setEmail('ananya@dharitrisentu.in');
                    setPassword('Demo123!');
                  }}
                  className={`py-1.5 px-2.5 rounded-lg font-medium border text-left transition ${
                    selectedRoleTab === 'buyer'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-white border-border text-stone-700 hover:bg-emerald-50/50'
                  }`}
                >
                  <span className="block text-[10px] text-muted-foreground uppercase">Buyer</span>
                  <span className="truncate block">ananya@dharitrisentu.in</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectRoleTab('seller');
                    setEmail('pranabjyoti@dharitrisentu.in');
                    setPassword('Demo123!');
                  }}
                  className={`py-1.5 px-2.5 rounded-lg font-medium border text-left transition ${
                    selectedRoleTab === 'seller'
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                      : 'bg-white border-border text-stone-700 hover:bg-amber-50/50'
                  }`}
                >
                  <span className="block text-[10px] text-muted-foreground uppercase">Seller</span>
                  <span className="truncate block">pranabjyoti@dharitrisentu.in</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-maintext mb-1">
                  {selectedRoleTab === 'buyer'
                    ? t('Buyer Email Address')
                    : t('Seller Email Address')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-evergreen"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-maintext">{t('Password')}</label>
                  <button
                    type="button"
                    onClick={() => setAuthTab('forgot')}
                    className="text-[11px] font-semibold text-evergreen hover:underline"
                  >
                    {t('Forgot Password?')}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-evergreen"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-xs font-semibold text-evergreen"
                  >
                    {showPassword ? t('Hide') : t('Show')}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl text-sm font-bold transition shadow-md ${
                  selectedRoleTab === 'seller'
                    ? 'bg-[#D97706] hover:bg-[#B45309] text-white'
                    : 'bg-evergreen hover:bg-teagreen text-warmivory'
                }`}
              >
                {selectedRoleTab === 'buyer'
                  ? t('Log In to Buyer Dashboard →')
                  : t('Log In to Seller Dashboard →')}
              </button>
            </form>

            {/* Quick Demo Credentials Autofill Helper */}
            <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs space-y-2.5">
              <div className="flex items-center justify-between text-[#166534] font-bold">
                <span className="flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Instant Test Credentials</span>
                </span>
                <span className="text-[11px] bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded-md font-mono border border-[#86EFAC]">
                  Password: Demo123!
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoleTab('buyer');
                    setEmail('ananya@dharitrisentu.in');
                    setPassword('Demo123!');
                    setError(null);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-white border border-[#86EFAC] text-[#166534] font-semibold text-xs hover:bg-[#DCFCE7] transition text-left flex flex-col shadow-xs"
                >
                  <span className="font-bold flex items-center gap-1">👤 Buyer</span>
                  <span className="text-[10px] text-[#15803D] font-mono truncate">ananya@dharitrisentu.in</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoleTab('seller');
                    setEmail('pranabjyoti@dharitrisentu.in');
                    setPassword('Demo123!');
                    setError(null);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-white border border-[#FDE68A] text-[#92400E] font-semibold text-xs hover:bg-[#FEF3C7] transition text-left flex flex-col shadow-xs"
                >
                  <span className="font-bold flex items-center gap-1">🏡 Seller</span>
                  <span className="text-[10px] text-[#B45309] font-mono truncate">pranabjyoti@dharitrisentu.in</span>
                </button>
              </div>

              <div className="pt-1.5 border-t border-[#BBF7D0]/60 flex items-center justify-between text-[11px] text-[#166534]">
                <span>Are you a Government Revenue Official?</span>
                <Link to="/official/login" className="font-bold underline hover:text-[#14532D]">
                  Reviewer Portal ↗
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE ACCOUNT */}
        {authTab === 'signup' && (
          <div className="space-y-4">
            <RegistrationForm
              initialRole={selectedRoleTab}
              onSuccess={(role) => navigateAfterAuth(role)}
              switchTab={() => setAuthTab('login')}
            />
          </div>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {authTab === 'forgot' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-palesky/60 border border-mistyblue text-xs text-maintext leading-relaxed">
              Enter your registered Buyer or Seller email address. We will generate a secure password reset link for your account.
            </div>
            {resetSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="font-bold text-sm">✅ Password Reset Instructions Sent</div>
                <p>
                  If an account matches <strong>{resetEmail}</strong>, a time-limited reset token has been dispatched.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className="px-4 py-2 rounded-xl bg-evergreen text-warmivory font-bold"
                >
                  Return to Log In →
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-maintext mb-1">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory text-sm font-bold shadow-md transition"
                >
                  Send Password Reset Link →
                </button>
              </form>
            )}
          </div>
        )}

        {/* Restricted Gateway Link for Official Verifiers */}
        <div className="pt-6 border-t border-[#DFD6C3] text-center">
          <Link
            to="/official-portal"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0D261C] hover:bg-[#15803D] text-[#B5E4A3] text-xs font-bold transition shadow-sm border border-emerald-900/60"
          >
            <span>🏛️</span>
            <span>Authorized Revenue Officer / Legal Reviewer? Access Official Portal →</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export const OfficialLoginPage: React.FC = () => {
  const { login, logout } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [circleCode, setCircleCode] = useState('CIR-NGHY-04 (North Guwahati / Kamrup)');
  const [error, setError] = useState<string | null>(null);

  const handleOfficialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(email, password);
    if (!res.ok || !res.user) {
      setError(res.message);
      return;
    }
    if (res.user.role !== 'reviewer') {
      await logout();
      setError('This account is not provisioned for the restricted reviewer portal.');
      return;
    }
    navigate('/official/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-[#DFD6C3] p-7 sm:p-9 shadow-xl space-y-6">
        <div className="text-center space-y-1.5">
          <span className="inline-block px-3 py-1 rounded-full bg-palesky text-evergreen text-xs font-bold border border-mistyblue">
            🏛️ Authorised Reviewer & Official Portal
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen mt-2">
            Official Reviewer Sign-In
          </h1>
          <p className="text-xs sm:text-sm text-secondarytext">
            Restricted access for authorised land-record reviewers, Circle Office verifiers, and platform moderators. All actions are recorded in the immutable audit log.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
          <strong>🔒 Audit & Governance Notice:</strong> Every listing status change, discrepancy resolution, and LandLocker document inspection performed in this portal is timestamped and logged.
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleOfficialLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-maintext mb-1">
              Official / Reviewer Email ID
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1">
              Assigned Revenue Circle / Jurisdiction
            </label>
            <select
              value={circleCode}
              onChange={(e) => setCircleCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs sm:text-sm font-medium"
            >
              <option value="CIR-NGHY-04 (North Guwahati / Kamrup)">
                CIR-NGHY-04 (North Guwahati / Kamrup)
              </option>
              <option value="CIR-DISP-01 (Dispur / Kamrup Metro)">
                CIR-DISP-01 (Dispur / Kamrup Metro)
              </option>
              <option value="CIR-JRTE-02 (Jorhat East / Cinnamara)">
                CIR-JRTE-02 (Jorhat East / Cinnamara)
              </option>
              <option value="CIR-DBRE-01 (Dibrugarh East)">
                CIR-DBRE-01 (Dibrugarh East)
              </option>
              <option value="CIR-BKSA-02 (Baksa / Protected Belt Review)">
                CIR-BKSA-02 (Baksa / Protected Belt Review)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1">Passcode</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory text-sm font-bold shadow-md transition"
          >
            Sign In to Official Reviewer Console →
          </button>
        </form>

        <div className="pt-3 border-t border-cream text-center text-xs text-secondarytext">
          Looking for the public Buyer or Seller portal?{' '}
          <Link to="/login" className="font-bold text-evergreen hover:underline">
            Return to Standard Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ASSAM_OFFICIAL_DISTRICTS = [
  'Kamrup Metro',
  'Kamrup Rural',
  'Barpeta',
  'Dibrugarh',
  'Jorhat',
  'Nagaon',
  'Cachar',
  'Sonitpur',
  'Lakhimpur',
  'Sivasagar',
  'Tinsukia',
  'Dhubri',
  'Nalbari',
  'Golaghat',
  'Darrang',
  'Morigaon',
  'Bongaigaon',
  'Goalpara',
  'Hailakandi',
  'Karimganj',
  'Chirang',
  'Baksa',
  'Udalguri',
  'Kokrajhar',
  'Majuli',
  'Dima Hasao',
  'West Karbi Anglong',
  'Karbi Anglong',
  'Charaideo',
  'Biswanath',
  'Hojai',
  'South Salmara-Mankachar',
  'Tamulpur',
  'Bajali',
] as const;

export interface RegistrationFormProps {
  initialRole?: 'buyer' | 'seller';
  onSuccess: (role: 'buyer' | 'seller') => void;
  switchTab?: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  initialRole = 'buyer',
  onSuccess,
  switchTab,
}) => {
  const { signup, showToast, t } = useApp();
  const [role, setRole] = useState<'buyer' | 'seller'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [district, setDistrict] = useState<string>('Kamrup Metro');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleSendOtp = () => {
    setError(null);
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit mobile number before requesting an OTP.');
      return;
    }
    setOtpSent(true);
    setOtpCountdown(30);
    setOtp('482910'); // Simulated code pre-filled for smooth testing
    showToast(`Verification code sent to +91 ${cleaned.slice(-10)} (Demo OTP: 482910)`);
  };

  const handleVerifyOtp = () => {
    if (otp.trim().length >= 4) {
      setIsOtpVerified(true);
      setError(null);
      showToast('Mobile number verified successfully! ✓');
    } else {
      setError('Please enter the 6-digit OTP sent to your phone.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!dob) {
      setError('Date of Birth is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!isOtpVerified && !otpSent) {
      setError('Please click "Send OTP" and verify your phone number to proceed.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signup(fullName.trim(), email.trim(), role, district, password);
      if (!res.ok) {
        setError(res.message);
        setIsSubmitting(false);
        return;
      }
      onSuccess(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Role Selection */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-secondarytext text-center">
          Select Account Role
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-warmivory border border-cream">
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
              role === 'buyer'
                ? 'bg-evergreen text-warmivory shadow-md'
                : 'text-maintext hover:bg-cream'
            }`}
          >
            <span className="text-base">👤</span>
            <span>Land Buyer</span>
            <span className="text-[10px] font-normal opacity-90">Explore & Purchase</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('seller')}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
              role === 'seller'
                ? 'bg-[#D97706] text-white shadow-md'
                : 'text-maintext hover:bg-cream'
            }`}
          >
            <span className="text-base">🏡</span>
            <span>Land Seller</span>
            <span className="text-[10px] font-normal opacity-90">List Plots & Deeds</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-semibold"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Full Name */}
        <div>
          <label className="block text-xs font-semibold text-maintext mb-1">
            {t('Full Legal Name')} <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Bhaskar Jyoti Bora"
            className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-evergreen"
          />
        </div>

        {/* 2. Date of Birth */}
        <div>
          <label className="block text-xs font-semibold text-maintext mb-1">
            {t('Date of Birth')} <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            required
            value={dob}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-evergreen"
          />
          <span className="text-[10px] text-secondarytext mt-0.5 block">
            {t('Required for statutory Dharitree citizen record cross-referencing.')}
          </span>
        </div>

        {/* 3. Email Address */}
        <div>
          <label className="block text-xs font-semibold text-maintext mb-1">
            {t('Registered Email Address')} <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bhaskar.bora@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-evergreen"
          />
        </div>

        {/* 4. Phone Number + Send OTP & Verification Box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-maintext">
            {t('Phone Number')} (10 Digits) <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs text-secondarytext font-bold">+91</span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9435012345"
                className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-evergreen"
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpCountdown > 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                otpCountdown > 0
                  ? 'bg-cream text-secondarytext cursor-not-allowed'
                  : 'bg-evergreen hover:bg-teagreen text-warmivory shadow-xs'
              }`}
            >
              {otpCountdown > 0 ? `Resend (${otpCountdown}s)` : otpSent ? t('Resend OTP') : t('Send OTP')}
            </button>
          </div>

          {/* OTP Verification Code input box */}
          {otpSent && (
            <div className="p-3.5 rounded-2xl bg-warmivory border border-cream space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-maintext">
                  {t('Security OTP Code')}
                </span>
                {isOtpVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓ {t('Verified')}
                  </span>
                ) : (
                  <span className="text-[11px] text-teagreen font-medium">
                    Demo OTP: <strong>482910</strong>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="482910"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#CFC5B0] text-sm font-mono font-bold tracking-widest text-center"
                />
                {!isOtpVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                  >
                    {t('Verify OTP')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. Password with toggle show/hide visibility */}
        <div>
          <label className="block text-xs font-semibold text-maintext mb-1">
            {t('Account Password')} <span className="text-red-600">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-evergreen font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-xs font-semibold text-evergreen hover:underline"
            >
              {showPassword ? t('Hide') : t('Show')}
            </button>
          </div>
        </div>

        {/* 6. Primary District in Assam */}
        <div>
          <label className="block text-xs font-semibold text-maintext mb-1">
            {t('Primary Land District in Assam')} <span className="text-red-600">*</span>
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-evergreen"
          >
            {ASSAM_OFFICIAL_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-xl text-sm font-bold transition shadow-md ${
            role === 'seller'
              ? 'bg-[#D97706] hover:bg-[#B45309] text-white'
              : 'bg-evergreen hover:bg-teagreen text-warmivory'
          }`}
        >
          {isSubmitting
            ? t('Submitting...')
            : role === 'buyer'
            ? t('Create Buyer Account')
            : t('Create Seller Account')}
        </button>
      </form>

      {switchTab && (
        <div className="pt-2 text-center text-xs text-secondarytext">
          Already registered?{' '}
          <button
            type="button"
            onClick={switchTab}
            className="font-bold text-evergreen hover:underline"
          >
            Log In to your Account
          </button>
        </div>
      )}
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roleParam = new URLSearchParams(location.search).get('role');
  const initialRole = roleParam === 'seller' ? 'seller' : 'buyer';

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-[#DFD6C3] p-7 sm:p-9 shadow-xl space-y-6">
        <div className="text-center space-y-1.5">
          <img src="/assets/logo.svg" alt="Dharitri Sentu" className="w-12 h-12 mx-auto" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-secondarytext">
            Join Assam's government-verified land exchange platform for transparent buying and selling.
          </p>
        </div>

        <RegistrationForm
          initialRole={initialRole}
          onSuccess={(role) =>
            navigate(role === 'buyer' ? '/dashboard/buyer' : '/dashboard/seller')
          }
          switchTab={() => navigate('/login')}
        />
      </div>
    </div>
  );
};
