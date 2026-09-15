import React from 'react';
import { X, Trash2, Play, Bookmark } from 'lucide-react';
import { getCleanSeriesTitle, isSeries, getSeriesEpisodeCount } from '../services/dataService';

export default function WatchlistModal({
  isOpen,
  onClose,
  watchlist = [],
  onPlayMovie,
  onRemoveFromWatchlist,
  onClearWatchlist,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#141420] rounded-3xl border border-[#26263A] flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#191928]">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-[#FFD700]" />
            <h2 className="text-base font-extrabold text-white">
              Daftar Tonton Saya ({watchlist.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {watchlist.length > 0 && (
              <button
                onClick={onClearWatchlist}
                className="text-xs font-semibold text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {watchlist.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Bookmark className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
              <p className="text-sm font-semibold text-slate-400">
                Belum ada film atau serial di daftar tonton kamu.
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tekan tombol bookmark pada kartu film atau saat memutar untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            watchlist.map((movie) => {
              const cleanTitle = getCleanSeriesTitle(movie);
              const isSeriesItem = isSeries(movie);
              const epCount = isSeriesItem ? getSeriesEpisodeCount(movie) : 0;

              return (
                <div
                  key={movie.id}
                  className="group flex items-center gap-3.5 p-2.5 rounded-2xl bg-[#1B1B2A] hover:bg-[#232338] border border-white/5 transition-all"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      onClose();
                      onPlayMovie(movie);
                    }}
                    className="relative w-24 h-14 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer"
                  >
                    <img
                      src={movie.thumbnail || movie.gif_preview}
                      alt={cleanTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 fill-white text-white" />
                    </div>
                  </div>

                  {/* Details */}
                  <div
                    onClick={() => {
                      onClose();
                      onPlayMovie(movie);
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FF3844] transition-colors">
                      {cleanTitle}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      {isSeriesItem && epCount > 0 ? (
                        <span className="text-[#00E5FF] font-semibold">{epCount} Episode</span>
                      ) : (
                        <span>{movie.duration || 'Film'}</span>
                      )}
                      {movie.category && <span>• {movie.category}</span>}
                    </div>
                  </div>

                  {/* Remove action */}
                  <button
                    onClick={() => onRemoveFromWatchlist(movie.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
