export interface RankTier {
  level: number;
  name: string;
  minProfit: number;
  bonusCash: number;
  badgeStyle: string;
}

export const RANK_TIERS: RankTier[] = [
  { level: 1, name: 'Bronze', minProfit: 1_000_000, bonusCash: 100_000, badgeStyle: 'bg-amber-700 text-white' },
  { level: 2, name: 'Silver', minProfit: 2_000_000, bonusCash: 200_000, badgeStyle: 'bg-slate-400 text-slate-950' },
  { level: 3, name: 'Gold', minProfit: 5_000_000, bonusCash: 500_000, badgeStyle: 'bg-yellow-400 text-slate-950' },
  { level: 4, name: 'Platinum', minProfit: 10_000_000, bonusCash: 1_000_000, badgeStyle: 'bg-cyan-500 text-white' },
  { level: 5, name: 'Diamond', minProfit: 30_000_000, bonusCash: 2_500_000, badgeStyle: 'bg-sky-500 text-white' },
  { level: 6, name: 'Raja Saham', minProfit: 100_000_000, bonusCash: 7_500_000, badgeStyle: 'bg-indigo-600 text-white' },
  { level: 7, name: 'Dewa Saham', minProfit: 1_000_000_000, bonusCash: 50_000_000, badgeStyle: 'bg-purple-600 text-white' },
  { level: 8, name: 'Joker', minProfit: 10_000_000_000, bonusCash: 250_000_000, badgeStyle: 'bg-rose-600 text-white' },
];

export const OVERLORD_RANK: RankTier = {
  level: 99,
  name: 'Overlord',
  minProfit: 0,
  bonusCash: 0,
  badgeStyle: 'bg-slate-950 text-amber-300 border border-amber-400/50',
};

export function evaluateRankProgress(profit: number, isAdmin: boolean, currentLevel: number) {
  if (isAdmin) {
    return {
      rankName: 'Overlord',
      rankLevel: 99,
      bonusAwarded: 0,
      nextTier: null as RankTier | null,
    };
  }

  let achieved: RankTier | null = null;
  for (const tier of RANK_TIERS) {
    if (profit >= tier.minProfit) {
      achieved = tier;
    }
  }

  const nextTier = RANK_TIERS.find((t) => profit < t.minProfit) || null;
  const newLevel = achieved ? achieved.level : 0;

  let bonusAwarded = 0;
  if (newLevel > currentLevel) {
    for (const tier of RANK_TIERS) {
      if (tier.level > currentLevel && tier.level <= newLevel) {
        bonusAwarded += tier.bonusCash;
      }
    }
  }

  return {
    rankName: achieved ? achieved.name : 'Pemula',
    rankLevel: Math.max(currentLevel, newLevel),
    bonusAwarded,
    nextTier,
  };
}
