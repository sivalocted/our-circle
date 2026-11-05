import { toastManager } from '../components/ActivityToasts';
import { soundEngine } from '../utils/audio';

class NotificationService {
  private permission: NotificationPermission = 'default';
  private onNotificationClickHandlers: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (this.isSupported()) {
      return this.permission;
    }
    return 'denied';
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      toastManager.showToast('Web notifications are not supported by this browser.');
      return false;
    }

    try {
      soundEngine.tick();
      const res = await Notification.requestPermission();
      this.permission = res;
      if (res === 'granted') {
        soundEngine.chime();
        toastManager.showToast('Browser notifications are enabled for incoming circle messages.');
        return true;
      } else {
        toastManager.showToast('Notification permission was declined.');
        return false;
      }
    } catch {
      return false;
    }
  }

  public sendNotification(title: string, options?: NotificationOptions) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      // In-app toast fallback
      if (options?.body) {
        toastManager.showToast(`${title}: ${options.body}`);
      }
      return;
    }

    try {
      const notif = new Notification(title, {
        badge: '/favicon.svg',
        tag: 'ourcircle_notification',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        this.onNotificationClickHandlers.forEach((fn) => fn());
        notif.close();
      };
    } catch {
      // If mobile or OS restricts notification constructor, fallback to in-app toast
      if (options?.body) {
        toastManager.showToast(`${title}: ${options.body}`);
      }
    }
  }

  // Cousin chat message alert
  public notifyChatMessage(senderName: string, text: string, avatarUrl?: string) {
    // Only send system notification if tab is in the background or blurred
    const isDocumentHidden = typeof document !== 'undefined' && document.hidden;
    if (isDocumentHidden) {
      this.sendNotification(`${senderName} in Our Circle 💬`, {
        body: text,
        icon: avatarUrl || '/favicon.svg',
      });
    }
  }

  // Birthday reminder notification
  public notifyBirthday(celebrantName: string) {
    this.sendNotification(`🎉 It's ${celebrantName}'s Birthday Today! 🎂`, {
      body: `Tap to see celebratory memories and send your wishes to ${celebrantName}!`,
      icon: '/favicon.svg',
    });
  }

  // Travel savings contribution alert
  public notifyTravelContribution(cousinName: string, amount: number, tripName: string) {
    this.sendNotification(`🌴 Travel Fund Updated!`, {
      body: `${cousinName} contributed ₹${amount.toLocaleString('en-IN')} towards ${tripName}!`,
      icon: '/favicon.svg',
    });
  }

  public onNotificationClick(callback: () => void) {
    this.onNotificationClickHandlers.push(callback);
    return () => {
      this.onNotificationClickHandlers = this.onNotificationClickHandlers.filter((cb) => cb !== callback);
    };
  }
}

export const notificationService = new NotificationService();
