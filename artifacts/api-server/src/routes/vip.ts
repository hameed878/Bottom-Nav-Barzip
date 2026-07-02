import { Router, type IRouter } from "express";
import { db, usersTable, depositsTable, vipRewardsTable } from "@workspace/db";
import { eq, sum, desc } from "drizzle-orm";
import { computeVipLevel, getVipTier, getNextVipTier, VIP_TIERS } from "../lib/vip";
import type { Request } from "express";

const router: IRouter = Router();

// GET /api/vip/status  — current user's VIP info
router.get("/vip/status", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const [depositSum] = await db
      .select({ total: sum(depositsTable.amountPkr) })
      .from(depositsTable)
      .where(eq(depositsTable.userId, req.session.userId));

    const totalDeposit = parseFloat(depositSum?.total ?? "0");
    const computedLevel = computeVipLevel(totalDeposit);

    if (computedLevel !== user.vipLevel) {
      await db.update(usersTable)
        .set({ vipLevel: computedLevel })
        .where(eq(usersTable.id, req.session.userId));
    }

    const currentTier = getVipTier(computedLevel);
    const nextTier = getNextVipTier(computedLevel);

    return res.json({
      ok: true,
      vipLevel: computedLevel,
      totalDeposit: totalDeposit.toFixed(2),
      ratePercent: currentTier?.ratePercent ?? 0,
      nextLevel: nextTier
        ? {
            level: nextTier.level,
            minDeposit: nextTier.minDeposit,
            ratePercent: nextTier.ratePercent,
            remaining: Math.max(0, nextTier.minDeposit - totalDeposit).toFixed(2),
          }
        : null,
      tiers: VIP_TIERS,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch VIP status" });
  }
});

// GET /api/vip/history  — user's VIP reward history
router.get("/vip/history", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const rewards = await db
      .select()
      .from(vipRewardsTable)
      .where(eq(vipRewardsTable.userId, req.session.userId))
      .orderBy(desc(vipRewardsTable.createdAt))
      .limit(50);

    return res.json({ ok: true, rewards });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch VIP history" });
  }
});

export default router;
