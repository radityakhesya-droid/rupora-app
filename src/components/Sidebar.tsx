'use client';

import React from 'react';
import { LayoutGrid, Compass, Briefcase, Trophy, Bookmark, Bell, Settings } from 'lucide-react';
import { useRupora } from '@/context/RuporaContext';
import { PageRoute } from '@/types/market';
import { BrandLogo } from './BrandLogo';

const NAV_ITEMS: { id: PageRoute; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Overview', icon: LayoutGrid },
  { id: 'market', label: 'Market', icon: Compass },
  { id: 'portfolio', label: 'My Portfolio', icon: Briefcase },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { id: 'notifications', label: 'Activity', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { activePage, setActivePage, user, notifications } = useRupora();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:justify-between lg:border-r lg:border-[#E8EDF3] lg:bg-white lg:px-5 lg:py-6 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="px-2">
          <BrandLogo />
        </div>
        <nav className="mt-8 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id || (item.id === 'market' && activePage === 'stock-detail');
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`${
                  active
                    ? 'bg-[#EAF1FF] text-[#356DFF] dark:bg-blue-950/60 dark:text-blue-400'
                    : 'text-[#8B95A5] hover:bg-[#F3F5F9] hover:text-[#17212B] dark:hover:bg-slate-800 dark:hover:text-white'
                } flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.id === 'notifications' && unread > 0 && (
                  <span className="rounded-full bg-[#356DFF] px-2 py-0.5 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <button
        onClick={() => setActivePage('settings')}
        className="flex items-center gap-3 rounded-2xl border border-[#E8EDF3] bg-[#F3F5F9]/70 p-3 text-left dark:border-slate-800 dark:bg-slate-800/70"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172A3A] text-xs font-bold text-white">
          {user.avatarInitials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-[#17212B] dark:text-white">{user.name}</p>
          <p className="truncate text-[11px] text-[#8B95A5]">{user.accountType}</p>
        </div>
      </button>
    </aside>
  );
}

