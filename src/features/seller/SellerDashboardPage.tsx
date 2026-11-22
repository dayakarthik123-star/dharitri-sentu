import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { AreaUnit } from '../../types';
import { AREA_UNIT_META, formatAreaWithSecondary, formatPricePerBighaAndUnit } from '../../utils/landUnitsAndBadges';
import { Store, Eye, MessageSquare, FileCheck, AlertTriangle, ArrowRight, Plus, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SellerDashboardPage: React.FC = () => {
  const {
    currentUser,
    listings,
    enquiries,
    documents,
    areaUnit,
    setAreaUnit,
    updateSellerAskingPrice,
    sendEnquiryMessage,
    showToast,
    t,
  } = useApp();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'properties' ? 'properties' : 'overview';

  const [activeTab, setActiveTab] = useState<'overview' | 'properties'>(initialTab);
  const [editingPriceMap, setEditingPriceMap] = useState<Record<string, number>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState(
    'Hello Ananya, we have initiated the Lot Mondal field resurvey to reconcile the 0.15 Bigha boundary difference. The revised trace sketch is submitted to the Revenue Circle Office.'
  );

  const sellerListings = listings.filter(
    (l) => !currentUser || currentUser.role !== 'seller' || l.sellerEmail === currentUser.email
  );

  const handlePriceUpdate = (listingId: string, price: number) => {
    updateSellerAskingPrice(listingId, price);
    showToast(`Asking price updated to ₹${price.toLocaleString('en-IN')}`);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowUploadModal(false);
    showToast('✓ Updated Boundary Trace Sketch submitted for Reviewer check!');
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    sendEnquiryMessage('ENQ-001', replyText.trim(), 'seller');
    setShowReplyModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <span>Seller Workspace</span>
            <span>&gt;</span>
            <span className="text-[#15803D] font-bold">Seller Dashboard</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D261C]">
            Seller Dashboard — Pranabjyoti Kalita
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Monitor buyer views, manage active listings and asking prices, and resolve document verifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/seller/inquiries"
            className="py-2.5 px-4 rounded-xl bg-white border border-[#E2E8F0] text-[#0D261C] font-bold text-xs hover:bg-gray-50 transition shadow-xs flex items-center gap-1.5"
          >
            <MessageSquare size={14} className="text-[#15803D]" />
            <span>Buyer Inquiries (2)</span>
          </Link>

          <Link
            to="/sell/new"
            className="py-2.5 px-5 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 active:scale-98"
          >
            <Plus size={14} />
            <span>+ List New Land Parcel</span>
          </Link>
        </div>
      </div>

      {/* 4 TOP METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E5EBE7] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#66736D] text-xs font-bold">
            <span>{t('metricActiveListings') || 'Active Listings'}</span>
            <Store size={16} className="text-[#147D4A]" />
          </div>
          <div className="text-3xl font-black text-[#092F24] mt-1 font-heading">{sellerListings.length}</div>
          <div className="text-[11px] text-[#66736D]">
            {sellerListings.map(l => l.village).slice(0, 2).join(' & ')} plots
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E5EBE7] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#66736D] text-xs font-bold">
            <span>{t('metricTotalBuyerViews') || 'Total Buyer Views'}</span>
            <Eye size={16} className="text-blue-600" />
          </div>
          <div className="text-3xl font-black text-[#092F24] mt-1 font-heading">48</div>
          <div className="text-[11px] text-[#147D4A] font-semibold">↑ +14 views this week</div>
        </div>

        {/* Card 3 */}
        <Link
          to="/seller/inquiries"
          className="bg-white p-5 rounded-3xl border border-[#E5EBE7] hover:border-[#F2A900] transition shadow-sm space-y-1 block cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>{t('metricOpenBuyerInquiries') || 'Open Buyer Inquiries'}</span>
            <MessageSquare size={16} className="text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-900 mt-1 font-heading">2</div>
          <div className="text-[11px] text-amber-700 font-semibold">Action Needed on Changsari</div>
        </Link>

        {/* Card 4 */}
        <Link
          to="/landlocker"
          className="bg-white p-5 rounded-3xl border border-[#E5EBE7] hover:border-[#35A66B] transition shadow-sm space-y-1 block cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#147D4A] text-xs font-bold">
            <span>{t('metricVerifiedDocuments') || 'Verified Documents'}</span>
            <FileCheck size={16} className="text-[#147D4A]" />
          </div>
          <div className="text-3xl font-black text-[#147D4A] mt-1 font-heading">3</div>
          <div className="text-[11px] text-[#66736D]">In LandLocker Vault</div>
        </Link>
      </div>

      {/* URGENT ACTION BANNER (TOP PRIORITY) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 mt-0.5">
            ⚠️
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Urgent Clarification Required
            </span>
            <h3 className="font-serif text-lg font-bold text-amber-950">
              Action Needed on Changsari 2.5 Bigha Plot
            </h3>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed max-w-3xl">
              Buyer <strong>Ananya Baruah</strong> requested clarification on a <strong>0.15 Bigha area difference</strong> between your listing (2.50 Bigha) and the Jamabandi record (2.35 Bigha).
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="py-2.5 px-4 rounded-xl bg-[#092F24] hover:bg-[#147D4A] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 active:scale-98"
          >
            <span>🗺️</span>
            <span>Upload Updated Trace Map</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReplyModal(true)}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-[#FFF9E8] border border-[#F2A900] text-[#92400E] font-bold text-xs transition shadow-xs flex items-center gap-1.5 active:scale-98"
          >
            <span>💬</span>
            <span>Reply to Buyer</span>
          </button>
        </div>
      </div>

      {/* MY PROPERTIES OVERVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#0D261C]">
              My Active Properties ({sellerListings.length})
            </h2>
            <p className="text-xs text-gray-500">
              Update asking prices directly and monitor buyer interest and verification status.
            </p>
          </div>

          <Link
            to="/sell/new"
            className="text-xs font-bold text-[#15803D] hover:underline"
          >
            + Add Another Plot
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sellerListings.map((item) => {
            const draftPrice =
              editingPriceMap[item.id] !== undefined
                ? editingPriceMap[item.id]
                : item.askingPriceINR;

            const isChangsari = item.id === 'lst-1';

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={item.media[0]?.url || '/assets/parcel-agricultural.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {isChangsari ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-amber-200 shadow-sm">
                        ⚠️ Action Needed: 0.15 Bigha Variance
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] border border-emerald-200 shadow-sm">
                        ✅ Verified Plot
                      </span>
                    )}
                  </div>
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                    {item.landType}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#0D261C]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      📍 {item.village}, {item.district} · Dag {item.parcelId}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-xs text-gray-500 block">Current Asking Price:</span>
                        <span className="font-bold text-xl text-[#0D261C]">
                          ₹{(item.askingPriceINR / 100000).toFixed(1)} Lakhs
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">Plot Area:</span>
                        <span className="font-bold text-sm text-gray-800">
                          {formatAreaWithSecondary(item.areaBigha, areaUnit)}
                        </span>
                      </div>
                    </div>

                    {/* Asking Price Quick Editor */}
                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center gap-2">
                      <label className="text-[11px] font-bold text-gray-700 whitespace-nowrap">
                        Edit Price (₹):
                      </label>
                      <input
                        type="number"
                        step={50000}
                        value={draftPrice}
                        onChange={(e) =>
                          setEditingPriceMap((prev) => ({
                            ...prev,
                            [item.id]: Number(e.target.value),
                          }))
                        }
                        className="flex-1 px-3 py-1 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#0D261C] focus:outline-none focus:ring-1 focus:ring-[#15803D]"
                      />
                      <button
                        type="button"
                        onClick={() => handlePriceUpdate(item.id, draftPrice)}
                        className="py-1 px-3 rounded-xl bg-[#15803D] hover:bg-[#0D261C] text-white text-xs font-bold transition shadow-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <Link
                      to={`/land/${item.id}`}
                      className="font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      <span>Public Preview</span>
                      <ExternalLink size={12} />
                    </Link>

                    <Link
                      to="/seller/verification"
                      className="font-bold text-[#147D4A] hover:underline"
                    >
                      {isChangsari ? 'Resolve Mismatch →' : 'View Verification Status →'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: Upload Updated Trace Map */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E5EBE7] shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-start justify-between border-b border-[#E5EBE7] pb-3.5">
              <div>
                <span className="text-[11px] font-bold text-[#147D4A] uppercase tracking-wider">
                  Official Re-Demarcation
                </span>
                <h3 className="font-serif text-xl font-bold text-[#092F24]">
                  Upload Updated Boundary Trace Map
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <p className="text-xs text-[#66736D] leading-relaxed">
                Upload the revised <strong>Lot Mondal field survey sketch</strong> for Dag 412 (Changsari). This will be routed directly to Revenue Officer Debajit Hazarika for official sign-off.
              </p>

              <div className="p-4 border-2 border-dashed border-[#E5EBE7] rounded-2xl bg-[#F7F9F6] text-center space-y-2">
                <span className="text-3xl block">🗺️</span>
                <span className="text-xs font-bold text-[#092F24] block">Lot-Mondal-Resurvey-Dag412-2.35B.pdf</span>
                <span className="text-[11px] text-[#66736D] block">PDF / Image (Max 15MB) · Certified field sketch</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#66736D] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#147D4A] hover:bg-[#092F24] text-white text-xs font-bold transition shadow-sm"
                >
                  Submit to Official Verifier →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reply to Buyer Ananya Baruah */}
      {showReplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E5EBE7] shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-start justify-between border-b border-[#E5EBE7] pb-3.5">
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  {t('Direct Stakeholder Messaging')}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#092F24]">
                  {t('Reply to Ananya Baruah (Buyer)')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReplyModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#092F24] uppercase mb-1">
                  {t('Message Body')}
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('Type your message here...')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F6] border border-[#E5EBE7] text-xs text-[#15251F] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#147D4A]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#66736D] hover:bg-gray-100"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#092F24] hover:bg-[#147D4A] text-white text-xs font-bold transition shadow-sm"
                >
                  {t('Send Message to Buyer →')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
