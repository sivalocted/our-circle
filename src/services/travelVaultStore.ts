import { authStore } from './authStore';

export interface TripGoal {
  destination: string;
  targetAmount: number;
  departureDate: string;
  description: string;
  bannerImage: string;
}

export interface BankConfig {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  beneficiaryName: string;
  upiId: string;
}

export interface Contribution {
  id: string;
  cousinName: string;
  cousinEmail: string;
  amount: number;
  paymentMethod: 'razorpay' | 'upi_qr' | 'manual';
  timestamp: number;
  razorpayPaymentId?: string;
  status: 'verified' | 'pending';
  note?: string;
}

const VAULT_STORAGE_KEY = 'ourcircle_travel_vault_state';

const DEFAULT_TRIP_GOAL: TripGoal = {
  destination: '',
  targetAmount: 0,
  departureDate: '',
  description: '',
  bannerImage: '',
};

const DEFAULT_BANK_CONFIG: BankConfig = {
  accountNumber: '',
  ifscCode: '',
  bankName: '',
  beneficiaryName: '',
  upiId: '',
};

class TravelVaultStore {
  private tripGoal: TripGoal = DEFAULT_TRIP_GOAL;
  private bankConfig: BankConfig = DEFAULT_BANK_CONFIG;
  private contributions: Contribution[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof window === 'undefined') return;
    try {
      const rawVault = localStorage.getItem(VAULT_STORAGE_KEY);
      if (rawVault) {
        const parsed = JSON.parse(rawVault);
        if (parsed.tripGoal) this.tripGoal = parsed.tripGoal;
        if (parsed.contributions) {
          this.contributions = (parsed.contributions as Contribution[]).filter(
            // Remove the known prototype transaction only; keep other user-entered records.
            (c) => c.id !== 'con_1' && c.razorpayPaymentId !== 'pay_M9aK38dF92kz'
          );
        }
      }
      this.saveState();
    } catch {
      // fallback
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        VAULT_STORAGE_KEY,
        JSON.stringify({ tripGoal: this.tripGoal, contributions: this.contributions })
      );
    } catch {
      // ignore
    }
    this.notify();
  }

  // Public data for all cousins
  public getTripGoal(): TripGoal {
    return { ...this.tripGoal };
  }

  public getContributions(): Contribution[] {
    return [...this.contributions].sort((a, b) => b.timestamp - a.timestamp);
  }

  public getTotalPooled(): number {
    // Browser storage is user-editable, so it cannot establish cleared funds.
    return 0;
  }

  public getProgressPercentage(): number {
    if (!this.tripGoal.targetAmount) return 0;
    return Math.min(100, Math.round((this.getTotalPooled() / this.tripGoal.targetAmount) * 100));
  }

  // Public UPI ID for scanning & paying (safe to share with cousins)
  public getPublicUpiId(): string {
    return '';
  }

  public getBeneficiaryName(): string {
    return '';
  }

  // Sensitive bank details — ADMIN ONLY
  public getAdminBankDetails(): BankConfig | null {
    return null;
  }

  public updateBankDetails(config: BankConfig): boolean {
    void config;
    return false;
  }

  public updateTripGoal(goal: Partial<TripGoal>): boolean {
    if (!authStore.isAdmin()) return false;
    this.tripGoal = { ...this.tripGoal, ...goal };
    this.saveState();
    return true;
  }

  // Record a new contribution
  public recordContribution(
    amount: number,
    paymentMethod: 'razorpay' | 'upi_qr' | 'manual',
    note?: string,
    razorpayPaymentId?: string
  ): Contribution {
    void amount;
    void paymentMethod;
    void note;
    void razorpayPaymentId;
    throw new Error('Contributions are disabled until server-side payment creation and verification are configured.');
  }

  // Admin approves manual/QR transfer
  public verifyContribution(id: string): boolean {
    void id;
    return false;
  }

  // UPI QR Code and Link Generator
  public generateUpiDeepLink(amount?: number): string | null {
    const upiId = this.bankConfig.upiId;
    if (!upiId) return null;
    const name = encodeURIComponent(this.bankConfig.beneficiaryName);
    const note = encodeURIComponent('Our Circle Travel Savings');
    let link = `upi://pay?pa=${upiId}&pn=${name}&tn=${note}&cu=INR`;
    if (amount && amount > 0) {
      link += `&am=${amount}`;
    }
    return link;
  }

  public getDynamicQrUrl(amount?: number): string | null {
    const deepLink = this.generateUpiDeepLink(amount);
    if (!deepLink) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
      deepLink
    )}`;
  }

  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const travelVaultStore = new TravelVaultStore();
