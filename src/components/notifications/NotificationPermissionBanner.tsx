import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { soundEngine } from '../../utils/audio';

const STORAGE_KEY = 'ourcircle_notif_banner_dismissed';

export const NotificationPermissionBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!notificationService.isSupported()) return;

    const currentPerm = notificationService.getPermission();
    if (currentPerm === 'default') {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Show after a gentle 2.5 second delay so page isn't crowded instantly
        const timer = setTimeout(() => setShow(true), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (!show) return null;

  const handleAllow = async () => {
    soundEngine.tick();
    await notificationService.requestPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    soundEngine.tick();
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        aria-label="Notification permissions prompt"
        className="fixed bottom-6 left-4 sm:left-8 z-40 max-w-sm rounded-2xl p-4 bg-[#141210]/95 backdrop-blur-2xl border border-amber-400/40 shadow-2xl shadow-black/95 text-white select-none"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>

          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <span>Stay In The Loop 🔔</span>
            </h4>
            <p className="text-[11px] font-sans text-stone-300 leading-snug">
              Allow notifications for incoming circle messages when this page is in the background.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleAllow}
                className="px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Allow Notifications</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-lg font-mono text-xs text-stone-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-stone-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
