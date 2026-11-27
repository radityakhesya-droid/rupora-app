'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Medal, TrendingUp, Flame, ShieldCheck, Gift, Send } from 'lucide-react';
import { useRupora } from '@/context/RuporaContext';
import { formatIDR } from '@/utils/formatters';
import { getSupabaseClient } from '@/lib/supabase';
import { evaluateRankProgress, OVERLORD_RANK, RANK_TIERS } from '@/lib/ranks';

type PeriodTab = 'WEEKLY' | 'MONTHLY' | 'ALL';

interface TraderRank {
  id: string;
  name: string;
  initials: string;
  badge: string;
  profit: number;
  tradesCount: number;
  winRate: number;
  isCurrentUser?: boolean;
}

interface RpcLeaderboardRow {
  user_id: string;
  full_name: string;
  avatar_initials: string;
  total_profit: number | string;
  total_trades: number | string;
  win_rate: number | string;
}

const SEED_TRADERS: Record<PeriodTab, Omit<TraderRank, 'isCurrentUser'>[]> = {
  WEEKLY: [
    { id: 'u1', name: 'Naufal Ramadhan', initials: 'NR', badge: 'Gold • Scalper IDX', profit: 5400000, tradesCount: 14, winRate: 78.6 },
    { id: 'u2', name: 'Alya Putri', initials: 'AP', badge: 'Silver • Blue-Chip', profit: 3420000, tradesCount: 9, winRate: 77.8 },
    { id: 'u3', name: 'Dimas Prakoso', initials: 'DP', badge: 'Silver • Tech Swing', profit: 2190000, tradesCount: 7, winRate: 71.4 },
    { id: 'u4', name: 'Salsabila Zahra', initials: 'SZ', badge: 'Bronze • Dividend', profit: 1540000, tradesCount: 5, winRate: 80.0 },
    { id: 'u5', name: 'Rizky Mahendra', initials: 'RM', badge: 'Pemula • Momentum', profit: 980000, tradesCount: 6, winRate: 66.7 },
  ],
  MONTHLY: [
    { id: 'u2', name: 'Alya Putri', initials: 'AP', badge: 'Platinum • Blue-Chip', profit: 18750000, tradesCount: 34, winRate: 79.4 },
    { id: 'u1', name: 'Naufal Ramadhan', initials: 'NR', badge: 'Platinum • Scalper IDX', profit: 15420000, tradesCount: 52, winRate: 73.1 },
    { id: 'u6', name: 'Farhan Hidayat', initials: 'FH', badge: 'Platinum • Global Tech', profit: 11890000, tradesCount: 21, winRate: 76.2 },
    { id: 'u3', name: 'Dimas Prakoso', initials: 'DP', badge: 'Gold • Tech Swing', profit: 8640000, tradesCount: 27, winRate: 70.4 },
    { id: 'u4', name: 'Salsabila Zahra', initials: 'SZ', badge: 'Gold • Dividend', profit: 6320000, tradesCount: 18, winRate: 83.3 },
  ],
  ALL: [
    { id: 'u2', name: 'Alya Putri', initials: 'AP', badge: 'Raja Saham • Grandmaster', profit: 164200000, tradesCount: 128, winRate: 78.9 },
    { id: 'u6', name: 'Farhan Hidayat', initials: 'FH', badge: 'Diamond • Global Tech', profit: 51850000, tradesCount: 94, winRate: 75.5 },
    { id: 'u1', name: 'Naufal Ramadhan', initials: 'NR', badge: 'Diamond • Scalper IDX', profit: 43900000, tradesCount: 186, winRate: 71.5 },
    { id: 'u4', name: 'Salsabila Zahra', initials: 'SZ', badge: 'Platinum • Dividend', profit: 29450000, tradesCount: 74, winRate: 82.4 },
    { id: 'u3', name: 'Dimas Prakoso', initials: 'DP', badge: 'Platinum • Tech Swing', profit: 21700000, tradesCount: 89, winRate: 69.7 },
  ],
};

export function LeaderboardView() {
  const { user, trades, holdings, cashBalance, addCashBalance, showToast } = useRupora();
  const [period, setPeriod] = useState<PeriodTab>('ALL');
  const [dbRows, setDbRows] = useState<TraderRank[] | null>(null);

  const [isAdmin, setIsAdmin] = useState(user.email === 'jisamsoe178@gmail.com');
  const [dailyClaims, setDailyClaims] = useState(0);
  const [claimedRankLevels, setClaimedRankLevels] = useState<number[]>([]);

  const [mintAmount, setMintAmount] = useState(50000000);
  const [recipientName, setRecipientName] = useState('Alya Putri');
  const [sendAmount, setSendAmount] = useState(5000000);

  useEffect(() => {
    setIsAdmin(
      user.email === 'jisamsoe178@gmail.com' ||
        user.accountType.toLowerCase().includes('admin')
    );
  }, [user.email, user.accountType]);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('role, daily_claims_count')
        .eq('id', data.user.id)
        .single();
      if (prof && active) {
        setIsAdmin(prof.role === 'admin' || data.user.email === 'jisamsoe178@gmail.com');
        setDailyClaims(Number(prof.daily_claims_count) || 0);
      }
    });

    supabase
      .rpc('get_profit_leaderboard', { period_filter: period })
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data || data.length === 0) {
          setDbRows(null);
          return;
        }
        const mapped: TraderRank[] = (data as RpcLeaderboardRow[]).map((row) => ({
          id: row.user_id,
          name: row.full_name,
          initials: row.avatar_initials || 'RP',
          badge: 'Supabase Trader',
          profit: Number(row.total_profit) || 0,
          tradesCount: Number(row.total_trades) || 0,
          winRate: Number(row.win_rate) || 0,
          isCurrentUser: row.full_name === user.name,
        }));
        setDbRows(mapped);
      });

    return () => {
      active = false;
    };
  }, [period, user.name, trades.length, cashBalance]);

  const userStats = useMemo(() => {
    const sellTrades = trades.filter((t) => t.side === 'SELL');
    const totalProfit = sellTrades.reduce((sum, tr) => {
      if (typeof tr.realizedPL === 'number') return sum + tr.realizedPL;
      const h = holdings.find((item) => item.ticker === tr.ticker);
      return sum + (tr.price - (h?.avgPrice ?? tr.price)) * tr.quantity;
    }, 0);
    const wins = sellTrades.filter((tr) => (tr.realizedPL ?? 0) > 0).length;
    const winRate = sellTrades.length > 0 ? Math.round((wins / sellTrades.length) * 1000) / 10 : 0;
    return { totalProfit, tradesCount: sellTrades.length, winRate };
  }, [trades, holdings]);

  const maxClaimedLevel = claimedRankLevels.length > 0 ? Math.max(...claimedRankLevels) : 0;
  const rankInfo = useMemo(
    () => evaluateRankProgress(userStats.totalProfit, isAdmin, maxClaimedLevel),
    [userStats.totalProfit, isAdmin, maxClaimedLevel]
  );

  useEffect(() => {
    if (isAdmin) return;
    const unlocked = RANK_TIERS.filter(
      (t) => userStats.totalProfit >= t.minProfit && !claimedRankLevels.includes(t.level)
    );
    if (unlocked.length > 0) {
      const bonusSum = unlocked.reduce((acc, t) => acc + t.bonusCash, 0);
      const topUnlockedName = unlocked[unlocked.length - 1].name;
      setClaimedRankLevels((prev) => [...prev, ...unlocked.map((t) => t.level)]);
      addCashBalance(bonusSum, 'Bonus naik rank ' + topUnlockedName);
      showToast('Naik rank ke ' + topUnlockedName + '! Bonus +' + formatIDR(bonusSum));
    }
  }, [userStats.totalProfit, isAdmin, claimedRankLevels, addCashBalance, showToast]);

  const handleClaimDaily = async () => {
    if (dailyClaims >= 7) {
      showToast('Bonus harian 100 ribu selama 7 hari sudah selesai diklaim.');
      return;
    }
    const nextDay = dailyClaims + 1;
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.rpc('claim_daily_bonus');
      if (!error && data?.ok) {
        setDailyClaims(nextDay);
        addCashBalance(100_000, 'Bonus harian hari ' + nextDay + '/7');
        showToast(data.message || 'Bonus harian +Rp 100.000 berhasil diklaim.');
        return;
      }
    }
    setDailyClaims(nextDay);
    addCashBalance(100_000, 'Bonus harian hari ' + nextDay + '/7');
  };

  const handleAdminMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || mintAmount <= 0) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.rpc('admin_mint_balance', { amount: mintAmount });
      if (data && data.ok === false) {
        showToast(data.message || 'Gagal menambah saldo di Supabase');
        return;
      }
    }
    addCashBalance(mintAmount, 'Tambah saldo admin');
  };

  const handleAdminSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || sendAmount <= 0 || !recipientName.trim()) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: target } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${recipientName.trim()}%`)
        .limit(1)
        .single();
      if (target?.id) {
        const { data } = await supabase.rpc('admin_send_balance', {
          target_user_id: target.id,
          amount: sendAmount,
        });
        if (data && data.ok === false) {
          showToast(data.message || 'Gagal mengirim saldo');
          return;
        }
        showToast('Saldo ' + formatIDR(sendAmount) + ' berhasil dikirim ke ' + target.full_name);
        return;
      }
    }
    showToast('Pengiriman saldo ' + formatIDR(sendAmount) + ' ke ' + recipientName.trim() + ' dicatat');
  };

  const rankings = useMemo(() => {
    if (dbRows && dbRows.length > 0) {
      return [...dbRows].sort((a, b) => b.profit - a.profit);
    }
    const combined: TraderRank[] = [
      ...SEED_TRADERS[period],
      {
        id: 'current-user',
        name: user.name,
        initials: user.avatarInitials,
        badge: `${rankInfo.rankName} • ${isAdmin ? 'Founder/Admin' : 'Trader'}`,
        profit: userStats.totalProfit,
        tradesCount: userStats.tradesCount,
        winRate: userStats.winRate,
        isCurrentUser: true,
      },
    ];
    return combined.sort((a, b) => b.profit - a.profit);
  }, [dbRows, period, user, userStats, rankInfo.rankName, isAdmin]);

  const myRankIndex = Math.max(0, rankings.findIndex((r) => r.isCurrentUser));
  const topThree = rankings.slice(0, 3);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF1FF] px-3 py-1 text-[11px] font-bold text-[#356DFF]">
            <Trophy className="h-3.5 w-3.5" />
            RANK &amp; TOP PROFIT LEADERBOARD
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">Peringkat &amp; Rank Trader</h1>
          <p className="text-xs text-[#8B95A5]">
            Modal awal Rp 5.000.000 • Bonus harian Rp 100.000 (7 hari) • Naik rank otomatis + bonus saldo
          </p>
        </div>

        <div className="flex rounded-2xl border border-[#E8EDF3] bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {(
            [
              { id: 'WEEKLY', label: 'Mingguan' },
              { id: 'MONTHLY', label: 'Bulanan' },
              { id: 'ALL', label: 'All Time' },
            ] as { id: PeriodTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`${
                period === tab.id
                  ? 'bg-[#356DFF] text-white shadow-xs'
                  : 'text-[#8B95A5] hover:text-[#17212B] dark:hover:text-white'
              } rounded-xl px-4 py-2 text-xs font-semibold transition`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-[22px] bg-gradient-to-r from-[#172A3A] to-[#223C52] p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#356DFF] font-display text-base font-bold">
              #{myRankIndex + 1}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg font-bold">{user.name}</p>
                <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${isAdmin ? OVERLORD_RANK.badgeStyle : 'bg-amber-400 text-slate-950'}`}>
                  {rankInfo.rankName}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-300 tabular-nums">
                Saldo Aktif: <strong>{formatIDR(cashBalance)}</strong>
                {!isAdmin && rankInfo.nextTier && (
                  <> • Target {rankInfo.nextTier.name}: {formatIDR(rankInfo.nextTier.minProfit)} (Bonus +{formatIDR(rankInfo.nextTier.bonusCash)})</>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClaimDaily}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#16B981] px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-600"
          >
            <Gift className="h-4 w-4" />
            Klaim Rp 100rb ({Math.min(dailyClaims, 7)}/7 Hari)
          </button>
        </div>
      </section>

      {isAdmin && (
        <section className="rounded-[22px] border border-amber-400/50 bg-white p-5 dark:border-amber-500/40 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <h2 className="font-display text-base font-bold">Panel Admin • Overlord</h2>
          </div>
          <p className="mt-1 text-xs text-[#8B95A5]">
            User pertama di database otomatis menjadi Admin dengan rank <strong>Overlord</strong>. Tambah saldo tanpa batas atau kirim saldo ke user lain.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <form onSubmit={handleAdminMint} className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#F3F5F9]/80 p-3.5 dark:bg-slate-800/70">
              <input
                type="number"
                min={1}
                value={mintAmount}
                onChange={(e) => setMintAmount(Math.max(1, Number(e.target.value)))}
                className="w-40 rounded-xl border border-[#E8EDF3] bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#356DFF] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Tambah Saldo Admin
              </button>
            </form>

            <form onSubmit={handleAdminSend} className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#F3F5F9]/80 p-3.5 dark:bg-slate-800/70">
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nama user tujuan"
                className="w-36 rounded-xl border border-[#E8EDF3] bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="number"
                min={1}
                value={sendAmount}
                onChange={(e) => setSendAmount(Math.max(1, Number(e.target.value)))}
                className="w-32 rounded-xl border border-[#E8EDF3] bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-[#172A3A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Send className="h-3.5 w-3.5" />
                Kirim Saldo
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="rounded-[22px] border border-[#E8EDF3] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-sm font-bold">Tingkatan Rank &amp; Bonus Naik Rank</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {RANK_TIERS.map((tier) => (
            <div
              key={tier.level}
              className="rounded-2xl border border-[#E8EDF3] bg-[#F3F5F9]/60 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/50 tabular-nums"
            >
              <span className={`inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${tier.badgeStyle}`}>
                {tier.name}
              </span>
              <p className="mt-2 text-[11px] text-[#8B95A5]">Profit: {formatIDR(tier.minProfit)}</p>
              <p className="mt-0.5 font-bold text-[#16B981]">Bonus: +{formatIDR(tier.bonusCash)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3.5 sm:grid-cols-3">
        {topThree.map((trader, idx) => {
          const rank = idx + 1;
          return (
            <div
              key={trader.id}
              className="rounded-[22px] border border-[#E8EDF3] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#172A3A] px-2.5 py-1 text-[11px] font-bold text-white">
                  <Medal className="h-3 w-3 text-amber-400" />
                  Rank #{rank}
                </span>
                <span className="text-[11px] font-medium text-[#8B95A5]">{trader.tradesCount} jual</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#356DFF] text-xs font-bold text-white">
                  {trader.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{trader.name}</p>
                  <p className="truncate text-[11px] text-[#8B95A5]">{trader.badge}</p>
                </div>
              </div>
              <div className="mt-4 border-t border-[#E8EDF3] pt-3 dark:border-slate-800 tabular-nums">
                <p className="text-[10px] text-[#8B95A5]">Keuntungan Bersih</p>
                <p className={`${trader.profit >= 0 ? 'text-[#16B981]' : 'text-[#F05A72]'} font-display text-lg font-bold`}>
                  {trader.profit >= 0 ? '+' : ''}
                  {formatIDR(trader.profit)}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[22px] border border-[#E8EDF3] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Klasemen Lengkap Trader</h2>
          <span className="inline-flex items-center gap-1 text-xs text-[#8B95A5]">
            <Flame className="h-3.5 w-3.5 text-amber-500" /> Diurutkan berdasarkan Realized P/L
          </span>
        </div>
        <div className="divide-y divide-[#E8EDF3] dark:divide-slate-800">
          {rankings.map((trader, idx) => (
            <div
              key={trader.id}
              className={`${
                trader.isCurrentUser ? 'bg-[#EAF1FF]/70 dark:bg-blue-950/30' : ''
              } flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3.5 text-xs tabular-nums`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-display text-sm font-bold text-[#8B95A5]">#{idx + 1}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172A3A] text-xs font-bold text-white">
                  {trader.initials}
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {trader.name}{' '}
                    {trader.isCurrentUser && (
                      <span className="ml-1 rounded-md bg-[#356DFF] px-1.5 py-0.5 text-[10px] text-white">
                        Kamu
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-[#8B95A5]">
                    {trader.badge} • {trader.tradesCount} jual • Win Rate {trader.winRate}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-right">
                <TrendingUp className={`h-4 w-4 ${trader.profit >= 0 ? 'text-[#16B981]' : 'text-[#F05A72]'}`} />
                <span className={`${trader.profit >= 0 ? 'text-[#16B981]' : 'text-[#F05A72]'} font-display text-sm font-bold`}>
                  {trader.profit >= 0 ? '+' : ''}
                  {formatIDR(trader.profit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
