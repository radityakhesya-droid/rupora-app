export type AssetCategory = 'Saham' | 'Indeks' | 'ETF' | 'Komoditas' | 'Kripto';

export type PageRoute =
  | 'login'
  | 'signup'
  | 'home'
  | 'market'
  | 'stock-detail'
  | 'portfolio' | 'leaderboard'
  | 'watchlist'
  | 'notifications'
  | 'settings';

export interface AssetItem {
  ticker: string;
  name: string;
  category: AssetCategory;
  exchange: string;
  price: number;
  prevClose: number;
  volume: string;
  marketCap: string;
  peRatio: string;
  pbRatio: string;
  divYield: string;
  high52w: number;
  low52w: number;
  description: string;
  color: string;
  history: Record<string, number[]>;
}

export interface PortfolioHolding {
  ticker: string;
  name: string;
  category: 'Saham' | 'ETF' | 'Other assets';
  quantity: number;
  avgPrice: number;
}

export interface NotificationItem {
  id: string;
  type: 'market' | 'watchlist' | 'portfolio' | 'leaderboard' | 'system';
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  accountType: string;
  avatarInitials: string;
}

