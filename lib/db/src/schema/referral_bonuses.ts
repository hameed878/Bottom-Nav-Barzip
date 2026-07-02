import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// level 1 = 5%, level 2 = 3%, level 3 = 1%
export const referralBonusesTable = pgTable("referral_bonuses", {
  id: serial("id").primaryKey(),
  beneficiaryId: integer("beneficiary_id").notNull(),   // who receives the bonus
  fromUserId: integer("from_user_id").notNull(),         // who placed the bet / deposited
  depositId: integer("deposit_id"),                      // nullable — set if source is deposit
  betId: integer("bet_id"),                              // nullable — set if source is bet
  source: text("source").notNull().default("deposit"),   // 'deposit' | 'bet'
  level: integer("level").notNull(),                     // 1, 2, or 3
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  bonusAmount: numeric("bonus_amount", { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralBonusSchema = createInsertSchema(referralBonusesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertReferralBonus = z.infer<typeof insertReferralBonusSchema>;
export type ReferralBonus = typeof referralBonusesTable.$inferSelect;
