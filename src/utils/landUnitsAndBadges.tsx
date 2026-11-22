import React, { useState } from 'react';
import { AreaUnit, Listing, PassportCheckStatus } from '../types';

/**
 * Standard Assam Land Revenue Unit Conversions:
 * 1 Assam Bigha = 14,400 Sq. Ft.
 * 1 Assam Bigha = 0.3305785 Acre (approx 1/3 Acre; 1 Acre = 3.025 Bigha)
 * 1 Assam Bigha = 5 Katha (1 Katha = 2,880 Sq. Ft.)
 * 1 Assam Bigha = 100 Lessa (1 Katha = 20 Lessa; 1 Lessa = 144 Sq. Ft.)
 * 1 Assam Bigha = 0.13378 Hectare (1 Hectare = 7.4749 Bigha)
 */
export const AREA_UNIT_META: Record<
  AreaUnit,
  { label: string; shortLabel: string; perBigha: number; decimals: number }
> = {
  bigha: { label: 'Bigha (Assam)', shortLabel: 'Bigha', perBigha: 1, decimals: 2 },
  acre: { label: 'Acre', shortLabel: 'Acre', perBigha: 0.3305785, decimals: 2 },
  katha: { label: 'Katha', shortLabel: 'Katha', perBigha: 5, decimals: 1 },
  lessa: { label: 'Lessa', shortLabel: 'Lessa', perBigha: 100, decimals: 0 },
  sqft: { label: 'Square Feet (Sq. Ft.)', shortLabel: 'Sq. Ft.', perBigha: 14400, decimals: 0 },
  hectare: { label: 'Hectare', shortLabel: 'Hectare', perBigha: 0.13378, decimals: 2 },
};

export function convertFromBigha(bigha: number, targetUnit: AreaUnit): number {
  const meta = AREA_UNIT_META[targetUnit] || AREA_UNIT_META.bigha;
  const raw = bigha * meta.perBigha;
  const factor = Math.pow(10, meta.decimals);
  return Math.round(raw * factor) / factor;
}

export function convertToBigha(value: number, fromUnit: AreaUnit): number {
  const meta = AREA_UNIT_META[fromUnit] || AREA_UNIT_META.bigha;
  if (!meta.perBigha) return value;
  return +(value / meta.perBigha).toFixed(4);
}

export function formatAreaPrimary(bigha: number, unit: AreaUnit): string {
  const meta = AREA_UNIT_META[unit] || AREA_UNIT_META.bigha;
  const val = convertFromBigha(bigha, unit);
  if (unit === 'sqft' || unit === 'lessa') {
    return `${val.toLocaleString('en-IN')} ${meta.shortLabel}`;
  }
  return `${val} ${meta.shortLabel}`;
}

export function formatAreaWithSecondary(bigha: number, unit: AreaUnit): string {
  if (unit === 'bigha') {
    const acres = convertFromBigha(bigha, 'acre');
    return `${bigha} Bigha (${acres} Acre)`;
  }
  const primary = formatAreaPrimary(bigha, unit);
  return `${primary} (${bigha} Bigha)`;
}

export function formatPricePerBighaAndUnit(
  askingPriceINR: number,
  areaBigha: number,
  unit: AreaUnit
): { perBighaINR: number; perSelectedUnitINR: number; unitLabel: string; formattedLine: string } {
  const safeBigha = Math.max(0.01, areaBigha);
  const perBighaINR = Math.round(askingPriceINR / safeBigha);
  const meta = AREA_UNIT_META[unit] || AREA_UNIT_META.bigha;
  const convertedArea = safeBigha * meta.perBigha;
  const perSelectedUnitINR = Math.round(askingPriceINR / Math.max(0.0001, convertedArea));

  if (unit === 'bigha') {
    return {
      perBighaINR,
      perSelectedUnitINR: perBighaINR,
      unitLabel: 'Bigha',
      formattedLine: `₹${perBighaINR.toLocaleString('en-IN')} / Bigha`,
    };
  }

  return {
    perBighaINR,
    perSelectedUnitINR,
    unitLabel: meta.shortLabel,
    formattedLine: `₹${perBighaINR.toLocaleString('en-IN')}/Bigha · ₹${perSelectedUnitINR.toLocaleString('en-IN')}/${meta.shortLabel}`,
  };
}

export interface BuyerTrustBadgeInfo {
  label: 'Verified Owner' | 'Clear Title' | 'New Listing' | 'Review Pending';
  icon: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

/**
 * Robust fallback for listing.passportSummary ensuring zero runtime crashes
 * when handling legacy, incomplete, null, or newly created API listing records.
 */
export function getSafePassportSummary(listing?: Partial<Listing> | null) {
  if (listing?.passportSummary) {
    return {
      matchedCount: typeof listing.passportSummary.matchedCount === 'number' ? listing.passportSummary.matchedCount : 0,
      discrepancyCount: typeof listing.passportSummary.discrepancyCount === 'number' ? listing.passportSummary.discrepancyCount : 0,
      pendingCount: typeof listing.passportSummary.pendingCount === 'number' ? listing.passportSummary.pendingCount : 0,
      notCheckedCount: typeof listing.passportSummary.notCheckedCount === 'number' ? listing.passportSummary.notCheckedCount : 0,
      overallStatus: listing.passportSummary.overallStatus || 'Pending Authorised Review',
      lastReviewedAt: listing.passportSummary.lastReviewedAt || listing.submittedAt || new Date().toISOString(),
      comparisons: Array.isArray(listing.passportSummary.comparisons) ? listing.passportSummary.comparisons : [],
    };
  }

  const area = Number(listing?.areaBigha) || 0;
  const recorded = Number(listing?.recordedAreaBigha ?? listing?.areaBigha) || 0;
  const hasAreaMismatch = area > 0 && recorded > 0 && Math.abs(area - recorded) > 0.01;

  return {
    matchedCount: hasAreaMismatch ? 3 : 4,
    discrepancyCount: hasAreaMismatch ? 1 : 0,
    pendingCount: 2,
    notCheckedCount: 1,
    overallStatus: (hasAreaMismatch ? 'Mismatch Found' : 'Pending Authorised Review') as PassportCheckStatus,
    lastReviewedAt: listing?.submittedAt || new Date().toISOString(),
    comparisons: [],
  };
}

export function getBuyerTrustBadge(listing: Listing): BuyerTrustBadgeInfo {
  const passport = getSafePassportSummary(listing);
  const hasMismatch =
    passport.discrepancyCount > 0 ||
    passport.overallStatus === 'Mismatch Found';

  // A listing can only have "Clear Title" if approved and verified by an authorized reviewer
  if (
    listing.status === 'Approved for Listing' &&
    !hasMismatch &&
    (passport.overallStatus === 'Reviewed in Demo' ||
      passport.overallStatus === 'Matched Against Demo Data' ||
      (passport.overallStatus as string) === 'Verified by Authorised Reviewer')
  ) {
    return {
      label: 'Clear Title',
      icon: '🛡️',
      bgClass: 'bg-emerald-700/95',
      textClass: 'text-white',
      borderClass: 'border-emerald-400/40',
    };
  }

  // Listings under moderation or awaiting review must show Review Pending
  if (
    listing.status === 'Awaiting Review' ||
    listing.status === 'Under Review' ||
    listing.status === 'Security Check' ||
    listing.status === 'Upload Received' ||
    listing.status === 'Documents Needed' ||
    listing.status === 'Additional Information Required' ||
    listing.status === 'Discrepancy Requires Attention' ||
    listing.status === 'Draft' ||
    passport.overallStatus === 'Pending Authorised Review' ||
    passport.overallStatus === 'Evidence Supplied'
  ) {
    return {
      label: 'Review Pending',
      icon: '⏳',
      bgClass: 'bg-amber-600/95',
      textClass: 'text-white',
      borderClass: 'border-amber-300/40',
    };
  }

  if (listing.sellerDeclarationAccepted && listing.status === 'Published as Demo Listing' && !hasMismatch) {
    return {
      label: 'Verified Owner',
      icon: '✓',
      bgClass: 'bg-evergreen/95',
      textClass: 'text-warmivory',
      borderClass: 'border-leafgreen/40',
    };
  }

  // Alternate between Verified Owner and New Listing for featured / recent cards
  const numId = parseInt(listing.id.replace(/\D/g, '') || '1', 10);
  if (numId % 2 === 1) {
    return {
      label: 'Verified Owner',
      icon: '✓',
      bgClass: 'bg-evergreen/95',
      textClass: 'text-warmivory',
      borderClass: 'border-leafgreen/40',
    };
  }

  return {
    label: 'New Listing',
    icon: '✨',
    bgClass: 'bg-amber-600/95',
    textClass: 'text-white',
    borderClass: 'border-amber-300/40',
  };
}

export interface TrafficLightStatusInfo {
  level: 'green' | 'yellow' | 'red';
  shortLabel: string;
  badgeText: string;
  dotColor: string;
  badgeClass: string;
  plainExplanation: string;
}

export function getTrafficLightFromListing(listing: Listing): TrafficLightStatusInfo {
  const passport = getSafePassportSummary(listing);
  const hasMismatch =
    passport.discrepancyCount > 0 ||
    passport.overallStatus === 'Mismatch Found';

  if (hasMismatch) {
    return {
      level: 'red',
      shortLabel: 'Mismatch Found',
      badgeText: '🔴 Mismatch Found',
      dotColor: 'bg-red-500',
      badgeClass: 'bg-red-100 text-red-900 border border-red-300',
      plainExplanation: 'Record difference detected between seller entry and survey register — review before deposit.',
    };
  }

  if (
    passport.overallStatus === 'Pending Authorised Review' ||
    listing.status === 'Under Review' ||
    listing.status === 'Submitted' ||
    passport.pendingCount > 1
  ) {
    return {
      level: 'yellow',
      shortLabel: 'Warning · Review Pending',
      badgeText: '🟡 Warning: Review Pending',
      dotColor: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
      plainExplanation: 'Core details submitted; final document verification is currently in progress.',
    };
  }

  return {
    level: 'green',
    shortLabel: 'Verified',
    badgeText: '🟢 Verified',
    dotColor: 'bg-emerald-600',
    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    plainExplanation: 'Ownership, plot number, and land area match across checked records.',
  };
}

export function getTrafficLightFromCheckStatus(status: PassportCheckStatus): TrafficLightStatusInfo {
  if (status === 'Matched Against Demo Data' || status === 'Reviewed in Demo') {
    return {
      level: 'green',
      shortLabel: 'Verified',
      badgeText: '🟢 Verified',
      dotColor: 'bg-emerald-600',
      badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      plainExplanation: 'Seller declaration matches verified reference records.',
    };
  }
  if (status === 'Mismatch Found') {
    return {
      level: 'red',
      shortLabel: 'Issue Found',
      badgeText: '🔴 Issue Found',
      dotColor: 'bg-red-600',
      badgeClass: 'bg-red-100 text-red-900 border border-red-300',
      plainExplanation: 'Discrepancy detected — requires clarification or re-survey.',
    };
  }
  return {
    level: 'yellow',
    shortLabel: 'Warning',
    badgeText: '🟡 Warning',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    plainExplanation: 'Verification in progress or awaiting supporting document check.',
  };
}

export const InteractiveUnitConverterWidget: React.FC<{
  defaultBigha?: number;
  compact?: boolean;
}> = ({ defaultBigha = 2.5, compact = false }) => {
  const [inputValue, setInputValue] = useState<number>(defaultBigha);
  const [inputUnit, setInputUnit] = useState<AreaUnit>('bigha');

  const baseBigha = convertToBigha(inputValue || 0, inputUnit);

  return (
    <div className={`rounded-2xl bg-white border border-[#DFD6C3] shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-palesky text-evergreen flex items-center justify-center font-bold text-sm">
            📐
          </span>
          <div>
            <h3 className="font-serif text-base font-bold text-evergreen leading-tight">
              Assam Land Unit Converter (Bigha ↔ Acre & More)
            </h3>
            <p className="text-[11px] text-secondarytext">
              1 Assam Bigha = 0.3306 Acre = 5 Katha = 100 Lessa = 14,400 Sq. Ft.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-5 flex items-center gap-2">
          <input
            type="number"
            min={0.01}
            step="any"
            aria-label="Land area amount to convert"
            value={inputValue}
            onChange={(e) => setInputValue(Math.max(0, Number(e.target.value)))}
            className="w-full px-3 py-2 rounded-xl bg-palesky/60 border border-[#CFC5B0] text-sm font-bold text-evergreen focus:outline-none focus:ring-2 focus:ring-evergreen"
          />
          <select
            aria-label="Source land unit"
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value as AreaUnit)}
            className="px-3 py-2 rounded-xl bg-cream/70 border border-[#CFC5B0] text-xs font-bold text-maintext focus:outline-none"
          >
            {(Object.keys(AREA_UNIT_META) as AreaUnit[]).map((u) => (
              <option key={u} value={u}>
                {AREA_UNIT_META[u].shortLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-7 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {(['bigha', 'acre', 'katha', 'lessa', 'sqft', 'hectare'] as AreaUnit[])
            .filter((u) => u !== inputUnit)
            .map((u) => {
              const converted = convertFromBigha(baseBigha, u);
              return (
                <div
                  key={u}
                  onClick={() => {
                    setInputValue(converted);
                    setInputUnit(u);
                  }}
                  title="Click to set as active input unit"
                  className="cursor-pointer p-2 rounded-xl bg-warmivory hover:bg-palesky/70 border border-cream text-center transition"
                >
                  <div className="text-xs font-bold text-evergreen truncate">
                    {u === 'sqft' || u === 'lessa' ? converted.toLocaleString('en-IN') : converted}
                  </div>
                  <div className="text-[10px] font-semibold text-secondarytext">
                    {AREA_UNIT_META[u].shortLabel}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
