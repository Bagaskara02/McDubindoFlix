import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Bookmark,
  Check,
  Share2,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Tv,
  ListVideo,
  Monitor,
} from 'lucide-react';
import {
  getEpisodesForMovie,
  getCleanSeriesTitle,
  isSeries,
  getSeriesEpisodeCount,
} from '../services/dataService';
import { sanitizeId, sanitizeUrl } from '../utils/security';

export default function VideoPlayerModal({
  movie,
  onClose,
  watchlist = [],
  onToggleWatchlist,
}) {
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [episodes, setEpisodes] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [playerMode, setPlayerMode] = useState('embed'); // 'embed' or 'direct'
  const [fitMode, setFitMode] = useState('contain'); // 'contain' (Pas Layar), 'cover' (Penuh/Zoom), 'fill' (Stretch)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const containerRef = useRef(null);

  // Update current movie and load series episodes
  useEffect(() => {
    if (movie) {
      setCurrentMovie(movie);
      const eps = getEpisodesForMovie(movie);
      setEpisodes(eps);
    }
  }, [movie]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Keyboard shortcut listener (ESC, Space, F, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!currentMovie) return null;

  const isSaved = watchlist.some((m) => m.id === currentMovie.id);
  const cleanTitle = getCleanSeriesTitle(currentMovie);
  const isSeriesItem = isSeries(currentMovie);

  // Episode click handler: instant switch
  const handleSelectEpisode = (ep) => {
    setCurrentMovie(ep.movie);
    // Auto-scroll episode button into view
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Cycle fit mode (Fit -> Cover -> Stretch)
  const cycleFitMode = () => {
    if (fitMode === 'contain') setFitMode('cover');
    else if (fitMode === 'cover') setFitMode('fill');
    else setFitMode('contain');
  };

  const getFitModeLabel = () => {
    if (fitMode === 'contain') return 'Pas Layar (Fit)';
    if (fitMode === 'cover') return 'Penuh (Zoom)';
    return 'Regang (Stretch)';
  };

  // Native share handler
  const handleShare = async () => {
    const shareData = {
      title: `${cleanTitle} - Dubbing Indonesia`,
      text: `Nonton ${cleanTitle} Dubbing Indonesia kualitas HD gratis di McDubindoFlix!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  // Stream URLs: Dubbindo embed url with ID sanitization
  const safeId = sanitizeId(currentMovie.id);
  const embedUrl = safeId ? `https://www.dubbindo.site/embed/${safeId}` : '';
  const safeExternalUrl = sanitizeUrl(
    currentMovie.url || (currentMovie.slug ? `https://www.dubbindo.site/watch/${encodeURIComponent(currentMovie.slug)}` : '')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Modal Card */}
      <div
        ref={containerRef}
        className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-5xl bg-[#12121C] sm:rounded-3xl border border-[#252538] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#161624] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="bg-[#E50914] text-white text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
              DUB INDO
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate" title={currentMovie.title}>
              {currentMovie.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Bagikan Film"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-[#E50914] transition-colors"
              title="Tutup (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Frame Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden shrink-0 group">
          <iframe
            key={currentMovie.id}
            src={embedUrl}
            title={cleanTitle}
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className={`w-full h-full border-0 ${
              fitMode === 'cover'
                ? 'object-cover scale-105'
                : fitMode === 'fill'
                ? 'object-fill'
                : 'object-contain'
            }`}
          />

          {/* Quick Overlay Controls Bar (Bottom right of player) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-auto">
            {/* Screen Fit Mode Cycle */}
            <button
              onClick={cycleFitMode}
              className="px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-xs font-bold text-slate-200 border border-white/20 hover:text-white hover:bg-black/90 flex items-center gap-1.5 shadow"
              title="Ganti Mode Ukuran Layar Video"
            >
              <Monitor className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span className="hidden sm:inline">{getFitModeLabel()}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-slate-200 border border-white/20 hover:text-white hover:bg-black/90 shadow"
              title="Layar Penuh"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Player Controls & Info Area (Scrollable on small screens) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Quality Selector Section */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00E5FF]" />
                Pilih Kualitas:
              </span>
              <div className="flex items-center gap-1.5">
                {['1080p FHD', '720p HD', '480p SD', '360p Hemat'].map((q) => {
                  const isSelected = selectedQuality.startsWith(q.slice(0, 4));
                  return (
                    <button
                      key={q}
                      onClick={() => setSelectedQuality(q)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
                          : 'bg-[#1D1D2C] text-slate-300 hover:text-white hover:bg-[#28283E] border border-white/5'
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions (Watchlist & Dubbindo link) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleWatchlist(currentMovie)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-[#1D1D2C] text-slate-200 border-white/10 hover:bg-white/10'
                }`}
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isSaved ? 'Tersimpan' : 'Watchlist'}</span>
              </button>

              <a
                href={safeExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                title="Buka Halaman Asli di Dubbindo"
              >
                <span>Dubbindo</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* CRITICAL FEATURE: EPISODE SELECTOR DIRECTLY BELOW QUALITY SELECTOR */}
          {episodes.length > 0 && (
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#181827] border border-[#2B2B40]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    Daftar Episode ({episodes.length} Episode Tersedia)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Klik episode untuk langsung memutar
                </span>
              </div>

              {/* Horizontal Scrollable Episode Chips */}
              <div className="flex items-center gap-2 overflow-x-auto py-1.5 no-scrollbar">
                {episodes.map((ep) => {
                  const isCurrent =
                    ep.movie.id === currentMovie.id ||
                    (currentMovie.slug && ep.movie.slug === currentMovie.slug);

                  return (
                    <button
                      key={ep.movie.id}
                      onClick={() => handleSelectEpisode(ep)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all transform active:scale-95 ${
                        isCurrent
                          ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/40 ring-2 ring-[#E50914] scale-105'
                          : 'bg-[#212136] text-slate-300 hover:text-white hover:bg-[#2D2D48] border border-white/10'
                      }`}
                    >
                      {ep.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Movie Details & Description */}
          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl font-black text-white">
              {currentMovie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {currentMovie.category && (
                <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded font-medium">
                  {currentMovie.category}
                </span>
              )}
              {currentMovie.duration && (
                <span>• Durasi: {currentMovie.duration}</span>
              )}
              {currentMovie.views && (
                <span>• {currentMovie.views} kali ditonton</span>
              )}
              {currentMovie.time_ago && (
                <span>• {currentMovie.time_ago}</span>
              )}
              {currentMovie.uploader && (
                <span>• Uploader: {currentMovie.uploader}</span>
              )}
            </div>

            {currentMovie.description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 whitespace-pre-line border-t border-white/5">
                {currentMovie.description.replace(/⁣/g, '')}
              </p>
            )}

            {shareSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold text-center border border-emerald-500/30 animate-in fade-in">
                ✓ Link berhasil disalin ke clipboard!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
