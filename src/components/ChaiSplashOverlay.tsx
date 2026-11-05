import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/audio';

export type PingType = 'chai' | 'pizza' | 'laugh' | 'love';

export interface ActivePingData {
  type: PingType;
  senderName?: string;
}

interface ChaiSplashOverlayProps {
  activePing: PingType | ActivePingData | null;
  onClearPing: () => void;
}

export const ChaiSplashOverlay: React.FC<ChaiSplashOverlayProps> = ({ activePing, onClearPing }) => {
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!activePing) return;

    const pingType = typeof activePing === 'string' ? activePing : activePing.type;
    const sender = typeof activePing === 'object' && activePing.senderName ? activePing.senderName : null;

    if (pingType === 'chai') {
      soundEngine.chai();
      setActiveMessage(
        sender
          ? `☕ ${sender} sent Hot Masala Chai to everyone!`
          : '☕ Hot Masala Chai delivered to everyone!'
      );
      confetti({
        particleCount: 50,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#D97706', '#B45309', '#FDE68A', '#DFBE8A'],
      });
    }

    if (pingType === 'pizza') {
      soundEngine.match();
      setActiveMessage(
        sender
          ? `🍕 ${sender} called a 2 AM Pizza & Maggie round!`
          : '🍕 2 AM Pizza & Maggie round is on!'
      );
      confetti({
        particleCount: 65,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#EF4444', '#F59E0B', '#10B981'],
      });
    }

    if (pingType === 'laugh') {
      soundEngine.chime();
      setActiveMessage(
        sender
          ? `😂 ${sender} dropped an iconic family inside joke!`
          : '😂 Someone dropped an iconic family inside joke!'
      );
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
      });
    }

    if (pingType === 'love') {
      soundEngine.chime();
      setActiveMessage(
        sender
          ? `❤️ Giant Cousin Group Hug from ${sender}!`
          : '❤️ Giant Cousin Group Hug for everyone!'
      );
      confetti({
        particleCount: 55,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#FB7185', '#FDA4AF'],
      });
    }

    const timer = setTimeout(() => {
      setActiveMessage(null);
      onClearPing();
    }, 3200);

    return () => clearTimeout(timer);
  }, [activePing, onClearPing]);

  if (!activeMessage) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
      <div className="bg-[#141210]/95 backdrop-blur-2xl px-7 py-4.5 rounded-3xl shadow-2xl border-2 border-[#DFBE8A]/60 transform -rotate-1 animate-bounce text-white">
        <span className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight drop-shadow-md">
          {activeMessage}
        </span>
      </div>
    </div>
  );
};
