import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const depositsTable = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amountPkr: numeric("amount_pkr", { precision: 18, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"),
  // "main" = credit balance_pkr, "wallet" = credit wallet_balance
  depositType: text("deposit_type").notNull().default("main"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDepositSchema = createInsertSchema(depositsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Deposit = typeof depositsTable.$inferSelect;
