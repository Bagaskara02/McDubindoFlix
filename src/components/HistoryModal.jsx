import React from 'react';
import { X, Trash2, Play, History } from 'lucide-react';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00';
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

export default function HistoryModal({
  isOpen,
  onClose,
  history = [],
  onResumeMovie,
  onRemoveItem,
  onClearHistory,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#141420] rounded-3xl border border-[#26263A] flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#181827]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-[#00E5FF] border border-cyan-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Riwayat Tontonan ({history.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Lanjutkan tontonan dari menit terakhir kali kamu tonton
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs font-semibold text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-xl hover:bg-red-500/10 transition-colors flex items-center gap-1"
                title="Hapus Seluruh Riwayat"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kosongkan</span>
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 no-scrollbar">
          {history.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                <History className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Belum ada riwayat tontonan.
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Film atau serial yang kamu putar akan otomatis tersimpan di sini beserta menit terakhir ditonton.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const curFormatted = formatTime(item.currentTime);
              const durFormatted = item.duration ? formatTime(item.duration) : '';
              const percent = item.percent || 0;

              return (
                <div
                  key={item.id || item.slug}
                  className="group flex items-center gap-3 sm:gap-4 p-2.5 rounded-2xl bg-[#1B1B2A] hover:bg-[#222236] border border-white/5 transition-all"
                >
                  {/* Thumbnail with Slidebar Progress */}
                  <div
                    onClick={() => {
                      onClose();
                      onResumeMovie(item);
                    }}
                    className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer"
                  >
                    <img
                      src={item.movie?.thumbnail || '/placeholder.jpg'}
                      alt={item.cleanTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-8 h-8 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Episode Badge */}
                    {item.episodeLabel && (
                      <div className="absolute top-1.5 left-1.5 bg-[#E50914] text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow">
                        {item.episodeLabel}
                      </div>
                    )}

                    {/* Bottom Red Slidebar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-[#E50914]"
                        style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div
                    onClick={() => {
                      onClose();
                      onResumeMovie(item);
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#00E5FF] transition-colors">
                      {item.cleanTitle}
                    </h4>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      {item.episodeLabel && (
                        <span className="text-[#00E5FF] font-semibold">{item.episodeLabel}</span>
                      )}
                      <span>•</span>
                      <span className="text-slate-300 font-mono">
                        Menit {curFormatted} {durFormatted ? `/ ${durFormatted}` : ''}
                      </span>
                      <span>•</span>
                      <span>{percent}%</span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#00E5FF] font-medium">
                      <span>Lanjutkan Menonton ▶</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onRemoveItem(item.id || item.slug)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                      title="Hapus dari Riwayat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
