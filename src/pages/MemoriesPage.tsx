import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { RealPhoto } from '../data/circleData';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { ExperienceController } from '../components/ExperienceController';
import { AestheticRandomVideoStage } from '../components/AestheticRandomVideoStage';
import { LightboxModal } from '../components/LightboxModal';
import { MemoryStoryModal } from '../components/MemoryStoryModal';
import { CinematicExperience } from '../components/experiences/CinematicExperience';
import { EditorialExperience } from '../components/experiences/EditorialExperience';
import { SpatialExperience } from '../components/experiences/SpatialExperience';
import { FilmstripExperience } from '../components/experiences/FilmstripExperience';
import { MotionExperience } from '../components/experiences/MotionExperience';
import { QuickPingsBar } from '../components/QuickPingsBar';
import { authStore } from '../services/authStore';
import { generateSmartExperience } from '../utils/experienceEngine';
import type { ExperienceType, UnifiedMediaItem } from '../utils/experienceEngine';
import { toastManager } from '../components/ActivityToasts';

interface MemoriesPageProps {
  favorites: string[];
  onToggleFavorite: (id: string, event?: React.MouseEvent) => void;
}

export function MemoriesPage({ favorites, onToggleFavorite }: MemoriesPageProps) {
  const [currentArchetype, setCurrentArchetype] = useState<ExperienceType>('editorial');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1_000_000));
  const [selectedItem, setSelectedItem] = useState<UnifiedMediaItem | RealPhoto | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);
  const experienceState = useMemo(
    () => generateSmartExperience(seed, currentArchetype),
    [seed, currentArchetype],
  );
  const galleryItems = useMemo(() => {
    const items: (RealPhoto | UnifiedMediaItem)[] = [...experienceState.floatingSatellites];
    if (selectedItem && !items.some((item) => item.id === selectedItem.id)) items.push(selectedItem);
    return items;
  }, [experienceState.floatingSatellites, selectedItem]);
  const galleryIndex = selectedItem ? galleryItems.findIndex((item) => item.id === selectedItem.id) : -1;

  const handleShuffle = () => {
    setSeed(Math.floor(Math.random() * 1_000_000));
    toastManager.showToast('Memories reshuffled.');
  };

  return (
    <main className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-[#100f0d] text-[#f5f2eb]">
      <AtmosphereBackground mood={experienceState.mood} />
      <div className="relative z-10">
        {experienceState.heroItem ? (
          <>
            <AestheticRandomVideoStage />
            <div id="experience-viewport" className="scroll-mt-20">
              <AnimatePresence mode="wait">
                <motion.div key={`exp-${currentArchetype}-${seed}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
                  {currentArchetype === 'motion' && <MotionExperience state={experienceState} onOpenItem={setSelectedItem} favorites={favorites} onToggleFavorite={onToggleFavorite} />}
                  {currentArchetype === 'cinematic' && <CinematicExperience state={experienceState} onOpenItem={setSelectedItem} favorites={favorites} onToggleFavorite={onToggleFavorite} />}
                  {currentArchetype === 'editorial' && <EditorialExperience state={experienceState} onOpenItem={setSelectedItem} favorites={favorites} onToggleFavorite={onToggleFavorite} />}
                  {currentArchetype === 'spatial' && <SpatialExperience state={experienceState} onOpenItem={setSelectedItem} favorites={favorites} onToggleFavorite={onToggleFavorite} />}
                  {currentArchetype === 'filmstrip' && <FilmstripExperience state={experienceState} onOpenItem={setSelectedItem} favorites={favorites} onToggleFavorite={onToggleFavorite} />}
                </motion.div>
              </AnimatePresence>
            </div>
            <ExperienceController currentArchetype={currentArchetype} onChangeArchetype={setCurrentArchetype} onShuffle={handleShuffle} onOpenStory={() => setStoryOpen(true)} />
            {authStore.getCurrentUser() && <QuickPingsBar />}
          </>
        ) : (
          <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
            <h1 className="font-serif text-5xl tracking-tight text-[#f5f2eb] sm:text-7xl">The family archive</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">Private family media will appear here after authenticated storage is connected. The development-only album links are excluded from production builds.</p>
          </section>
        )}
      </div>
      <LightboxModal
        items={galleryItems}
        index={galleryIndex}
        isFavorite={selectedItem ? favorites.includes(selectedItem.id) : false}
        onClose={() => setSelectedItem(null)}
        onIndexChange={(index) => setSelectedItem(galleryItems[index] ?? null)}
        onToggleFavorite={(id) => onToggleFavorite(id)}
      />
      <MemoryStoryModal isOpen={storyOpen} onClose={() => setStoryOpen(false)} />
    </main>
  );
}
