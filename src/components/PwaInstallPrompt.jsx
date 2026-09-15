import React from 'react';
import { X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PwaInstallPrompt({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141422] rounded-3xl border border-[#2D2D44] p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4">
          <img
            src="/icons/icon-192.png"
            alt="McDubindoFlix"
            className="w-16 h-16 rounded-2xl shadow-xl shadow-[#E50914]/30 border border-white/10"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">McDubindoFlix</h3>
              <span className="text-[10px] font-extrabold bg-[#E50914] text-white px-2 py-0.5 rounded uppercase">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Pasang di Layar Utama iPhone 14 & Semua HP
            </p>
          </div>
        </div>

        {/* Highlight Alert */}
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-[#00E5FF]/30 text-xs text-cyan-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
          <span>
            Aplikasi web ini mendukung mode <strong>Standalone</strong>. Setelah ditambahkan ke layar utama, web akan berjalan layar penuh seperti aplikasi native iPhone tanpa address bar safari!
          </span>
        </div>

        {/* iPhone 14 Step by Step */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Panduan iPhone 14 (Safari)
          </h4>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1B1B2C] border border-white/5">
              <div className="w-6 h-6 rounded-lg bg-[#E50914]/20 text-[#FF4550] flex items-center justify-center text-xs font-black shrink-0">
                1
              </div>
              <div className="text-xs text-slate-200">
                Buka web ini menggunakan browser <strong>Safari</strong> di iPhone 14 kamu.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1B1B2C] border border-white/5">
              <div className="w-6 h-6 rounded-lg bg-[#E50914]/20 text-[#FF4550] flex items-center justify-center text-xs font-black shrink-0">
                2
              </div>
              <div className="text-xs text-slate-200">
                Tekan tombol <strong>Bagikan (Share)</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> di bagian bilah navigasi bawah Safari.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1B1B2C] border border-white/5">
              <div className="w-6 h-6 rounded-lg bg-[#E50914]/20 text-[#FF4550] flex items-center justify-center text-xs font-black shrink-0">
                3
              </div>
              <div className="text-xs text-slate-200">
                Gulir menu ke bawah lalu ketuk opsi <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1B1B2C] border border-white/5">
              <div className="w-6 h-6 rounded-lg bg-[#E50914]/20 text-[#FF4550] flex items-center justify-center text-xs font-black shrink-0">
                4
              </div>
              <div className="text-xs text-slate-200">
                Tekan <strong>"Tambah" (Add)</strong> di sudut kanan atas. Selesai! Icon McDubindoFlix siap dibuka kapan pun.
              </div>
            </div>
          </div>
        </div>

        {/* Footer OK Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E50914] to-[#FF2E3B] text-white font-black text-sm shadow-lg shadow-[#E50914]/30 hover:opacity-95 transition-all"
        >
          Mengerti & Tutup
        </button>
      </div>
    </div>
  );
}
