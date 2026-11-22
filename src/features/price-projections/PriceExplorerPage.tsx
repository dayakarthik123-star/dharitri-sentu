import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { AreaUnit } from '../../types';
import {
  calculateProjectedScenarioValue,
  getRoleCheckedPriceProjections,
} from '../../services/govIntegrationBoundary';
import {
  AREA_UNIT_META,
  formatAreaWithSecondary,
  formatPricePerBighaAndUnit,
} from '../../utils/landUnitsAndBadges';
import { PricingLegalCostCard } from '../../components/PricingLegalCostCard';

export const PriceExplorerPage: React.FC = () => {
  const { listings, currentUser, areaUnit, setAreaUnit, t, showToast } = useApp();
  const [selectedId, setSelectedId] = useState<string>(listings[0]?.id || 'lst-1');
  const [startingValueINR, setStartingValueINR] = useState<number>(1800000);
  const [annualRatePercent, setAnnualRatePercent] = useState<number>(6);
  const [years, setYears] = useState<number>(10);
  const [hoveredYear, setHoveredYear] = useState<number>(10);

  // Enforce Part 10: Sellers must not have access to future land-value projections
  const roleCheck = getRoleCheckedPriceProjections(
    currentUser?.role,
    startingValueINR,
    annualRatePercent,
    years
  );

  if (!roleCheck.allowed) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div
          role="alert"
          className="bg-white rounded-3xl border-2 border-amber-300 p-8 shadow-xl space-y-4 text-center"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold">
            🔒 Role-Based Access Restriction (Seller Account Active)
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-evergreen">
            {t('sellerValuationBlockedTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-secondarytext leading-relaxed max-w-xl mx-auto">
            {roleCheck.message || t('sellerValuationBlockedDesc')}
          </p>
          <div className="pt-3 flex flex-wrap justify-center gap-3">
            <Link
              to="/dashboard/seller"
              className="px-6 py-3 rounded-xl bg-[#D97706] text-white text-xs sm:text-sm font-bold hover:bg-[#B45309] transition shadow-md"
            >
              Return to Seller Dashboard & Manage Asking Price →
            </Link>
            <Link
              to="/explore"
              className="px-5 py-3 rounded-xl bg-warmivory border border-[#CFC5B0] text-evergreen text-xs sm:text-sm font-bold hover:bg-cream transition"
            >
              Explore Satellite Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedListing = listings.find((l) => l.id === selectedId) || listings[0];

  const handleSelectListing = (id: string) => {
    setSelectedId(id);
    const found = listings.find((l) => l.id === id);
    if (found) setStartingValueINR(found.askingPriceINR);
  };

  const conservativeRate = Math.max(1, annualRatePercent - 2);
  const optimisticRate = annualRatePercent + 2;

  const yearPoints = Array.from({ length: years + 1 }, (_, yr) => ({
    year: yr,
    conservative: calculateProjectedScenarioValue(startingValueINR, conservativeRate, yr),
    selected: calculateProjectedScenarioValue(startingValueINR, annualRatePercent, yr),
    optimistic: calculateProjectedScenarioValue(startingValueINR, optimisticRate, yr),
  }));

  const finalConservative = yearPoints[yearPoints.length - 1].conservative;
  const finalSelected = yearPoints[yearPoints.length - 1].selected;
  const finalOptimistic = yearPoints[yearPoints.length - 1].optimistic;
  const activePoint =
    yearPoints[Math.min(hoveredYear, yearPoints.length - 1)] || yearPoints[yearPoints.length - 1];

  const priceMeta = selectedListing
    ? formatPricePerBighaAndUnit(startingValueINR, selectedListing.areaBigha, areaUnit)
    : null;

  const handleDownloadScenarioSummary = () => {
    const content = [
      'DHARITRI SENTU — BUYER LAND VALUE & APPRECIATION SUMMARY',
      '========================================================',
      `Parcel: ${selectedListing?.title} (${selectedListing?.village}, ${selectedListing?.district})`,
      `Land Size: ${formatAreaWithSecondary(selectedListing?.areaBigha || 2.5, areaUnit)}`,
      `Starting Price (INR): Rs. ${startingValueINR.toLocaleString('en-IN')}`,
      `Rate per Unit: ${priceMeta?.formattedLine || ''}`,
      `Time Horizon: ${years} Years`,
      '',
      `1. Steady Growth (${conservativeRate}%/yr): Rs. ${finalConservative.toLocaleString('en-IN')}`,
      `2. Expected Trajectory (${annualRatePercent}%/yr): Rs. ${finalSelected.toLocaleString('en-IN')}`,
      `3. High-Demand Growth (${optimisticRate}%/yr): Rs. ${finalOptimistic.toLocaleString('en-IN')}`,
      '',
      'Note: Projected values help buyers compare indicative long-term appreciation scenarios.',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dharitri-Sentu-Value-Projection-${selectedListing?.village || 'Plot'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded value projection report (.txt)');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
            Buyer Land Value Insights · Indicative Appreciation Scenarios
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
            Land Price & Value Growth Calculator
          </h1>
          <p className="text-sm text-secondarytext mt-1">
            Compare per-Bigha and per-Acre asking rates against circle guideline benchmarks and explore indicative long-term appreciation scenarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-[#CFC5B0] text-xs">
            <span className="text-secondarytext font-medium">📐 Unit:</span>
            <select
              aria-label="Select Area Unit"
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
              className="font-bold text-evergreen bg-transparent focus:outline-none"
            >
              {(Object.keys(AREA_UNIT_META) as AreaUnit[]).map((u) => (
                <option key={u} value={u}>
                  {AREA_UNIT_META[u].shortLabel}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleDownloadScenarioSummary}
            className="px-4 py-2 rounded-xl bg-evergreen text-warmivory text-xs font-bold hover:bg-teagreen shadow-sm transition"
          >
            ⬇ Download Projection (.txt)
          </button>
        </div>
      </div>

      {/* Official Circle Rate vs Market Price & Live Stamp Duty Calculator */}
      <PricingLegalCostCard
        circleName="Changsari (Kamrup)"
        areaBigha={2.5}
        allowCustomControls={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 Cols: Clean Controls Panel */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#DFD6C3] p-6 space-y-5 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-evergreen">
            Customize Plot & Growth Rate
          </h2>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              Select Land Listing
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleSelectListing(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-warmivory border border-[#CFC5B0] text-xs font-bold text-evergreen"
            >
              {listings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.village} ({item.district}) — ₹{item.askingPriceINR.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-maintext mb-1.5">
              Starting Land Price (INR ₹)
            </label>
            <input
              type="number"
              step={50000}
              min={100000}
              value={startingValueINR}
              onChange={(e) => setStartingValueINR(Math.max(100000, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-bold text-evergreen"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-warmivory border border-[#CFC5B0]">
            <div className="flex justify-between text-xs font-semibold text-maintext mb-1.5">
              <span>Expected Annual Appreciation</span>
              <span className="font-bold text-evergreen">{annualRatePercent}% / year</span>
            </div>
            <input
              type="range"
              min={2}
              max={14}
              step={0.5}
              value={annualRatePercent}
              onChange={(e) => setAnnualRatePercent(Number(e.target.value))}
              className="soft-slider"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-warmivory border border-[#CFC5B0]">
            <div className="flex justify-between text-xs font-semibold text-maintext mb-1.5">
              <span>Holding Period</span>
              <span className="font-bold text-evergreen">{years} Years</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={years}
              onChange={(e) => {
                const nextY = Number(e.target.value);
                setYears(nextY);
                setHoveredYear(nextY);
              }}
              className="soft-slider"
            />
          </div>

          {/* Transparent Per-Unit Breakdown */}
          {selectedListing && priceMeta && (
            <div className="p-4 rounded-2xl bg-palesky/60 border border-mistyblue text-xs space-y-2">
              <div className="font-bold text-evergreen">
                Unit & Circle Guideline Breakdown
              </div>
              <div className="flex justify-between">
                <span className="text-secondarytext">Plot Size:</span>
                <span className="font-bold text-maintext">
                  {formatAreaWithSecondary(selectedListing.areaBigha, areaUnit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondarytext">Seller Asking Rate:</span>
                <span className="font-bold text-evergreen">{priceMeta.formattedLine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondarytext">Circle Guideline Benchmark:</span>
                <span className="font-semibold text-maintext">
                  ₹{selectedListing.benchmarkRatePerBighaINR.toLocaleString('en-IN')} / Bigha
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right 8 Cols: Wide Interactive Trajectory Chart & Scenario Comparison */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#DFD6C3] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-evergreen">
                {years}-Year Indicative Land Value Trajectory
              </h2>
              <p className="text-xs text-secondarytext">
                Click or hover any year marker on the chart to inspect projected values across all three growth scenarios.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-palesky text-evergreen text-xs font-bold">
              Inspecting: Year {activePoint.year}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-warmivory border border-cream">
              <div className="text-xs font-semibold text-secondarytext">
                Steady Scenario ({conservativeRate}%/yr)
              </div>
              <div className="text-xl font-bold text-teagreen mt-1">
                ₹{activePoint.conservative.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-secondarytext mt-1">
                Year {years} Total: ₹{finalConservative.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-palesky border-2 border-evergreen shadow-sm">
              <div className="text-xs font-bold text-evergreen">
                Selected Scenario ({annualRatePercent}%/yr)
              </div>
              <div className="text-xl font-bold text-evergreen mt-1">
                ₹{activePoint.selected.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-teagreen font-semibold mt-1">
                +₹{(activePoint.selected - startingValueINR).toLocaleString('en-IN')} scenario gain by Yr {activePoint.year}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="text-xs font-semibold text-amber-900">
                High-Corridor Scenario ({optimisticRate}%/yr)
              </div>
              <div className="text-xl font-bold text-amber-800 mt-1">
                ₹{activePoint.optimistic.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-amber-800 mt-1">
                Year {years} Total: ₹{finalOptimistic.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Wide Interactive SVG Line Chart */}
          <div className="bg-palesky/40 p-5 rounded-2xl border border-mistyblue">
            <svg viewBox="0 0 680 250" className="w-full h-64 overflow-visible">
              <defs>
                <linearGradient id="explorerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#123F32" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#123F32" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                const y = 205 - r * 165;
                const val = startingValueINR * 0.85 + r * (finalOptimistic * 1.05 - startingValueINR * 0.85);
                return (
                  <g key={idx}>
                    <line
                      x1="60"
                      y1={y}
                      x2="650"
                      y2={y}
                      stroke="rgba(86,102,95,0.18)"
                      strokeDasharray="4 4"
                    />
                    <text x="8" y={y + 4} fontSize="10" fill="#56665F" fontWeight="600">
                      ₹{(val / 100000).toFixed(0)}L
                    </text>
                  </g>
                );
              })}

              <line x1="60" y1="205" x2="650" y2="205" stroke="#56665F" strokeWidth="1.5" />
              <line x1="60" y1="30" x2="60" y2="205" stroke="#56665F" strokeWidth="1.5" />

              {(() => {
                const minV = startingValueINR * 0.85;
                const maxV = finalOptimistic * 1.06;
                const span = Math.max(1, maxV - minV);
                const toCoord = (yrIdx: number, val: number) => ({
                  x: 65 + (yrIdx / Math.max(1, years)) * 575,
                  y: 200 - ((val - minV) / span) * 160,
                });

                const consCoords = yearPoints.map((p, i) => toCoord(i, p.conservative));
                const selCoords = yearPoints.map((p, i) => toCoord(i, p.selected));
                const optCoords = yearPoints.map((p, i) => toCoord(i, p.optimistic));

                const areaPts = [
                  `${selCoords[0].x},205`,
                  ...selCoords.map((c) => `${c.x},${c.y}`),
                  `${selCoords[selCoords.length - 1].x},205`,
                ].join(' ');

                return (
                  <>
                    <polygon points={areaPts} fill="url(#explorerFill)" />
                    <polyline
                      fill="none"
                      stroke="#769B63"
                      strokeWidth="2.2"
                      points={consCoords.map((c) => `${c.x},${c.y}`).join(' ')}
                    />
                    <polyline
                      fill="none"
                      stroke="#123F32"
                      strokeWidth="3.2"
                      points={selCoords.map((c) => `${c.x},${c.y}`).join(' ')}
                    />
                    <polyline
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="2.2"
                      strokeDasharray="6 4"
                      points={optCoords.map((c) => `${c.x},${c.y}`).join(' ')}
                    />

                    {yearPoints.map((pt, i) => {
                      const c = selCoords[i];
                      const isHovered = pt.year === activePoint.year;
                      const showLabel =
                        pt.year === 0 ||
                        pt.year === years ||
                        pt.year === Math.round(years / 2) ||
                        isHovered;

                      return (
                        <g
                          key={pt.year}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredYear(pt.year)}
                          onClick={() => setHoveredYear(pt.year)}
                        >
                          {isHovered && (
                            <line
                              x1={c.x}
                              y1="30"
                              x2={c.x}
                              y2="205"
                              stroke="#123F32"
                              strokeDasharray="3 3"
                            />
                          )}
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={isHovered ? 6.5 : 4}
                            fill={isHovered ? '#D97706' : '#123F32'}
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                          {showLabel && (
                            <>
                              <text
                                x={c.x}
                                y={c.y - 10}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="700"
                                fill="#123F32"
                              >
                                ₹{(pt.selected / 100000).toFixed(1)}L
                              </text>
                              <text
                                x={c.x}
                                y="225"
                                textAnchor="middle"
                                fontSize="10.5"
                                fontWeight={isHovered ? '700' : '500'}
                                fill="#172E29"
                              >
                                Yr {pt.year}
                              </text>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          <p className="text-xs text-secondarytext">{t('priceDisclaimer')}</p>
        </div>
      </div>
    </div>
  );
};
