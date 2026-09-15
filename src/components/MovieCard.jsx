import React, { useState } from 'react';
import { Play, Bookmark, Clock, Eye, Check } from 'lucide-react';
import { getCleanSeriesTitle, isSeries, getSeriesEpisodeCount } from '../services/dataService';

export default function MovieCard({
  movie,
  onPlayMovie,
  isSaved,
  onToggleWatchlist,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cleanTitle = getCleanSeriesTitle(movie);
  const isSeriesItem = isSeries(movie);
  const epCount = isSeriesItem ? getSeriesEpisodeCount(movie) : 0;

  // Fallback poster if image fails
  const posterUrl = imgError || !movie.thumbnail
    ? (movie.gif_preview || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60')
    : movie.thumbnail;

  return (
    <div
      className="group relative flex flex-col bg-[#161622] rounded-2xl overflow-hidden border border-[#26263A] hover:border-[#E50914]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#E50914]/15 hover:-translate-y-1.5 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlayMovie(movie)}
    >
      {/* 16:9 Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#10101A]">
        <img
          src={posterUrl}
          alt={cleanTitle}
          onError={() => setImgError(true)}
          loading="lazy"
          className="w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161622] via-transparent to-black/40 opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#E50914] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
              HD
            </span>
            {isSeriesItem && epCount > 0 && (
              <span className="bg-[#00E5FF]/25 backdrop-blur-md text-[#00E5FF] border border-[#00E5FF]/50 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider">
                {epCount} EPS
              </span>
            )}
          </div>

          {movie.duration && (
            <span className="bg-black/60 backdrop-blur-md text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {movie.duration}
            </span>
          )}
        </div>

        {/* Quick Play Center Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-[#E50914]/50 transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-6 h-6 fill-white ml-1" />
          </div>
        </div>

        {/* Watchlist Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(movie);
          }}
          className={`absolute bottom-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-all z-10 ${
            isSaved
              ? 'bg-emerald-500 text-white shadow'
              : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80'
          }`}
          title={isSaved ? 'Hapus dari Watchlist' : 'Simpan ke Watchlist'}
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Info Body */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3
            className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-[#FF3844] transition-colors"
            title={cleanTitle}
          >
            {cleanTitle}
          </h3>
        </div>

        {/* Bottom meta */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-slate-500" />
            <span>{movie.views ? `${movie.views} views` : 'Dub Indo'}</span>
          </div>

          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[90px]">
            {movie.uploader || (isSeriesItem ? 'Series' : 'Movie')}
          </span>
        </div>
      </div>
    </div>
  );
}
