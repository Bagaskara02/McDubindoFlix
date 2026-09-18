import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Clock, Eye, Sparkles, Download } from 'lucide-react';
import { getCleanSeriesTitle, isSeries, getSeriesEpisodeCount } from '../services/dataService';
import { sanitizeUrl } from '../utils/security';

export default function HeroBanner({
  featuredMovies = [],
  onPlayMovie,
  watchlist = [],
  onToggleWatchlist,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!featuredMovies.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(featuredMovies.length, 5));
    }, 6500);
    return () => clearInterval(interval);
  }, [featuredMovies]);

  if (!featuredMovies.length) return null;

  const movie = featuredMovies[currentIndex] || featuredMovies[0];
  const isSaved = watchlist.some((m) => m.id === movie.id);
  const cleanTitle = getCleanSeriesTitle(movie);
  const isSeriesItem = isSeries(movie);
  const epCount = isSeriesItem ? getSeriesEpisodeCount(movie) : 0;
  const posterSrc = sanitizeUrl(movie.thumbnail || movie.gif_preview, '');

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden bg-[#0C0C12] select-none">
      {/* Crisp Right-Aligned Artwork with Natural HD Proportions */}
      <div className="absolute top-0 right-0 w-full md:w-[70%] lg:w-[62%] h-full overflow-hidden">
        <img
          key={movie.id}
          src={posterSrc}
          alt={cleanTitle}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center animate-in fade-in duration-700"
        />

        {/* Seamless Blend Vignette (Left to Right, Top, Bottom) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C12] via-[#0C0C12]/85 via-20% md:via-30% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C12] via-[#0C0C12]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0C0C12]/70 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Ambient background subtle tone for left panel */}
      <div className="absolute top-0 left-0 w-full md:w-[50%] h-full bg-gradient-to-r from-[#0C0C12] via-[#0C0C12] to-transparent pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10 sm:pb-14 z-10">
        <div className="max-w-xl space-y-3 sm:space-y-3.5">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="bg-[#E50914] text-white px-2.5 py-0.5 rounded-md tracking-wider uppercase text-[10px] sm:text-[11px] font-bold shadow-sm shadow-[#E50914]/40">
              DUB INDO
            </span>
            <span className="bg-black/60 backdrop-blur-md text-[#00E5FF] border border-[#00E5FF]/40 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold">
              HD 1080p
            </span>
            {isSeriesItem && epCount > 0 && (
              <span className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold">
                {epCount} EPISODE
              </span>
            )}
            {movie.duration && (
              <div className="flex items-center gap-1 text-slate-300 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] sm:text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{movie.duration}</span>
              </div>
            )}
            {movie.views && (
              <div className="flex items-center gap-1 text-slate-300 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] sm:text-[11px]">
                <Eye className="w-3 h-3 text-slate-400" />
                <span>{movie.views} views</span>
              </div>
            )}
          </div>

          {/* Title: Poppins Regular, Not Bold, Not Oversized */}
          <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-normal text-white leading-snug drop-shadow-md tracking-normal font-sans">
            {cleanTitle}
          </h1>

          {/* Description */}
          {movie.description && (
            <p className="text-xs sm:text-sm text-slate-300 font-normal line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-lg">
              {movie.description.replace(/⁣/g, '')}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            <button
              onClick={() => onPlayMovie(movie)}
              className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#E50914] hover:bg-[#FF1B27] text-white font-semibold text-xs sm:text-sm transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#E50914]/40"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Tonton Sekarang</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(movie)}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium text-xs sm:text-sm transition-all border ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
              }`}
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isSaved ? 'Tersimpan' : 'Watchlist'}</span>
            </button>

            <a
              href="/downloads/McDubindoFlix.apk"
              download="McDubindoFlix.apk"
              className="hidden md:flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium text-xs sm:text-sm bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 backdrop-blur-md transition-all shadow-md"
              title="Download APK Android Flutter (52 MB)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download APK Android</span>
            </a>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center gap-2 mt-5 sm:mt-6">
          {featuredMovies.slice(0, 5).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx
                  ? 'w-7 bg-[#E50914]'
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
