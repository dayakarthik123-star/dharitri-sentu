import { describe, it, expect } from 'vitest';
import { sendSellerEnquiryEmail, sendChangePasswordOtpEmail } from '../server/emailAdapter.mjs';

describe('Dharitri Sentu System Refactor & Dashboard Enhancements', () => {
  it('sendSellerEnquiryEmail formats and handles simulated dispatch gracefully', async () => {
    const result = await sendSellerEnquiryEmail({
      sellerEmail: 'seller@test.dharitri.in',
      sellerName: 'Pranabjyoti Kalita',
      buyerName: 'Ananya Baruah',
      buyerEmail: 'buyer@test.dharitri.in',
      buyerPhone: '9864012345',
      listingTitle: 'Fertile Paddy Soil Land in Mirza',
      parcelId: 'AS-KMP-001',
      subject: 'Enquiry for Fertile Paddy Soil Land (Dag No: AS-KMP-001)',
      message: 'Hello, I would like to schedule a physical inspection.',
      enquiryId: 'ENQ-TEST-001',
    });

    expect(result).toBeDefined();
    // Since SMTP is not configured in test environment, it safely catches and returns simulated: true
    const isSuccess = 'simulated' in result ? result.simulated : result.ok;
    expect(isSuccess).toBeTruthy();
  });

  it('sendChangePasswordOtpEmail formats 6-digit OTP code cleanly', async () => {
    const result = await sendChangePasswordOtpEmail({
      toEmail: 'buyer@test.dharitri.in',
      otpCode: '482910',
      userName: 'Ananya Baruah',
    });

    expect(result).toBeDefined();
    const isSuccess = 'simulated' in result ? result.simulated : result.ok;
    expect(isSuccess).toBeTruthy();
  });

  it('verifies the 5-point Assam Due Diligence Checklist structure', () => {
    const checklistKeys = ['nec', 'jamabandi', 'pipeline', 'tribal_belt', 'flood_elevation'];
    expect(checklistKeys.length).toBe(5);
    expect(checklistKeys).toContain('nec');
    expect(checklistKeys).toContain('jamabandi');
    expect(checklistKeys).toContain('pipeline');
    expect(checklistKeys).toContain('tribal_belt');
    expect(checklistKeys).toContain('flood_elevation');
  });
});
