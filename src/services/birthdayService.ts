import { getISTDate } from './contentEngine/istTime';
import { authStore } from './authStore';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { toastManager } from '../components/ActivityToasts';

export interface BirthdayCelebrant {
  id: string;
  name: string;
  birthday: string; // YYYY-MM-DD or MM-DD
  avatarUrl: string;
  photoIndices: number[];
  age?: number;
}

const BIRTHDAYS_STORAGE_KEY = 'ourcircle_cousin_birthdays';

class BirthdayService {
  private birthdays: Record<string, string> = {};
  private listeners: ((celebrants: BirthdayCelebrant[]) => void)[] = [];
  private activeCelebration: BirthdayCelebrant | null = null;
  private celebrationListeners: ((celebrant: BirthdayCelebrant | null) => void)[] = [];

  constructor() {
    this.loadBirthdays();
  }

  private loadBirthdays() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(BIRTHDAYS_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          this.birthdays = parsed as Record<string, string>;
        }
      }
    } catch {
      // fallback
    }
  }

  public registerCousinBirthday(cousinId: string, birthday: string) {
    this.birthdays[cousinId] = birthday;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BIRTHDAYS_STORAGE_KEY, JSON.stringify(this.birthdays));
      } catch {
        // ignore
      }
    }
    this.notifyCelebrants();
  }

  // Check if today matches any cousin's birthday in Asia/Kolkata
  public getTodaysBirthdays(): BirthdayCelebrant[] {
    const ist = getISTDate();
    const currentMonth = ist.getMonth() + 1; // 1-12
    const currentDay = ist.getDate(); // 1-31

    const celebrants: BirthdayCelebrant[] = [];

    // Check registered profiles from authStore
    const user = authStore.getCurrentUser();
    if (user && user.birthday) {
      const parts = user.birthday.split('-');
      if (parts.length >= 3) {
        const bMonth = parseInt(parts[1], 10);
        const bDay = parseInt(parts[2], 10);
        if (bMonth === currentMonth && bDay === currentDay) {
          celebrants.push({
            id: user.email,
            name: user.name,
            birthday: user.birthday,
            avatarUrl: user.avatarUrl,
            photoIndices: [],
            age: ist.getFullYear() - parseInt(parts[0], 10),
          });
        }
      }
    }

    return celebrants;
  }

  // Trigger grand celebration animation, sounds, and auto-scroll
  public launchCelebration(celebrant: BirthdayCelebrant) {
    this.activeCelebration = celebrant;
    this.notifyActiveCelebration(celebrant);

    // Audio chime
    soundEngine.chime();

    // Multi-stage confetti cannons
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.3 },
      colors: ['#DFBE8A', '#FFB703', '#FF007F', '#00F5D4', '#FFFFFF'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
      });
    }, 400);

    toastManager.showToast(`🎉 Happy Birthday, ${celebrant.name}! 🎂`);

    // No photo-to-person mapping is available, so do not imply that specific
    // memories belong to the celebrant.
  }

  public dismissCelebration() {
    this.activeCelebration = null;
    this.notifyActiveCelebration(null);
  }

  public getActiveCelebration(): BirthdayCelebrant | null {
    return this.activeCelebration;
  }

  public onCelebrationChange(callback: (celebrant: BirthdayCelebrant | null) => void) {
    this.celebrationListeners.push(callback);
    callback(this.activeCelebration);
    return () => {
      this.celebrationListeners = this.celebrationListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyActiveCelebration(celebrant: BirthdayCelebrant | null) {
    this.celebrationListeners.forEach((fn) => fn(celebrant));
  }

  private notifyCelebrants() {
    const list = this.getTodaysBirthdays();
    this.listeners.forEach((fn) => fn(list));
  }
}

export const birthdayService = new BirthdayService();
