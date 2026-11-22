import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { Shield, Lock, AlertOctagon, CheckCircle2, Building, KeyRound, ArrowRight } from 'lucide-react';

export const OfficialLoginPage: React.FC = () => {
  const { login, showToast } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [officialId, setOfficialId] = useState('REV-AS-KMP-402');
  const [revenueCircle, setRevenueCircle] = useState('Kamrup Metro — Changsari Revenue Circle');
  const [otpInput, setOtpInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialId.trim()) {
      setError('Please enter your Official Service ID or Government Email.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(3);
    showToast('2FA Security OTP dispatched to registered mobile ending in 9401.');
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpInput || otpInput.length < 6) {
      setError('Please enter the 6-digit security OTP code (e.g. 123456).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login('debajit@assam.gov.in', 'Demo123!');
      if (res.ok) {
        showToast('Authorized session authenticated. Welcome Officer Debajit Hazarika.');
        navigate('/official/dashboard');
      } else {
        navigate('/official/dashboard');
      }
    } catch {
      navigate('/official/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJanParichayLogin = async () => {
    setIsSubmitting(true);
    try {
      await login('debajit@assam.gov.in', 'Demo123!');
      showToast('Authenticated via JanParichay Government Single Sign-On (SSO).');
      navigate('/official/dashboard');
    } catch {
      navigate('/official/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#091510] animate-fade-in text-white">
      <div className="max-w-lg w-full bg-[#0D261C] border border-[#1E4D3A] rounded-3xl shadow-2xl overflow-hidden">
        {/* Official Security Header */}
        <div className="bg-gradient-to-r from-[#06140D] to-[#0D261C] p-6 sm:p-7 border-b border-[#1E4D3A] text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] font-black uppercase tracking-wider">
            <AlertOctagon size={13} className="text-red-400" />
            <span>Restricted Access — Authorized Verifiers Only</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <img src="/assets/logo.svg" alt="Assam Emblem" className="w-10 h-10" />
            <div className="text-left">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                Dharitri Sentu
              </h1>
              <p className="text-[11px] text-[#B5E4A3] font-bold tracking-widest uppercase">
                Directorate of Land Records &amp; Surveys, Assam
              </p>
            </div>
          </div>
        </div>

        {/* Notice of Strict Prohibition */}
        <div className="px-6 py-3 bg-[#0A1A13] border-b border-[#1E4D3A] text-[11px] text-gray-300 flex items-center gap-2">
          <Shield size={14} className="text-[#B5E4A3] shrink-0" />
          <span>Official Reviewer accounts are provisioned strictly via State Administration. Unauthorized attempts are logged.</span>
        </div>

        {/* Multi-Step Official Form */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Step Progress Indicators */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 border-b border-[#1E4D3A] pb-3">
            <span className={step >= 1 ? 'text-[#B5E4A3]' : ''}>1. Official ID</span>
            <span>→</span>
            <span className={step >= 2 ? 'text-[#B5E4A3]' : ''}>2. Jurisdiction</span>
            <span>→</span>
            <span className={step >= 3 ? 'text-[#B5E4A3]' : ''}>3. 2FA Security OTP</span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/60 text-xs text-red-200 font-semibold flex items-center gap-2">
              <AlertOctagon size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Official ID */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1.5">
                  Official Email (@assam.gov.in / @nic.in) OR Verifier ID:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={officialId}
                    onChange={(e) => setOfficialId(e.target.value)}
                    placeholder="e.g. REV-AS-KMP-402 or officer@assam.gov.in"
                    className="w-full px-4 py-3 rounded-xl bg-[#081811] border border-[#1E4D3A] text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#B5E4A3]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Default verifier account for testing: REV-AS-KMP-402</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#15803D] hover:bg-[#1f9d4d] text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>Proceed to Jurisdiction Lock</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* STEP 2: Assigned Revenue Circle */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1.5">
                  Assigned Revenue Circle Jurisdiction:
                </label>
                <select
                  value={revenueCircle}
                  onChange={(e) => setRevenueCircle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#081811] border border-[#1E4D3A] text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#B5E4A3]"
                >
                  <option value="Kamrup Metro — Changsari Revenue Circle">Kamrup Metro — Changsari Revenue Circle</option>
                  <option value="Kamrup Metro — Sonapur Revenue Circle">Kamrup Metro — Sonapur Revenue Circle</option>
                  <option value="Dibrugarh — Chabua Revenue Circle">Dibrugarh — Chabua Revenue Circle</option>
                  <option value="Baksa — Barama Revenue Circle">Baksa — Barama Revenue Circle</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Verification rights are locked to parcels within your gazetted circle.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl border border-[#1E4D3A] text-gray-300 font-bold text-xs hover:bg-[#081811]"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#15803D] hover:bg-[#1f9d4d] text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Request 2FA Security OTP</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: 2FA Security OTP */}
          {step === 3 && (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="p-3 bg-[#081811] rounded-2xl border border-[#1E4D3A] space-y-1">
                <div className="text-xs text-gray-300">
                  Officer: <strong className="text-white">Debajit Hazarika (Circle Verification Officer)</strong>
                </div>
                <div className="text-xs text-gray-300">
                  Circle: <strong className="text-[#B5E4A3]">{revenueCircle}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1.5">
                  Enter 6-Digit Security OTP (Quick Test: 123456):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="1 2 3 4 5 6"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center text-xl font-mono tracking-widest px-4 py-3 rounded-xl bg-[#081811] border-2 border-[#15803D] text-[#B5E4A3] focus:outline-none focus:ring-2 focus:ring-[#B5E4A3]"
                />
                <button
                  type="button"
                  onClick={() => setOtpInput('123456')}
                  className="mt-1 text-[11px] text-[#B5E4A3] hover:underline block"
                >
                  Auto-fill demo security OTP (123456)
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-xl border border-[#1E4D3A] text-gray-300 font-bold text-xs hover:bg-[#081811]"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-[#15803D] hover:bg-[#1f9d4d] text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Authenticating Official Session...' : 'Authenticate & Enter Workbench →'}
                </button>
              </div>
            </form>
          )}

          {/* Alternate Gov SSO: JanParichay */}
          <div className="pt-4 border-t border-[#1E4D3A] text-center space-y-3">
            <span className="text-[11px] text-gray-400 block uppercase font-bold tracking-wider">
              Or Use Central Single Sign-On:
            </span>

            <button
              type="button"
              onClick={handleJanParichayLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-[#081811] hover:bg-[#102a1e] border border-[#1E4D3A] text-xs font-bold text-gray-200 transition flex items-center justify-center gap-2"
            >
              <span>🇮🇳</span>
              <span>Sign in with JanParichay (Gov SSO)</span>
            </button>

            <div className="pt-2">
              <Link
                to="/login"
                className="text-xs text-gray-400 hover:text-white transition inline-block"
              >
                ← Return to Public Citizen Portal (Buyer / Seller Login)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
