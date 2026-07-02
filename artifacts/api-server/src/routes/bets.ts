import { Router, type IRouter } from "express";
import { db, usersTable, betsTable, referralBonusesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { Request } from "express";

const router: IRouter = Router();

// Rebate rates per level — applied to the bet's estimated profit
const BET_REBATE_LEVELS = [
  { level: 1, pct: 0.08 },  // 8% of profit to direct referrer (level 1)
  { level: 2, pct: 0.05 },  // 5% of profit to level 2 referrer
  { level: 3, pct: 0.03 },  // 3% of profit to level 3 referrer
];

async function creditBetRebates(bettorId: number, betId: number, estimatedProfit: number) {
  let currentUserId: number | null = bettorId;
  for (const { level, pct } of BET_REBATE_LEVELS) {
    if (!currentUserId) break;
    const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId)).limit(1);
    if (!currentUser || !currentUser.invitedBy) break;

    const referrerId = currentUser.invitedBy;
    const bonusAmount = parseFloat((estimatedProfit * pct).toFixed(2));
    if (bonusAmount <= 0) { currentUserId = referrerId; continue; }

    const [referrer] = await db.select().from(usersTable).where(eq(usersTable.id, referrerId)).limit(1);
    if (!referrer) break;

    const newWalletBalance = (parseFloat(referrer.walletBalance) + bonusAmount).toFixed(2);
    await db.update(usersTable)
      .set({ walletBalance: newWalletBalance })
      .where(eq(usersTable.id, referrerId));

    await db.insert(referralBonusesTable).values({
      beneficiaryId: referrerId,
      fromUserId: bettorId,
      betId,
      source: "bet",
      level,
      percentage: String(pct * 100),
      bonusAmount: String(bonusAmount),
    });

    currentUserId = referrerId;
  }
}

router.get("/bets", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  try {
    const bets = await db
      .select()
      .from(betsTable)
      .where(eq(betsTable.userId, req.session.userId))
      .orderBy(desc(betsTable.createdAt));
    return res.json({ ok: true, bets });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch bets" });
  }
});

router.post("/bets", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const {
    fixtureId, homeTeam, awayTeam, leagueName, matchDate, matchTime,
    homeTeamLogo, awayTeamLogo, selectedScore, oddsValue, stakePkr,
  } = req.body as {
    fixtureId: number; homeTeam: string; awayTeam: string; leagueName: string;
    matchDate: string; matchTime: string; homeTeamLogo?: string; awayTeamLogo?: string;
    selectedScore: string; oddsValue: string; stakePkr: number;
  };

  if (!stakePkr || stakePkr <= 0) return res.status(400).json({ ok: false, error: "Invalid stake" });

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const balance = parseFloat(user.balancePkr);
    if (stakePkr > balance) return res.status(400).json({ ok: false, error: "Insufficient balance" });

    const oddsNum = parseFloat(oddsValue) / 100;
    const estimatedProfit = stakePkr * oddsNum;
    const orderId = Date.now().toString() + randomBytes(4).toString("hex").toUpperCase();

    const [bet] = await db.insert(betsTable).values({
      userId: req.session.userId,
      fixtureId,
      homeTeam,
      awayTeam,
      leagueName,
      matchDate,
      matchTime,
      homeTeamLogo: homeTeamLogo ?? "",
      awayTeamLogo: awayTeamLogo ?? "",
      selectedScore,
      oddsValue,
      stakePkr: String(stakePkr.toFixed(2)),
      estimatedProfit: String(estimatedProfit.toFixed(3)),
      orderId,
      status: "active",
    }).returning();

    const newBalance = (balance - stakePkr).toFixed(2);
    const newTotalTrade = (parseFloat(user.totalTrade) + stakePkr).toFixed(2);
    const newFrozenTrade = (parseFloat(user.frozenTrade) + stakePkr).toFixed(2);
    await db.update(usersTable)
      .set({ balancePkr: newBalance, totalTrade: newTotalTrade, frozenTrade: newFrozenTrade })
      .where(eq(usersTable.id, req.session.userId));

    // Credit rebates to referrer chain based on estimated profit (fire-and-forget)
    creditBetRebates(req.session.userId, bet.id, estimatedProfit).catch((e) => req.log.error(e, "rebate credit failed"));

    return res.json({ ok: true, bet, newBalance });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to place bet" });
  }
});

router.delete("/bets/:id", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const betId = parseInt(req.params.id);
  if (isNaN(betId)) return res.status(400).json({ ok: false, error: "Invalid bet id" });

  try {
    const [bet] = await db
      .select()
      .from(betsTable)
      .where(and(eq(betsTable.id, betId), eq(betsTable.userId, req.session.userId)))
      .limit(1);

    if (!bet) return res.status(404).json({ ok: false, error: "Bet not found" });
    if (bet.status !== "active") return res.status(400).json({ ok: false, error: "Bet cannot be cancelled" });

    await db.update(betsTable).set({ status: "cancelled" }).where(eq(betsTable.id, betId));

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    const stake = parseFloat(String(bet.stakePkr));
    const refundBalance = (parseFloat(user.balancePkr) + stake).toFixed(2);
    const newFrozen = Math.max(0, parseFloat(user.frozenTrade) - stake).toFixed(2);
    await db.update(usersTable)
      .set({ balancePkr: refundBalance, frozenTrade: newFrozen })
      .where(eq(usersTable.id, req.session.userId));

    return res.json({ ok: true, refundBalance });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to cancel bet" });
  }
});

export default router;
