import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Share2,
  ExternalLink,
  Sparkles,
  ListVideo,
  Clock,
  Eye,
  Calendar,
  User,
  Film,
} from 'lucide-react';
import {
  getEpisodesForMovie,
  getCleanSeriesTitle,
  isSeries,
  getRelatedMovies,
} from '../services/dataService';
import { sanitizeUrl } from '../utils/security';
import MovieCard from './MovieCard';
import VideoPlayer from './VideoPlayer';

export default function MovieDetailPage({
  movie,
  onBack,
  watchlist = [],
  onToggleWatchlist,
  onSelectMovie,
}) {
  const [currentMovie, setCurrentMovie] = useState(movie);
  const [episodes, setEpisodes] = useState([]);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);

  const containerRef = useRef(null);
  const playerRef = useRef(null);

  // Update current movie and fetch episodes & related movies
  useEffect(() => {
    if (movie) {
      setCurrentMovie(movie);
      const eps = getEpisodesForMovie(movie);
      setEpisodes(eps);
      getRelatedMovies(movie, 12).then(setRelatedMovies);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [movie]);

  if (!currentMovie) return null;

  const isSaved = watchlist.some((m) => m.id === currentMovie.id);
  const cleanTitle = getCleanSeriesTitle(currentMovie);
  const isSeriesItem = isSeries(currentMovie);

  const safeExternalUrl = sanitizeUrl(
    currentMovie.url || (currentMovie.slug ? `https://www.dubbindo.site/watch/${encodeURIComponent(currentMovie.slug)}` : '')
  );

  // Switch episode
  const handleSelectEpisode = (ep) => {
    setCurrentMovie(ep.movie);
    // Smoothly scroll player into view
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Web Share API
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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0C0C12] text-slate-100 flex flex-col font-sans animate-in fade-in duration-300"
    >
      {/* Top Sticky Bar with iPhone Safe-Area-Inset-Top (Hidden during Fullscreen) */}
      {!isPlayerFullscreen && (
        <div
          className="sticky top-0 z-40 w-full glass-nav transition-all"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
              {/* Back Button */}
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all text-xs sm:text-sm font-medium border border-white/10"
                title="Kembali ke Katalog"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              {/* Middle Title (Truncated) */}
              <div className="hidden sm:flex items-center gap-2 min-w-0 max-w-md">
                <span className="bg-[#E50914] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0">
                  DUB INDO
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-200 truncate" title={currentMovie.title}>
                  {cleanTitle}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => onToggleWatchlist(currentMovie)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    isSaved
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-[#181826] text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isSaved ? 'Tersimpan' : 'Watchlist'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Bagikan Film"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {safeExternalUrl && (
                  <a
                    href={safeExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <span>Dubbindo</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Detail Page Body */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Cinema Video Player Container */}
        <section ref={playerRef} className={`w-full mx-auto ${isPlayerFullscreen ? 'relative z-[99999]' : 'relative z-20'}`}>
          <VideoPlayer
            movie={currentMovie}
            cleanTitle={cleanTitle}
            episodes={episodes}
            onSelectEpisode={handleSelectEpisode}
            onEpisodeChange={handleSelectEpisode}
            onFullscreenChange={setIsPlayerFullscreen}
            initialTime={currentMovie.resumeTime || 0}
          />
        </section>

        {/* Quality & Series Episode Playlist Section */}
        <section className="relative z-10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#141422] border border-[#232338] space-y-4 shadow-xl">
          {/* Quality Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                Pilih Kualitas:
              </span>
              <div className="flex items-center gap-1.5">
                {['1080p FHD', '720p HD', '480p SD', '360p Hemat'].map((q) => {
                  const isSelected = selectedQuality.startsWith(q.slice(0, 4));
                  return (
                    <button
                      key={q}
                      onClick={() => setSelectedQuality(q)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
                          : 'bg-[#1C1C2D] text-slate-300 hover:text-white hover:bg-[#25253A] border border-white/5'
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs font-medium text-slate-400">
              Server Pemutar Aktif
            </div>
          </div>

          {/* CRITICAL: SERIES EPISODES DIRECTLY BELOW QUALITY SELECTOR */}
          {episodes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-xs sm:text-sm font-medium text-white">
                    Daftar Episode ({episodes.length} Episode Tersedia)
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all transform active:scale-95 ${
                        isCurrent
                          ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/40 ring-1 ring-[#E50914] scale-105'
                          : 'bg-[#1D1D2E] text-slate-300 hover:text-white hover:bg-[#28283E] border border-white/10'
                      }`}
                    >
                      {ep.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Movie Info & Details Section */}
        <section className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#13131F] border border-[#222234] space-y-3.5">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="bg-[#E50914] text-white px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase">
              DUB INDO
            </span>
            <span className="bg-black/50 text-[#00E5FF] border border-[#00E5FF]/40 px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
              HD
            </span>
            {isSeriesItem && episodes.length > 0 && (
              <span className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                {episodes.length} EPISODE
              </span>
            )}
            {currentMovie.category && (
              <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
                {currentMovie.category}
              </span>
            )}
          </div>

          {/* Title: Poppins Regular/Medium, NOT too bold */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-medium text-white tracking-normal font-sans leading-snug">
            {currentMovie.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            {currentMovie.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentMovie.duration}</span>
              </div>
            )}
            {currentMovie.views && (
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentMovie.views} kali ditonton</span>
              </div>
            )}
            {currentMovie.time_ago && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentMovie.time_ago}</span>
              </div>
            )}
            {currentMovie.uploader && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Uploader: {currentMovie.uploader}</span>
              </div>
            )}
          </div>

          {/* Synopsis */}
          {currentMovie.description && (
            <div className="pt-3 border-t border-white/5">
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed whitespace-pre-line">
                {currentMovie.description.replace(/⁣/g, '')}
              </p>
            </div>
          )}

          {shareSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-medium text-center border border-emerald-500/30">
              ✓ Link berhasil disalin ke clipboard!
            </div>
          )}
        </section>

        {/* Film & Series Terkait (Related Content) */}
        {relatedMovies.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4.5 bg-[#E50914] rounded-full" />
              <h3 className="text-base sm:text-lg font-medium text-slate-200 font-sans tracking-normal">
                Film & Series Terkait
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {relatedMovies.map((m) => {
                const isSavedMovie = watchlist.some((w) => w.id === m.id);
                return (
                  <MovieCard
                    key={m.id}
                    movie={m}
                    onPlayMovie={onSelectMovie}
                    isSaved={isSavedMovie}
                    onToggleWatchlist={onToggleWatchlist}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#08080C] border-t border-white/5 py-8 px-4 text-center space-y-2 mt-8">
        <p className="text-xs text-slate-400">
          Nonton Film & Serial TV Dubbing Indonesia berkualitas Full HD secara gratis.
        </p>
        <div className="text-xs text-slate-500">
          © 2026 McDubindoFlix • Web Film Khusus Yang suka Film BerDub Indo ajah
        </div>
      </footer>
    </div>
  );
}
