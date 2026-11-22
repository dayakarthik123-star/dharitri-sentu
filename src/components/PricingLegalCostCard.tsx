import React, { useState } from 'react';
import { ShieldCheck, Info, Calculator, Scale, ArrowUpRight } from 'lucide-react';

export interface RevenueCircleConfig {
  name: string;
  district: string;
  circleRatePerBighaINR: number;
  marketRatePerBighaINR: number;
}

export const REVENUE_CIRCLES: RevenueCircleConfig[] = [
  {
    name: 'Changsari (Kamrup)',
    district: 'Kamrup',
    circleRatePerBighaINR: 450000,
    marketRatePerBighaINR: 620000,
  },
  {
    name: 'Sonapur (Kamrup Metropolitan)',
    district: 'Kamrup Metropolitan',
    circleRatePerBighaINR: 580000,
    marketRatePerBighaINR: 790000,
  },
  {
    name: 'Chabua (Dibrugarh)',
    district: 'Dibrugarh',
    circleRatePerBighaINR: 320000,
    marketRatePerBighaINR: 440000,
  },
  {
    name: 'Garmur (Jorhat)',
    district: 'Jorhat',
    circleRatePerBighaINR: 410000,
    marketRatePerBighaINR: 550000,
  },
  {
    name: 'Barama (Baksa)',
    district: 'Baksa',
    circleRatePerBighaINR: 280000,
    marketRatePerBighaINR: 380000,
  },
];

export interface PricingLegalCostCardProps {
  circleName?: string;
  areaBigha?: number;
  circleRatePerBighaINR?: number;
  askingPricePerBighaINR?: number;
  allowCustomControls?: boolean;
  className?: string;
}

export const PricingLegalCostCard: React.FC<PricingLegalCostCardProps> = ({
  circleName: initialCircleName = 'Changsari (Kamrup)',
  areaBigha: initialAreaBigha = 2.5,
  circleRatePerBighaINR: initialCircleRate,
  askingPricePerBighaINR: initialAskingRate,
  allowCustomControls = false,
  className = '',
}) => {
  const [selectedCircleName, setSelectedCircleName] = useState(initialCircleName);
  const [area, setArea] = useState<number>(initialAreaBigha);
  const [buyerCategory, setBuyerCategory] = useState<'male' | 'female' | 'joint'>('male');

  const activeCircleConfig =
    REVENUE_CIRCLES.find((c) => c.name === selectedCircleName) || REVENUE_CIRCLES[0];

  const circleRatePerBigha = initialCircleRate ?? activeCircleConfig.circleRatePerBighaINR;
  const askingPricePerBigha = initialAskingRate ?? activeCircleConfig.marketRatePerBighaINR;

  const totalBasePrice = Math.round(area * askingPricePerBigha);
  const totalCircleValue = Math.round(area * circleRatePerBigha);

  // Normal market premium over circle rate
  const premiumPct = Math.round(
    ((askingPricePerBigha - circleRatePerBigha) / circleRatePerBigha) * 100
  );

  // Assam Stamp (Amendment) Rules
  // Male: 5%, Female: 4%, Joint: 4.5%
  const stampDutyRate = buyerCategory === 'female' ? 0.04 : buyerCategory === 'joint' ? 0.045 : 0.05;
  const registrationFeeRate = 0.02; // Flat 2%
  const legalDocFee = 5000; // Flat Stamp paper & legal fee

  const taxableConsideration = Math.max(totalBasePrice, totalCircleValue);
  const stampDutyAmount = Math.round(taxableConsideration * stampDutyRate);
  const registrationFeeAmount = Math.round(taxableConsideration * registrationFeeRate);

  const totalTransferCost = stampDutyAmount + registrationFeeAmount + legalDocFee;
  const totalEstimatedCashOutlay = totalBasePrice + totalTransferCost;

  // Comparison progress bar percentages (clamped to 100%)
  const circleRatio = Math.min(100, Math.round((circleRatePerBigha / askingPricePerBigha) * 100));

  return (
    <div
      className={`bg-white rounded-[14px] border border-[#E2E8F0] p-6 sm:p-7 shadow-sm space-y-6 ${className}`}
      style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}
    >
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#092F24] flex items-center gap-2">
            <span>⚖️</span>
            <span>Pricing &amp; Legal Cost Breakdown</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#66736D] mt-0.5">
            Official Circle Rate vs. Market Price &amp; Government Transfer Expenses
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck size={14} />
          <span>Statutory Revenue Verified</span>
        </div>
      </div>

      {/* Optional Interactive Controls for Price Explorer */}
      {allowCustomControls && (
        <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#15251F] uppercase tracking-wider mb-1.5">
              Select Revenue Circle:
            </label>
            <select
              value={selectedCircleName}
              onChange={(e) => setSelectedCircleName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-sm font-semibold text-[#092F24] focus:outline-none focus:ring-2 focus:ring-[#147D4A]"
            >
              {REVENUE_CIRCLES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} — Circle: ₹{(c.circleRatePerBighaINR / 100000).toFixed(2)}L/Bigha
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#15251F] uppercase tracking-wider">
                Land Area (Bigha):
              </label>
              <span className="text-xs font-extrabold text-[#147D4A] bg-[#DCFCE7] px-2 py-0.5 rounded">
                {area} Bigha
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={area}
                onChange={(e) => setArea(parseFloat(e.target.value) || 1)}
                className="w-full accent-[#147D4A] cursor-pointer"
              />
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={area}
                onChange={(e) => setArea(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-20 px-2 py-1 bg-white border border-[#CBD5E1] rounded text-sm text-center font-bold text-[#092F24]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Section A: Circle Rate vs. Fair Market Price Meter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#66736D]">
            Section A: Zonal Benchmark vs Asking Price
          </span>
          <span className="text-xs text-[#66736D]">
            Plot Size: <strong>{area} Bigha</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Official Circle Rate */}
          <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-4 space-y-1">
            <span className="text-xs font-semibold text-[#66736D]">
              Official Zonal Circle Rate (Govt Minimum):
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#092F24]">
              ₹{circleRatePerBigha.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-[#66736D]">/ Bigha</span>
            </div>
            <p className="text-xs text-[#66736D] pt-0.5">
              Set by Revenue Circle Office, {selectedCircleName.split(' ')[0]}
            </p>
          </div>

          {/* Card 2: Seller Asking Price */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#66736D]">
                Seller Asking Price:
              </span>
              <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                +{premiumPct}% over Circle Rate (Normal Market Premium)
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#147D4A]">
              ₹{askingPricePerBigha.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-[#66736D]">/ Bigha</span>
            </div>
            <p className="text-xs text-[#15251F] font-semibold pt-0.5">
              Total Plot Consideration Value:{' '}
              <span className="text-[#092F24] font-extrabold">
                {area} Bigha × ₹{askingPricePerBigha.toLocaleString('en-IN')} = ₹
                {totalBasePrice.toLocaleString('en-IN')}
              </span>
            </p>
          </div>
        </div>

        {/* Visual Comparison Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[#092F24]">
              Circle Baseline: ₹{(circleRatePerBigha / 100000).toFixed(1)}L / Bigha
            </span>
            <span className="text-[#147D4A]">
              Asking Price: ₹{(askingPricePerBigha / 100000).toFixed(1)}L / Bigha
            </span>
          </div>

          <div className="w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden flex">
            <div
              className="bg-[#103D30] h-full transition-all duration-500"
              style={{ width: `${circleRatio}%` }}
              title={`Govt Circle Benchmark (${circleRatio}%)`}
            />
            <div
              className="bg-[#35A66B] h-full transition-all duration-500"
              style={{ width: `${100 - circleRatio}%` }}
              title={`Market Premium (${100 - circleRatio}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#66736D]">
            <span>■ Govt Circle Minimum Floor</span>
            <span>■ Fair Market Commercial Premium</span>
          </div>
        </div>
      </div>

      {/* 3. Section B: Live Interactive Stamp Duty & Registration Calculator */}
      <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#66736D]">
            Section B: Live Interactive Stamp Duty &amp; Registration Calculator
          </span>
          <span className="text-xs text-[#147D4A] font-semibold">
            Based on Assam Stamp (Amendment) Rules
          </span>
        </div>

        {/* 3-Way Buyer Ownership Category Selector */}
        <div>
          <label className="block text-xs font-bold text-[#15251F] mb-2">
            Select Buyer Ownership Category:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setBuyerCategory('male')}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                buyerCategory === 'male'
                  ? 'bg-[#092F24] text-white border-[#092F24] shadow-sm'
                  : 'bg-white text-[#15251F] border-[#CBD5E1] hover:bg-[#F8FAF7]'
              }`}
            >
              <span>👨</span>
              <span>Male Buyer (5% Stamp Duty)</span>
            </button>

            <button
              type="button"
              onClick={() => setBuyerCategory('female')}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                buyerCategory === 'female'
                  ? 'bg-[#092F24] text-white border-[#092F24] shadow-sm'
                  : 'bg-white text-[#15251F] border-[#CBD5E1] hover:bg-[#F8FAF7]'
              }`}
            >
              <span>👩</span>
              <span>Female Buyer (4% Stamp Duty)</span>
            </button>

            <button
              type="button"
              onClick={() => setBuyerCategory('joint')}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                buyerCategory === 'joint'
                  ? 'bg-[#092F24] text-white border-[#092F24] shadow-sm'
                  : 'bg-white text-[#15251F] border-[#CBD5E1] hover:bg-[#F8FAF7]'
              }`}
            >
              <span>👥</span>
              <span>Joint Ownership (4.5% Stamp Duty)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Cost Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-[#F8FAF7] text-[#66736D] uppercase text-[11px] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-4">Line Item / Government Transfer Component</th>
                <th className="py-2.5 px-4 text-center">Statutory Rate</th>
                <th className="py-2.5 px-4 text-right">Payable Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium text-[#15251F]">
              <tr>
                <td className="py-2.5 px-4">
                  <strong>Property Base Consideration Price</strong>
                  <div className="text-[11px] text-[#66736D]">
                    {area} Bigha × ₹{askingPricePerBigha.toLocaleString('en-IN')}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center text-xs text-[#66736D]">Negotiated Base</td>
                <td className="py-2.5 px-4 text-right font-bold text-[#092F24]">
                  ₹{totalBasePrice.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-4">
                  <strong>Assam Stamp Duty</strong>
                  <div className="text-[11px] text-[#66736D]">
                    Payable via e-Stamping / Senior Sub-Registrar
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center font-bold text-[#147D4A]">
                  {(stampDutyRate * 100).toFixed(1)}%
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-[#092F24]">
                  ₹{stampDutyAmount.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-4">
                  <strong>Government Registration Fee</strong>
                  <div className="text-[11px] text-[#66736D]">
                    Flat Registration Charge under IGRS Assam
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center font-bold text-[#66736D]">Flat 2%</td>
                <td className="py-2.5 px-4 text-right font-bold text-[#092F24]">
                  ₹{registrationFeeAmount.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-4">
                  <strong>Stamp Paper &amp; Legal Documentation Fee</strong>
                  <div className="text-[11px] text-[#66736D]">
                    Deed drafting, notary stamping, &amp; title search cess
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center text-xs text-[#66736D]">Standard Fixture</td>
                <td className="py-2.5 px-4 text-right font-bold text-[#092F24]">
                  ₹{legalDocFee.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr className="bg-[#F8FAF7] font-bold">
                <td className="py-2.5 px-4 text-[#092F24]">
                  Total Government &amp; Title Transfer Cost
                </td>
                <td className="py-2.5 px-4 text-center text-[#147D4A] text-xs">
                  {((stampDutyRate + registrationFeeRate) * 100).toFixed(1)}% + Legal
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-800 text-sm">
                  ₹{totalTransferCost.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Summary Highlight Box */}
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#166534]">
              Total Estimated Cash Outlay for Title Transfer
            </span>
            <p className="text-xs text-[#166534]/90">
              Includes agreed land consideration price plus complete statutory stamp duty and registration dues.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#166534]">
              ₹{totalEstimatedCashOutlay.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-[#166534]/80">
              (Base Price: ₹{totalBasePrice.toLocaleString('en-IN')} + Govt Fees: ₹
              {totalTransferCost.toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#66736D] italic">
          *Stamp duty calculated as per Assam Stamp (Amendment) Rules on declared consideration value.
        </p>
      </div>
    </div>
  );
};
