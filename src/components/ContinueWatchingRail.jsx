import React from 'react';
import { Play, History, X } from 'lucide-react';

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

export default function ContinueWatchingRail({
  historyItems = [],
  onResumeMovie,
  onRemoveItem,
  onClearHistory,
}) {
  if (!historyItems || historyItems.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 my-6">
      {/* Rail Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#E50914]/20 border border-[#E50914]/30 text-[#E50914]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-normal">
              Lanjutkan Menonton
            </h3>
            <p className="text-[11px] text-slate-400">
              Lanjutkan tontonan tepat dari menit terakhir kali kamu tonton
            </p>
          </div>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[11px] font-medium text-slate-400 hover:text-red-400 transition-colors"
          >
            Hapus Semua
          </button>
        )}
      </div>

      {/* Horizontal Scroll Rail */}
      <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        {historyItems.map((item) => {
          const percent = item.percent || 0;
          const curFormatted = formatTime(item.currentTime);
          const durFormatted = item.duration ? formatTime(item.duration) : '';

          return (
            <div
              key={item.id || item.slug}
              className="relative shrink-0 w-60 sm:w-64 group bg-[#151522] rounded-2xl overflow-hidden border border-[#232338] hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/60"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => onResumeMovie(item)}
                className="relative aspect-video w-full bg-black/40 overflow-hidden cursor-pointer"
              >
                <img
                  src={item.movie?.thumbnail || '/placeholder.jpg'}
                  alt={item.cleanTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Floating Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <div className="w-11 h-11 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-[#E50914]/50 transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Episode Badge if Series */}
                {item.episodeLabel && (
                  <div className="absolute top-2 left-2 bg-[#E50914] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    {item.episodeLabel}
                  </div>
                )}

                {/* Delete / Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id || item.slug);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-[#E50914] text-white/80 hover:text-white transition-colors"
                  title="Hapus dari histori"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Last Watched Timestamp Label */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-200 pointer-events-none">
                  <span className="bg-black/70 px-1.5 py-0.5 rounded border border-white/10">
                    Menit {curFormatted}
                  </span>
                  {durFormatted && (
                    <span className="text-slate-400">
                      {durFormatted}
                    </span>
                  )}
                </div>

                {/* Slidebar / Progress Bar (Interactive Visual Indicator) */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                  <div
                    className="h-full bg-[#E50914] rounded-r-full transition-all duration-300"
                    style={{ width: `${Math.max(5, Math.min(100, percent))}%` }}
                  />
                </div>
              </div>

              {/* Title & Info */}
              <div
                onClick={() => onResumeMovie(item)}
                className="p-3 cursor-pointer"
              >
                <h4
                  className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-[#00E5FF] transition-colors truncate"
                  title={item.cleanTitle}
                >
                  {item.cleanTitle}
                </h4>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span className="truncate">
                    {item.episodeLabel ? `${item.episodeLabel} • ` : ''}
                    {percent}% Selesai
                  </span>
                  <span className="text-[#00E5FF] font-medium hover:underline shrink-0 ml-2">
                    Lanjutkan ▶
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
