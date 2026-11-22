import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { apiRequest, API_MODE } from '../../services/apiClient';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifyingToken, setIsVerifyingToken] = useState(Boolean(token));
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token format / status on page load
  useEffect(() => {
    if (!token) {
      setTokenError('No password reset token was provided in the link. Please request a new link.');
      setIsVerifyingToken(false);
      return;
    }

    if (token.length < 32) {
      setTokenError('The password reset link is invalid or incomplete.');
      setIsVerifyingToken(false);
      return;
    }

    let isMounted = true;
    if (API_MODE) {
      apiRequest<{ valid: boolean; reason?: string }>(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
        .then((res) => {
          if (!isMounted) return;
          if (!res.valid) {
            setTokenError(res.reason || 'This reset link has expired or has already been used.');
          }
        })
        .catch(() => {
          // If network error during check, still let the user attempt submission
        })
        .finally(() => {
          if (isMounted) setIsVerifyingToken(false);
        });
    } else {
      setIsVerifyingToken(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!token) {
      setFormError('Reset token is missing. Please click the link in your email again.');
      return;
    }

    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('The passwords you entered do not match. Please verify and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (API_MODE) {
        await apiRequest<{ ok: boolean; message: string }>('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, newPassword }),
        });
      }
      setIsSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to reset password. Please request a new link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-warmivory">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-[#DFD6C3]">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-decoration-none">
            <img src="/assets/logo.svg" alt="Dharitri Sentu" className="w-10 h-10 object-contain mx-auto" />
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen">
            Dharitri Sentu
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-leafgreen">
            LAND · EVIDENCE · TRUST
          </p>
        </div>

        {/* State 1: Verifying Token */}
        {isVerifyingToken && (
          <div className="text-center py-8 space-y-3">
            <RefreshCw className="w-8 h-8 text-evergreen animate-spin mx-auto" />
            <p className="text-sm font-semibold text-secondarytext">
              Verifying your reset security token...
            </p>
          </div>
        )}

        {/* State 2: Invalid or Missing Token */}
        {!isVerifyingToken && tokenError && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Reset Link Expired or Invalid</span>
              </div>
              <p className="leading-relaxed text-stone-700">
                {tokenError}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                to="/login?mode=forgot"
                className="w-full py-3 px-4 rounded-xl bg-evergreen hover:bg-forest text-warmivory text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Request New Reset Link</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/login"
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Success View */}
        {!isVerifyingToken && !tokenError && isSuccess && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-serif text-evergreen">
                Password Successfully Reset!
              </h2>
              <p className="text-xs text-secondarytext leading-relaxed">
                Your password has been securely updated in Dharitri Sentu. All previous active sessions have been safely logged out.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-xl bg-evergreen hover:bg-forest text-warmivory text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* State 4: Reset Password Form */}
        {!isVerifyingToken && !tokenError && !isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold font-serif text-evergreen">
                Create New Password
              </h2>
              <p className="text-xs text-secondarytext">
                Enter your new password below. Must be at least 8 characters.
              </p>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{formError}</span>
              </div>
            )}

            {/* New Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-maintext">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/50 border border-[#CFC5B0] text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-evergreen"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-maintext">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/50 border border-[#CFC5B0] text-sm pr-11 focus:outline-none focus:ring-2 focus:ring-evergreen"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] space-y-1.5 text-stone-600">
              <div className="flex items-center gap-1.5">
                <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                  {newPassword.length >= 8 ? '✓' : '•'}
                </span>
                <span className={newPassword.length >= 8 ? 'text-emerald-900 font-medium' : ''}>
                  At least 8 characters long
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={confirmPassword && newPassword === confirmPassword ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                  {confirmPassword && newPassword === confirmPassword ? '✓' : '•'}
                </span>
                <span className={confirmPassword && newPassword === confirmPassword ? 'text-emerald-900 font-medium' : ''}>
                  Both passwords match
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full py-3 px-4 rounded-xl bg-evergreen hover:bg-forest disabled:bg-stone-300 disabled:cursor-not-allowed text-warmivory text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Reset Password</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-secondarytext hover:text-evergreen"
              >
                <ArrowLeft size={13} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}

        {/* Security Footer Notice */}
        <div className="border-t border-cream pt-4 text-center">
          <p className="text-[10px] text-stone-500 flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-leafgreen" />
            <span>Assam Land Intelligence & Document Integrity Engine</span>
          </p>
        </div>
      </div>
    </div>
  );
};
