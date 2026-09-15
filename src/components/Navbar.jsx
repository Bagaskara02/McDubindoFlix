import React, { useState } from 'react';
import { Search, Bookmark, X, Film, Tv, Sparkles, Smartphone, Menu } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full glass-nav transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onCategorySelect('popular')}
              className="flex items-center gap-2 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E50914] to-[#FF4550] flex items-center justify-center font-extrabold text-white shadow-lg shadow-[#E50914]/30 group-hover:scale-105 transition-transform">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-white group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                  McDubindo<span className="text-[#E50914]">Flix</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-[#E50914]/20 text-[#FF4550] px-1.5 py-0.5 rounded border border-[#E50914]/30">
                    DUB INDO
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                    HD GRATIS
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeCategory === item.id && !searchQuery;
              return (
                <button
                  key={item.id}
                  onClick={() => onCategorySelect(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
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

          {/* Action Bar (Search, Watchlist, iPhone PWA) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Bar Input (Desktop) */}
            <div className="hidden sm:flex relative items-center">
              <input
                type="text"
                placeholder="Cari film atau serial (misal Spider-Man)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-56 md:w-72 pl-9 pr-8 py-2 text-sm bg-white/5 border border-white/10 rounded-full text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] focus:w-80 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-4 h-4" />
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
              className="relative p-2 sm:px-3 sm:py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              title="Daftar Tonton"
            >
              <Bookmark className="w-5 h-5 text-[#FFD700]" />
              <span className="hidden lg:inline text-xs font-semibold">Watchlist</span>
              {watchlistCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto px-1.5 py-0.5 text-[10px] font-bold bg-[#E50914] text-white rounded-full min-w-5 text-center shadow">
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* iPhone 14 PWA install guide trigger */}
            <button
              onClick={onOpenPwaGuide}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-cyan-500/20 transition-all"
              title="Pasang di iPhone 14 / HP"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install di Layar</span>
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
            <button
              onClick={() => {
                onOpenPwaGuide();
                setIsMobileMenuOpen(false);
              }}
              className="col-span-2 px-3 py-2.5 rounded-xl text-xs font-bold text-center bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 flex items-center justify-center gap-2 mt-1"
            >
              <Smartphone className="w-4 h-4" />
              <span>Tambahkan ke Layar Utama iPhone 14</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
