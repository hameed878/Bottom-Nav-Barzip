import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { addSpinRecord, getSpinHistory, type SpinResult } from "./spinStore";

const router: IRouter = Router();

const SPIN_COST = 100;

// Strict algo: wheel always stops on one of these 5 candidates (equal probability).
// PKR 500 / 1K / 5K / 1LAC never actually land — they are display-only segments.
const ALLOWED: SpinResult[] = ["10", "50", "try-again", "100", "try-again"];

const WIN_AMOUNTS: Record<SpinResult, number> = {
  "10":        10,
  "50":        50,
  "100":       100,
  "try-again": 0,
};

router.post("/spin", async (req: Request, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId))
      .limit(1);

    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const balance = parseFloat(user.balancePkr);
    if (balance < SPIN_COST) {
      return res.status(400).json({
        ok: false,
        error: `Insufficient balance. You need PKR ${SPIN_COST} to spin.`,
      });
    }

    // Pick randomly from the 5 allowed outcomes
    const result: SpinResult = ALLOWED[Math.floor(Math.random() * ALLOWED.length)]!;
    const won = WIN_AMOUNTS[result];
    const newBalance = (balance - SPIN_COST + won).toFixed(2);

    await db
      .update(usersTable)
      .set({ balancePkr: newBalance })
      .where(eq(usersTable.id, req.session.userId));

    addSpinRecord({
      id: `${req.session.userId}-${Date.now()}`,
      userId: req.session.userId,
      result,
      cost: SPIN_COST,
      won,
      balanceBefore: balance.toFixed(2),
      balanceAfter: newBalance,
      createdAt: new Date(),
    });

    return res.json({ ok: true, result, won, newBalance, spinCost: SPIN_COST });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Spin failed" });
  }
});

router.get("/spin/history", async (req: Request, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  const history = getSpinHistory(req.session.userId).map((s) => ({
    id: s.id,
    result: s.result,
    cost: s.cost,
    won: s.won,
    net: s.won - s.cost,
    balanceBefore: s.balanceBefore,
    balanceAfter: s.balanceAfter,
    createdAt: s.createdAt.toISOString(),
  }));

  return res.json({ ok: true, history });
});

export default router;
