import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const withdrawalsTable = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amountPkr: numeric("amount_pkr", { precision: 18, scale: 2 }).notNull(),
  feePkr: numeric("fee_pkr", { precision: 18, scale: 2 }).notNull(),
  amountUsdt: numeric("amount_usdt", { precision: 18, scale: 6 }).notNull(),
  walletAddress: text("wallet_address").notNull(),
  orderId: text("order_id").notNull(),
  status: text("status").notNull().default("pending"), // pending | success | rejected
  rejectReason: text("reject_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawalsTable).omit({
  id: true,
  createdAt: true,
  status: true,
  rejectReason: true,
});

export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawalsTable.$inferSelect;
