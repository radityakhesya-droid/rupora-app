'use client';

import React from 'react';
import { LayoutGrid, Compass, Briefcase, Trophy, User } from 'lucide-react';
import { useRupora } from '@/context/RuporaContext';
import { PageRoute } from '@/types/market';

const NAV_ITEMS: { id: PageRoute; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: LayoutGrid },
  { id: 'market', label: 'Market', icon: Compass },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'leaderboard', label: 'Rank', icon: Trophy },
  { id: 'settings', label: 'Profile', icon: User },
];

export function MobileNav() {
  const { activePage, setActivePage } = useRupora();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E8EDF3] bg-white/95 px-2 py-2 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-[11px] font-semibold transition ${
                active
                  ? 'bg-[#356DFF] text-white shadow-xs'
                  : 'text-[#8B95A5] hover:text-[#17212B] dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
