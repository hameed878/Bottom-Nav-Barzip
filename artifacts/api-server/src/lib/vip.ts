export interface VipTier {
  level: number;
  minDeposit: number;
  ratePercent: number;
}

export const VIP_TIERS: VipTier[] = [
  { level: 1,  minDeposit: 12,    ratePercent: 0.10 },
  { level: 2,  minDeposit: 20,    ratePercent: 0.15 },
  { level: 3,  minDeposit: 50,    ratePercent: 0.20 },
  { level: 4,  minDeposit: 100,   ratePercent: 0.30 },
  { level: 5,  minDeposit: 200,   ratePercent: 0.40 },
  { level: 6,  minDeposit: 500,   ratePercent: 0.50 },
  { level: 7,  minDeposit: 1000,  ratePercent: 0.60 },
  { level: 8,  minDeposit: 2000,  ratePercent: 0.70 },
  { level: 9,  minDeposit: 5000,  ratePercent: 0.80 },
  { level: 10, minDeposit: 10000, ratePercent: 1.00 },
];

export function computeVipLevel(totalDeposit: number): number {
  let level = 0;
  for (const tier of VIP_TIERS) {
    if (totalDeposit >= tier.minDeposit) level = tier.level;
  }
  return level;
}

export function getVipTier(level: number): VipTier | null {
  return VIP_TIERS.find((t) => t.level === level) ?? null;
}

export function getNextVipTier(level: number): VipTier | null {
  return VIP_TIERS.find((t) => t.level === level + 1) ?? null;
}
