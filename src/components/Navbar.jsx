import React, { useState } from 'react';
import { Search, Bookmark, X, Film, Tv, Sparkles, Smartphone, Menu, Download } from 'lucide-react';

export default function Navbar({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategorySelect,
  watchlistCount,
  onOpenWatchlist,
  onOpenPwaGuide,
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'popular', label: 'Beranda' },
    { id: 'trending', label: 'Trending' },
    { id: 'series', label: 'Series' },
    { id: 'movies', label: 'Film' },
    { id: 'disney', label: 'Disney+' },
    { id: 'netflix', label: 'Netflix' },
    { id: 'boxoffice', label: 'Box Office' },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full glass-nav transition-all"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 gap-2 sm:gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onCategorySelect('popular')}
              className="flex items-center gap-2 group text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E50914] to-[#FF4550] flex items-center justify-center font-bold text-white shadow-md shadow-[#E50914]/30 group-hover:scale-105 transition-transform">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                  McDubindo<span className="text-[#E50914]">Flix</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-[#E50914]/20 text-[#FF4550] px-1.5 py-0.5 rounded border border-[#E50914]/30">
                    DUB INDO
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">
                    HD GRATIS
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {navItems.map((item, idx) => {
              const isActive = activeCategory === item.id && !searchQuery;
              const isSecondary = idx >= 4; // Disney+, Netflix, Box Office visible on 2xl
              return (
                <button
                  key={item.id}
                  onClick={() => onCategorySelect(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs xl:text-sm font-medium whitespace-nowrap transition-all ${
                    isSecondary ? 'hidden 2xl:inline-block' : 'inline-block'
                  } ${
                    isActive
                      ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Bar (Search, Watchlist, Download APK, PWA) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Bar Input (Desktop) */}
            <div className="hidden sm:flex relative items-center shrink-0">
              <input
                type="text"
                placeholder="Cari film atau serial..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-28 lg:w-36 xl:w-48 pl-8 pr-7 py-1.5 text-xs lg:text-sm bg-white/5 border border-white/10 rounded-full text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:w-40 lg:focus:w-48 xl:focus:w-56 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="sm:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Cari"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Watchlist Button */}
            <button
              onClick={onOpenWatchlist}
              className="relative p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Daftar Tonton"
            >
              <Bookmark className="w-4 h-4 text-[#FFD700]" />
              <span className="hidden xl:inline text-xs font-medium">Watchlist</span>
              {watchlistCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-[#E50914] text-white rounded-full min-w-4 text-center shadow">
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* Download APK Button (Direct link for Android) */}
            <a
              href="/downloads/McDubindoFlix.apk"
              download="McDubindoFlix.apk"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all whitespace-nowrap shrink-0 shadow-sm"
              title="Download APK Android (Versi Flutter)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download APK</span>
              <span className="sm:hidden text-[10px]">APK</span>
            </a>

            {/* PWA install guide trigger */}
            <button
              onClick={onOpenPwaGuide}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-cyan-500/10 text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-cyan-500/20 transition-all whitespace-nowrap shrink-0"
              title="Panduan Pasang Aplikasi (Apple / Android)"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Petunjuk</span>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {isSearchOpen && (
          <div className="sm:hidden pb-3 pt-1">
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Cari film atau serial (cth: Kung Fu Panda, Spider-Man)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#161622] border border-[#2A2A3E] rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E50914]"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-white/10 grid grid-cols-2 gap-2 animate-in fade-in duration-200">
            {navItems.map((item) => {
              const isActive = activeCategory === item.id && !searchQuery;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onCategorySelect(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                    isActive
                      ? 'bg-[#E50914] text-white shadow-sm'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* Mobile Menu Action Buttons */}
            <a
              href="/downloads/McDubindoFlix.apk"
              download="McDubindoFlix.apk"
              onClick={() => setIsMobileMenuOpen(false)}
              className="col-span-2 px-3 py-2.5 rounded-xl text-xs font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-900/40 mt-1"
            >
              <Download className="w-4 h-4" />
              <span>Download APK Android (Versi Flutter 52 MB)</span>
            </a>

            <button
              onClick={() => {
                onOpenPwaGuide();
                setIsMobileMenuOpen(false);
              }}
              className="col-span-2 px-3 py-2 rounded-xl text-xs font-medium text-center bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Panduan Pasang App (Apple / Android)</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
