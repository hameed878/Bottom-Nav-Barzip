import { pgTable, serial, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";

export const vipRewardsTable = pgTable("vip_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vipLevel: integer("vip_level").notNull(),
  rewardRate: numeric("reward_rate", { precision: 8, scale: 4 }).notNull(),
  balanceSnapshot: numeric("balance_snapshot", { precision: 18, scale: 2 }).notNull(),
  rewardAmount: numeric("reward_amount", { precision: 18, scale: 2 }).notNull(),
  rewardedFor: date("rewarded_for").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type VipReward = typeof vipRewardsTable.$inferSelect;
