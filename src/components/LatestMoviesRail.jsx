import React from 'react';
import { Clock, ChevronRight, Play } from 'lucide-react';
import { getCleanSeriesTitle } from '../services/dataService';

export default function LatestMoviesRail({
  movies = [],
  onPlayMovie,
  onSeeAll,
}) {
  if (!movies || movies.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-[#00E5FF]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-normal flex items-center gap-2">
              Update Terbaru
              <span className="bg-[#E50914] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                BARU
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Film dan episode serial Dubbing Indonesia yang baru saja ditambahkan
            </p>
          </div>
        </div>

        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-1 text-xs font-semibold text-[#00E5FF] hover:text-white transition-colors"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Scroll Rail */}
      <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        {movies.map((movie) => {
          const displayTitle = getCleanSeriesTitle(movie);

          return (
            <div
              key={movie.id || movie.slug}
              onClick={() => onPlayMovie(movie)}
              className="relative shrink-0 w-44 sm:w-48 group bg-[#151522] rounded-2xl overflow-hidden border border-[#232338] hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/60 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[16/10] w-full bg-black/40 overflow-hidden">
                <img
                  src={movie.thumbnail || '/placeholder.jpg'}
                  alt={displayTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Badge BARU */}
                <div className="absolute top-2 left-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                  BARU
                </div>

                {/* Duration */}
                {movie.duration && (
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-slate-300 border border-white/10">
                    {movie.duration}
                  </div>
                )}

                {/* Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-[#E50914]/50 transform group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="p-2.5">
                <h4
                  className="text-xs font-semibold text-slate-200 group-hover:text-[#00E5FF] transition-colors truncate"
                  title={displayTitle}
                >
                  {displayTitle}
                </h4>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span className="text-[#E50914] font-bold">DUB INDO</span>
                  {movie.time_ago && (
                    <span className="truncate">{movie.time_ago}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
