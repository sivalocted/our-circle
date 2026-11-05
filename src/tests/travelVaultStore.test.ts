import { beforeEach, describe, expect, it } from 'vitest';
import { travelVaultStore } from '../services/travelVaultStore';

describe('travelVaultStore safety', () => {
  beforeEach(() => {
    expect(travelVaultStore.getTotalPooled()).toBe(0);
  });

  it('does not expose payment details when no payment service is configured', () => {
    expect(travelVaultStore.getPublicUpiId()).toBe('');
    expect(travelVaultStore.getBeneficiaryName()).toBe('');
    expect(travelVaultStore.getAdminBankDetails()).toBeNull();
    expect(travelVaultStore.generateUpiDeepLink(450)).toBeNull();
    expect(travelVaultStore.getDynamicQrUrl(450)).toBeNull();
  });

  it('never counts browser-stored contribution claims as cleared funds', () => {
    expect(travelVaultStore.getTotalPooled()).toBe(0);
    expect(travelVaultStore.getProgressPercentage()).toBe(0);
  });

  it('refuses to create a contribution until server-side payment verification exists', () => {
    expect(() => travelVaultStore.recordContribution(450, 'razorpay', 'Test entry')).toThrow(/server-side payment/);
    expect(travelVaultStore.getTotalPooled()).toBe(0);
  });

  it('does not let the browser verify a contribution', () => {
    expect(travelVaultStore.verifyContribution('any-id')).toBe(false);
  });
});
