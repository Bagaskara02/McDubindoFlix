import React from 'react';
import { Flame, Film, Tv, Trophy, Sparkles, Compass } from 'lucide-react';

export default function CategoryNav({ activeCategory, onSelectCategory }) {
  const categories = [
    { id: 'popular', label: 'Semua Populer', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'boxoffice', label: 'Box Office', icon: Trophy },
    { id: 'netflix', label: 'Netflix', icon: Film },
    { id: 'disney', label: 'Disney+', icon: Compass },
    { id: 'series', label: 'Series Lengkap', icon: Tv },
    { id: 'movies', label: 'Film Bioskop', icon: Film },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 my-2">
      <div className="flex items-center gap-2.5 px-4 sm:px-6 lg:px-8 min-w-max">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#E50914] to-[#FF2E3B] text-white shadow-lg shadow-[#E50914]/30 scale-105'
                  : 'bg-[#161622] text-slate-300 hover:text-white hover:bg-[#1F1F30] border border-[#2A2A3E]/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
