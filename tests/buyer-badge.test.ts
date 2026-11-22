import { getBuyerTrustBadge } from '../src/utils/landUnitsAndBadges';
import { describe, it, expect } from 'vitest';

describe('Buyer Trust Badge Rules', () => {
  it('does NOT grant Clear Title to listings awaiting review or review pending', () => {
    const pendingListing: any = {
      id: 'lst-test',
      status: 'Awaiting Review',
      passportSummary: {
        matchedCount: 4,
        discrepancyCount: 0,
        overallStatus: 'Pending Authorised Review'
      }
    };
    const badge = getBuyerTrustBadge(pendingListing);
    expect(badge.label).toBe('Review Pending');
    expect(badge.label).not.toBe('Clear Title');
  });

  it('only grants Clear Title to Approved for Listing with verified passport', () => {
    const approvedListing: any = {
      id: 'lst-test-2',
      status: 'Approved for Listing',
      passportSummary: {
        matchedCount: 4,
        discrepancyCount: 0,
        overallStatus: 'Reviewed in Demo'
      }
    };
    const badge = getBuyerTrustBadge(approvedListing);
    expect(badge.label).toBe('Clear Title');
  });
});
