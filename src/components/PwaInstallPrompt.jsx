import React, { useState } from 'react';
import { X, Smartphone, Share, PlusSquare, Sparkles, Download, CheckCircle2, ShieldCheck, ArrowDownToLine } from 'lucide-react';

export default function PwaInstallPrompt({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
      return 'android';
    }
    return 'android'; // Default to android APK download
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141422] rounded-3xl border border-[#2D2D44] p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 sm:gap-4 pr-8">
          <img
            src="/icons/icon-192.png"
            alt="McDubindoFlix"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-xl shadow-[#E50914]/30 border border-white/10 shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">McDubindoFlix</h3>
              <span className="text-[10px] font-extrabold bg-[#E50914] text-white px-2 py-0.5 rounded uppercase">
                V2.1.0
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Aplikasi Nonton Film & Series Dubbing Indonesia Full HD
            </p>
          </div>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex rounded-xl bg-[#0D0D18] p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'android'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Android (APK Flutter)</span>
          </button>
          <button
            onClick={() => setActiveTab('apple')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'apple'
                ? 'bg-[#E50914] text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Apple (iOS Safari)</span>
          </button>
        </div>

        {/* TAB 1: Android APK Download */}
        {activeTab === 'android' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Download Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#16241E] to-[#121A16] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    APK RESMI
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Universal (52.3 MB)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Aman & Bebas Iklan</span>
                </div>
              </div>

              <a
                href="/downloads/McDubindoFlix.apk"
                download="McDubindoFlix.apk"
                className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                <ArrowDownToLine className="w-4 h-4 animate-bounce" />
                <span>Download APK Android Sekarang</span>
              </a>

              <p className="text-[11px] text-slate-400 text-center">
                Dibuat dengan <strong>Flutter</strong>. Performa native 60fps, responsif, dan hemat kuota.
              </p>
            </div>

            {/* Quick Install Guide for APK */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cara Pasang di HP Android:
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#1B1B2C] border border-white/5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">1</div>
                  <span>Klik tombol <strong>Download APK</strong> di atas lalu tunggu unduhan selesai.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#1B1B2C] border border-white/5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">2</div>
                  <span>Buka file <strong>McDubindoFlix.apk</strong> dari notifikasi atau folder Download.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#1B1B2C] border border-white/5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">3</div>
                  <span>Jika muncul konfirmasi keamanan, pilih <strong>Izinkan instalasi dari sumber ini</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#1B1B2C] border border-white/5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">4</div>
                  <span>Pilih <strong>Install</strong> dan buka aplikasi untuk mulai menonton!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Apple iOS PWA Guide */}
        {activeTab === 'apple' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Highlight Alert */}
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-[#00E5FF]/30 text-xs text-cyan-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
              <span>
                Pengguna Apple (iPhone & iPad) dapat menginstal web ini sebagai <strong>Aplikasi PWA Standalone</strong> tanpa App Store dan bebas address bar peramban.
              </span>
            </div>

            {/* Apple Step by Step */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1B1B2C] border border-white/5">
                <div className="w-6 h-6 rounded-lg bg-[#E50914]/20 text-[#FF4550] flex items-center justify-center text-xs font-black shrink-0">1</div>
                <div className="text-xs text-slate-200">
                  Buka web ini menggunakan browser <strong>Safari</strong> di iPhone atau iPad.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1B1B2C] border border-white/5">
                <div className="w-6 h-6 rounded-lg bg-[#E50914]/20 text-[#FF4550] flex items-center justify-center text-xs font-black shrink-0">2</div>
                <div className="text-xs text-slate-200">
                  Tekan tombol <strong>Bagikan (Share)</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> di bagian bilah navigasi bawah Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1B1B2C] border border-white/5">
                <div className="w-6 h-6 rounded-lg bg-[#E50914]/20 text-[#FF4550] flex items-center justify-center text-xs font-black shrink-0">3</div>
                <div className="text-xs text-slate-200">
                  Gulir ke bawah dan ketuk <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1B1B2C] border border-white/5">
                <div className="w-6 h-6 rounded-lg bg-[#E50914]/20 text-[#FF4550] flex items-center justify-center text-xs font-black shrink-0">4</div>
                <div className="text-xs text-slate-200">
                  Tekan <strong>"Tambah" (Add)</strong> di pojok kanan atas. Ikon McDubindoFlix akan muncul di layar utama!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer OK Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm transition-all"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
