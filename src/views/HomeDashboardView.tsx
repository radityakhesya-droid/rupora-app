'use client';

import React from 'react';
import { Bookmark, RefreshCw } from 'lucide-react';
import { useRupora } from '@/context/RuporaContext';
import { Sparkline } from '@/components/Sparkline';
import { formatIDR, formatNumberID, formatPct } from '@/utils/formatters';

export function HomeDashboardView() {
  const {
    user,
    assets,
    holdings,
    cashBalance,
    watchlist,
    toggleWatchlist,
    openStockDetail,
    setActivePage,
    simulateMarketTick,
  } = useRupora();

  const investedValue = holdings.reduce((sum, h) => {
    const asset = assets.find((a) => a.ticker === h.ticker);
    return sum + (asset ? asset.price * h.quantity : h.avgPrice * h.quantity);
  }, 0);

  const totalCost = holdings.reduce((sum, h) => sum + h.avgPrice * h.quantity, 0);
  const netPL = investedValue - totalCost;
  const totalPortfolio = cashBalance + investedValue;

  const dailyChange = holdings.reduce((sum, h) => {
    const asset = assets.find((a) => a.ticker === h.ticker);
    if (!asset) return sum;
    return sum + (asset.price - asset.prevClose) * h.quantity;
  }, 0);

  const prevPortfolio = totalPortfolio - dailyChange;
  const dailyPct = prevPortfolio > 0 ? (dailyChange / prevPortfolio) * 100 : 0;

  const totalGain = Math.max(0, netPL);
  const totalLoss = Math.abs(Math.min(0, netPL));

  const todayMarketTickers = ['IHSG', 'LQ45', 'GOLD', 'IDX30', 'USDIDR', 'BTC'];
  const todayMarketAssets = todayMarketTickers
    .map((t) => assets.find((a) => a.ticker === t))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const highlightTickers = ['IHSG', 'SP500', 'NASDAQ', 'GOLD'];
  const highlightAssets = highlightTickers
    .map((t) => assets.find((a) => a.ticker === t))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const popularStocks = assets.filter((a) => a.category === 'Saham').slice(0, 8);

  const todayLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const initials = (user?.name || 'R')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full max-w-full min-w-0 space-y-5 overflow-x-hidden">
      {/* Header sapaan */}
      <div className="flex w-full min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#172A3A] text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base sm:text-lg font-bold text-[#17212B] dark:text-white">
              Selamat malam, {user?.name || 'Investor'}
            </h1>
            <p className="truncate text-[11px] text-[#8B95A5]">{todayLabel}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={simulateMarketTick}
          title="Perbarui Harga Pasar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E8EDF3] bg-white text-[#356DFF] shadow-2xs transition hover:bg-[#EAF1FF] dark:border-slate-800 dark:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Kartu Biru Total Nilai Portofolio (2x2 di mobile, flex-wrap di desktop) */}
      <section className="w-full max-w-full min-w-0 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#356DFF] via-[#2558E8] to-[#1D4ED8] p-4 sm:p-6 text-white shadow-md">
        <p className="text-[11px] font-medium text-blue-100">Total Nilai Portofolio</p>
        <p className="mt-1 max-w-full break-words font-display text-[clamp(1.375rem,6.2vw,2.25rem)] font-bold leading-tight tracking-tight tabular-nums">
          {formatIDR(totalPortfolio)}
        </p>

        <div className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-white/15 pt-3 text-[11px] sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
          <div className="min-w-0 truncate tabular-nums">
            <span className="block text-[10px] text-blue-200 sm:inline">Perubahan hari ini: </span>
            <strong className="font-semibold text-white">
              {dailyChange >= 0 ? '+' : ''}
              {formatIDR(dailyChange)}
            </strong>
          </div>
          <div className="min-w-0 truncate tabular-nums">
            <span className="block text-[10px] text-blue-200 sm:inline">Persentase: </span>
            <strong className="font-semibold text-white">{formatPct(dailyPct)}</strong>
          </div>
          <div className="min-w-0 truncate tabular-nums">
            <span className="block text-[10px] text-blue-200 sm:inline">Keuntungan investasi: </span>
            <strong className="font-semibold text-emerald-300">+{formatIDR(totalGain)}</strong>
          </div>
          <div className="min-w-0 truncate tabular-nums">
            <span className="block text-[10px] text-blue-200 sm:inline">Kerugian investasi: </span>
            <strong className="font-semibold text-rose-200">
              {totalLoss > 0 ? `-${formatIDR(totalLoss)}` : 'Rp 0'}
            </strong>
          </div>
        </div>
      </section>

      {/* Today's Market */}
      <section className="w-full max-w-full min-w-0 space-y-2.5">
        <h2 className="font-display text-sm font-bold text-[#17212B] dark:text-white">
          Today&apos;s Market
        </h2>

        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {todayMarketAssets.map((item) => {
            const diff = item.price - item.prevClose;
            const pct = item.prevClose > 0 ? (diff / item.prevClose) * 100 : 0;
            const isPos = diff >= 0;
            const series = item.history['1D'] || [item.prevClose, item.price];

            return (
              <button
                key={item.ticker}
                type="button"
                onClick={() => openStockDetail(item.ticker)}
                className="flex w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-[#E8EDF3] bg-white p-3.5 text-left shadow-2xs transition hover:border-[#356DFF]/40 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-bold text-[#8B95A5]">{item.ticker}</span>
                  <span
                    className={`shrink-0 text-[11px] font-bold tabular-nums ${
                      isPos ? 'text-[#16B981]' : 'text-[#F05A72]'
                    }`}
                  >
                    {formatPct(pct)}
                  </span>
                </div>

                <p className="mt-1 truncate text-sm font-bold text-[#17212B] dark:text-white tabular-nums">
                  {item.category === 'Komoditas' || item.category === 'Kripto'
                    ? formatIDR(item.price)
                    : formatNumberID(item.price)}
                </p>

                <div className="mt-2 h-8 w-full max-w-[96px] overflow-hidden">
                  <Sparkline data={series} positive={isPos} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Market Highlights */}
      <section className="w-full max-w-full min-w-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[#17212B] dark:text-white">
            Market Highlights
          </h2>
          <span className="text-[10px] font-bold tracking-wider text-[#356DFF] uppercase">
            MARKET PULSE
          </span>
        </div>

        <div className="grid w-full min-w-0 grid-cols-2 gap-2.5 lg:grid-cols-4">
          {highlightAssets.map((item) => {
            const diff = item.price - item.prevClose;
            const pct = item.prevClose > 0 ? (diff / item.prevClose) * 100 : 0;
            const isPos = diff >= 0;

            return (
              <button
                key={item.ticker}
                type="button"
                onClick={() => openStockDetail(item.ticker)}
                className="block w-full min-w-0 overflow-hidden rounded-2xl bg-[#172A3A] p-3.5 text-left text-white shadow-2xs transition hover:bg-[#1E3548]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] font-bold text-slate-300">
                    {item.ticker}
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-bold tabular-nums ${
                      isPos ? 'text-[#16B981]' : 'text-[#F05A72]'
                    }`}
                  >
                    {formatPct(pct)}
                  </span>
                </div>

                <p className="mt-1.5 truncate font-display text-sm sm:text-base font-bold text-white tabular-nums">
                  {item.category === 'Komoditas'
                    ? formatIDR(item.price)
                    : formatNumberID(item.price)}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">{item.name}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Popular Stocks */}
      <section className="w-full max-w-full min-w-0 overflow-hidden rounded-[22px] border border-[#E8EDF3] bg-white p-4 sm:p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[#17212B] dark:text-white">
            Popular Stocks
          </h2>
          <button
            type="button"
            onClick={() => setActivePage('market')}
            className="text-xs font-semibold text-[#356DFF] hover:underline"
          >
            Lihat Semua
          </button>
        </div>

        <div className="mt-2 divide-y divide-[#E8EDF3] dark:divide-slate-800">
          {popularStocks.map((stock) => {
            const diff = stock.price - stock.prevClose;
            const pct = stock.prevClose > 0 ? (diff / stock.prevClose) * 100 : 0;
            const isPos = diff >= 0;
            const isSaved = watchlist.includes(stock.ticker);

            return (
              <div
                key={stock.ticker}
                onClick={() => openStockDetail(stock.ticker)}
                className="flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 py-3 transition hover:bg-[#F3F5F9]/60 dark:hover:bg-slate-800/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
                    style={{ backgroundColor: stock.color }}
                  >
                    {stock.ticker.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#17212B] dark:text-white">
                      {stock.ticker}
                    </p>
                    <p className="truncate text-[11px] text-[#8B95A5]">{stock.name}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right tabular-nums">
                    <p className="text-xs font-bold text-[#17212B] dark:text-white">
                      {formatIDR(stock.price)}
                    </p>
                    <p
                      className={`text-[11px] font-semibold ${
                        isPos ? 'text-[#16B981]' : 'text-[#F05A72]'
                      }`}
                    >
                      {formatPct(pct)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(stock.ticker);
                    }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition ${
                      isSaved
                        ? 'border-[#356DFF] bg-[#EAF1FF] text-[#356DFF]'
                        : 'border-[#E8EDF3] text-[#8B95A5] hover:text-[#17212B] dark:border-slate-700'
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
