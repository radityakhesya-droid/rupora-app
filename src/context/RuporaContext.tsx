'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AssetItem,
  NotificationItem,
  PageRoute,
  PortfolioHolding,
  UserProfile,
} from '@/types/market';
import {
  INITIAL_ASSETS,
  INITIAL_HOLDINGS,
  INITIAL_NOTIFICATIONS,
} from '@/data/mockMarket';
import { formatIDR } from '@/utils/formatters';
import { getSupabaseClient } from '@/lib/supabase';

export interface TradeMarker {
  id: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  time: string;
  pointRatio: number;
  realizedPL?: number;
}

interface RuporaContextValue {
  isAuthenticated: boolean;
  user: UserProfile;
  activePage: PageRoute;
  selectedTicker: string;
  assets: AssetItem[];
  watchlist: string[];
  holdings: PortfolioHolding[];
  cashBalance: number;
  notifications: NotificationItem[];
  trades: TradeMarker[];
  theme: 'light' | 'dark';
  toastMessage: string | null;
  setActivePage: (page: PageRoute) => void;
  openStockDetail: (ticker: string) => void;
  loginDemo: (email: string, name?: string) => void;
  signupDemo: (name: string, email: string) => void;
  logoutDemo: () => void;
  toggleWatchlist: (ticker: string) => void;
  simulateOrder: (ticker: string, side: 'BUY' | 'SELL', quantity: number) => boolean;
  simulateMarketTick: () => void;
  addCashBalance: (amount: number, reason?: string) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (name: string, email: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetSimulation: () => void;
  showToast: (msg: string) => void;
}

const RuporaContext = createContext<RuporaContextValue | undefined>(undefined);

export function RuporaProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<PageRoute>('login');
  const [selectedTicker, setSelectedTicker] = useState('BBCA');

  const [user, setUser] = useState<UserProfile>({
    name: 'Dizyy',
    email: 'jisamsoe178@gmail.com',
    accountType: 'Overlord • Admin',
    avatarInitials: 'DZ',
  });

  const [assets, setAssets] = useState<AssetItem[]>(INITIAL_ASSETS);
  const [watchlist, setWatchlist] = useState<string[]>(['BBCA', 'BBRI', 'NVDA', 'AAPL']);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(INITIAL_HOLDINGS);
  const [cashBalance, setCashBalance] = useState<number>(5000000);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [trades, setTrades] = useState<TradeMarker[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const syncFromSupabase = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (!authUser) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_initials, cash_balance, role, rank_name')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      setUser({
        name: profile.full_name || authUser.user_metadata?.full_name || 'Dizyy',
        email: authUser.email || '',
        accountType: `${profile.rank_name || 'Overlord'} • ${profile.role === 'admin' ? 'Admin' : 'Trader'}`,
        avatarInitials: profile.avatar_initials || 'DZ',
      });
      const localSavedCash = Number(localStorage.getItem('rupora_cash') || 0);
      const dbCash = Number(profile.cash_balance) || 0;
      const effectiveCash = Math.max(localSavedCash, dbCash);
      setCashBalance(effectiveCash);
      localStorage.setItem('rupora_cash', String(effectiveCash));
    }

    const { data: dbTrades } = await supabase
      .from('trade_logs')
      .select('id, ticker, side, price, quantity, realized_pl, created_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbTrades && dbTrades.length > 0) {
      const mapped: TradeMarker[] = dbTrades.map((t) => ({
        id: t.id,
        ticker: t.ticker,
        side: t.side as 'BUY' | 'SELL',
        price: Number(t.price),
        quantity: Number(t.quantity),
        time: new Date(t.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        pointRatio: 0.92,
        ...(t.side === 'SELL' ? { realizedPL: Number(t.realized_pl) } : {}),
      }));
      setTrades(mapped);
      localStorage.setItem('rupora_trades', JSON.stringify(mapped));
    }
  };

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('rupora_session');
      const savedUser = localStorage.getItem('rupora_user');
      const savedWatchlist = localStorage.getItem('rupora_watchlist');
      const savedHoldings = localStorage.getItem('rupora_holdings');
      const savedCash = localStorage.getItem('rupora_cash');
      const savedTheme = localStorage.getItem('rupora_theme');
      const savedTrades = localStorage.getItem('rupora_trades');

      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
      if (savedHoldings) setHoldings(JSON.parse(savedHoldings));
      if (savedCash) setCashBalance(Number(savedCash));
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
      }
      if (savedTrades) setTrades(JSON.parse(savedTrades));
      if (savedSession === 'true') {
        setIsAuthenticated(true);
        setActivePage('home');
        syncFromSupabase();
      }
    } catch {
      // Abaikan jika storage diblokir
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('rupora_theme', theme);
  }, [theme, hydrated]);

  const tickMarket = () => {
    setAssets((prev) =>
      prev.map((item) => {
        const swing = (Math.random() - 0.49) * 0.004;
        const nextPrice = Math.max(10, Math.round(item.price * (1 + swing)));
        const next1D = [...item.history['1D'].slice(1), nextPrice];
        return {
          ...item,
          price: nextPrice,
          history: { ...item.history, '1D': next1D },
        };
      })
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      tickMarket();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const simulateMarketTick = () => {
    tickMarket();
    showToast('Harga pasar diperbarui');
  };

  const addCashBalance = (amount: number, reason = 'Penambahan saldo') => {
    if (amount <= 0) return;
    setCashBalance((prev) => {
      const next = prev + amount;
      localStorage.setItem('rupora_cash', String(next));

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.id) {
            supabase
              .from('profiles')
              .update({ cash_balance: next, updated_at: new Date().toISOString() })
              .eq('id', data.user.id)
              .then(() => {});
          }
        });
      }

      return next;
    });
    showToast(`${reason}: +${formatIDR(amount)}`);
  };

  const loginDemo = (email: string, name?: string) => {
    const cleanName = name || user.name || email.split('@')[0];
    const initials = cleanName
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const updatedUser: UserProfile = {
      ...user,
      name: cleanName,
      email,
      avatarInitials: initials || 'DZ',
    };
    setUser(updatedUser);
    setIsAuthenticated(true);
    setActivePage('home');
    localStorage.setItem('rupora_session', 'true');
    localStorage.setItem('rupora_user', JSON.stringify(updatedUser));
    syncFromSupabase();
    showToast(`Selamat datang kembali, ${cleanName}`);
  };

  const signupDemo = (name: string, email: string) => {
    loginDemo(email, name);
    showToast('Akun RUPORA berhasil terdaftar');
  };

  const logoutDemo = () => {
    const supabase = getSupabaseClient();
    supabase?.auth.signOut().catch(() => {});
    setIsAuthenticated(false);
    setActivePage('login');
    localStorage.removeItem('rupora_session');
    showToast('Sesi diakhiri');
  };

  const openStockDetail = (ticker: string) => {
    setSelectedTicker(ticker);
    setActivePage('stock-detail');
  };

  const toggleWatchlist = (ticker: string) => {
    setWatchlist((prev) => {
      const exists = prev.includes(ticker);
      const next = exists ? prev.filter((t) => t !== ticker) : [...prev, ticker];
      localStorage.setItem('rupora_watchlist', JSON.stringify(next));
      showToast(
        exists
          ? `${ticker} dihapus dari Watchlist`
          : `${ticker} ditambahkan ke Watchlist`
      );
      return next;
    });
  };

  const persistTradeToSupabase = async (
    ticker: string,
    side: 'BUY' | 'SELL',
    price: number,
    quantity: number,
    realizedPL: number,
    nextCash: number
  ) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    if (!uid) return;

    await supabase.from('trade_logs').insert({
      user_id: uid,
      ticker,
      side,
      price,
      quantity,
      realized_pl: realizedPL,
    });

    await supabase
      .from('profiles')
      .update({ cash_balance: nextCash, updated_at: new Date().toISOString() })
      .eq('id', uid);
  };

  const appendTradeMarker = (marker: TradeMarker) => {
    setTrades((prev) => {
      const next = [marker, ...prev];
      localStorage.setItem('rupora_trades', JSON.stringify(next));
      return next;
    });
  };

  const simulateOrder = (ticker: string, side: 'BUY' | 'SELL', quantity: number): boolean => {
    const asset = assets.find((a) => a.ticker === ticker);
    if (!asset || quantity <= 0) return false;
    const totalValue = asset.price * quantity;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (side === 'BUY') {
      if (totalValue > cashBalance) {
        showToast('Saldo kas tidak mencukupi');
        return false;
      }
      const nextCash = cashBalance - totalValue;
      setCashBalance(nextCash);
      localStorage.setItem('rupora_cash', String(nextCash));

      setHoldings((prev) => {
        const existing = prev.find((h) => h.ticker === ticker);
        let next: PortfolioHolding[];
        if (existing) {
          const totalQty = existing.quantity + quantity;
          const weightedAvg = Math.round(
            (existing.avgPrice * existing.quantity + totalValue) / totalQty
          );
          next = prev.map((h) =>
            h.ticker === ticker ? { ...h, quantity: totalQty, avgPrice: weightedAvg } : h
          );
        } else {
          const mappedCat: PortfolioHolding['category'] =
            asset.category === 'Saham'
              ? 'Saham'
              : asset.category === 'ETF'
              ? 'ETF'
              : 'Other assets';
          next = [
            ...prev,
            {
              ticker,
              name: asset.name,
              category: mappedCat,
              quantity,
              avgPrice: asset.price,
            },
          ];
        }
        localStorage.setItem('rupora_holdings', JSON.stringify(next));
        return next;
      });

      appendTradeMarker({
        id: `tr-${Date.now()}`,
        ticker,
        side: 'BUY',
        price: asset.price,
        quantity,
        time: nowTime,
        pointRatio: 0.92,
      });

      persistTradeToSupabase(ticker, 'BUY', asset.price, quantity, 0, nextCash);

      setNotifications((prev) => [
        {
          id: `ord-${Date.now()}`,
          type: 'portfolio',
          title: `Beli Aset ${ticker} Berhasil`,
          message: `Menambahkan ${quantity.toLocaleString('id-ID')} unit ${ticker} senilai ${formatIDR(totalValue)}.`,
          time: 'Baru saja',
          unread: true,
        },
        ...prev,
      ]);
      showToast(`Pembelian ${ticker} (${formatIDR(totalValue)}) berhasil`);
      return true;
    }

    const existing = holdings.find((h) => h.ticker === ticker);
    if (!existing || existing.quantity < quantity) {
      showToast(`Kepemilikan ${ticker} tidak mencukupi`);
      return false;
    }

    const realizedPL = (asset.price - existing.avgPrice) * quantity;
    const nextCash = cashBalance + totalValue;
    setCashBalance(nextCash);
    localStorage.setItem('rupora_cash', String(nextCash));

    setHoldings((prev) => {
      const next = prev
        .map((h) => (h.ticker === ticker ? { ...h, quantity: h.quantity - quantity } : h))
        .filter((h) => h.quantity > 0);
      localStorage.setItem('rupora_holdings', JSON.stringify(next));
      return next;
    });

    appendTradeMarker({
      id: `tr-${Date.now()}`,
      ticker,
      side: 'SELL',
      price: asset.price,
      quantity,
      time: nowTime,
      pointRatio: 0.92,
      realizedPL,
    });

    persistTradeToSupabase(ticker, 'SELL', asset.price, quantity, realizedPL, nextCash);

    setNotifications((prev) => [
      {
        id: `ord-${Date.now()}`,
        type: 'portfolio',
        title: `Jual Aset ${ticker} Berhasil`,
        message: `Melepas ${quantity.toLocaleString('id-ID')} unit ${ticker} senilai ${formatIDR(totalValue)}.`,
        time: 'Baru saja',
        unread: true,
      },
      ...prev,
    ]);
    showToast(`Penjualan ${ticker} (${formatIDR(totalValue)}) berhasil`);
    return true;
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('Semua notifikasi ditandai sudah dibaca');
  };

  const updateProfile = (name: string, email: string) => {
    const initials = name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const updated = { ...user, name, email, avatarInitials: initials || 'DZ' };
    setUser(updated);
    localStorage.setItem('rupora_user', JSON.stringify(updated));
    showToast('Profil berhasil diperbarui');
  };

  const resetSimulation = () => {
    setHoldings(INITIAL_HOLDINGS);
    setCashBalance(5000000);
    setWatchlist(['BBCA', 'BBRI', 'NVDA', 'AAPL']);
    setTrades([]);
    localStorage.setItem('rupora_holdings', JSON.stringify(INITIAL_HOLDINGS));
    localStorage.setItem('rupora_cash', '5000000');
    localStorage.setItem('rupora_watchlist', JSON.stringify(['BBCA', 'BBRI', 'NVDA', 'AAPL']));
    localStorage.removeItem('rupora_trades');
    showToast('Data portofolio dikembalikan ke awal');
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      activePage,
      selectedTicker,
      assets,
      watchlist,
      holdings,
      cashBalance,
      notifications,
      trades,
      theme,
      toastMessage,
      setActivePage,
      openStockDetail,
      loginDemo,
      signupDemo,
      logoutDemo,
      toggleWatchlist,
      simulateOrder,
      simulateMarketTick,
      addCashBalance,
      markAllNotificationsRead,
      updateProfile,
      setTheme: setThemeState,
      resetSimulation,
      showToast,
    }),
    [
      isAuthenticated,
      user,
      activePage,
      selectedTicker,
      assets,
      watchlist,
      holdings,
      cashBalance,
      notifications,
      trades,
      theme,
      toastMessage,
    ]
  );

  return <RuporaContext.Provider value={value}>{children}</RuporaContext.Provider>;
}

export function useRupora() {
  const ctx = useContext(RuporaContext);
  if (!ctx) throw new Error('useRupora must be used inside RuporaProvider');
  return ctx;
}
