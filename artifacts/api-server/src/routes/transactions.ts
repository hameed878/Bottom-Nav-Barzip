import { Router, type IRouter } from "express";
import { db, depositsTable, referralBonusesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { Request } from "express";
import { getSpinHistory } from "./spinStore";

const router: IRouter = Router();

router.get("/transactions", async (req: Request, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  try {
    const userId = req.session.userId;

    const [deposits, bonuses] = await Promise.all([
      db.select().from(depositsTable).where(eq(depositsTable.userId, userId)),
      db
        .select({
          id: referralBonusesTable.id,
          bonusAmount: referralBonusesTable.bonusAmount,
          level: referralBonusesTable.level,
          percentage: referralBonusesTable.percentage,
          fromUserId: referralBonusesTable.fromUserId,
          createdAt: referralBonusesTable.createdAt,
          fromUsername: usersTable.username,
        })
        .from(referralBonusesTable)
        .leftJoin(usersTable, eq(referralBonusesTable.fromUserId, usersTable.id))
        .where(eq(referralBonusesTable.beneficiaryId, userId)),
    ]);

    const txns: {
      id: string;
      type: string;
      label: string;
      amount: string;
      sign: "+" | "-";
      date: string;
      status: string;
      category: "deposit" | "referral" | "bet";
    }[] = [];

    for (const d of deposits) {
      txns.push({
        id: `dep-${d.id}`,
        type: "Deposit",
        label: "Recharge",
        amount: parseFloat(d.amountPkr).toFixed(2),
        sign: "+",
        date: d.createdAt.toISOString(),
        status: "Completed",
        category: "deposit",
      });
    }

    for (const b of bonuses) {
      const pct = parseFloat(b.percentage).toFixed(0);
      txns.push({
        id: `ref-${b.id}`,
        type: "Referral Bonus",
        label: `Level ${b.level} referral (${pct}%) from @${b.fromUsername ?? b.fromUserId}`,
        amount: parseFloat(b.bonusAmount).toFixed(2),
        sign: "+",
        date: b.createdAt.toISOString(),
        status: "Credited",
        category: "referral",
      });
    }

    const spins = getSpinHistory(userId);
    for (const s of spins) {
      txns.push({
        id: `spin-${s.id}`,
        type: "Lucky Wheel",
        label: s.result === "10" ? `Wheel Win PKR ${s.won} (cost PKR ${s.cost})` : `Wheel Spin (Try Again, cost PKR ${s.cost})`,
        amount: s.result === "10" ? (s.won - s.cost).toFixed(2) : s.cost.toFixed(2),
        sign: s.result === "10" && s.won > s.cost ? "+" : "-",
        date: s.createdAt.toISOString(),
        status: s.result === "10" ? "Won" : "Try Again",
        category: "bet",
      });
    }

    txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({ ok: true, transactions: txns });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch transactions" });
  }
});

export default router;
