'use client';

import React from 'react';
import { LayoutGrid, Compass, Briefcase, Bookmark, User } from 'lucide-react';
import { useRupora } from '@/context/RuporaContext';
import { PageRoute } from '@/types/market';

const MOBILE_ITEMS: { id: PageRoute; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: LayoutGrid },
  { id: 'market', label: 'Market', icon: Compass },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { id: 'settings', label: 'Profile', icon: User },
];

export function MobileNav() {
  const { activePage, setActivePage } = useRupora();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 rounded-[22px] border border-[#E8EDF3] bg-white/95 px-2 py-2 shadow-lg backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <div className="grid grid-cols-5 items-center">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id || (item.id === 'market' && activePage === 'stock-detail');
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className="flex flex-col items-center justify-center gap-1 py-1"
            >
              <div
                className={`${
                  active
                    ? '-translate-y-1 bg-[#356DFF] text-white shadow-md shadow-[#356DFF]/30'
                    : 'text-[#8B95A5]'
                } flex h-9 w-9 items-center justify-center rounded-xl transition`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`${active ? 'text-[#356DFF]' : 'text-[#8B95A5]'} text-[10px] font-medium`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
