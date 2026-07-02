import { Router, type IRouter } from "express";
import type { Request } from "express";
import { db } from "@workspace/db";
import { withdrawalsTable, walletAddressesTable, usersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

const router: IRouter = Router();

router.get("/withdrawals", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const rows = await db
    .select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, req.session.userId))
    .orderBy(desc(withdrawalsTable.createdAt));
  return res.json({ ok: true, withdrawals: rows });
});

router.post("/withdrawals", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const { amountPkr, fundPassword } = req.body as { amountPkr: string; fundPassword?: string };

  if (!amountPkr || isNaN(parseFloat(amountPkr)) || parseFloat(amountPkr) <= 0) {
    return res.status(400).json({ ok: false, error: "Invalid amount" });
  }
  if (!fundPassword) {
    return res.status(400).json({ ok: false, error: "Fund password is required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) return res.status(404).json({ ok: false, error: "User not found" });

  const [wallet] = await db
    .select()
    .from(walletAddressesTable)
    .where(eq(walletAddressesTable.userId, req.session.userId));
  if (!wallet) return res.status(400).json({ ok: false, error: "No USDT address linked" });

  const pkr = parseFloat(amountPkr);
  if (pkr > parseFloat(user.balancePkr)) {
    return res.status(400).json({ ok: false, error: "Insufficient balance" });
  }

  const feePkr = pkr * 0.14;
  const netPkr = pkr - feePkr;
  // Use a rough rate of 285 if no live rate is available — actual rate shown to user in UI
  const amountUsdt = (netPkr / 285).toFixed(6);
  const orderId = Date.now().toString() + randomBytes(4).toString("hex").toUpperCase();

  await db.insert(withdrawalsTable).values({
    userId: req.session.userId,
    amountPkr: pkr.toFixed(2),
    feePkr: feePkr.toFixed(2),
    amountUsdt,
    walletAddress: wallet.address,
    orderId,
    status: "pending",
  });

  // Deduct balance
  await db
    .update(usersTable)
    .set({ balancePkr: (parseFloat(user.balancePkr) - pkr).toFixed(2) })
    .where(eq(usersTable.id, req.session.userId));

  return res.json({ ok: true, orderId });
});

export default router;
