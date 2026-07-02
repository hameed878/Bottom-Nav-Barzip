import { Router, type IRouter } from "express";
import type { Request } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

let cachedRate: number | null = null;
let cacheTime = 0;
const CACHE_MS = 12 * 60 * 60 * 1000; // 12 hours (twice a day)

const DEFAULT_EXCHANGE_URL =
  "https://v6.exchangerate-api.com/v6/f0b20f4900a31caefc6bc880/latest/USD";

async function getAdminSetting(key: string, fallback: string): Promise<string> {
  try {
    const result = await pool.query(
      "SELECT value FROM admin_settings WHERE key = $1",
      [key]
    );
    if (result.rows.length > 0 && result.rows[0].value) {
      return result.rows[0].value as string;
    }
  } catch {
    // fall through to fallback
  }
  return fallback;
}

router.get("/settings/payment-address", async (_req: Request, res) => {
  const address = await getAdminSetting("trc20_address", "TF8XLURccFp8Tb1LFjFG33BApP9YVFp6ML");
  return res.json({ ok: true, address });
});

router.get("/exchange-rate", async (req: Request, res) => {
  try {
    if (cachedRate && Date.now() - cacheTime < CACHE_MS) {
      return res.json({ ok: true, usdToPkr: cachedRate });
    }

    const apiUrl = await getAdminSetting("exchange_rate_api_url", DEFAULT_EXCHANGE_URL);
    const apiKey = await getAdminSetting("exchange_rate_api_key", "");

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const r = await fetch(apiUrl, { headers });
    const data = await r.json() as { conversion_rates?: Record<string, number> };
    const rate = data.conversion_rates?.["PKR"];
    if (!rate) return res.status(502).json({ ok: false, error: "Rate unavailable" });
    cachedRate = rate;
    cacheTime = Date.now();
    return res.json({ ok: true, usdToPkr: rate });
  } catch (err) {
    req.log.error(err);
    if (cachedRate) return res.json({ ok: true, usdToPkr: cachedRate });
    return res.status(502).json({ ok: false, error: "Failed to fetch rate" });
  }
});

export default router;
