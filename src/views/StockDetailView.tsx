'use client';

import React, { useState } from 'react';
import { ChevronLeft, Bookmark } from 'lucide-react';
import { useRupora } from '@/context/RuporaContext';
import { formatIDR, formatNumberID, formatPct } from '@/utils/formatters';

const RANGES = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];
const TABS = ['Overview', 'News', 'Fundamentals', 'Statistics'] as const;

export function StockDetailView() {
  const {
    assets,
    selectedTicker,
    watchlist,
    holdings,
    toggleWatchlist,
    simulateOrder,
    setActivePage,
    trades,
  } = useRupora();

  const asset = assets.find((a) => a.ticker === selectedTicker) || assets[0];

  const [range, setRange] = useState('1D');
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoveredTradeId, setHoveredTradeId] = useState<string | null>(null);
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL' | null>(null);
  const [qty, setQty] = useState(100);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const assetTrades = trades.filter((t) => t.ticker === asset.ticker);
  const lastBuy = assetTrades.find((t) => t.side === 'BUY');
  const lastSell = assetTrades.find((t) => t.side === 'SELL');

  const curHolding = holdings.find((h) => h.ticker === asset.ticker);
  const ownedQty = curHolding?.quantity ?? 0;
  const assetRealizedPL = assetTrades
    .filter((t) => t.side === 'SELL')
    .reduce((sum, t) => sum + (t.realizedPL ?? 0), 0);

  const rawSeries = asset.history[range] || asset.history['1D'];
  const series =
    rawSeries.length >= 2
      ? rawSeries
      : [Math.round(asset.price * 0.99), asset.price];

  const rawMin = Math.min(...series);
  const rawMax = Math.max(...series);
  const pad = Math.max(1, (rawMax - rawMin) * 0.25 || rawMax * 0.02);
  const minVal = Math.max(1, rawMin - pad);
  const maxVal = rawMax + pad;
  const span = maxVal - minVal || 1;

  const activeIdx =
    hoverIdx !== null && series[hoverIdx] !== undefined ? hoverIdx : series.length - 1;
  const activePrice = series[activeIdx];

  const diff = asset.price - asset.prevClose;
  const pct = asset.prevClose > 0 ? (diff / asset.prevClose) * 100 : 0;
  const isPos = diff >= 0;
  const isSaved = watchlist.includes(asset.ticker);

  const W = 720;
  const H = 210;
  const coords = series.map((val, i) => ({
    x: (i / Math.max(1, series.length - 1)) * W,
    y: H - ((val - minVal) / span) * (H - 36) - 18,
  }));

  const markerPoints = assetTrades.slice(0, 8).map((tr, idx) => {
    const ratio = Math.max(0.08, Math.min(0.96, tr.pointRatio - idx * 0.06));
    const clampedPrice = Math.max(minVal, Math.min(maxVal, tr.price));
    const x = ratio * W;
    const y = H - ((clampedPrice - minVal) / span) * (H - 36) - 18;
    return { ...tr, x, y };
  });

  const activeTrade = markerPoints.find((m) => m.id === hoveredTradeId) || null;

  const linePath = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  const curPt = coords[activeIdx] || coords[coords.length - 1];

  const focusX = activeTrade ? activeTrade.x : curPt ? curPt.x : W;
  const focusY = activeTrade ? activeTrade.y : curPt ? curPt.y : H / 2;
  const pctX = (focusX / W) * 100;
  const pctY = (focusY / H) * 100;
  const tooltipLeftPct = Math.max(10, Math.min(90, pctX));
  const tooltipTopPct = Math.max(14, Math.min(82, pctY));
  const tooltipTranslateX = pctX > 78 ? '-100%' : pctX < 22 ? '0%' : '-50%';
  const tooltipTranslateY = pctY < 28 ? '12px' : 'calc(-100% - 12px)';

  const openSellForm = () => {
    setOrderSide('SELL');
    if (ownedQty > 0) {
      setQty(ownedQty);
    }
  };

  const handleSellAllDirect = () => {
    if (ownedQty <= 0) return;
    if (simulateOrder(asset.ticker, 'SELL', ownedQty)) {
      setOrderSide(null);
    }
  };

  const handleExec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSide) return;
    if (simulateOrder(asset.ticker, orderSide, qty)) {
      setOrderSide(null);
    }
  };

  const handleAskAi = async (customPrompt?: string) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: asset.ticker,
          assetName: asset.name,
          category: asset.category,
          price: asset.price,
          prevClose: asset.prevClose,
          holdingQty: ownedQty,
          avgPrice: curHolding?.avgPrice ?? 0,
          realizedPL: assetRealizedPL,
          prompt: customPrompt ?? aiPrompt,
        }),
      });
      const data = await res.json();
      setAiReply(data.reply || 'Tidak ada respons.');
    } catch {
      setAiReply('Terjadi gangguan saat menghubungi layanan AI.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setActivePage('market')}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E8EDF3] bg-white px-4 py-2 text-xs font-semibold text-[#17212B] shadow-2xs hover:bg-[#F3F5F9] dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Kembali ke Market
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EAF1FF] px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-[#356DFF] uppercase">
            LIVE MARKET
          </span>
          <button
            onClick={() => toggleWatchlist(asset.ticker)}
            className={`${
              isSaved
                ? 'border-[#356DFF] bg-[#EAF1FF] text-[#356DFF]'
                : 'border-[#E8EDF3] bg-white text-[#17212B] dark:border-slate-800 dark:bg-slate-900 dark:text-white'
            } inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition`}
          >
            <Bookmark className="h-3.5 w-3.5" fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Dipantau' : 'Pantau'}
          </button>
        </div>
      </div>

      <section className="rounded-[24px] border border-[#E8EDF3] bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: asset.color }}
            >
              {asset.ticker.slice(0, 4)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#17212B] dark:text-white">
                  {asset.name}
                </h1>
                <span className="rounded-lg bg-[#F3F5F9] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#8B95A5] uppercase dark:bg-slate-800">
                  {asset.exchange}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#8B95A5]">
                {asset.ticker} • Sektor {asset.category} • Dimiliki:{' '}
                <strong className="text-[#17212B] dark:text-white tabular-nums">
                  {ownedQty.toLocaleString('id-ID')} unit
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOrderSide('BUY')}
              className="rounded-full bg-[#356DFF] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Beli Aset
            </button>
            <button
              onClick={openSellForm}
              className="rounded-full border border-[#E8EDF3] bg-white px-5 py-2.5 text-xs font-semibold text-[#17212B] hover:bg-[#F3F5F9] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              Jual Aset
            </button>
            {ownedQty > 0 && (
              <button
                type="button"
                onClick={handleSellAllDirect}
                className="rounded-full bg-[#F05A72] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600 tabular-nums"
              >
                Jual Semua ({ownedQty.toLocaleString('id-ID')})
              </button>
            )}
          </div>
        </div>

        {orderSide && (
          <form
            onSubmit={handleExec}
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#356DFF]/30 bg-[#EAF1FF]/60 p-4 dark:bg-blue-950/30"
          >
            <div className="text-xs">
              <p className="font-bold text-[#17212B] dark:text-white">
                {orderSide === 'BUY' ? 'Beli Aset' : 'Jual Aset'} {asset.ticker}
                {orderSide === 'SELL' && (
                  <span className="ml-2 font-normal text-[#8B95A5] tabular-nums">
                    (Tersedia: {ownedQty.toLocaleString('id-ID')} unit)
                  </span>
                )}
              </p>
              <p className="text-[#8B95A5]">
                Estimasi total: <strong className="text-[#356DFF]">{formatIDR(asset.price * qty)}</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {orderSide === 'SELL' && ownedQty > 0 && (
                <button
                  type="button"
                  onClick={() => setQty(ownedQty)}
                  className="rounded-xl border border-[#F05A72]/40 bg-white px-3 py-2 text-xs font-semibold text-[#F05A72] hover:bg-rose-50 dark:bg-slate-800 tabular-nums"
                >
                  Semua ({ownedQty.toLocaleString('id-ID')})
                </button>
              )}
              <input
                type="number"
                min={1}
                max={orderSide === 'SELL' && ownedQty > 0 ? ownedQty : undefined}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-28 rounded-xl border border-[#E8EDF3] bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#356DFF] px-4 py-2 text-xs font-semibold text-white"
              >
                Konfirmasi
              </button>
              <button
                type="button"
                onClick={() => setOrderSide(null)}
                className="rounded-xl px-3 py-2 text-xs font-medium text-[#8B95A5]"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#8B95A5] uppercase">
              HARGA PASAR TERKINI
            </p>
            <div className="mt-1 flex items-baseline gap-3 tabular-nums">
              <span className="font-display text-3xl sm:text-4xl font-bold text-[#17212B] dark:text-white">
                {formatNumberID(asset.price)}
              </span>
              <span className={`${isPos ? 'text-[#16B981]' : 'text-[#F05A72]'} text-xs font-bold`}>
                {isPos ? '▲' : '▼'} {isPos ? '+' : ''}
                {formatNumberID(diff)} ({formatPct(pct)})
              </span>
            </div>
          </div>
          <p className="text-xs text-[#8B95A5] tabular-nums">
            Rentang Hari Ini:{' '}
            <strong className="text-[#17212B] dark:text-white">
              {formatIDR(rawMin)} – {formatIDR(rawMax)}
            </strong>
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8B95A5]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Rentang: <strong className="text-[#17212B] dark:text-white">{range}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16B981]" />
              Beli: <strong className="text-[#16B981]">{lastBuy ? formatIDR(lastBuy.price) : '-'}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F05A72]" />
              Jual: <strong className="text-[#F05A72]">{lastSell ? formatIDR(lastSell.price) : '-'}</strong>
            </span>
          </div>
          <span className="tabular-nums">
            Titik dipilih: <strong className="text-[#356DFF]">{formatIDR(activePrice)}</strong>
          </span>
        </div>

        <div
          className="relative mt-3 w-full cursor-crosshair select-none"
          onMouseLeave={() => {
            setHoverIdx(null);
            setHoveredTradeId(null);
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setHoverIdx(Math.round(relX * (series.length - 1)));
          }}
        >
          {(hoverIdx !== null || activeTrade) && (
            <div
              style={{
                left: `${tooltipLeftPct}%`,
                top: `${tooltipTopPct}%`,
                transform: `translate(${tooltipTranslateX}, ${tooltipTranslateY})`,
              }}
              className="pointer-events-none absolute z-10 whitespace-nowrap rounded-xl border border-[#356DFF]/25 bg-[#172A3A] px-3 py-1.5 text-white shadow-md tabular-nums"
            >
              {activeTrade ? (
                <>
                  <p className={`text-[10px] font-bold ${activeTrade.side === 'BUY' ? 'text-[#16B981]' : 'text-[#F05A72]'}`}>
                    Titik {activeTrade.side === 'BUY' ? 'BELI' : 'JUAL'} • {activeTrade.time}
                  </p>
                  <p className="text-xs font-bold text-white">
                    {formatIDR(activeTrade.price)} ({activeTrade.quantity.toLocaleString('id-ID')} unit)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-medium text-slate-300">Harga Pasar • {range}</p>
                  <p className="text-xs font-bold text-white">{formatIDR(activePrice)}</p>
                </>
              )}
            </div>
          )}

          <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full overflow-visible">
            <defs>
              <linearGradient id="ruporaAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#356DFF" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#356DFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {[0.2, 0.4, 0.6, 0.8].map((g) => (
              <line
                key={g}
                x1="0"
                y1={H * g}
                x2={W}
                y2={H * g}
                stroke="#E8EDF3"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}
            <path d={areaPath} fill="url(#ruporaAreaGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke="#356DFF"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {curPt && !activeTrade && (
              <>
                <line
                  x1={curPt.x}
                  y1="10"
                  x2={curPt.x}
                  y2={H}
                  stroke="#356DFF"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                />
                <circle cx={curPt.x} cy={curPt.y} r="4.5" fill="#FFFFFF" stroke="#356DFF" strokeWidth="2.5" />
              </>
            )}

            {markerPoints.map((mp) => {
              const isBuy = mp.side === 'BUY';
              const strokeCol = isBuy ? '#16B981' : '#F05A72';
              return (
                <g
                  key={mp.id}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setHoveredTradeId(mp.id);
                  }}
                  onMouseLeave={() => setHoveredTradeId(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={mp.x}
                    cy={mp.y}
                    r={hoveredTradeId === mp.id ? 8.5 : 6.5}
                    fill={strokeCol}
                    fillOpacity="0.22"
                  />
                  <circle
                    cx={mp.x}
                    cy={mp.y}
                    r="4.5"
                    fill="#FFFFFF"
                    stroke={strokeCol}
                    strokeWidth="2.6"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRange(r);
                setHoverIdx(null);
              }}
              className={`${
                range === r
                  ? 'bg-[#356DFF] text-white shadow-xs'
                  : 'text-[#8B95A5] hover:bg-[#F3F5F9] hover:text-[#17212B] dark:hover:bg-slate-800'
              } rounded-xl px-3.5 py-1.5 text-xs font-bold transition`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#E8EDF3] bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'bg-[#172A3A] text-white dark:bg-blue-600'
                  : 'text-[#8B95A5] hover:bg-[#F3F5F9] hover:text-[#17212B] dark:hover:bg-slate-800'
              } rounded-xl px-4 py-2 text-xs font-semibold transition`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="text-[11px] text-[#8B95A5]">Kapitalisasi Pasar</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{asset.marketCap}</p>
            </div>
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="text-[11px] text-[#8B95A5]">P/E Ratio</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{asset.peRatio}</p>
            </div>
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="text-[11px] text-[#8B95A5]">P/B Ratio</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{asset.pbRatio}</p>
            </div>
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="text-[11px] text-[#8B95A5]">Dividend Yield</p>
              <p className="mt-1 text-sm font-bold text-[#16B981] tabular-nums">{asset.divYield}</p>
            </div>
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="text-[11px] text-[#8B95A5]">Volume Transaksi</p>
              <p className="mt-1 text-sm font-bold tabular-nums">{asset.volume}</p>
            </div>
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="text-[11px] text-[#8B95A5]">High / Low</p>
              <p className="mt-1 text-sm font-bold tabular-nums">
                {formatIDR(asset.high52w)} / {formatIDR(asset.low52w)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'News' && (
          <div className="mt-5 space-y-3 text-xs">
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="font-bold">Pergerakan {asset.ticker} menjaga momentum akumulasi sesi ini</p>
              <p className="mt-1 text-[#8B95A5]">Ringkasan Sentimen Pasar Terkini • Hari ini</p>
            </div>
          </div>
        )}

        {activeTab === 'Fundamentals' && (
          <p className="mt-5 text-xs leading-relaxed text-[#8B95A5]">{asset.description}</p>
        )}

        {activeTab === 'Statistics' && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="text-[#8B95A5]">Penutupan Sebelumnya</p>
              <p className="mt-1 font-bold tabular-nums">{formatIDR(asset.prevClose)}</p>
            </div>
            <div className="rounded-2xl bg-[#F3F5F9]/80 p-4 dark:bg-slate-800/70">
              <p className="text-[#8B95A5]">Rentang 52 Minggu</p>
              <p className="mt-1 font-bold tabular-nums">
                {formatIDR(asset.low52w)} – {formatIDR(asset.high52w)}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-[#E8EDF3] bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold">RUPORA AI Analyst</h2>
            <p className="text-xs text-[#8B95A5]">
              Evaluasi pergerakan harga, posisi kepemilikan, dan risiko investasi untuk {asset.ticker}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              handleAskAi(
                'Analisis kondisi aset ini, posisi portofolio saya, dan hal yang perlu diperhatikan.'
              )
            }
            disabled={aiLoading}
            className="rounded-xl bg-[#356DFF] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {aiLoading ? 'Menganalisis...' : `Analisis ${asset.ticker}`}
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={`Tanya AI soal ${asset.ticker} (misal: apakah cocok untuk akumulasi beli bertahap?)`}
            className="flex-1 rounded-xl border border-[#E8EDF3] bg-[#F3F5F9]/60 px-3.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => handleAskAi()}
            disabled={aiLoading}
            className="rounded-xl border border-[#E8EDF3] px-4 py-2 text-xs font-semibold hover:bg-[#F3F5F9] dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Kirim
          </button>
        </div>

        {aiReply && (
          <div className="mt-4 whitespace-pre-line rounded-2xl bg-[#F3F5F9]/80 p-4 text-xs leading-relaxed text-[#17212B] dark:bg-slate-800/80 dark:text-slate-200">
            {aiReply}
          </div>
        )}
      </section>
    </div>
  );
}
