import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, User, ArrowRight } from 'lucide-react';
import { authStore, createInitialAvatar, type UserProfile } from '../../services/authStore';
import { birthdayService } from '../../services/birthdayService';
import { soundEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { toastManager } from '../ActivityToasts';

interface OnboardingModalProps {
  user: UserProfile;
  onComplete: (updated: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
  const [name, setName] = useState(user.name || '');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [upiHandle, setUpiHandle] = useState(user.upiHandle || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastManager.showToast('Please enter your name');
      return;
    }
    if (!birthday) {
      toastManager.showToast('Please select your birthday');
      return;
    }

    soundEngine.chime();
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });

    const updated = authStore.completeOnboarding({
      name: name.trim(),
      birthday,
      avatarUrl: createInitialAvatar(name.trim()),
      upiHandle: upiHandle.trim(),
    });

    if (updated) {
      // Register with birthday service so automated celebrations trigger
      birthdayService.registerCousinBirthday(updated.email, birthday);
      toastManager.showToast(`Welcome to the family circle, ${updated.name}! 🎉`);
      onComplete(updated);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-md rounded-3xl bg-[#141210] border border-[#DFBE8A]/40 p-6 sm:p-8 text-white shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white tracking-tight">
              Welcome to Our Circle
            </h3>
            <p className="text-xs font-mono text-stone-400">
              Please enter your real name and birthday to complete your profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-stone-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Real Name / Nickname</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#DFBE8A] text-white text-xs font-mono outline-none"
                required
              />
            </div>

            {/* 2. Birthday */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-stone-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Birthday</span>
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#DFBE8A] text-white text-xs font-mono outline-none"
                required
              />
              <p className="text-[10px] font-mono text-stone-500">
                🎂 The circle will automatically scroll to your memories & celebrate on your special day!
              </p>
            </div>

            {/* 3. Optional UPI Handle */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-stone-300">
                UPI Handle for Travel Fund (Optional)
              </label>
              <input
                type="text"
                value={upiHandle}
                onChange={(e) => setUpiHandle(e.target.value)}
                placeholder="e.g. yourname@okhdfcbank"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#DFBE8A] text-white text-xs font-mono outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl font-mono text-xs font-bold bg-gradient-to-r from-[#DFBE8A] to-[#B3874B] text-black hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Join Circle</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
