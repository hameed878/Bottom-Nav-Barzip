import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const betsTable = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  fixtureId: integer("fixture_id").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  leagueName: text("league_name").notNull(),
  matchDate: text("match_date").notNull(),
  matchTime: text("match_time").notNull(),
  homeTeamLogo: text("home_team_logo").default(""),
  awayTeamLogo: text("away_team_logo").default(""),
  selectedScore: text("selected_score").notNull(),
  oddsValue: text("odds_value").notNull(),
  stakePkr: numeric("stake_pkr", { precision: 14, scale: 2 }).notNull(),
  estimatedProfit: numeric("estimated_profit", { precision: 14, scale: 2 }).notNull(),
  orderId: text("order_id").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
