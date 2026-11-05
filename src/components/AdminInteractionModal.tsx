import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Bell, Volume2, Sparkles, Eye } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export interface InteractionSettings {
  activityToasts: boolean;
  floatingReactions: boolean;
  soundEffects: boolean;
  reducedMotion: boolean;
}

interface InteractionPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  settings: InteractionSettings;
  onUpdateSettings: (newSettings: InteractionSettings) => void;
}

export const AdminInteractionModal: React.FC<InteractionPreferencesProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const toggle = (key: keyof InteractionSettings) => {
    soundEngine.tick();
    onUpdateSettings({ ...settings, [key]: !settings[key] });
  };

  const preferences = [
    { key: 'activityToasts' as const, icon: Bell, title: 'Activity toasts', detail: 'Brief confirmations for actions on this device.' },
    { key: 'floatingReactions' as const, icon: Sparkles, title: 'Floating reactions', detail: 'Show live reactions while you are signed in.' },
    { key: 'soundEffects' as const, icon: Volume2, title: 'Interface sounds', detail: 'Play short sounds for interactive controls.' },
    { key: 'reducedMotion' as const, icon: Eye, title: 'Reduce motion', detail: 'Limit animation and automatic media movement.' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <motion.section role="dialog" aria-modal="true" aria-labelledby="preferences-title" initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="w-full max-w-lg space-y-4 rounded-3xl border border-[#DFBE8A]/40 bg-[#141210] p-5 text-white shadow-2xl sm:p-6">
          <header className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#DFBE8A]/30 bg-white/10 text-[#DFBE8A]"><Sliders className="h-4 w-4" /></span>
              <div><h2 id="preferences-title" className="font-serif text-lg font-bold">Preferences</h2><p className="text-xs text-stone-400">These settings apply on this device.</p></div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close preferences" className="rounded-full p-2 text-stone-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </header>

          <div className="space-y-3">
            {preferences.map(({ key, icon: Icon, title, detail }) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-3">
                <span className="flex items-center gap-3"><Icon className="h-4 w-4 shrink-0 text-[#DFBE8A]" /><span><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-xs leading-5 text-stone-400">{detail}</span></span></span>
                <input type="checkbox" checked={settings[key]} onChange={() => toggle(key)} className="h-4 w-4 shrink-0 accent-[#DFBE8A]" />
              </label>
            ))}
          </div>
        </motion.section>
      </div>
    </AnimatePresence>
  );
};
