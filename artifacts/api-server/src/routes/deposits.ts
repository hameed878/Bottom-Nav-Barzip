import { Router, type IRouter } from "express";
import { db, usersTable, depositsTable, referralBonusesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { Request } from "express";

const router: IRouter = Router();

const REFERRAL_LEVELS = [
  { level: 1, pct: 0.08 },
  { level: 2, pct: 0.05 },
  { level: 3, pct: 0.03 },
];

router.get("/deposits", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Not authenticated" });
  try {
    const deposits = await db
      .select()
      .from(depositsTable)
      .where(eq(depositsTable.userId, req.session.userId))
      .orderBy(desc(depositsTable.createdAt));
    return res.json({ ok: true, deposits });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch deposits" });
  }
});

router.post("/deposits", async (req: Request, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  const { amount, type } = req.body as { amount: string; type?: string };
  const amountNum = parseFloat(amount);
  if (!amountNum || amountNum <= 0) {
    return res.status(400).json({ ok: false, error: "Invalid amount" });
  }

  // "main" credits balance_pkr, "wallet" credits wallet_balance
  const depositType = type === "wallet" ? "wallet" : "main";

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) return res.status(401).json({ ok: false, error: "User not found" });

    // Create the deposit as pending — balance is NOT credited until admin approves
    const [deposit] = await db.insert(depositsTable).values({
      userId: user.id,
      amountPkr: String(amountNum),
      status: "pending",
      depositType,
    }).returning();

    return res.json({
      ok: true,
      pending: true,
      deposit,
      user: {
        id: user.id,
        username: user.username,
        balancePkr: user.balancePkr,
        walletBalance: user.walletBalance,
        totalTrade: user.totalTrade,
        frozenTrade: user.frozenTrade,
        vipLevel: user.vipLevel,
        referralCode: user.referralCode,
      },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Deposit failed" });
  }
});

export default router;
