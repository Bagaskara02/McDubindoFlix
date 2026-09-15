import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Star, Clock, Eye, Sparkles } from 'lucide-react';
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
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies]);

  if (!featuredMovies.length) return null;

  const movie = featuredMovies[currentIndex] || featuredMovies[0];
  const isSaved = watchlist.some((m) => m.id === movie.id);
  const cleanTitle = getCleanSeriesTitle(movie);
  const isSeriesItem = isSeries(movie);
  const epCount = isSeriesItem ? getSeriesEpisodeCount(movie) : 0;

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] md:h-[600px] overflow-hidden bg-[#0C0C12] select-none">
      {/* Backdrop Image with Dark Overlay */}
      <div className="absolute inset-0">
        <img
          src={sanitizeUrl(movie.thumbnail || movie.gif_preview, '')}
          alt={cleanTitle}
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 blur-[1px]"
        />
        {/* Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C12] via-[#0C0C12]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C12] via-[#0C0C12]/80 to-transparent" />
      </div>

      {/* Hero Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 z-10">
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="bg-[#E50914] text-white px-2.5 py-1 rounded-md tracking-wider uppercase text-[11px] shadow-sm shadow-[#E50914]/50">
              DUB INDO
            </span>
            <span className="bg-black/50 backdrop-blur-md text-[#00E5FF] border border-[#00E5FF]/40 px-2 py-1 rounded-md text-[11px]">
              HD 1080p
            </span>
            {isSeriesItem && epCount > 0 && (
              <span className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 px-2 py-1 rounded-md text-[11px]">
                {epCount} EPISODE
              </span>
            )}
            {movie.duration && (
              <div className="flex items-center gap-1 text-slate-300 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{movie.duration}</span>
              </div>
            )}
            {movie.views && (
              <div className="flex items-center gap-1 text-slate-300 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md text-[11px]">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{movie.views} views</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-md">
            {cleanTitle}
          </h1>

          {/* Description */}
          {movie.description && (
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl">
              {movie.description.replace(/⁣/g, '')}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onPlayMovie(movie)}
              className="flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-xl bg-[#E50914] hover:bg-[#FF1B27] text-white font-extrabold text-sm sm:text-base transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#E50914]/40"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Tonton Sekarang</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(movie)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-bold text-sm transition-all border ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
              }`}
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isSaved ? 'Tersimpan' : 'Watchlist'}
              </span>
            </button>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center gap-2 mt-6">
          {featuredMovies.slice(0, 5).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx
                  ? 'w-8 bg-[#E50914]'
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
