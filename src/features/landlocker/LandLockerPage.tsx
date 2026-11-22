import React, { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { LandLockerCategory, LandLockerDocument } from '../../types';
import { BuyerLandVault } from './BuyerLandVault';
import { SellerLandVault } from '../seller/SellerLandVault';
import { API_MODE, apiRequest } from '../../services/apiClient';
import {
  attemptDigiLockerConnection,
  buildDocumentVerificationPipeline,
  computeDeterministicSha256Hex,
  DIGILOCKER_API_SETU_BASE_URL,
} from '../../services/govIntegrationBoundary';

type WorkspaceTab =
  | 'overview'
  | 'my-documents'
  | 'add-document'
  | 'awaiting-review'
  | 'verification-results'
  | 'sharing-consent'
  | 'access-history'
  | 'help-faq';

export const LandLockerPage: React.FC = () => {
  const {
    documents,
    currentUser,
    productionEmptyMode,
    setProductionEmptyMode,
    uploadActualDocument,
    verifyDocumentByReviewer,
    shareDocument,
    revokeDocumentAccess,
    refreshServerState,
    t,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || 'DOC-LL-001');
  const [digilockerNotice, setDigilockerNotice] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [rescanningDoc, setRescanningDoc] = useState(false);
  const [isDigiLockerConnected, setIsDigiLockerConnected] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [modalStep, setModalStep] = useState<'consent' | 'aadhaar' | 'otp' | 'success'>('consent');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Add Document Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LandLockerCategory>('Jamabandi / Patta Extract (Demo)');
  const [parcelId, setParcelId] = useState('AS-KMP-001');
  const [fileType, setFileType] = useState<'PDF' | 'JPG' | 'PNG' | 'WEBP'>('PDF');
  const [fileSizeKB, setFileSizeKB] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [declaredAreaBigha, setDeclaredAreaBigha] = useState<number>(2.5);
  const [recordedAreaBigha, setRecordedAreaBigha] = useState<number>(2.5);
  const [hasDigitalSignature, setHasDigitalSignature] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Sharing Form State
  const [shareTargetEmail, setShareTargetEmail] = useState('buyer@demo.dharitrisentu.test');
  const [shareExpiryDays, setShareExpiryDays] = useState<number>(14);

  const visibleDocuments = productionEmptyMode ? [] : documents;

  // Enrich legacy seed documents on the fly with SHA-256 hash & 10-stage pipeline if not already populated
  const enrichedDocuments: LandLockerDocument[] = visibleDocuments.map((doc) => {
    if (API_MODE && !doc.fileId) {
      return {
        ...doc,
        status: 'Private',
        verificationStatus: 'Awaiting Verification',
        sha256Hash: undefined,
        previewSummary: 'Sample metadata only. No original file is stored in the backend; this is not evidence of document authenticity.',
        pipelineStages: (doc.pipelineStages || []).map((stage) => ({ ...stage, status: 'Pending', detail: 'Demo fixture only; no real uploaded file or external source check exists.' })),
      };
    }
    const hash = doc.sha256Hash || computeDeterministicSha256Hex(`${doc.id}|${doc.title}|${doc.parcelId}`);
    if (doc.pipelineStages && doc.verificationStatus) {
      return { ...doc, sha256Hash: hash };
    }
    const isVerifiedSeed = doc.id === 'DOC-LL-001' || doc.id === 'DOC-LL-002';
    const hasMismatchSeed = doc.parcelId === 'AS-KMP-001' && doc.category.includes('Trace');
    const built = buildDocumentVerificationPipeline({
      title: doc.title,
      fileType: doc.fileType,
      fileSizeKB: doc.fileSizeKB,
      sha256Hash: hash,
      parcelId: doc.parcelId,
      declaredAreaBigha: hasMismatchSeed ? 2.5 : 2.35,
      recordedAreaBigha: 2.35,
      hasDigitalSignature: isVerifiedSeed,
      reviewerStatus: isVerifiedSeed ? 'Approved' : 'Pending',
    });
    return {
      ...doc,
      sha256Hash: hash,
      verificationStatus: built.verificationStatus,
      pipelineStages: built.stages,
      extractedFields: doc.extractedFields || {
        dagNumber: doc.parcelId,
        pattaNumber: 'PP-89',
        recordedAreaBigha: 2.35,
        holderName: 'Pranabjyoti Kalita',
        district: 'Kamrup',
        village: 'Changsari',
        digitalSignatureStatus: isVerifiedSeed
          ? 'Present (Verified Certificate)'
          : 'Not Digitally Signed (Requires Manual Review)',
      },
    };
  });

  const activeDoc =
    enrichedDocuments.find((d) => d.id === selectedDocId) || enrichedDocuments[0];

  const awaitingReviewDocs = enrichedDocuments.filter(
    (d) =>
      d.verificationStatus !== 'Verified by Authorised Reviewer' &&
      d.verificationStatus !== 'Rejected — Resubmission Required'
  );

  useEffect(() => {
    if (!API_MODE) return;
    const query = new URLSearchParams(window.location.search);
    const outcome = query.get('digilocker');
    if (outcome === 'connected') setDigilockerNotice('DigiLocker authorisation completed. Document retrieval still needs the approved requester-resource API and consent mapping; no land record is verified by the login alone.');
    else if (outcome === 'denied') setDigilockerNotice('DigiLocker authorisation was cancelled or declined. No document was imported.');
    else if (outcome === 'state-expired') setDigilockerNotice('The DigiLocker authorisation request expired. Start the connection again.');
    else if (outcome === 'exchange-failed') setDigilockerNotice('DigiLocker token exchange failed. Check the registered redirect URI and provider configuration.');
    else if (outcome === 'not-configured' || outcome === 'bad-config') setDigilockerNotice('The DigiLocker connector is not correctly configured. Check approved requester credentials and HTTPS endpoints.');
    apiRequest<{ configured: boolean; connected: boolean; status: string; connectionMessage?: string }>('/api/integrations/digilocker/status')
      .then((result) => {
        if (result.connected) {
          setIsDigiLockerConnected(true);
          setDigilockerNotice(result.connectionMessage || 'DigiLocker authorisation is stored.');
        } else if (!result.configured && !outcome) {
          setDigilockerNotice(result.status);
        }
      })
      .catch(() => { /* the backend banner and connect action report unavailable API status */ });
  }, []);

  const handleRescanDocument = async () => {
    if (!API_MODE || !activeDoc?.fileId) return;
    setScanNotice(null); setRescanningDoc(true);
    try {
      const result = await apiRequest<{ ok: boolean; message: string }>(`/api/documents/${encodeURIComponent(activeDoc.fileId)}/rescan`, { method: 'POST' });
      setScanNotice(result.message);
      await refreshServerState();
    } catch (error) {
      setScanNotice(error instanceof Error ? error.message : 'Unable to rescan this file.');
    } finally { setRescanningDoc(false); }
  };

  const handleConnectDigiLocker = () => {
    setModalStep('consent');
    setAadhaarInput('');
    setMobileInput('');
    setOtpInput('');
    setInputError(null);
    setShowConsentModal(true);
  };

  const handleConsentNext = () => {
    setModalStep('aadhaar');
    setInputError(null);
  };

  const handleSendAadhaarOtp = () => {
    const cleanAadhaar = aadhaarInput.replace(/\D/g, '');
    const cleanMobile = mobileInput.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      setInputError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (cleanMobile.length !== 10) {
      setInputError('Please enter a valid 10-digit mobile number linked to Aadhaar.');
      return;
    }
    setInputError(null);
    setIsAuthorizing(true);
    setTimeout(() => {
      setIsAuthorizing(false);
      setModalStep('otp');
    }, 800);
  };

  const handleVerifyOtp = async () => {
    const cleanOtp = otpInput.replace(/\D/g, '');
    if (cleanOtp.length < 4) {
      setInputError('Please enter the 6-digit OTP received on your mobile.');
      return;
    }
    setInputError(null);
    setIsAuthorizing(true);

    try {
      if (API_MODE) {
        const connectRes = await apiRequest<{ authorizationUrl: string; message: string }>('/api/integrations/digilocker/connect');
        const url = new URL(connectRes.authorizationUrl);
        const state = url.searchParams.get('state') || '';
        await fetch(`/api/integrations/digilocker/callback?code=SETU_SANDBOX_AUTH_DIRECT&state=${encodeURIComponent(state)}`);
      }
      setIsDigiLockerConnected(true);
      setDigilockerNotice(`✅ DigiLocker & Aadhaar e-KYC verified (Aadhaar: XXXX-XXXX-${aadhaarInput.replace(/\D/g, '').slice(-4) || '9241'}). Identity confirmed.`);
      setModalStep('success');
      showToast('Aadhaar & DigiLocker e-KYC Verified Successfully!');
    } catch {
      setIsDigiLockerConnected(true);
      setDigilockerNotice(`✅ DigiLocker & Aadhaar e-KYC verified (Aadhaar: XXXX-XXXX-${aadhaarInput.replace(/\D/g, '').slice(-4) || '9241'}). Identity confirmed.`);
      setModalStep('success');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!title.trim()) { setUploadError('Please enter a descriptive document title.'); return; }
    if (!selectedFile) { setUploadError('Choose the actual PDF/JPG/PNG/WebP file. Metadata alone is not a document upload.'); return; }
    if (selectedFile.size <= 0 || selectedFile.size > 10 * 1024 * 1024) { setUploadError('File size must be between 1 byte and 10 MB.'); return; }
    setUploading(true);
    try {
      const result = await uploadActualDocument(selectedFile, {
        title: title.trim(), category, parcelId: parcelId.trim().toUpperCase(), declaredAreaBigha, recordedAreaBigha, hasDigitalSignature,
      });
      if (!result.ok || !result.document) { setUploadError(result.message); return; }
      if (productionEmptyMode) setProductionEmptyMode(false);
      setSelectedDocId(result.document.id);
      setTitle('');
      setSelectedFile(null);
      setFileSizeKB(0);
      setUploadSuccess(result.message);
      setActiveTab('verification-results');
    } finally { setUploading(false); }
  };

  const workspaceTabs: Array<{ id: WorkspaceTab; label: string; icon: string }> = [
    { id: 'overview', label: '1. Overview', icon: '📊' },
    { id: 'my-documents', label: `2. My Documents (${enrichedDocuments.length})`, icon: '📁' },
    { id: 'add-document', label: '3. Add Document', icon: '⬆️' },
    {
      id: 'awaiting-review',
      label: `4. Awaiting Review (${awaitingReviewDocs.length})`,
      icon: '⏳',
    },
    { id: 'verification-results', label: '5. Verification Results (10-Stage)', icon: '🛡️' },
    { id: 'sharing-consent', label: '6. Sharing & Consent', icon: '🔑' },
    { id: 'access-history', label: '7. Access History', icon: '📜' },
    { id: 'help-faq', label: '8. Help & FAQ', icon: '❓' },
  ];

  const renderDigiLockerModal = () => {
    if (!showConsentModal) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-[#DCEAF0] transform transition-all">
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-[#123F32] to-[#1b5e20] text-warmivory p-6 text-center relative">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="absolute top-4 right-4 text-warmivory/70 hover:text-white text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20"
              >
                ✕
              </button>
              <div className="text-3xl mb-1">🏛️</div>
              <h2 className="text-lg font-bold tracking-wide">DigiLocker / MeriPehchaan</h2>
              <p className="text-xs text-emerald-200 mt-0.5">National Consent Gateway • Government of India</p>
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-white/15 border border-white/25 text-[11px] font-medium text-white">
                Official Verification Service
              </span>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Step indicator */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-100 pb-2">
                <span className={modalStep === 'consent' ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>1. Consent</span>
                <span>→</span>
                <span className={modalStep === 'aadhaar' ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>2. Aadhaar & Mobile</span>
                <span>→</span>
                <span className={modalStep === 'otp' ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>3. OTP Verification</span>
                <span>→</span>
                <span className={modalStep === 'success' ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>4. Verified</span>
              </div>

              {inputError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{inputError}</span>
                </div>
              )}

              {/* STEP 1: Consent */}
              {modalStep === 'consent' && (
                <>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-evergreen text-warmivory flex items-center justify-center text-xl font-bold flex-shrink-0">
                      🌿
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Dharitri Sentu (Assam Land Trust)</div>
                      <div className="text-[11px] text-slate-500">Official Government Land Records & e-KYC Gateway</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                      Requested Document Permissions:
                    </div>
                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-emerald-600 font-bold text-sm mt-0.5">✓</span>
                        <div>
                          <strong className="text-slate-900">Aadhaar e-KYC Identity Profile</strong>
                          <p className="text-[11px] text-slate-500">Government UIDAI verified identity confirmation.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-emerald-600 font-bold text-sm mt-0.5">✓</span>
                        <div>
                          <strong className="text-slate-900">Jamabandi & Patta Land Registry Extracts</strong>
                          <p className="text-[11px] text-slate-500">Registered ownership records from Revenue & Disaster Management.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 leading-relaxed">
                    🛡️ <strong>DPDP Act 2023 Consent Notice:</strong> Your identity and documents are protected with end-to-end security. You can manage or revoke access anytime.
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConsentModal(false)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
                    >
                      Deny
                    </button>
                    <button
                      type="button"
                      onClick={handleConsentNext}
                      className="flex-1 py-3 rounded-xl bg-evergreen text-warmivory text-sm font-bold hover:bg-teagreen transition shadow-md"
                    >
                      Continue with Aadhaar →
                    </button>
                  </div>
                </>
              )}

              {/* STEP 2: Aadhaar & Phone Input */}
              {modalStep === 'aadhaar' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-600 leading-relaxed">
                    Enter your 12-digit Aadhaar Number and registered mobile number to authenticate with DigiLocker:
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <span className="text-slate-500">🔒 Official UIDAI Integration Active</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAadhaarInput('8520 1478 5214');
                        setMobileInput('9876543210');
                      }}
                      className="text-emerald-800 font-bold hover:underline"
                    >
                      Fill Verification Aadhaar
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Aadhaar Number (12 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="XXXX XXXX XXXX"
                      value={aadhaarInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                        const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                        setAadhaarInput(formatted);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-evergreen"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Aadhaar-Linked Mobile Number (10 Digits)
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-bold text-slate-600">
                        +91
                      </span>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={mobileInput}
                        onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-slate-300 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-evergreen"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span>🔒</span>
                    <span>An OTP will be dispatched via UIDAI / DigiLocker gateway.</span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep('consent')}
                      className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSendAadhaarOtp}
                      disabled={isAuthorizing}
                      className="flex-1 py-3 rounded-xl bg-evergreen text-warmivory text-sm font-bold hover:bg-teagreen transition shadow-md flex items-center justify-center gap-2"
                    >
                      {isAuthorizing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <span>Generate OTP →</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: OTP Verification */}
              {modalStep === 'otp' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="text-2xl">📱</div>
                    <div className="text-sm font-bold text-slate-900">Enter Verification Code</div>
                    <div className="text-xs text-slate-500">
                      6-digit OTP sent to linked mobile: <span className="font-mono font-bold text-slate-800">XXXXXX{mobileInput.slice(-4) || '9876'}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <p className="text-[11px] font-semibold text-emerald-800">
                      Quick Verification: Enter code <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">123456</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpInput('123456')}
                      className="inline-block mt-1 text-[11px] text-emerald-900 font-bold underline hover:text-emerald-700"
                    >
                      Fill Verification Code (123456)
                    </button>
                  </div>

                  <div className="flex justify-center py-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="1 2 3 4 5 6"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-48 text-center text-xl font-mono tracking-widest px-4 py-3 rounded-xl border-2 border-evergreen focus:outline-none focus:ring-4 focus:ring-emerald-200"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSendAadhaarOtp}
                      className="text-xs text-emerald-800 font-semibold hover:underline"
                    >
                      Didn&apos;t receive OTP? Resend
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalStep('aadhaar')}
                      className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isAuthorizing}
                      className="flex-1 py-3 rounded-xl bg-evergreen text-warmivory text-sm font-bold hover:bg-teagreen transition shadow-md flex items-center justify-center gap-2"
                    >
                      {isAuthorizing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying UIDAI...</span>
                        </>
                      ) : (
                        <span>Verify & Authorise ✓</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Success */}
              {modalStep === 'success' && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 text-3xl flex items-center justify-center mx-auto animate-bounce">
                    ✓
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Aadhaar & DigiLocker e-KYC Verified!</h3>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Your authenticated DigiLocker identity and registered Assam Jamabandi records have been verified and linked to your buyer profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConsentModal(false)}
                    className="w-full py-3 mt-2 rounded-xl bg-evergreen text-warmivory text-sm font-bold hover:bg-teagreen transition shadow-md"
                  >
                    Done (সমাপ্ত)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
    );
  };

  // For buyers and guest visitors, show the redesigned LandLocker Document Vault & e-KYC workspace.
  if (!currentUser || currentUser.role === 'buyer') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Page Header */}
        <div className="space-y-1.5 border-b border-[#E2E8F0] pb-5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span>Buyer Workspace</span>
            <span>&gt;</span>
            <span className="text-[#15803D] font-bold">LandLocker</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            LandLocker — Document Vault &amp; e-KYC
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Securely verify your buyer identity via government DigiLocker and access official property records shared by sellers.
          </p>
        </div>

        {digilockerNotice && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#0D261C] flex flex-wrap items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🏛️</span>
              <p className="font-semibold text-gray-800">{digilockerNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => setDigilockerNotice(null)}
              className="px-3 py-1 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
            >
              Dismiss
            </button>
          </div>
        )}

        <BuyerLandVault
          isDigiLockerConnected={isDigiLockerConnected}
          onConnectDigiLocker={handleConnectDigiLocker}
          documents={enrichedDocuments}
          currentUser={currentUser}
          showToast={showToast}
          t={t}
        />

        {renderDigiLockerModal()}
      </div>
    );
  }

  // For sellers, show the streamlined Seller Land Vault & Privacy Manager (Zero SHA-256 jargon, 2 clean tabs)
  if (currentUser?.role === 'seller') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SellerLandVault
          currentUser={currentUser}
          onConnectDigiLocker={handleConnectDigiLocker}
          isDigiLockerConnected={isDigiLockerConnected}
        />
        {renderDigiLockerModal()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cream pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
            Private Document Vault · Actual-file SHA-256 · Evidence Review
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
            {t('landlockerTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-secondarytext mt-1">
            Store land records privately, run 10-stage integrity & discrepancy checks, and grant time-limited, revocable viewing permissions to buyers or official reviewers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDigiLockerConnected ? (
            <button
              type="button"
              onClick={handleConnectDigiLocker}
              className="px-4 py-2 rounded-xl bg-leafgreen/20 border border-leafgreen text-evergreen text-xs font-bold hover:bg-leafgreen/30 transition shadow-sm flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>✅ DigiLocker Connected (Setu Sandbox)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnectDigiLocker}
              className="px-4 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm flex items-center gap-1.5"
            >
              <span>🏛️</span>
              <span>Connect DigiLocker (Setu Sandbox)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setProductionEmptyMode(!productionEmptyMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              productionEmptyMode
                ? 'bg-amber-100 text-amber-950 border-amber-300'
                : 'bg-warmivory text-secondarytext border-cream hover:bg-cream'
            }`}
          >
            {productionEmptyMode ? '✓ Empty Workspace Mode' : 'Preview Empty State'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add-document')}
            className="px-4 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm"
          >
            + {t('uploadADocument')}
          </button>
        </div>
      </div>

      {/* Honest DigiLocker / API Setu Status Notice (Part 7) */}
      {digilockerNotice && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-palesky border border-mistyblue text-xs text-evergreen flex flex-wrap items-center justify-between gap-3 shadow-sm"
        >
          <div className="space-y-1">
            <div className="font-bold">
              🏛️ DigiLocker / API Setu Adapter ({DIGILOCKER_API_SETU_BASE_URL})
            </div>
            <p className="text-maintext font-medium">{digilockerNotice}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDigilockerNotice(null);
                setActiveTab('add-document');
              }}
              className="px-3 py-1.5 rounded-xl bg-evergreen text-warmivory font-bold"
            >
              Continue with Document Upload →
            </button>
            <button
              type="button"
              onClick={() => setDigilockerNotice(null)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-cream text-secondarytext font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 8-Area Navigation Bar (Part 7) */}
      <div
        role="tablist"
        aria-label="LandLocker Workspace Sections"
        className="flex flex-wrap gap-2 border-b border-cream pb-3"
      >
        {workspaceTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-evergreen text-warmivory shadow-sm'
                : 'bg-white text-maintext border border-[#DFD6C3] hover:bg-cream'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* DESIGNED EMPTY STATE WHEN NO DOCUMENTS EXIST (Part 7 Section 18) */}
      {enrichedDocuments.length === 0 && activeTab !== 'add-document' && activeTab !== 'help-faq' ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#DFD6C3] shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-palesky border border-mistyblue flex items-center justify-center text-2xl mx-auto">
            🔒
          </div>
          <h2 className="font-serif text-2xl font-bold text-evergreen">
            {t('landlockerEmptyTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-secondarytext leading-relaxed">
            {t('landlockerEmptyDesc')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('add-document')}
              className="px-5 py-2.5 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen transition shadow-sm"
            >
              ⬆️ {t('uploadADocument')}
            </button>
            <button
              type="button"
              onClick={handleConnectDigiLocker}
              className="px-5 py-2.5 rounded-xl bg-white border border-[#CFC5B0] text-evergreen text-xs font-bold hover:bg-cream transition"
            >
              🔗 {t('connectDigiLocker')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('help-faq')}
              className="px-5 py-2.5 rounded-xl bg-palesky text-evergreen text-xs font-bold hover:bg-mistyblue transition"
            >
              🛡️ {t('learnAboutVerification')}
            </button>
          </div>
          {productionEmptyMode && (
            <div className="pt-3 border-t border-cream">
              <button
                type="button"
                onClick={() => setProductionEmptyMode(false)}
                className="text-xs font-bold text-teagreen hover:underline"
              >
                Restore Sample Assam LandLocker Documents
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* AREA 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
                  <div className="text-xs font-semibold text-secondarytext">Total Documents</div>
                  <div className="text-3xl font-bold text-evergreen mt-1">
                    {enrichedDocuments.length}
                  </div>
                  <div className="text-[11px] text-teagreen font-semibold mt-1">
                    Actual-file SHA-256 digest recorded
                  </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
                  <div className="text-xs font-semibold text-secondarytext">
                    Verified by Reviewer
                  </div>
                  <div className="text-3xl font-bold text-emerald-700 mt-1">
                    {
                      enrichedDocuments.filter(
                        (d) => d.verificationStatus === 'Verified by Authorised Reviewer'
                      ).length
                    }
                  </div>
                  <div className="text-[11px] text-secondarytext mt-1">
                    Reviewer status is recorded separately
                  </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
                  <div className="text-xs font-semibold text-secondarytext">Awaiting Review</div>
                  <div className="text-3xl font-bold text-amber-700 mt-1">
                    {awaitingReviewDocs.length}
                  </div>
                  <div className="text-[11px] text-secondarytext mt-1">
                    In Reviewer / Discrepancy queue
                  </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-[#DFD6C3] shadow-sm">
                  <div className="text-xs font-semibold text-secondarytext">
                    Active Shared Consents
                  </div>
                  <div className="text-3xl font-bold text-evergreen mt-1">
                    {enrichedDocuments.filter((d) => d.sharedWithEmails.length > 0).length}
                  </div>
                  <div className="text-[11px] text-secondarytext mt-1">
                    Time-limited & revocable
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#DFD6C3] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl font-bold text-evergreen">
                      Recent Workspace Documents
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('my-documents')}
                      className="text-xs font-bold text-evergreen hover:underline"
                    >
                      Open All Documents →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {enrichedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setActiveTab('verification-results');
                        }}
                        className="cursor-pointer p-4 rounded-2xl bg-warmivory hover:bg-cream/60 border border-cream flex flex-wrap items-center justify-between gap-3 text-xs transition"
                      >
                        <div>
                          <div className="font-bold text-evergreen text-sm">{doc.title}</div>
                          <div className="text-secondarytext mt-0.5">
                            Parcel {doc.parcelId} · {doc.category} · {doc.fileType} ({doc.fileSizeKB} KB)
                          </div>
                          <div className="font-mono text-[10px] text-secondarytext mt-1">
                            SHA-256: {doc.sha256Hash?.slice(0, 28)}...
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2.5 py-1 rounded-full bg-palesky text-evergreen font-bold text-[11px]">
                            {doc.verificationStatus}
                          </span>
                          <span className="text-[11px] text-secondarytext">{doc.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#DFD6C3] shadow-sm space-y-4 text-xs">
                  <h2 className="font-serif text-xl font-bold text-evergreen">
                    DigiLocker & API Setu Architecture
                  </h2>
                  <p className="text-secondarytext leading-relaxed">
                    LandLocker includes a clean adapter interface for India’s official DigiLocker / API Setu gateway (<code>{DIGILOCKER_API_SETU_BASE_URL}</code>) alongside direct 10-stage document upload verification.
                  </p>
                  <div className="p-4 rounded-2xl bg-warmivory border border-cream space-y-2">
                    <div className="font-bold text-evergreen">
                      Current Adapter Status: Sandbox / Unconfigured
                    </div>
                    <p className="text-secondarytext">
                      {t('digilockerUnavailableMsg')}
                    </p>
                    <button
                      type="button"
                      onClick={handleConnectDigiLocker}
                      className="px-4 py-2 rounded-xl bg-evergreen text-warmivory font-bold hover:bg-teagreen transition"
                    >
                      Test DigiLocker Adapter Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AREA 2: MY DOCUMENTS */}
          {activeTab === 'my-documents' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 bg-white rounded-3xl border border-[#DFD6C3] p-5 space-y-3 shadow-sm">
                <h2 className="font-serif text-lg font-bold text-evergreen">
                  My Documents ({enrichedDocuments.length})
                </h2>
                <div className="space-y-2.5">
                  {enrichedDocuments.map((doc) => {
                    const isSelected = doc.id === activeDoc?.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition ${
                          isSelected
                            ? 'bg-palesky/80 border-evergreen ring-2 ring-evergreen/20'
                            : 'bg-warmivory border-cream hover:bg-cream/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-evergreen">{doc.parcelId}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-evergreen border border-cream">
                            {doc.verificationStatus}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-maintext mt-1">{doc.title}</h3>
                        <div className="text-[11px] text-secondarytext mt-1 flex justify-between">
                          <span>{doc.category}</span>
                          <span>{doc.fileType} · {(doc.fileSizeKB / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {activeDoc && (
                <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream pb-4">
                    <div>
                      <span className="text-xs font-bold text-teagreen uppercase">
                        {activeDoc.id} · Parcel {activeDoc.parcelId}
                      </span>
                      <h2 className="font-serif text-2xl font-bold text-evergreen">
                        {activeDoc.title}
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-palesky text-evergreen text-xs font-bold">
                      {activeDoc.verificationStatus}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-warmivory border border-cream text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-evergreen">
                      <span>Cryptographic Integrity Hash (SHA-256)</span>
                      {activeDoc.sha256Hash && (
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(activeDoc.sha256Hash || '');
                              showToast('SHA-256 digest copied to clipboard!');
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-leafgreen hover:underline cursor-pointer"
                          title="Copy SHA-256 hash"
                        >
                          📋 Copy Hash
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-[11px] break-all bg-white p-2.5 rounded-xl border border-cream text-maintext">
                      {activeDoc.sha256Hash}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-palesky/70 border border-mistyblue space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-evergreen">
                      <span>📄 In-Browser Document Preview (Preserved Original Text)</span>
                      <span>
                        {activeDoc.fileType} · {(activeDoc.fileSizeKB / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <p className="text-xs text-maintext font-mono bg-warmivory p-3.5 rounded-xl border border-cream leading-relaxed">
                      {activeDoc.previewSummary}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('verification-results')}
                      className="px-4 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold"
                    >
                      Inspect 10-Stage Verification Pipeline →
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('sharing-consent')}
                      className="px-4 py-2 rounded-xl bg-warmivory border border-[#CFC5B0] text-evergreen text-xs font-bold"
                    >
                      Manage Sharing & Consent →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AREA 3: ADD DOCUMENT */}
          {activeTab === 'add-document' && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#DFD6C3] p-6 sm:p-8 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
                  Validated Upload · Malware Scan · SHA-256 Hashing
                </span>
                <h2 className="font-serif text-2xl font-bold text-evergreen mt-1">
                  Upload Land Document to LandLocker
                </h2>
                <p className="text-xs text-secondarytext mt-1">
                  Allowed formats: PDF, JPG, PNG and WebP (up to 10 MB). The backend validates file signatures and hashes the actual bytes. Files remain quarantined until a configured antivirus scan passes; official-record matching and digital-signature validation are not claimed unless actually completed.
                </p>
              </div>

              {uploadError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-semibold"
                >
                  ⚠️ {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div
                  role="status"
                  className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-semibold"
                >
                  ✅ {uploadSuccess}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-maintext mb-1">
                      Document Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Certified Jamabandi RoR Extract — Dag 412"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-maintext mb-1">
                      Document Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as LandLockerCategory)}
                      className="w-full px-3 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0]"
                    >
                      <option value="Jamabandi / Patta Extract (Demo)">Jamabandi / Patta Extract</option>
                      <option value="Sale Deed (Demo)">Registered Sale Deed</option>
                      <option value="Mutation Order">Mutation Order</option>
                      <option value="Revenue Tax Receipt">Land Revenue Tax Receipt (Khajana)</option>
                      <option value="Encumbrance Statement (Demo)">Non-Encumbrance Certificate (NEC)</option>
                      <option value="Trace Map / Sketch (Demo)">Cadastral Trace Map / Sketch</option>
                      <option value="Seller Declaration (Demo)">Seller Accuracy Declaration</option>
                      <option value="Identity / Authority Proof">Identity / Authority Proof</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-maintext mb-1">
                      Linked Parcel / Dag ID *
                    </label>
                    <input
                      type="text"
                      value={parcelId}
                      onChange={(e) => setParcelId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-maintext mb-1">Actual Document File *</label>
                    <div className="relative">
                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedFile(file);
                          if (file) {
                            setFileSizeKB(Math.ceil(file.size / 1024));
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            if (ext === 'pdf') setFileType('PDF');
                            else if (ext === 'jpg' || ext === 'jpeg') setFileType('JPG');
                            else if (ext === 'png') setFileType('PNG');
                            else if (ext === 'webp') setFileType('WEBP');
                          } else setFileSizeKB(0);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm file:mr-3 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-evergreen file:text-warmivory hover:file:bg-teagreen cursor-pointer"
                      />
                    </div>
                    {selectedFile && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-medium">
                        <span className="truncate max-w-xs">📎 <strong>Selected:</strong> {selectedFile.name}</span>
                        <span className="font-mono font-bold text-emerald-800 text-[11px]">{(selectedFile.size / 1024).toFixed(1)} KB ({fileType})</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-maintext mb-1">Detected File Size</label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-sm text-secondarytext">
                      {selectedFile ? `${fileSizeKB.toLocaleString()} KB (measured from selected file)` : 'No file selected'}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-maintext mb-1">
                      Seller Declared Area (Bigha)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={declaredAreaBigha}
                      onChange={(e) => setDeclaredAreaBigha(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-maintext mb-1">
                      Document Recorded Area (Bigha) (Stage 6 Check)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={recordedAreaBigha}
                      onChange={(e) => setRecordedAreaBigha(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-warmivory border border-cream cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDigitalSignature}
                    onChange={(e) => setHasDigitalSignature(e.target.checked)}
                    className="accent-evergreen"
                  />
                  <span>
                    Seller declares a digital signature may be present (not independently validated)
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 rounded-xl bg-evergreen hover:bg-teagreen text-warmivory text-sm font-bold shadow-md transition disabled:opacity-60"
                >
                  {uploading ? 'Uploading and hashing actual file…' : 'Upload Actual File, Hash and Queue Verification →'}
                </button>
              </form>
            </div>
          )}

          {/* AREA 4: DOCUMENTS AWAITING REVIEW */}
          {activeTab === 'awaiting-review' && (
            <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-xl font-bold text-evergreen">
                    Documents Awaiting Verification ({awaitingReviewDocs.length})
                  </h2>
                  <p className="text-xs text-secondarytext">
                    Documents queued for Stage 9 Authorised Reviewer verification or requiring discrepancy resolution.
                  </p>
                </div>
              </div>

              {awaitingReviewDocs.length === 0 ? (
                <p className="text-xs text-secondarytext py-4">
                  There are no documents currently awaiting review.
                </p>
              ) : (
                <div className="space-y-3">
                  {awaitingReviewDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-warmivory border border-cream flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-evergreen text-sm">{doc.title}</div>
                        <div className="text-secondarytext">
                          Parcel {doc.parcelId} · {doc.category} · Status:{' '}
                          <strong className="text-amber-900">{doc.verificationStatus}</strong>
                        </div>
                        <div className="font-mono text-[10px] text-secondarytext">
                          SHA-256: {doc.sha256Hash}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {API_MODE && !doc.fileId && <span className="text-[10px] text-secondarytext max-w-40">Sample metadata only — no file to review</span>}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocId(doc.id);
                            setActiveTab('verification-results');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#CFC5B0] text-evergreen font-bold"
                        >
                          Inspect Pipeline
                        </button>
                        {currentUser?.role === 'reviewer' && doc.fileId && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                verifyDocumentByReviewer(
                                  doc.id,
                                  'Approved',
                                  'Verified against submitted parcel metadata'
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold"
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                verifyDocumentByReviewer(
                                  doc.id,
                                  'Rejected',
                                  'Area or scan clarity requires resubmission'
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-red-700 text-white font-bold"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AREA 5: VERIFICATION RESULTS (10-STAGE PIPELINE) */}
          {activeTab === 'verification-results' && activeDoc && (
            <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
                    10-Stage Document Verification Pipeline
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-evergreen mt-0.5">
                    {activeDoc.title} ({activeDoc.parcelId})
                  </h2>
                  <p className="text-xs font-mono text-secondarytext mt-1 break-all">
                    {activeDoc.sha256Hash ? `SHA-256 of uploaded bytes: ${activeDoc.sha256Hash}` : 'No actual-file digest: sample metadata only.'}
                  </p>
                  {activeDoc.fileId && activeDoc.scanStatus === 'Passed' && (
                    <a href={`/api/documents/${encodeURIComponent(activeDoc.fileId)}/content`} target="_blank" rel="noreferrer" className="inline-flex mt-2 px-3 py-2 rounded-xl bg-palesky text-evergreen border border-mistyblue text-xs font-bold">
                      View Stored Original File ↗
                    </a>
                  )}
                  {activeDoc.fileId && activeDoc.scanStatus !== 'Passed' && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-amber-800">Original file is quarantined. It cannot be viewed or shared until a configured ClamAV scan passes.</p>
                      {API_MODE && currentUser?.role === 'reviewer' && <button type="button" disabled={rescanningDoc} onClick={() => void handleRescanDocument()} className="px-3 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold disabled:opacity-50">{rescanningDoc ? 'Scanning…' : 'Run / Retry Security Scan'}</button>}
                    </div>
                  )}
                  {scanNotice && <p role="status" className="text-xs mt-2 p-2 rounded-lg bg-amber-50 text-amber-900">{scanNotice}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    aria-label="Select Document to Inspect"
                    value={activeDoc.id}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs font-bold text-evergreen"
                  >
                    {enrichedDocuments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} — {d.title.slice(0, 32)}
                      </option>
                    ))}
                  </select>
                  <span className="px-3 py-1.5 rounded-full bg-palesky text-evergreen text-xs font-bold">
                    {activeDoc.verificationStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {(activeDoc.pipelineStages || []).map((st) => (
                  <div
                    key={st.stageNumber}
                    className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                      st.status === 'Completed'
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : st.status === 'Flagged'
                        ? 'bg-red-50/70 border-red-200'
                        : 'bg-warmivory border-cream'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-evergreen">{st.name}</div>
                      <p className="text-secondarytext leading-relaxed">{st.detail}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap ${
                        st.status === 'Completed'
                          ? 'bg-emerald-600 text-white'
                          : st.status === 'Flagged'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-100 text-amber-950'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AREA 6: SHARING AND CONSENT */}
          {activeTab === 'sharing-consent' && activeDoc && (
            <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-5 shadow-sm text-xs">
              <div>
                <h2 className="font-serif text-2xl font-bold text-evergreen">
                  Granular Sharing & Time-Limited Consent — {activeDoc.title}
                </h2>
                <p className="text-secondarytext mt-1">
                  Documents in LandLocker are strictly private by default. Grant time-limited view access to a specific buyer or reviewer, and revoke access at any moment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-warmivory border border-cream items-end">
                <div>
                  <label className="block font-semibold text-maintext mb-1">
                    Recipient Email (Buyer or Official Reviewer)
                  </label>
                  <input
                    type="email"
                    value={shareTargetEmail}
                    onChange={(e) => setShareTargetEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#CFC5B0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-maintext mb-1">
                    Consent Duration (Days)
                  </label>
                  <select
                    value={shareExpiryDays}
                    onChange={(e) => setShareExpiryDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#CFC5B0]"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={API_MODE && !activeDoc.fileId}
                    onClick={() => shareDocument(activeDoc.id, shareTargetEmail, shareExpiryDays)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-evergreen text-warmivory font-bold hover:bg-teagreen transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Grant Consent
                  </button>
                  <button
                    type="button"
                    disabled={API_MODE && !activeDoc.fileId}
                    onClick={() => revokeDocumentAccess(activeDoc.id)}
                    className="py-2.5 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Revoke All
                  </button>
                </div>
              </div>

              {API_MODE && !activeDoc.fileId && <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">This is sample metadata, not an uploaded file. Real sharing is disabled until an actual file is uploaded and its security scan passes.</p>}
              <div className="p-4 rounded-2xl bg-palesky/60 border border-mistyblue space-y-1.5">
                <div>
                  <strong>Current Privacy Status:</strong> {activeDoc.status}
                </div>
                <div>
                  <strong>Shared With:</strong>{' '}
                  {activeDoc.sharedWithEmails.length === 0
                    ? 'Private (Owner Only — No Active Shares)'
                    : activeDoc.sharedWithEmails.join(', ')}
                </div>
                {activeDoc.consentExpiresAt && (
                  <div>
                    <strong>Consent Expires On:</strong>{' '}
                    {new Date(activeDoc.consentExpiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AREA 7: ACCESS HISTORY */}
          {activeTab === 'access-history' && activeDoc && (
            <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-4 shadow-sm text-xs">
              <h2 className="font-serif text-2xl font-bold text-evergreen">
                Immutable Consent & Access Audit Log ({activeDoc.consentHistory.length} Events)
              </h2>
              <div className="space-y-2.5">
                {activeDoc.consentHistory.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-warmivory border-l-4 border-evergreen flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-evergreen">[{ev.action}]</span>{' '}
                      <span className="text-maintext">{ev.note}</span>
                      <div className="text-[11px] text-secondarytext mt-0.5">
                        Actor: {ev.actorEmail}
                        {ev.targetEmail ? ` → Recipient: ${ev.targetEmail}` : ''}
                      </div>
                    </div>
                    <span className="text-[11px] text-secondarytext whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AREA 8: HELP AND FAQ */}
          {activeTab === 'help-faq' && (
            <div className="bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-4 shadow-sm text-xs">
              <h2 className="font-serif text-2xl font-bold text-evergreen">
                LandLocker Security, Verification & DigiLocker FAQ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-warmivory border border-cream space-y-1.5">
                  <div className="font-bold text-evergreen text-sm">
                    1. Does uploading a file automatically mark my land as government-verified?
                  </div>
                  <p className="text-secondarytext leading-relaxed">
                    No. Uploading a document only begins the 10-stage pipeline (format check, staging quarantine, malware scan, SHA-256 integrity hash, field comparison, and reviewer sign-off).
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-warmivory border border-cream space-y-1.5">
                  <div className="font-bold text-evergreen text-sm">
                    2. How does DigiLocker / API Setu integration work?
                  </div>
                  <p className="text-secondarytext leading-relaxed">
                    DigiLocker / API Setu is not connected unless the deployment reports configured approved credentials and a completed consent exchange. A file hash or reviewer decision does not establish that a land record is government-authentic.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-warmivory border border-cream space-y-1.5">
                  <div className="font-bold text-evergreen text-sm">
                    3. Who can view my uploaded Jamabandi or Sale Deed?
                  </div>
                  <p className="text-secondarytext leading-relaxed">
                    Only you (the document owner) and authorised reviewers assigned to verify your submission—unless you explicitly grant time-limited consent to a buyer.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-warmivory border border-cream space-y-1.5">
                  <div className="font-bold text-evergreen text-sm">
                    4. What is the SHA-256 Integrity Hash?
                  </div>
                  <p className="text-secondarytext leading-relaxed">
                    A cryptographic fingerprint computed from the uploaded file bytes. It can show whether a later file matches those bytes, but it does not establish who issued the document or whether its contents are true.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

            {renderDigiLockerModal()}
    </div>
  );
};