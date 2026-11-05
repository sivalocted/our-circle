import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { realtimeService } from '../services/supabase';
import type { FloatingReactionEvent } from '../services/supabase';

interface FloatingReactionInstance extends FloatingReactionEvent {
  startX: number;
  rotation: number;
}

export const FloatingReactionsOverlay: React.FC = () => {
  const [reactions, setReactions] = useState<FloatingReactionInstance[]>([]);

  useEffect(() => {
    const unsubscribe = realtimeService.onReaction((event) => {
      const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const startX = event.x ?? Math.random() * (windowWidth - 120) + 60;
      const rotation = (Math.random() - 0.5) * 40;

      const instance: FloatingReactionInstance = {
        ...event,
        startX,
        rotation,
      };

      setReactions((prev) => [...prev.slice(-20), instance]);

      // Remove after animation completes
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== instance.id));
      }, 2600);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{
              opacity: 0,
              scale: 0.5,
              x: r.startX,
              y: window.innerHeight - 80,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.25, 1, 0.9],
              y: window.innerHeight - 450,
              x: r.startX + (Math.random() - 0.5) * 60,
              rotate: r.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.4,
              ease: 'easeOut',
            }}
            className="absolute flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#DFBE8A]/30 shadow-2xl"
          >
            <span className="text-2xl filter drop-shadow">{r.emoji}</span>
            {r.senderName && (
              <span className="text-[10px] font-mono text-[#DFBE8A] font-semibold">
                {r.senderName}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
