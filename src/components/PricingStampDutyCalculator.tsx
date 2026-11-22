import React, { useState } from 'react';
import { AreaUnit } from '../types';
import { formatAreaWithSecondary } from '../utils/landUnitsAndBadges';
import { Calculator, ShieldCheck, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';

interface PricingStampDutyCalculatorProps {
  village?: string;
  district?: string;
  areaBigha?: number;
  askingPriceINR?: number;
  circleRatePerBighaINR?: number;
}

export const PricingStampDutyCalculator: React.FC<PricingStampDutyCalculatorProps> = ({
  village = 'Changsari',
  district = 'Kamrup',
  areaBigha = 2.35,
  askingPriceINR = 1800000,
  circleRatePerBighaINR = 450000,
}) => {
  const [buyerGender, setBuyerGender] = useState<'male' | 'female' | 'joint'>('female');

  // Circle Rate Value = Area (Bigha) * Circle Rate / Bigha
  const totalCircleValue = Math.round(areaBigha * circleRatePerBighaINR);
  const askingPricePerBigha = Math.round(askingPriceINR / areaBigha);
  const premiumPct = Math.round(((askingPricePerBigha - circleRatePerBighaINR) / circleRatePerBighaINR) * 100);

  // Government Stamp Duty Rates in Assam:
  // Male: 5%, Female: 4% (State Women Landownership Concession), Joint: 4.5%
  const stampDutyRate = buyerGender === 'female' ? 0.04 : buyerGender === 'joint' ? 0.045 : 0.05;
  const registrationFeeRate = 0.02; // 2% Senior Sub-Registrar Fee

  // Stamp duty is calculated on whichever is higher: Asking Price or Circle Benchmark
  const taxableBase = Math.max(askingPriceINR, totalCircleValue);
  const stampDutyAmount = Math.round(taxableBase * stampDutyRate);
  const registrationFee = Math.round(taxableBase * registrationFeeRate);
  const municipalLegalCess = 15000; // Standard Document Drafting & Notary Stamping
  const totalCashRequired = askingPriceINR + stampDutyAmount + registrationFee + municipalLegalCess;

  return (
    <div className="bg-white rounded-3xl border border-[#E5EBE7] p-6 sm:p-7 shadow-sm space-y-6">
      {/* Title & Eyebrow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EBE7] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F2EC] text-[#147D4A] text-xs font-bold mb-1">
            <Calculator size={13} />
            <span>Statutory Land Valuation &amp; Legal Costs</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#092F24]">
            Government Circle Rate vs. Fair Market Price
          </h3>
          <p className="text-xs text-[#66736D]">
            Official Zonal Circle Benchmark for {village}, {district} under Assam Land Revenue Regulation.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#147D4A] text-xs font-bold">
          <ShieldCheck size={16} />
          <span>IGRS Assam Rate Benchmarked</span>
        </div>
      </div>

      {/* Comparison Grid: Circle Rate vs Asking Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Official Circle Rate */}
        <div className="p-4 rounded-2xl bg-[#F7F9F6] border border-[#E5EBE7] space-y-2">
          <div className="text-xs font-bold text-[#66736D] uppercase tracking-wider flex items-center justify-between">
            <span>Official Circle Rate (Zonal Value)</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">Circle No. 4</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#092F24] font-heading">
            ₹{circleRatePerBighaINR.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-normal text-[#66736D]">/ Bigha</span>
          </div>
          <div className="text-xs text-[#66736D]">
            Statutory minimum valuation for {areaBigha} Bigha: <strong className="text-[#092F24]">₹{totalCircleValue.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Card 2: Seller Asking Price & Market Premium */}
        <div className="p-4 rounded-2xl bg-[#E9F2EC]/60 border border-[#B5E4A3]/50 space-y-2">
          <div className="text-xs font-bold text-[#147D4A] uppercase tracking-wider flex items-center justify-between">
            <span>Seller Asking Price</span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              +{premiumPct}% Normal Market Premium
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#092F24] font-heading">
            ₹{askingPricePerBigha.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-normal text-[#66736D]">/ Bigha</span>
          </div>
          <div className="text-xs text-[#66736D]">
            Total Asking Price: <strong className="text-[#092F24]">₹{askingPriceINR.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Live Stamp Duty & Registration Calculator Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F7F9F6] border border-[#E5EBE7] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#092F24]">
              Live Stamp Duty &amp; Registration Fee Calculator
            </h4>
            <p className="text-xs text-[#66736D]">
              Calculates exact Assam Senior Sub-Registrar title transfer fees based on ownership gender concessions.
            </p>
          </div>

          {/* Gender Selector Chips */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E5EBE7] self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => setBuyerGender('female')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                buyerGender === 'female'
                  ? 'bg-[#147D4A] text-white shadow-xs'
                  : 'text-[#66736D] hover:text-[#092F24]'
              }`}
            >
              👩 Female (4%)
            </button>
            <button
              type="button"
              onClick={() => setBuyerGender('joint')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                buyerGender === 'joint'
                  ? 'bg-[#147D4A] text-white shadow-xs'
                  : 'text-[#66736D] hover:text-[#092F24]'
              }`}
            >
              👥 Joint (4.5%)
            </button>
            <button
              type="button"
              onClick={() => setBuyerGender('male')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                buyerGender === 'male'
                  ? 'bg-[#147D4A] text-white shadow-xs'
                  : 'text-[#66736D] hover:text-[#092F24]'
              }`}
            >
              👨 Male (5%)
            </button>
          </div>
        </div>

        {/* Detailed Fee Breakdown Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-white rounded-xl border border-[#E5EBE7]">
            <span className="text-[11px] text-[#66736D] block">Stamp Duty ({(stampDutyRate * 100).toFixed(1)}%)</span>
            <span className="text-lg font-bold text-[#092F24] font-mono">₹{stampDutyAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E5EBE7]">
            <span className="text-[11px] text-[#66736D] block">Registration Fee (2.0%)</span>
            <span className="text-lg font-bold text-[#092F24] font-mono">₹{registrationFee.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E5EBE7]">
            <span className="text-[11px] text-[#66736D] block">Drafting &amp; Notary Cess</span>
            <span className="text-lg font-bold text-[#092F24] font-mono">₹{municipalLegalCess.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-[#147D4A] font-bold block">Total Cash Needed</span>
            <span className="text-lg font-extrabold text-[#092F24] font-mono">₹{totalCashRequired.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="text-[11px] text-[#66736D] flex items-center gap-1.5">
          <Info size={13} className="text-[#147D4A] shrink-0" />
          <span>
            Assam Stamp (Amendment) Act allows 1% concession for female deed owners. Registration is legally completed at Senior Sub-Registrar Kamrup.
          </span>
        </div>
      </div>
    </div>
  );
};
