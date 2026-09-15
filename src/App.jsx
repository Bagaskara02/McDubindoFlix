import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import CategoryNav from './components/CategoryNav';
import MovieCard from './components/MovieCard';
import VideoPlayerModal from './components/VideoPlayerModal';
import WatchlistModal from './components/WatchlistModal';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { getCategoryMovies, searchMovies, initSeriesIndex } from './services/dataService';
import { Film, Sparkles, Tv, AlertCircle, Heart } from 'lucide-react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMovie, setActiveMovie] = useState(null);

  // Watchlist state (persisted in localStorage)
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('mcdubindoflix_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState(false);

  // Persist watchlist changes
  useEffect(() => {
    try {
      localStorage.setItem('mcdubindoflix_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist:', e);
    }
  }, [watchlist]);

  // Initial load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await initSeriesIndex();

      // Load popular and box office for hero banner
      const [pop, box] = await Promise.all([
        getCategoryMovies('popular', 60),
        getCategoryMovies('boxoffice', 20),
      ]);

      setMovies(pop);
      setFeaturedMovies([...box.slice(0, 5), ...pop.slice(0, 5)]);
      setIsLoading(false);
    }
    init();
  }, []);

  // Category change handler
  const handleCategorySelect = async (catId) => {
    setSearchQuery('');
    setActiveCategory(catId);
    setIsLoading(true);
    const data = await getCategoryMovies(catId, 100);
    setMovies(data);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search input handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Revert back to active category
      getCategoryMovies(activeCategory, 100).then(setMovies);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchMovies(searchQuery);
      setMovies(results);
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory]);

  // Watchlist toggle handler
  const handleToggleWatchlist = useCallback((movie) => {
    setWatchlist((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      if (exists) {
        return prev.filter((m) => m.id !== movie.id);
      } else {
        return [movie, ...prev];
      }
    });
  }, []);

  // Watchlist remove handler
  const handleRemoveFromWatchlist = useCallback((movieId) => {
    setWatchlist((prev) => prev.filter((m) => m.id !== movieId));
  }, []);

  // Watchlist clear handler
  const handleClearWatchlist = useCallback(() => {
    if (window.confirm('Yakin ingin mengosongkan seluruh daftar tonton?')) {
      setWatchlist([]);
    }
  }, []);

  // Get current section heading label
  const getSectionTitle = () => {
    if (searchQuery.trim()) {
      return `Hasil Pencarian "${searchQuery}" (${movies.length})`;
    }
    switch (activeCategory) {
      case 'trending':
        return 'Sedang Trending Hari Ini';
      case 'boxoffice':
        return 'Blockbuster Box Office';
      case 'netflix':
        return 'Netflix Originals Dubbing Indo';
      case 'disney':
        return 'Disney+ & Marvel Dubbing Indo';
      case 'series':
        return 'Serial TV & Animasi Terlengkap';
      case 'movies':
        return 'Koleksi Film Layar Lebar';
      default:
        return 'Film & Series Populer';
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C12] text-slate-100 flex flex-col selection:bg-[#E50914] selection:text-white font-sans">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenPwaGuide={() => setIsPwaGuideOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {/* Show Hero Carousel only when NOT searching */}
        {!searchQuery.trim() && featuredMovies.length > 0 && (
          <HeroBanner
            featuredMovies={featuredMovies}
            onPlayMovie={setActiveMovie}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {/* Category Pills Bar */}
        {!searchQuery.trim() && (
          <div className="mt-4">
            <CategoryNav
              activeCategory={activeCategory}
              onSelectCategory={handleCategorySelect}
            />
          </div>
        )}

        {/* Catalog Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-6 bg-[#E50914] rounded-full" />
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {getSectionTitle()}
              </h2>
            </div>
            {!isLoading && (
              <span className="text-xs font-semibold text-slate-400">
                {movies.length} Judul
              </span>
            )}
          </div>

          {/* Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#161622] aspect-video animate-pulse border border-[#222234]"
                />
              ))}
            </div>
          ) : movies.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center space-y-3 bg-[#13131F] rounded-3xl border border-[#252538] p-8 max-w-lg mx-auto">
              <AlertCircle className="w-12 h-12 text-[#FF4550] mx-auto" />
              <h3 className="text-base font-bold text-white">
                Tidak ada film atau serial ditemukan
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Coba gunakan kata kunci lain seperti "Spider-Man", "Kung Fu Panda", atau "Avengers".
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            /* Movie Cards Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5">
              {movies.map((movie) => {
                const isSaved = watchlist.some((m) => m.id === movie.id);
                return (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlayMovie={setActiveMovie}
                    isSaved={isSaved}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#08080C] border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E50914] flex items-center justify-center text-white font-extrabold text-sm">
            M
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            McDubindo<span className="text-[#E50914]">Flix</span>
          </span>
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Nonton Film & Serial TV Dubbing Indonesia berkualitas Full HD secara gratis. Responsif untuk iPhone 14, Tablet, dan Desktop.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-2">
          <span>© 2026 McDubindoFlix</span>
          <span>•</span>
          <button
            onClick={() => setIsPwaGuideOpen(true)}
            className="hover:text-[#00E5FF] transition-colors"
          >
            Pasang di iPhone 14 (PWA)
          </button>
          <span>•</span>
          <a
            href="https://github.com/Bagaskara02/McDubindoFlix.git"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub Repository
          </a>
        </div>
      </footer>

      {/* Video Player Modal */}
      {activeMovie && (
        <VideoPlayerModal
          movie={activeMovie}
          onClose={() => setActiveMovie(null)}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {/* Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        onPlayMovie={(movie) => {
          setIsWatchlistOpen(false);
          setActiveMovie(movie);
        }}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        onClearWatchlist={handleClearWatchlist}
      />

      {/* iPhone 14 PWA Install Modal Guide */}
      <PwaInstallPrompt
        isOpen={isPwaGuideOpen}
        onClose={() => setIsPwaGuideOpen(false)}
      />
    </div>
  );
}
