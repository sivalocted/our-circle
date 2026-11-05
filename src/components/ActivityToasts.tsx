import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

export interface ActivityToastEvent {
  id: string;
  message: string;
  timestamp: number;
}

class ToastManager {
  private listeners: ((toast: ActivityToastEvent) => void)[] = [];
  private lastToastTime = 0;
  private minIntervalMs = 15000; // 15 seconds rate limit

  public showToast(message: string) {
    const now = Date.now();
    if (now - this.lastToastTime < this.minIntervalMs) return;
    this.lastToastTime = now;

    const toast: ActivityToastEvent = {
      id: `toast_${now}_${Math.random().toString(36).substring(2, 6)}`,
      message,
      timestamp: now,
    };

    this.listeners.forEach((fn) => fn(toast));
  }

  public subscribe(callback: (toast: ActivityToastEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }
}

export const toastManager = new ToastManager();

interface ActivityToastsProps {
  enabled?: boolean;
}

export const ActivityToasts: React.FC<ActivityToastsProps> = ({ enabled = true }) => {
  const [activeToast, setActiveToast] = useState<ActivityToastEvent | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = toastManager.subscribe((toast) => {
      setActiveToast(toast);
      const timer = setTimeout(() => {
        setActiveToast((current) => (current?.id === toast.id ? null : current));
      }, 4200);
      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, [enabled]);

  if (!enabled || !activeToast) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={activeToast.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-[#DFBE8A]/40 text-white shadow-2xl max-w-sm"
        >
          <div className="w-6 h-6 rounded-full bg-[#DFBE8A]/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#DFBE8A]" />
          </div>

          <span className="text-xs font-mono font-medium text-stone-200">
            {activeToast.message}
          </span>

          <button
            onClick={() => setActiveToast(null)}
            className="p-1 rounded-full text-stone-400 hover:text-white transition-colors cursor-pointer"
            title="Dismiss Notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
