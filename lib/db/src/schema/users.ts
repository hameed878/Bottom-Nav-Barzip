import { pgTable, serial, text, numeric, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    email: text("email"),
    phone: text("phone"),
    balancePkr: numeric("balance_pkr", { precision: 18, scale: 2 }).notNull().default("0.00"),
    walletBalance: numeric("wallet_balance", { precision: 18, scale: 2 }).notNull().default("0.00"),
    totalTrade: numeric("total_trade", { precision: 18, scale: 2 }).notNull().default("0.00"),
    frozenTrade: numeric("frozen_trade", { precision: 18, scale: 2 }).notNull().default("0.00"),
    vipLevel: integer("vip_level").notNull().default(0),
    referralCode: text("referral_code").notNull(),
    invitedBy: integer("invited_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
