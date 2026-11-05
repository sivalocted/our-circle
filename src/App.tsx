import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { MotionConfig } from 'motion/react';
import { ArrowRight, LockKeyhole, Plane, Settings } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { FloatingReactionsOverlay } from './components/FloatingReactionsOverlay';
import { BirthdayCelebrationOverlay } from './components/birthday/BirthdayCelebrationOverlay';
import { NotificationPermissionBanner } from './components/notifications/NotificationPermissionBanner';
import { ActivityToasts } from './components/ActivityToasts';
import { AdminInteractionModal } from './components/AdminInteractionModal';
import type { InteractionSettings } from './components/AdminInteractionModal';
import { authStore, type AuthAccessState, type UserProfile } from './services/authStore';
import { isSupabaseConfigured, realtimeService } from './services/supabase';
import { AuthGateModal } from './components/auth/AuthGateModal';
import { ReducedMotionContext } from './components/ReducedMotionContext';
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const MemoriesPage = lazy(() => import('./pages/MemoriesPage').then((module) => ({ default: module.MemoriesPage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then((module) => ({ default: module.ChatPage })));
const ArcadeHubModal = lazy(() => import('./components/arcade/ArcadeHubModal').then((module) => ({ default: module.ArcadeHubModal })));
const FamilyCalendarModal = lazy(() => import('./components/calendar/FamilyCalendarModal').then((module) => ({ default: module.FamilyCalendarModal })));
const TravelVaultModal = lazy(() => import('./components/travel/TravelVaultModal').then((module) => ({ default: module.TravelVaultModal })));
import { soundEngine } from './utils/audio';
import { getISTDateString } from './services/contentEngine/istTime';
import { toastManager } from './components/ActivityToasts';
import { birthdayService } from './services/birthdayService';
import { notificationService } from './services/notificationService';

function readStoredSettings(): InteractionSettings {
  const defaults: InteractionSettings = {
    activityToasts: true,
    floatingReactions: true,
    soundEffects: soundEngine.isEnabled(),
    reducedMotion: false,
  };
  try {
    const parsed = JSON.parse(localStorage.getItem('ourcircle_interaction_settings') ?? 'null');
    return parsed && typeof parsed === 'object' ? { ...defaults, ...parsed } : defaults;
  } catch {
    return defaults;
  }
}

function SettingsPage({ user, onOpenSettings }: { user: UserProfile | null; onOpenSettings: () => void }) {
  const navigate = useNavigate();
  return (
    <main className="mx-auto min-h-[calc(100vh-68px)] max-w-4xl px-4 py-12 sm:px-8 sm:py-16">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a704a]">Your circle</p>
      <h1 className="mt-3 font-serif text-5xl tracking-[-0.04em]">Profile & settings</h1>
      {user ? (
        <section className="mt-10 flex items-center gap-4 rounded-3xl border border-[#ded8cb] bg-white/60 p-5">
          <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          <div><h2 className="font-medium">{user.name}</h2><p className="mt-1 text-sm text-[#77736b]">{user.email}</p></div>
          <span className="ml-auto rounded-full bg-[#e9e0cf] px-3 py-1 text-xs capitalize text-[#665338]">{user.role}</span>
        </section>
      ) : (
        <p className="mt-6 text-sm text-[#69675f]">Local preview has no signed-in profile.</p>
      )}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onOpenSettings} className="flex min-h-20 items-center justify-between rounded-2xl border border-[#ded8cb] bg-white/60 p-5 text-left transition hover:bg-white">
          <span><Settings className="mb-2 h-4 w-4 text-[#8a704a]" /><span className="block text-sm font-medium">Preferences</span><span className="mt-1 block text-xs text-[#77736b]">Motion, sound and activity feedback</span></span><ArrowRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => navigate('/trip-fund')} className="flex min-h-20 items-center justify-between rounded-2xl border border-[#ded8cb] bg-white/60 p-5 text-left transition hover:bg-white">
          <span><Plane className="mb-2 h-4 w-4 text-[#8a704a]" /><span className="block text-sm font-medium">Trip fund</span><span className="mt-1 block text-xs text-[#77736b]">Trip plan and payment availability</span></span><ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {!isSupabaseConfigured && <p className="mt-8 flex items-start gap-2 rounded-2xl border border-[#ded8cb] p-4 text-sm leading-6 text-[#69675f]"><LockKeyhole className="mt-1 h-4 w-4 shrink-0" />Account, invitation and shared-data controls are unavailable until the backend is configured.</p>}
    </main>
  );
}

export function App() {
  const [previewMode, setPreviewMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authStore.getCurrentUser());
  const [accessState, setAccessState] = useState<AuthAccessState>(() => authStore.getAccessState());
  const [adminSettingsOpen, setAdminSettingsOpen] = useState(false);
  const [interactionSettings, setInteractionSettings] = useState<InteractionSettings>(readStoredSettings);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = authStore.subscribe(setCurrentUser);
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    const unsubscribe = authStore.subscribeAccess(setAccessState);
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (previewMode) window.scrollTo(0, 0);
  }, [previewMode]);

  useEffect(() => {
    if (!currentUser || previewMode) {
      void realtimeService.disconnectFromCircle();
      return;
    }
    void realtimeService.connectToCircle({ id: currentUser.userId, name: currentUser.name, avatarUrl: currentUser.avatarUrl });
    const unsubscribe = realtimeService.onNewMessage((message) => {
      if (message.senderId !== currentUser.userId) {
        notificationService.notifyChatMessage(message.senderName, message.content, message.senderAvatar);
      }
    });
    return () => { unsubscribe(); void realtimeService.disconnectFromCircle(); };
  }, [currentUser?.userId, currentUser?.name, currentUser?.avatarUrl, previewMode]);

  useEffect(() => {
    if (!currentUser || previewMode) return;
    const celebrant = birthdayService.getTodaysBirthdays()[0];
    if (!celebrant) return;
    const dayKey = getISTDateString();
    const storageKey = `ourcircle_birthday_celebrated_${currentUser.userId}_${dayKey}`;
    try {
      if (localStorage.getItem(storageKey)) return;
      localStorage.setItem(storageKey, 'true');
    } catch {
      // The greeting can still appear for this session if storage is blocked.
    }
    birthdayService.launchCelebration(celebrant);
  }, [currentUser?.userId, currentUser?.birthday, currentUser?.name, previewMode]);

  useEffect(() => {
    try {
      localStorage.setItem('ourcircle_interaction_settings', JSON.stringify(interactionSettings));
    } catch {
      // Preferences are optional when browser storage is unavailable.
    }
  }, [interactionSettings]);

  useEffect(() => {
    soundEngine.setEnabled(interactionSettings.soundEffects);
  }, [interactionSettings.soundEffects]);

  const toggleFavorite = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    soundEngine.tick();
    try {
      const saved = JSON.parse(localStorage.getItem('ourcircle_favorites') ?? '[]') as string[];
      const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
      localStorage.setItem('ourcircle_favorites', JSON.stringify(next));
      setFavorites(next);
    } catch {
      toastManager.showToast('Favorites could not be saved in this browser.');
    }
  };

  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ourcircle_favorites') ?? '[]') as string[]; } catch { return []; }
  });
  useEffect(() => {
    const update = (event: StorageEvent) => {
      if (event.key !== 'ourcircle_favorites') return;
      try { setFavorites(JSON.parse(localStorage.getItem('ourcircle_favorites') ?? '[]') as string[]); } catch { setFavorites([]); }
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  const handleCloseRouteModal = (route: string) => () => navigate(route);

  if (!currentUser && !previewMode) {
    if (accessState === 'checking') {
      return <main className="flex min-h-screen items-center justify-center bg-[#f5f2eb] text-sm text-[#69675f]">Checking circle access…</main>;
    }
    if (accessState === 'denied') {
      return <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f2eb] px-6 text-center text-[#24231f]"><h1 className="font-serif text-4xl">This account isn’t on the circle list.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-[#69675f]">Access is controlled by the family membership table. Ask an administrator to add this account, then sign in again.</p><button type="button" onClick={() => void authStore.signOut()} className="mt-6 rounded-full bg-[#25241f] px-5 py-3 text-sm text-white">Sign out</button></main>;
    }
    if (accessState === 'unavailable') {
      return <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f2eb] px-6 text-center text-[#24231f]"><h1 className="font-serif text-4xl">Circle access couldn’t be checked.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-[#69675f]">The membership lookup failed. Confirm the Supabase connection and database migration before retrying.</p><button type="button" onClick={() => void authStore.signOut()} className="mt-6 rounded-full bg-[#25241f] px-5 py-3 text-sm text-white">Sign out</button></main>;
    }
    return <AuthGateModal onPreview={() => setPreviewMode(true)} />;
  }

  return (
    <MotionConfig reducedMotion={interactionSettings.reducedMotion ? 'always' : 'user'}>
      <ReducedMotionContext.Provider value={interactionSettings.reducedMotion}>
      <div className={`min-h-screen bg-[#f5f2eb] text-[#24231f] ${interactionSettings.reducedMotion ? 'reduce-motion' : ''}`}>
        <Navbar currentUser={currentUser} onSignOut={() => void authStore.signOut()} />
        <Suspense fallback={<main role="status" className="flex min-h-[calc(100vh-68px)] items-center justify-center text-sm text-[#69675f]">Loading page…</main>}>
          <Routes>
            <Route path="/" element={<Navigate to="/memories" replace />} />
            <Route path="/home" element={<HomePage preview={previewMode} />} />
            <Route path="/memories" element={<MemoriesPage favorites={favorites} onToggleFavorite={toggleFavorite} />} />
            <Route path="/play" element={<ArcadeHubModal isOpen onClose={handleCloseRouteModal('/')} />} />
            <Route path="/calendar" element={<FamilyCalendarModal isOpen onClose={handleCloseRouteModal('/')} />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/trip-fund" element={<TravelVaultModal isOpen onClose={handleCloseRouteModal('/')} />} />
            <Route path="/settings" element={<SettingsPage user={currentUser} onOpenSettings={() => setAdminSettingsOpen(true)} />} />
            <Route path="*" element={<Navigate to="/memories" replace />} />
          </Routes>
        </Suspense>

      <ActivityToasts enabled={interactionSettings.activityToasts} />
      {currentUser && !previewMode && interactionSettings.floatingReactions && <FloatingReactionsOverlay />}
      {currentUser && !previewMode && <BirthdayCelebrationOverlay />}
      {currentUser && !previewMode && <NotificationPermissionBanner />}
        {currentUser && !previewMode && <AdminInteractionModal isOpen={adminSettingsOpen} onClose={() => setAdminSettingsOpen(false)} settings={interactionSettings} onUpdateSettings={setInteractionSettings} />}
      </div>
      </ReducedMotionContext.Provider>
    </MotionConfig>
  );
}

export default App;
