import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Volume2, VolumeX, Plus, Check, Maximize2, Play, X } from 'lucide-react';
import {
  getAllSortedAlbumVideos,
  addAlbumVideo,
} from '../data/albumVideos';
import type { AlbumVideo } from '../data/albumVideos';
import { soundEngine } from '../utils/audio';
import { Tooltip } from './Tooltip';
import { toastManager } from './ActivityToasts';
import { deletedMediaStore } from '../services/deletedMediaStore';
import { useReducedMotionSetting } from './ReducedMotionContext';
import { resolveVideoSource } from '../services/videoSource';

interface AestheticRandomVideoStageProps {
  onVideoChange?: (video: AlbumVideo) => void;
}

export const AestheticRandomVideoStage: React.FC<AestheticRandomVideoStageProps> = ({
  onVideoChange,
}) => {
  const reducedMotion = useReducedMotionSetting();
  // Load the curated video catalog, excluding sources explicitly removed by a user.
  const [videoList, setVideoList] = useState<AlbumVideo[]>(() =>
    deletedMediaStore.filterValid(getAllSortedAlbumVideos())
  );

  // Pick a random entry from the current catalog.
  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    Math.floor(Math.random() * Math.max(1, deletedMediaStore.filterValid(getAllSortedAlbumVideos()).length))
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [externalPlayerEnabled, setExternalPlayerEnabled] = useState(false);
  const [failedVideoIds, setFailedVideoIds] = useState<Set<string>>(() => new Set());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDate, setNewVideoDate] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentVideo = videoList[currentIndex] || videoList[0];
  const videoSource = currentVideo ? resolveVideoSource(currentVideo.videoUrl, false) : null;
  const isDirectVideo = videoSource?.kind === 'direct';
  const videoSourceKind = videoSource?.kind;
  const videoSourceIsVertical = videoSource?.kind === 'embed' && videoSource.isVertical;

  const [dynamicIsVertical, setDynamicIsVertical] = useState<boolean>(() =>
    Boolean(currentVideo?.isVertical || (currentVideo?.height && currentVideo.height > currentVideo.width))
  );
  const [isStageVisible, setIsStageVisible] = useState(true);

  useEffect(() => {
    if (currentVideo) {
      setIsVideoLoading(true);
      setIsVideoPlaying(false);
      setExternalPlayerEnabled(false);
      setDynamicIsVertical(Boolean(
        videoSourceIsVertical
        || currentVideo.isVertical
        || (currentVideo.height && currentVideo.height > currentVideo.width)
      ));
      if (videoSourceKind === 'unsupported') {
        setIsVideoLoading(false);
        setFailedVideoIds((failed) => new Set(failed).add(currentVideo.id));
      }
    }
  }, [currentVideo, videoSourceKind, videoSourceIsVertical]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      const videos = container.querySelectorAll('video');
      videos.forEach((video) => {
        if (!entry.isIntersecting) video.pause();
        else if (!reducedMotion && !isFullscreen && !failedVideoIds.has(currentVideo?.id ?? '')) void video.play().catch(() => {});
      });
      setIsStageVisible(entry.isIntersecting);
    }, { threshold: 0.1 });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isFullscreen, currentVideo?.id, failedVideoIds, reducedMotion]);

  // Pick a new random video different from the current one
  const pickNextRandomVideo = useCallback(() => {
    soundEngine.tick();
    setCurrentIndex((prev) => {
      const candidates = videoList.map((video, index) => ({ video, index }))
        .filter(({ video, index }) => index !== prev && !failedVideoIds.has(video.id));
      if (candidates.length === 0) return prev;
      return candidates[Math.floor(Math.random() * candidates.length)].index;
    });
  }, [videoList, failedVideoIds]);

  useEffect(() => {
    if (onVideoChange && currentVideo) {
      onVideoChange(currentVideo);
    }
  }, [currentVideo, onVideoChange]);

  // Synchronize HTML5 video element muted state and volume directly
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : 1.0;
    }
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.muted = isMuted;
      fullscreenVideoRef.current.volume = isMuted ? 0 : 1.0;
    }
  }, [isMuted, currentVideo]);

  // Toggle Audio with direct DOM property sync and tactile feedback
  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = nextMuted ? 0 : 1.0;
      if (!nextMuted) {
        videoRef.current.play().catch(() => {});
      }
    }
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.muted = nextMuted;
      fullscreenVideoRef.current.volume = nextMuted ? 0 : 1.0;
      if (!nextMuted) {
        fullscreenVideoRef.current.play().catch(() => {});
      }
    }

    if (nextMuted) {
      soundEngine.tick();
      toastManager.showToast('Audio muted 🔇');
    } else {
      soundEngine.chime();
      toastManager.showToast('Audio unmuted 🔊');
    }
  };

  // Dedicated Fullscreen handler (only when clicking the expand icon)
  const handleOpenFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.chime();
    setIsFullscreen(true);
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  const handleCloseFullscreen = () => {
    soundEngine.tick();
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore
    }
  };

  // Keyboard navigation: Escape exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleCloseFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Auto-advance when video ends
  const handleVideoEnded = () => {
    pickNextRandomVideo();
  };

  // Add a direct stream or supported provider URL to this browser's catalog.
  const handleAddCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(newVideoUrl.trim());
    } catch {
      toastManager.showToast('Enter a valid HTTPS video URL.');
      return;
    }
    if (parsedUrl.protocol !== 'https:') {
      toastManager.showToast('Video URLs must use HTTPS.');
      return;
    }

    soundEngine.match();
    const added = addAlbumVideo({
      videoUrl: newVideoUrl.trim(),
      baseUrl: newVideoUrl.trim(),
      title: newVideoTitle.trim() || undefined,
      dateFormatted: newVideoDate.trim() || undefined,
    });

    const updatedList = getAllSortedAlbumVideos();
    setVideoList(updatedList);

    const newIdx = updatedList.findIndex((v) => v.id === added.id);
    if (newIdx !== -1) {
      setCurrentIndex(newIdx);
    }

    setFailedVideoIds((current) => { const next = new Set(current); next.delete(added.id); return next; });
    toastManager.showToast(newVideoTitle.trim()
      ? `Added "${newVideoTitle.trim()}" to this browser's video list.`
      : 'Video added to this browser’s list.');
    setNewVideoUrl('');
    setNewVideoTitle('');
    setNewVideoDate('');
    setAddModalOpen(false);
  };

  return (
    <>
      {/* 1. Main Aesthetic Video Stage (15% height reduction per user request) */}
      <section
        ref={containerRef}
        aria-label="Family video archive"
        className="relative w-full h-[75vh] sm:h-[80vh] md:h-[83vh] min-h-[544px] max-h-[935px] overflow-hidden bg-[#05070E] select-none group"
      >
        {/* Animated Background Video Player with Smooth Crossfade */}
        <AnimatePresence mode="wait">
          {currentVideo && (
            <motion.div
              key={currentVideo.id}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
            >
              {/* If Vertical: Soft Ambient Blurred Backdrop to avoid black voids on wide screens */}
              {dynamicIsVertical && isDirectVideo && (
                <video
                  src={currentVideo.videoUrl}
                  autoPlay={!reducedMotion}
                  muted
                  playsInline
                  loop
                  className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-35 scale-125 pointer-events-none"
                />
              )}

              {/* Main Video Element: Plays vertically cropped without horizontal stretching */}
              {!isFullscreen && videoSource?.kind === 'direct' && <video
                ref={videoRef}
                src={videoSource.src}
                poster={currentVideo.posterUrl}
                autoPlay={!reducedMotion}
                muted={isMuted}
                playsInline
                loop={false}
                onPlay={() => { setIsVideoLoading(false); setIsVideoPlaying(true); }}
                onPause={() => setIsVideoPlaying(false)}
                onError={() => {
                  if (currentVideo) {
                    setFailedVideoIds((failed) => new Set(failed).add(currentVideo.id));
                    setIsVideoLoading(false);
                  }
                }}
                onEnded={handleVideoEnded}
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  if (v.videoHeight && v.videoWidth) {
                    setDynamicIsVertical(v.videoHeight > v.videoWidth);
                  }
                }}
                onLoadedData={() => {
                  setIsVideoLoading(false);
                  if (!reducedMotion && videoRef.current) {
                    videoRef.current.muted = isMuted;
                    videoRef.current.volume = isMuted ? 0 : 1.0;
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className={
                  dynamicIsVertical
                    ? 'relative z-10 h-full max-h-full w-auto aspect-[9/16] object-cover rounded-2xl shadow-2xl border border-white/10 filter brightness-[0.96] contrast-[1.04]'
                    : 'w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.04]'
                }
              />}
              {videoSource?.kind === 'embed' && externalPlayerEnabled && !isFullscreen && <iframe
                ref={iframeRef}
                src={isStageVisible || isFullscreen ? videoSource.src : undefined}
                title={`${currentVideo.title} · ${videoSource.provider} video`}
                referrerPolicy="no-referrer"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsVideoLoading(false)}
                onError={() => {
                  setFailedVideoIds((failed) => new Set(failed).add(currentVideo.id));
                  setIsVideoLoading(false);
                }}
                className={dynamicIsVertical
                  ? 'relative z-10 h-full max-h-full w-auto aspect-[9/16] border-0'
                  : 'relative z-10 h-full w-full border-0'}
              />}
              {videoSource?.kind === 'embed' && !externalPlayerEnabled && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/75 p-6 text-center">
                <p className="max-w-sm text-sm text-white">This video is hosted by {videoSource.provider === 'youtube' ? 'YouTube' : 'Vimeo'}. Loading the player connects to that provider.</p>
                <button type="button" onClick={() => { setIsVideoLoading(true); setExternalPlayerEnabled(true); }} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black hover:bg-stone-200">Load {videoSource.provider === 'youtube' ? 'YouTube' : 'Vimeo'} player</button>
              </div>}
              {reducedMotion && isDirectVideo && !isVideoPlaying && !failedVideoIds.has(currentVideo.id) && <button type="button" onClick={() => void videoRef.current?.play().catch(() => {})} aria-label="Play family video" className="absolute left-1/2 top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-black/60 text-white shadow-xl backdrop-blur transition hover:bg-black/80"><Play className="ml-1 h-5 w-5 fill-current" /></button>}
              {isVideoLoading && (isDirectVideo || externalPlayerEnabled) && !failedVideoIds.has(currentVideo.id) && <div className="pointer-events-none absolute z-20 rounded-full bg-black/65 px-4 py-2 text-xs text-white/80">Loading video…</div>}
              {failedVideoIds.has(currentVideo.id) && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/75 p-6 text-center"><p className="text-sm text-white">This video source is unavailable right now.</p><div className="flex flex-wrap items-center justify-center gap-2"><a href={currentVideo.videoUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-4 py-2 text-xs text-white hover:bg-white/10">Open source</a><button type="button" onClick={pickNextRandomVideo} className="rounded-full border border-white/30 px-4 py-2 text-xs text-white hover:bg-white/10">Try another video</button></div></div>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Multi-layer Luxury Vignette Atmosphere */}
        {/* Top Vignette: Seamless transition under the floating Navbar */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#05070E] via-[#05070E]/60 to-transparent pointer-events-none z-10" />

        {/* Radial Vignette: Dark cinematic edge falloff */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(5,7,14,0.3) 75%, rgba(5,7,14,0.85) 100%)',
          }}
        />

        {/* Hand-Drawn Wavy Black Vignette Dropped to the Bottom to Fit Screen */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10 flex flex-col justify-end">
          {/* Subtle Organic Caustic Wave Dropped to Bottom Edge */}
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-8 sm:h-12 text-[#05070E] -mb-px opacity-95"
          >
            <path
              d="M0,25 C320,45 640,10 960,35 C1200,50 1360,20 1440,30 L1440,60 L0,60 Z"
              fill="currentColor"
            />
          </svg>

          {/* Minimal Bottom Seam Seamlessly Blending Into Next Section */}
          <div className="w-full h-3 sm:h-5 bg-[#05070E]" />
        </div>

        {/* 3. Aesthetic Editorial HUD */}
        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-between pointer-events-none z-20">
          {/* Top Bar: Telemetry + Action Pills */}
          <div className="flex items-center justify-between w-full">
            {/* Title & Origin Indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/90 text-xs font-mono"
            >
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider text-[#DFBE8A] font-bold">
                Family archive
              </span>
              <span className="text-white/40">•</span>
              <span className="font-serif italic text-white/90 truncate max-w-[180px] sm:max-w-xs">
                {currentVideo?.title || 'Untitled video'}
              </span>
              {currentVideo?.dateFormatted && <><span className="text-white/40">•</span><span className="text-stone-300 font-sans font-semibold">{currentVideo.dateFormatted}</span></>}
              {currentVideo?.timeFormatted && <><span className="text-white/40">•</span><span className="text-[11px] text-stone-400 font-mono">{currentVideo.timeFormatted}</span></>}
            </motion.div>

            {/* Controls (Audio Toggle, Add Video, Shuffle, Fullscreen) */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Audio Toggle with Direct Unmute */}
              {isDirectVideo && <Tooltip content={isMuted ? 'Unmute Audio 🔊' : 'Mute Audio 🔇'} position="bottom">
                <button
                  onClick={handleToggleAudio}
                  className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                    !isMuted
                      ? 'bg-[#00F5D4]/20 border-[#00F5D4] text-[#00F5D4] scale-105'
                      : 'bg-black/60 border-white/15 text-white/80 hover:text-white hover:border-[#DFBE8A]'
                  }`}
                  aria-label="Toggle ambient audio"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </Tooltip>}

              {/* Add a direct video source */}
              <Tooltip content="Add a video link" position="bottom">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEngine.tick();
                    setAddModalOpen(true);
                  }}
                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:border-[#DFBE8A] hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                  aria-label="Add a video link"
                >
                  <Plus className="w-4 h-4 text-[#DFBE8A]" />
                </button>
              </Tooltip>

              {/* Next Random Video */}
              <Tooltip content="Next Album Video 🎲" position="bottom">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    pickNextRandomVideo();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/90 text-xs font-mono hover:border-[#DFBE8A] hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer group/btn"
                >
                  <Dices className="w-3.5 h-3.5 text-[#DFBE8A] group-hover/btn:rotate-180 transition-transform duration-500" />
                  <span className="hidden sm:inline">Randomize</span>
                </button>
              </Tooltip>

              {/* Optional Fullscreen Button */}
              {(videoSource?.kind !== 'embed' || externalPlayerEnabled) && <Tooltip content="Fullscreen Cinema ⤢" position="bottom">
                <button
                  onClick={handleOpenFullscreen}
                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:border-[#DFBE8A] hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                  aria-label="Enter fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fullscreen video player */}
      <AnimatePresence>
        {isFullscreen && currentVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden"
            onClick={handleCloseFullscreen}
          >
            {videoSource?.kind === 'direct' && <video
              ref={fullscreenVideoRef}
              src={videoSource.src}
              autoPlay={!reducedMotion}
              controls={reducedMotion}
              muted={isMuted}
              playsInline
              loop
              onError={() => {
                if (currentVideo) {
                  setFailedVideoIds((failed) => new Set(failed).add(currentVideo.id));
                  setIsFullscreen(false);
                }
              }}
              onEnded={handleVideoEnded}
              className={
                dynamicIsVertical
                  ? 'h-full w-auto max-h-screen aspect-[9/16] object-cover rounded-xl shadow-2xl mx-auto'
                  : 'w-full h-full object-cover sm:object-contain bg-black'
              }
            />}
            {videoSource?.kind === 'embed' && <iframe
              ref={fullscreenIframeRef}
              src={videoSource.src}
              title={`${currentVideo.title} · ${videoSource.provider} video`}
              referrerPolicy="no-referrer"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />}
            <button
              type="button"
              aria-label="Close fullscreen video"
              onClick={(event) => { event.stopPropagation(); handleCloseFullscreen(); }}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/30 hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add a direct video source */}
      <AnimatePresence>
        {addModalOpen && (
          <div
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setAddModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#141210] border border-white/15 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#DFBE8A]/20 flex items-center justify-center text-[#DFBE8A]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">Add a video link</h3>
                    <p className="text-xs text-stone-400 font-mono">
                      {videoList.length} saved sources in this browser's rotation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomVideo} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#DFBE8A] mb-1.5">
                    HTTPS video URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://video-host.example/clip.mp4"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-stone-500 text-xs font-mono focus:outline-none focus:border-[#DFBE8A]"
                  />
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Supports direct video streams, YouTube and Vimeo links. External players load only after you choose to connect; this entry is saved only in this browser.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-400 mb-1.5">
                      Chronicle Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Diwali Gathering 2026"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-stone-500 text-xs font-body focus:outline-none focus:border-[#DFBE8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-stone-400 mb-1.5">
                      Date (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. November 2026"
                      value={newVideoDate}
                      onChange={(e) => setNewVideoDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-stone-500 text-xs font-body focus:outline-none focus:border-[#DFBE8A]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-mono text-stone-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-[#1A1614] text-xs font-mono font-bold hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Add to Randomization</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
