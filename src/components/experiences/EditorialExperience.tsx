import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import type { CuratedExperienceState, UnifiedMediaItem } from '../../utils/experienceEngine';
import { UnifiedMediaCard } from '../UnifiedMediaCard';

interface EditorialExperienceProps {
  state: CuratedExperienceState;
  onOpenItem: (item: UnifiedMediaItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const EditorialExperience: React.FC<EditorialExperienceProps> = ({
  state,
  onOpenItem,
  favorites,
  onToggleFavorite,
}) => {
  const [heroOffset, setHeroOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const spread0Items = state.editorialSpreads[0]?.items || [];

  // Auto-rotate hero memory in spread every 5 seconds so photos don't stay static, pauses on hover
  useEffect(() => {
    if (isHovered || spread0Items.length <= 1) return;
    const interval = setInterval(() => {
      setHeroOffset((prev) => (prev + 1) % spread0Items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, spread0Items.length]);

  const currentHero = spread0Items[heroOffset % spread0Items.length] || spread0Items[0];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full min-h-screen py-10 px-4 sm:px-8 max-w-7xl mx-auto space-y-24"
    >
      {/* Editorial Header Masthead */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto space-y-3"
      >
        <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#DFBE8A]/30 text-[#DFBE8A] text-xs font-mono tracking-widest uppercase inline-flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#DFBE8A]" />
          <span>Editorial Monograph</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
          Curated Chronicles & Spreads
        </h1>
        <p className="text-xs sm:text-sm font-mono text-stone-400">
          Asymmetric layouts, archival proportions, and deliberate compositions
        </p>
      </motion.div>

      {/* SPREAD 1: Hero Duo (Oversized Feature + Complementary Companion Stack) */}
      {state.editorialSpreads[0] && currentHero && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF7F2]">
              {state.editorialSpreads[0].headline || 'I. Primary Exhibition'}
            </h2>
            <span className="text-xs font-mono text-[#DFBE8A]">SPREAD 01 // ARCHIVE</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Massive Hero Photo (7 columns) */}
            <motion.div
              key={currentHero.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7"
            >
              <UnifiedMediaCard
                item={currentHero}
                aspectRatioClass="aspect-[16/10] sm:aspect-[4/3]"
                onOpenItem={onOpenItem}
                isFavorite={favorites.includes(currentHero.id)}
                onToggleFavorite={onToggleFavorite}
              />
              <div className="mt-2.5 flex items-center justify-between text-xs font-mono text-stone-400">
                <span>{currentHero.dateFormatted}</span>
                <span className="text-[#DFBE8A]">Featured Highlight</span>
              </div>
            </motion.div>

            {/* Stacked Duo (5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              {state.editorialSpreads[0].items.slice(1, 3).map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                >
                  <UnifiedMediaCard
                    item={item}
                    aspectRatioClass="aspect-[16/9]"
                    onOpenItem={onOpenItem}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>{item.dateFormatted}</span>
                    <span className="text-stone-500">Plate #{idx + 2}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SPREAD 2: Staggered Triptych (3 Columns with Alternating Heights) */}
      {state.editorialSpreads[1] && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF7F2]">
              {state.editorialSpreads[1].headline || 'II. Staggered Triptych'}
            </h2>
            <span className="text-xs font-mono text-[#DFBE8A]">SPREAD 02 // HARMONY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start">
            {state.editorialSpreads[1].items.slice(0, 3).map((item, idx) => {
              const yOffset = idx === 1 ? 'md:-translate-y-6' : 'md:translate-y-4';
              const aspect = idx === 1 ? 'aspect-[3/4]' : 'aspect-square';
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  className={`${yOffset} space-y-2`}
                >
                  <UnifiedMediaCard
                    item={item}
                    aspectRatioClass={aspect}
                    onOpenItem={onOpenItem}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 px-1">
                    <span>{item.dateFormatted}</span>
                    <span className="text-[#DFBE8A]">Triptych {idx + 1}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* SPREAD 3: Asymmetric Quad (One dominant left, 3 small polaroids right) */}
      {state.editorialSpreads[2] && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF7F2]">
              {state.editorialSpreads[2].headline || 'III. Unscripted Moments'}
            </h2>
            <span className="text-xs font-mono text-[#DFBE8A]">SPREAD 03 // POLAROID DECK</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Small polaroids trio (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 order-2 lg:order-1">
              {state.editorialSpreads[2].items.slice(1, 4).map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  className={idx === 2 ? 'col-span-2' : ''}
                >
                  <UnifiedMediaCard
                    item={item}
                    aspectRatioClass={idx === 2 ? 'aspect-[16/9]' : 'aspect-square'}
                    onOpenItem={onOpenItem}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                </motion.div>
              ))}
            </div>

            {/* Dominant Right (7 cols) */}
            {state.editorialSpreads[2].items[0] && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7 order-1 lg:order-2"
              >
                <UnifiedMediaCard
                  item={state.editorialSpreads[2].items[0]}
                  aspectRatioClass="aspect-[4/3] sm:aspect-[16/10]"
                  onOpenItem={onOpenItem}
                  isFavorite={favorites.includes(state.editorialSpreads[2].items[0].id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* SPREAD 4: Dynamic Face Mosaic & Family Footprints */}
      {state.editorialSpreads[4] && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#FAF7F2]">
              {state.editorialSpreads[4].headline || 'IV. Mosaic of Kinfolk'}
            </h2>
            <span className="text-xs font-mono text-[#DFBE8A]">SPREAD 04 // MOSAIC</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {state.editorialSpreads[4].items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
              >
                <UnifiedMediaCard
                  item={item}
                  aspectRatioClass={item.aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'}
                  onOpenItem={onOpenItem}
                  isFavorite={favorites.includes(item.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
