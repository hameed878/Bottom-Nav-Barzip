import { db, usersTable, vipRewardsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { getVipTier } from "./vip";

let cronStarted = false;

async function runVipRewards() {
  const today = new Date().toISOString().split("T")[0]!;

  try {
    const users = await db.select().from(usersTable);

    for (const user of users) {
      if (user.vipLevel === 0) continue;

      const tier = getVipTier(user.vipLevel);
      if (!tier) continue;

      const alreadyRewarded = await db
        .select({ id: vipRewardsTable.id })
        .from(vipRewardsTable)
        .where(
          and(
            eq(vipRewardsTable.userId, user.id),
            eq(vipRewardsTable.rewardedFor, today)
          )
        )
        .limit(1);

      if (alreadyRewarded.length > 0) continue;

      const balance = parseFloat(user.balancePkr);
      if (balance <= 0) continue;

      const rate = tier.ratePercent / 100;
      const rewardAmount = parseFloat((balance * rate).toFixed(2));
      if (rewardAmount <= 0) continue;

      await db.insert(vipRewardsTable).values({
        userId: user.id,
        vipLevel: user.vipLevel,
        rewardRate: String(rate),
        balanceSnapshot: String(balance),
        rewardAmount: String(rewardAmount),
        rewardedFor: today,
      });

      await db.update(usersTable)
        .set({ balancePkr: sql`${usersTable.balancePkr} + ${rewardAmount}` })
        .where(eq(usersTable.id, user.id));
    }

    console.log(`[vip-cron] VIP rewards distributed for ${today}`);
  } catch (err) {
    console.error("[vip-cron] Error distributing VIP rewards:", err);
  }
}

function getMillisUntilNextWindow(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(0, 0, 0, 0);
  if (now.getHours() >= 1) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function startVipCron() {
  if (cronStarted) return;
  cronStarted = true;

  const scheduleNext = () => {
    const ms = getMillisUntilNextWindow();
    setTimeout(async () => {
      await runVipRewards();
      setTimeout(scheduleNext, 61 * 60 * 1000);
    }, ms);
  };

  scheduleNext();
  console.log("[vip-cron] VIP reward cron scheduled");
}
