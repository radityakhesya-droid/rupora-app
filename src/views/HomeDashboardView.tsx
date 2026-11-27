'use client';

import React from 'react';
import { Bell, Bookmark } from 'lucide-react';
import { useRupora } from '@/context/RuporaContext';
import {
  formatIDR,
  formatNumberID,
  formatPct,
  formatIndonesianDate,
  getIndonesianGreeting,
} from '@/utils/formatters';
import { Sparkline } from '@/components/Sparkline';

const POPULAR = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'ANTM', 'GOTO', 'AMRT'];
const TODAY = ['IHSG', 'IDX30', 'LQ45', 'USDIDR', 'GOLD', 'BTC'];
const HIGHLIGHTS = ['IHSG', 'SP500', 'NASDAQ', 'GOLD'];

export function HomeDashboardView() {
  const {
    user,
    assets,
    holdings,
    cashBalance,
    watchlist,
    notifications,
    openStockDetail,
    toggleWatchlist,
    setActivePage,
  } = useRupora();

  const holdingsVal = holdings.reduce(
    (s, h) => s + (assets.find((a) => a.ticker === h.ticker)?.price || h.avgPrice) * h.quantity,
    0
  );
  const costVal = holdings.reduce((s, h) => s + h.avgPrice * h.quantity, 0);
  const totalVal = holdingsVal + cashBalance;
  const pl = holdingsVal - costVal;
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#172A3A] text-sm font-bold text-white">
            {user.avatarInitials}
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold">
              {getIndonesianGreeting()}, {user.name.split(' ')[0]}
            </h1>
            <p className="text-xs text-[#8B95A5]">{formatIndonesianDate()}</p>
          </div>
        </div>
        <button
          onClick={() => setActivePage('notifications')}
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E8EDF3] bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-[#356DFF]" />}
        </button>
      </header>

      <section className="rounded-[22px] bg-gradient-to-br from-[#356DFF] to-[#1E44B8] p-6 text-white">
        <p className="text-xs text-blue-100">Total Nilai Portofolio</p>
        <p className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tabular-nums">
          {formatIDR(totalVal)}
        </p>
        <div className="mt-4 flex flex-wrap gap-5 border-t border-white/15 pt-4 text-xs tabular-nums">
          <span>
            Perubahan hari ini: <strong>+Rp 620.000</strong>
          </span>
          <span>
            Persentase: <strong>+0,76%</strong>
          </span>
          <span>
            Keuntungan investasi: <strong>{pl >= 0 ? '+' + formatIDR(pl) : 'Rp 0'}</strong>
          </span>
          <span>
            Kerugian investasi: <strong>{pl < 0 ? formatIDR(pl) : 'Rp 0'}</strong>
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm font-bold">Today&apos;s Market</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TODAY.map((sym) => {
            const it = assets.find((a) => a.ticker === sym);
            if (!it) return null;
            const pct = ((it.price - it.prevClose) / it.prevClose) * 100;
            const pos = pct >= 0;
            return (
              <button
                key={sym}
                onClick={() => openStockDetail(sym)}
                className="rounded-2xl border border-[#E8EDF3] bg-white p-3.5 text-left dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex justify-between text-xs font-bold">
                  <span>{sym}</span>
                  <span className={`${pos ? 'text-[#16B981]' : 'text-[#F05A72]'} tabular-nums`}>
                    {formatPct(pct)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-bold tabular-nums">
                  {sym === 'BTC' || sym === 'GOLD' ? formatIDR(it.price) : formatNumberID(it.price)}
                </p>
                <div className="mt-2">
                  <Sparkline data={it.history['1D']} positive={pos} width={84} height={24} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex justify-between">
          <h2 className="font-display text-sm font-bold">Market Highlights</h2>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#356DFF]">
            MARKET PULSE
          </span>
        </div>
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar">
          {HIGHLIGHTS.map((sym) => {
            const it = assets.find((a) => a.ticker === sym);
            if (!it) return null;
            const pct = ((it.price - it.prevClose) / it.prevClose) * 100;
            const pos = pct >= 0;
            return (
              <button
                key={sym}
                onClick={() => openStockDetail(sym)}
                className="min-w-[230px] flex-1 rounded-[22px] bg-[#172A3A] p-4 text-left text-white"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">{it.ticker}</span>
                  <span className={pos ? 'text-[#16B981]' : 'text-[#F05A72]'}>{formatPct(pct)}</span>
                </div>
                <p className="mt-2 font-display text-lg font-bold tabular-nums">
                  {sym === 'GOLD' ? formatIDR(it.price) : formatNumberID(it.price)}
                </p>
                <p className="truncate text-[11px] text-slate-400">{it.name}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[22px] border border-[#E8EDF3] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 font-display text-sm font-bold">Popular Stocks</h2>
        <div className="divide-y divide-[#E8EDF3] dark:divide-slate-800">
          {POPULAR.map((sym) => {
            const st = assets.find((a) => a.ticker === sym);
            if (!st) return null;
            const pct = ((st.price - st.prevClose) / st.prevClose) * 100;
            const pos = pct >= 0;
            const saved = watchlist.includes(sym);
            return (
              <div key={sym} className="flex items-center justify-between gap-3 py-3">
                <button
                  onClick={() => openStockDetail(sym)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{ backgroundColor: st.color }}
                  >
                    {sym.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{sym}</p>
                    <p className="truncate text-xs text-[#8B95A5]">{st.name}</p>
                  </div>
                </button>
                <div className="text-right tabular-nums">
                  <p className="text-sm font-bold">{formatIDR(st.price)}</p>
                  <p className={`${pos ? 'text-[#16B981]' : 'text-[#F05A72]'} text-xs font-semibold`}>
                    {formatPct(pct)}
                  </p>
                </div>
                <button
                  onClick={() => toggleWatchlist(sym)}
                  className={`${
                    saved
                      ? 'border-[#356DFF] bg-[#EAF1FF] text-[#356DFF]'
                      : 'border-[#E8EDF3] text-[#8B95A5]'
                  } flex h-9 w-9 items-center justify-center rounded-xl border`}
                >
                  <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
