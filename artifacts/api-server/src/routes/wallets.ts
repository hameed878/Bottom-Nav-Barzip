import { Router, type IRouter } from "express";
import { db, walletAddressesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { Request } from "express";

const router: IRouter = Router();

router.get("/wallets", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Not authenticated" });
  try {
    const wallets = await db
      .select()
      .from(walletAddressesTable)
      .where(eq(walletAddressesTable.userId, req.session.userId));
    return res.json({ ok: true, wallets });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to fetch wallets" });
  }
});

router.post("/wallets", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Not authenticated" });
  const { currency, network, address } = req.body as Record<string, string>;
  if (!address?.trim()) return res.status(400).json({ ok: false, error: "Address is required" });
  try {
    // Enforce 1 wallet per user — must delete existing one first
    const existing = await db
      .select()
      .from(walletAddressesTable)
      .where(eq(walletAddressesTable.userId, req.session.userId))
      .limit(1);
    if (existing.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "You already have a USDT address linked. Please delete it first before adding a new one.",
      });
    }
    const [wallet] = await db.insert(walletAddressesTable).values({
      userId: req.session.userId,
      currency: currency ?? "USDT",
      network: network ?? "TRC20",
      address: address.trim(),
    }).returning();
    return res.json({ ok: true, wallet });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to add wallet" });
  }
});

router.delete("/wallets/:id", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Not authenticated" });
  const id = parseInt(req.params["id"] ?? "0");
  if (!id) return res.status(400).json({ ok: false, error: "Invalid id" });
  try {
    await db.delete(walletAddressesTable).where(
      and(eq(walletAddressesTable.id, id), eq(walletAddressesTable.userId, req.session.userId))
    );
    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to delete wallet" });
  }
});

export default router;
