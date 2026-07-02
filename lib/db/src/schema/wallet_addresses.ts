import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const walletAddressesTable = pgTable("wallet_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  currency: text("currency").notNull().default("USDT"),
  network: text("network").notNull().default("TRC20"),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWalletAddressSchema = createInsertSchema(walletAddressesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertWalletAddress = z.infer<typeof insertWalletAddressSchema>;
export type WalletAddress = typeof walletAddressesTable.$inferSelect;
