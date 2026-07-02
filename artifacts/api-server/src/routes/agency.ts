import { Router, type IRouter } from "express";
import { db, usersTable, depositsTable, withdrawalsTable, betsTable, referralBonusesTable } from "@workspace/db";
import { eq, and, gte, inArray, desc } from "drizzle-orm";
import type { Request } from "express";

const router: IRouter = Router();

/**
 * Collect all subordinate user IDs up to 3 levels deep.
 * Level 1: direct invitees of userId
 * Level 2: invitees of level-1 users
 * Level 3: invitees of level-2 users
 */
async function getAllSubordinates(userId: number): Promise<{
  level1: number[];
  level2: number[];
  level3: number[];
  all: number[];
}> {
  const level1Users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.invitedBy, userId));
  const level1 = level1Users.map((u) => u.id);

  let level2: number[] = [];
  if (level1.length > 0) {
    const level2Users = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(inArray(usersTable.invitedBy, level1));
    level2 = level2Users.map((u) => u.id);
  }

  let level3: number[] = [];
  if (level2.length > 0) {
    const level3Users = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(inArray(usersTable.invitedBy, level2));
    level3 = level3Users.map((u) => u.id);
  }

  return { level1, level2, level3, all: [...level1, ...level2, ...level3] };
}

router.get("/agency/stats", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!me) return res.status(404).json({ ok: false, error: "User not found" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { level1, all: allIds } = await getAllSubordinates(req.session.userId);

    const teamSize = allIds.length;

    // Team balance: sum of ALL subordinates' balancePkr (reflects live betting deductions)
    let teamBalance = 0;
    if (allIds.length > 0) {
      const members = await db
        .select({ balancePkr: usersTable.balancePkr, createdAt: usersTable.createdAt })
        .from(usersTable)
        .where(inArray(usersTable.id, allIds));
      teamBalance = members.reduce((sum, u) => sum + parseFloat(u.balancePkr), 0);
    }

    // New registrations in 30 days across all levels
    let newRegistrations = 0;
    if (allIds.length > 0) {
      const recentMembers = await db
        .select({ createdAt: usersTable.createdAt })
        .from(usersTable)
        .where(and(inArray(usersTable.id, allIds), gte(usersTable.createdAt, thirtyDaysAgo)));
      newRegistrations = recentMembers.length;
    }

    // Aggregate financials across all subordinates in last 30 days
    let totalTopUp = 0;
    let totalWithdrawal = 0;
    let totalBetAmount = 0;
    let numberOfBets = 0;

    if (allIds.length > 0) {
      const deposits = await db
        .select()
        .from(depositsTable)
        .where(and(inArray(depositsTable.userId, allIds), gte(depositsTable.createdAt, thirtyDaysAgo)));
      totalTopUp = deposits
        .filter((d) => d.status === "success")
        .reduce((s, d) => s + parseFloat(d.amountPkr), 0);

      const withdrawals = await db
        .select()
        .from(withdrawalsTable)
        .where(and(inArray(withdrawalsTable.userId, allIds), gte(withdrawalsTable.createdAt, thirtyDaysAgo)));
      totalWithdrawal = withdrawals
        .filter((w) => w.status === "success")
        .reduce((s, w) => s + parseFloat(w.amountPkr), 0);

      const bets = await db
        .select()
        .from(betsTable)
        .where(and(inArray(betsTable.userId, allIds), gte(betsTable.createdAt, thirtyDaysAgo)));
      numberOfBets = bets.length;
      totalBetAmount = bets.reduce((s, b) => s + parseFloat(b.stakePkr), 0);
    }

    return res.json({
      ok: true,
      stats: {
        username: me.username,
        referralCode: me.referralCode,
        teamBalance: teamBalance.toFixed(2),
        teamSize,
        newRegistrations,
        totalTopUp: totalTopUp.toFixed(2),
        totalWithdrawal: totalWithdrawal.toFixed(2),
        totalBetAmount: totalBetAmount.toFixed(2),
        numberOfBets,
        totalProfit: "0.00",
        teamMotivationAchievement: 0,
        teamIncentivesNotUpToPar: teamSize > 0 ? 1 : 0,
        breakdown: { level1: level1.length },
      },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch agency stats" });
  }
});

router.get("/agency/subordinates", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const { level1, level2, level3 } = await getAllSubordinates(req.session.userId);

    const fetchUsers = async (ids: number[], level: number): Promise<{ id: number; username: string; vipLevel: number; level: number }[]> => {
      if (ids.length === 0) return [];
      const rows = await db
        .select({ id: usersTable.id, username: usersTable.username, vipLevel: usersTable.vipLevel })
        .from(usersTable)
        .where(inArray(usersTable.id, ids));
      return rows.map((u) => ({ ...u, level }));
    };

    const [l1, l2, l3] = await Promise.all([
      fetchUsers(level1, 1),
      fetchUsers(level2, 2),
      fetchUsers(level3, 3),
    ]);

    return res.json({ ok: true, subordinates: [...l1, ...l2, ...l3] });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch subordinates" });
  }
});

router.get("/rebate/stats", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const userId = req.session.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const allBonuses = await db
      .select()
      .from(referralBonusesTable)
      .where(eq(referralBonusesTable.beneficiaryId, userId))
      .orderBy(desc(referralBonusesTable.createdAt));

    const totalRebate = allBonuses
      .reduce((sum, b) => sum + parseFloat(b.bonusAmount), 0)
      .toFixed(2);

    const todayRebate = allBonuses
      .filter((b) => b.createdAt >= today)
      .reduce((sum, b) => sum + parseFloat(b.bonusAmount), 0)
      .toFixed(2);

    const rebateThisWeek = allBonuses
      .filter((b) => b.createdAt >= weekStart)
      .reduce((sum, b) => sum + parseFloat(b.bonusAmount), 0)
      .toFixed(2);

    const lastRebate = allBonuses.length > 0
      ? parseFloat(allBonuses[0].bonusAmount).toFixed(2)
      : "0.00";

    const byDate: Record<string, { date: string; amount: number; level: number }[]> = {};
    for (const b of allBonuses) {
      const dateKey = b.createdAt.toISOString().split("T")[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push({ date: dateKey, amount: parseFloat(b.bonusAmount), level: b.level });
    }

    const records = Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, entries]) => ({
        date,
        amount: entries.reduce((s, e) => s + e.amount, 0).toFixed(2),
        type: "Profit Rebate",
        breakdown: entries.map((e) => ({ level: e.level, amount: e.amount.toFixed(2) })),
      }));

    return res.json({
      ok: true,
      stats: { totalRebate, rebateThisWeek, todayRebate, lastRebate, records },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch rebate stats" });
  }
});

export default router;
