'use client';

import React, { useState } from 'react';
import { useRupora } from '@/context/RuporaContext';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { LoginView, SignUpView } from '@/views/AuthViews';
import { HomeDashboardView } from '@/views/HomeDashboardView';
import { StockDetailView } from '@/views/StockDetailView';
import { LeaderboardView } from '@/views/LeaderboardView';
import { formatIDR, formatPct } from '@/utils/formatters';
import { Sparkline } from '@/components/Sparkline';
import { AssetCategory } from '@/types/market';

export default function RuporaPage() {
  const {
    isAuthenticated,
    activePage,
    assets,
    watchlist,
    holdings,
    cashBalance,
    notifications,
    trades,
    selectedTicker,
    openStockDetail,
    toggleWatchlist,
    simulateOrder,
    markAllNotificationsRead,
    updateProfile,
    setTheme,
    theme,
    resetSimulation,
    logoutDemo,
    setActivePage,
    user,
    toastMessage,
  } = useRupora();

  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<AssetCategory>('Saham');
  const [pname, setPname] = useState(user.name);
  const [pemail, setPemail] = useState(user.email);

  if (!isAuthenticated) {
    return <>{activePage === 'signup' ? <SignUpView /> : <LoginView />}</>;
  }

  const filtered = assets.filter((a) =>
    !search.trim()
      ? a.category === cat
      : a.ticker.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase())
  );

  const sellTrades = trades.filter((t) => t.side === 'SELL');
  const totalRealizedPL = sellTrades.reduce((acc, tr) => {
    if (typeof tr.realizedPL === 'number') return acc + tr.realizedPL;
    const h = holdings.find((item) => item.ticker === tr.ticker);
    const refAvg = h?.avgPrice ?? tr.price;
    return acc + (tr.price - refAvg) * tr.quantity;
  }, 0);

  const totalUnrealizedPL = holdings.reduce((acc, h) => {
    const px = assets.find((a) => a.ticker === h.ticker)?.price ?? h.avgPrice;
    return acc + (px - h.avgPrice) * h.quantity;
  }, 0);

  return (
    <div className="flex min-h-screen bg-[#F3F5F9] dark:bg-[#0E1621]">
      <Sidebar />
      <main className="flex-1 pb-24 lg:pb-10">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {activePage === 'home' && <HomeDashboardView />}

          {activePage === 'market' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-bold">Market</h1>
                <span className="rounded-full bg-[#EAF1FF] px-3 py-1 text-xs font-semibold text-[#356DFF]">
                  Investasi Market
                </span>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari saham, perusahaan, atau kode..."
                className="w-full rounded-2xl border border-[#E8EDF3] bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900"
              />
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {(['Saham', 'Indeks', 'ETF', 'Komoditas', 'Kripto'] as AssetCategory[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`${
                      cat === c ? 'bg-[#356DFF] text-white' : 'bg-white text-[#8B95A5]'
                    } rounded-2xl px-4 py-2 text-xs font-semibold`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item, idx) => {
                  const pct = ((item.price - item.prevClose) / item.prevClose) * 100;
                  return (
                    <div
                      key={`${item.ticker}-${idx}`}
                      onClick={() => openStockDetail(item.ticker)}
                      className="cursor-pointer rounded-[22px] border border-[#E8EDF3] bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-bold">{item.ticker}</p>
                          <p className="text-xs text-[#8B95A5]">{item.name}</p>
                        </div>
                        <Sparkline data={item.history['1D']} positive={pct >= 0} />
                      </div>
                      <div className="mt-3 flex justify-between text-xs tabular-nums">
                        <span className="font-bold">{formatIDR(item.price)}</span>
                        <span className={pct >= 0 ? 'text-[#16B981]' : 'text-[#F05A72]'}>
                          {formatPct(pct)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activePage === 'stock-detail' && <StockDetailView />}

          {activePage === 'leaderboard' && <LeaderboardView />}

          {activePage === 'portfolio' && (
            <div className="space-y-6">
              <section className="rounded-[22px] border border-[#E8EDF3] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="font-display text-2xl font-bold">My Portfolio</h1>
                    <p className="text-xs text-[#8B95A5]">
                      Kas Investasi: <strong className="text-[#17212B] dark:text-white">{formatIDR(cashBalance)}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
                    <p className="text-[11px] text-[#8B95A5]">Untung / Rugi Terealisasi (Dari Penjualan)</p>
                    <p
                      className={`${
                        totalRealizedPL >= 0 ? 'text-[#16B981]' : 'text-[#F05A72]'
                      } mt-1 font-display text-lg font-bold tabular-nums`}
                    >
                      {totalRealizedPL >= 0 ? '+' : ''}
                      {formatIDR(totalRealizedPL)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
                    <p className="text-[11px] text-[#8B95A5]">Untung / Rugi Berjalan (Aset Dimiliki)</p>
                    <p
                      className={`${
                        totalUnrealizedPL >= 0 ? 'text-[#16B981]' : 'text-[#F05A72]'
                      } mt-1 font-display text-lg font-bold tabular-nums`}
                    >
                      {totalUnrealizedPL >= 0 ? '+' : ''}
                      {formatIDR(totalUnrealizedPL)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-[#E8EDF3] dark:divide-slate-800">
                  {holdings.map((h, idx) => {
                    const px = assets.find((a) => a.ticker === h.ticker)?.price ?? h.avgPrice;
                    const posPL = (px - h.avgPrice) * h.quantity;
                    const posPct = h.avgPrice > 0 ? ((px - h.avgPrice) / h.avgPrice) * 100 : 0;
                    const isPos = posPL >= 0;

                    return (
                      <div
                        key={`${h.ticker}-${idx}`}
                        onClick={() => openStockDetail(h.ticker)}
                        className="flex cursor-pointer flex-wrap items-center justify-between gap-3 py-3.5 text-xs tabular-nums hover:bg-[#F3F5F9]/50 dark:hover:bg-slate-800/40 rounded-xl px-2"
                      >
                        <div>
                          <p className="font-bold text-sm">{h.ticker}</p>
                          <p className="text-[11px] text-[#8B95A5]">
                            {h.quantity.toLocaleString('id-ID')} unit • Avg Beli {formatIDR(h.avgPrice)} • Harga Kini {formatIDR(px)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatIDR(px * h.quantity)}</p>
                          <p className={`${isPos ? 'text-[#16B981]' : 'text-[#F05A72]'} font-semibold`}>
                            {isPos ? 'Untung +' : 'Rugi '}
                            {formatIDR(posPL)} ({formatPct(posPct)})
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[22px] border border-[#E8EDF3] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-bold">Perhitungan Untung / Rugi Penjualan</h2>
                    <p className="text-xs text-[#8B95A5]">
                      Hasil perhitungan keuntungan atau kerugian setiap kali kamu menjual saham (misalnya BBRI)
                    </p>
                  </div>
                  <span className="rounded-full bg-[#EAF1FF] px-3 py-1 text-xs font-semibold text-[#356DFF]">
                    {sellTrades.length} Penjualan
                  </span>
                </div>

                {sellTrades.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#E8EDF3] p-5 text-center text-xs text-[#8B95A5] dark:border-slate-800">
                    Belum ada saham yang dijual. Saat kamu membeli saham (seperti <strong>BBRI</strong>) lalu menjualnya, perhitungan untung atau ruginya akan tampil di sini.
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-[#E8EDF3] dark:divide-slate-800">
                    {sellTrades.map((tr, idx) => {
                      const h = holdings.find((item) => item.ticker === tr.ticker);
                      const refAvg = h?.avgPrice ?? tr.price;
                      const pl = typeof tr.realizedPL === 'number' ? tr.realizedPL : (tr.price - refAvg) * tr.quantity;
                      const isProfit = pl >= 0;

                      return (
                        <div
                          key={`${tr.id}-${idx}`}
                          onClick={() => openStockDetail(tr.ticker)}
                          className="flex cursor-pointer flex-wrap items-center justify-between gap-3 py-3.5 text-xs tabular-nums hover:bg-[#F3F5F9]/50 dark:hover:bg-slate-800/40 rounded-xl px-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{tr.ticker}</span>
                              <span className="rounded-md bg-[#F05A72]/15 px-2 py-0.5 text-[10px] font-bold text-[#F05A72]">
                                JUAL
                              </span>
                              <span className="text-[11px] text-[#8B95A5]">{tr.time}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-[#8B95A5]">
                              Terjual {tr.quantity.toLocaleString('id-ID')} unit @ {formatIDR(tr.price)} (Acuan beli {formatIDR(refAvg)})
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-[#8B95A5]">Nilai Jual: {formatIDR(tr.price * tr.quantity)}</p>
                            <p className={`${isProfit ? 'text-[#16B981]' : 'text-[#F05A72]'} font-bold text-sm`}>
                              {isProfit ? 'Untung +' : 'Rugi '}
                              {formatIDR(pl)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {activePage === 'watchlist' && (
            <div className="space-y-4 rounded-[22px] border border-[#E8EDF3] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h1 className="font-display text-2xl font-bold">Watchlist ({watchlist.length})</h1>
              {watchlist.length === 0 ? (
                <p className="text-xs text-[#8B95A5]">Watchlist masih kosong.</p>
              ) : (
                watchlist.map((sym, idx) => {
                  const st = assets.find((a) => a.ticker === sym);
                  if (!st) return null;
                  return (
                    <div
                      key={`${sym}-${idx}`}
                      className="flex items-center justify-between border-b border-[#E8EDF3] py-3 text-xs dark:border-slate-800"
                    >
                      <button onClick={() => openStockDetail(sym)} className="font-bold">
                        {sym} — {st.name}
                      </button>
                      <span className="font-bold tabular-nums">{formatIDR(st.price)}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activePage === 'notifications' && (
            <div className="space-y-6">
              <section className="rounded-[22px] border border-[#E8EDF3] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="font-display text-2xl font-bold">Riwayat Transaksi</h1>
                    <p className="text-xs text-[#8B95A5]">
                      Catatan eksekusi beli &amp; jual saham beserta grafik pergerakan terkini
                    </p>
                  </div>
                  <span className="rounded-full bg-[#EAF1FF] px-3 py-1 text-xs font-semibold text-[#356DFF]">
                    {trades.length} Transaksi
                  </span>
                </div>

                {trades.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-[#E8EDF3] p-6 text-center text-xs text-[#8B95A5] dark:border-slate-800">
                    Belum ada transaksi beli atau jual. Buka menu <strong>Market</strong> lalu lakukan{' '}
                    <strong>Beli Aset</strong> untuk mencatat riwayat di sini.
                  </div>
                ) : (
                  <div className="mt-5 divide-y divide-[#E8EDF3] dark:divide-slate-800">
                    {trades.map((tr, idx) => {
                      const asset = assets.find((a) => a.ticker === tr.ticker);
                      const currentPrice = asset?.price ?? tr.price;
                      const diffPct = ((currentPrice - tr.price) / tr.price) * 100;
                      const isBuy = tr.side === 'BUY';
                      const isGain = isBuy ? currentPrice >= tr.price : currentPrice <= tr.price;

                      return (
                        <div
                          key={`${tr.id}-${idx}`}
                          onClick={() => openStockDetail(tr.ticker)}
                          className="flex cursor-pointer flex-wrap items-center justify-between gap-4 py-4 transition hover:bg-[#F3F5F9]/60 dark:hover:bg-slate-800/40 rounded-xl px-2"
                        >
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                              style={{ backgroundColor: asset?.color || '#356DFF' }}
                            >
                              {tr.ticker.slice(0, 4)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{tr.ticker}</span>
                                <span
                                  className={`${
                                    isBuy
                                      ? 'bg-[#16B981]/15 text-[#16B981]'
                                      : 'bg-[#F05A72]/15 text-[#F05A72]'
                                  } rounded-md px-2 py-0.5 text-[10px] font-bold`}
                                >
                                  {isBuy ? 'BELI' : 'JUAL'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8B95A5]">
                                {asset?.name || tr.ticker} • {tr.time}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {asset && (
                              <Sparkline
                                data={asset.history['1D']}
                                positive={isGain}
                                width={86}
                                height={28}
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-right text-xs tabular-nums">
                            <div>
                              <p className="text-[10px] text-[#8B95A5]">
                                {isBuy ? 'Harga Beli' : 'Harga Jual'}
                              </p>
                              <p className="font-bold">{formatIDR(tr.price)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#8B95A5]">Jumlah Satuan</p>
                              <p className="font-bold">{tr.quantity.toLocaleString('id-ID')} unit</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#8B95A5]">Total &amp; Selisih</p>
                              <p className="font-bold">{formatIDR(tr.price * tr.quantity)}</p>
                              <p
                                className={`${
                                  isGain ? 'text-[#16B981]' : 'text-[#F05A72]'
                                } text-[11px] font-semibold`}
                              >
                                {formatPct(diffPct)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-[22px] border border-[#E8EDF3] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between">
                  <h2 className="font-display text-lg font-bold">Notifikasi Aktivitas</h2>
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs font-semibold text-[#356DFF]"
                  >
                    Tandai dibaca
                  </button>
                </div>
                <div className="mt-3 divide-y divide-[#E8EDF3] dark:divide-slate-800">
                  {notifications.map((n, idx) => (
                    <div key={`${n.id}-${idx}`} className="py-3 text-xs">
                      <p className="font-bold">{n.title}</p>
                      <p className="text-[#8B95A5]">{n.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activePage === 'settings' && (
            <div className="space-y-4 rounded-[22px] border border-[#E8EDF3] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h1 className="font-display text-2xl font-bold">Profile &amp; Settings</h1>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={pname}
                  onChange={(e) => setPname(e.target.value)}
                  className="rounded-2xl border border-[#E8EDF3] px-4 py-2.5 text-sm dark:bg-slate-800"
                />
                <input
                  value={pemail}
                  onChange={(e) => setPemail(e.target.value)}
                  className="rounded-2xl border border-[#E8EDF3] px-4 py-2.5 text-sm dark:bg-slate-800"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateProfile(pname, pemail)}
                  className="rounded-xl bg-[#356DFF] px-4 py-2 text-xs font-semibold text-white"
                >
                  Simpan Profil
                </button>
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="rounded-xl border border-[#E8EDF3] px-4 py-2 text-xs font-semibold"
                >
                  Tema: {theme.toUpperCase()}
                </button>
                <button
                  onClick={resetSimulation}
                  className="rounded-xl border border-[#E8EDF3] px-4 py-2 text-xs font-semibold"
                >
                  Reset Investasi
                </button>
                <button
                  onClick={logoutDemo}
                  className="rounded-xl bg-[#F05A72]/10 px-4 py-2 text-xs font-semibold text-[#F05A72]"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileNav />
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 rounded-2xl bg-[#172A3A] px-4 py-3 text-xs font-medium text-white shadow-lg lg:bottom-6">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

