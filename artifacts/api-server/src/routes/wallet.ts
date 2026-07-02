import { Router, type IRouter } from "express";
import { db, usersTable, referralBonusesTable } from "@workspace/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import type { Request } from "express";

const router: IRouter = Router();

// GET /api/wallet/balance
router.get("/wallet/balance", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // Fetch all bet-sourced rebates for this user
    const allBonuses = await db
      .select()
      .from(referralBonusesTable)
      .where(
        and(
          eq(referralBonusesTable.beneficiaryId, req.session.userId),
          eq(referralBonusesTable.source, "bet")
        )
      )
      .orderBy(desc(referralBonusesTable.createdAt));

    const cumulativeRebate = allBonuses
      .reduce((acc, b) => acc + parseFloat(b.bonusAmount), 0)
      .toFixed(2);

    const yesterdayRebate = allBonuses
      .filter((b) => b.createdAt >= yesterday && b.createdAt <= yesterdayEnd)
      .reduce((acc, b) => acc + parseFloat(b.bonusAmount), 0)
      .toFixed(2);

    // Last 30 records for history display
    const history = allBonuses.slice(0, 30).map((b) => ({
      id: b.id,
      level: b.level,
      bonusAmount: b.bonusAmount,
      percentage: b.percentage,
      createdAt: b.createdAt,
    }));

    return res.json({
      ok: true,
      walletBalance: user.walletBalance,
      yesterdayRebate,
      cumulativeRebate,
      history,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch wallet balance" });
  }
});

// GET /api/wallet/lookup-subordinate?username=xxx  — verify a username is a direct subordinate
router.get("/wallet/lookup-subordinate", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { username } = req.query as { username?: string };
  if (!username?.trim()) return res.status(400).json({ ok: false, error: "Username required" });

  try {
    // Fetch the current user to guard against self-transfer
    const [me] = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    if (me && me.username.toLowerCase() === username.trim().toLowerCase()) {
      return res.status(400).json({ ok: false, error: "You cannot transfer funds to your own account" });
    }

    const [sub] = await db
      .select({ id: usersTable.id, username: usersTable.username, vipLevel: usersTable.vipLevel, balancePkr: usersTable.balancePkr })
      .from(usersTable)
      .where(and(eq(usersTable.username, username.trim()), eq(usersTable.invitedBy, req.session.userId)))
      .limit(1);

    if (!sub) return res.status(404).json({ ok: false, error: "No subordinate found with that username. Only users who registered with your referral code can receive transfers." });
    return res.json({ ok: true, subordinate: sub });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Lookup failed" });
  }
});

// GET /api/wallet/subordinates  — list of users who joined via my referral code (level 1 only)
router.get("/wallet/subordinates", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const subs = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        balancePkr: usersTable.balancePkr,
        vipLevel: usersTable.vipLevel,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.invitedBy, req.session.userId));

    return res.json({ ok: true, subordinates: subs });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch subordinates" });
  }
});

// POST /api/wallet/transfer-self  — move walletBalance → main balancePkr
router.post("/wallet/transfer-self", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { amount } = req.body as { amount: string };
  const amountNum = parseFloat(amount);
  if (!amountNum || amountNum <= 0) return res.status(400).json({ ok: false, error: "Invalid amount" });

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const wallet = parseFloat(user.walletBalance);
    if (amountNum > wallet) return res.status(400).json({ ok: false, error: "Insufficient wallet balance" });

    const newWallet = (wallet - amountNum).toFixed(2);
    const newBalance = (parseFloat(user.balancePkr) + amountNum).toFixed(2);

    await db.update(usersTable)
      .set({ walletBalance: newWallet, balancePkr: newBalance })
      .where(eq(usersTable.id, req.session.userId));

    return res.json({ ok: true, walletBalance: newWallet, balancePkr: newBalance });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Transfer failed" });
  }
});

// POST /api/wallet/transfer-subordinate  — send from walletBalance to a subordinate's main balancePkr
router.post("/wallet/transfer-subordinate", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { toUserId, amount } = req.body as { toUserId: number; amount: string };
  const amountNum = parseFloat(amount);
  if (!amountNum || amountNum <= 0) return res.status(400).json({ ok: false, error: "Invalid amount" });
  if (!toUserId) return res.status(400).json({ ok: false, error: "Missing recipient" });
  if (toUserId === req.session.userId) return res.status(400).json({ ok: false, error: "You cannot transfer funds to your own account" });

  try {
    // Verify the recipient is actually a subordinate
    const [recipient] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, toUserId), eq(usersTable.invitedBy, req.session.userId)))
      .limit(1);

    if (!recipient) return res.status(400).json({ ok: false, error: "Recipient is not your subordinate" });

    const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!sender) return res.status(404).json({ ok: false, error: "Sender not found" });

    const wallet = parseFloat(sender.walletBalance);
    if (amountNum > wallet) return res.status(400).json({ ok: false, error: "Insufficient wallet balance" });

    const newWallet = (wallet - amountNum).toFixed(2);
    const recipientNewBalance = (parseFloat(recipient.balancePkr) + amountNum).toFixed(2);

    await db.update(usersTable)
      .set({ walletBalance: newWallet })
      .where(eq(usersTable.id, req.session.userId));

    await db.update(usersTable)
      .set({ balancePkr: recipientNewBalance })
      .where(eq(usersTable.id, toUserId));

    return res.json({
      ok: true,
      walletBalance: newWallet,
      recipientUsername: recipient.username,
      amountSent: amountNum.toFixed(2),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Transfer failed" });
  }
});

export default router;
