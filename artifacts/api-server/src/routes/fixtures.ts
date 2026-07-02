import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000;
let requestCount = 0;
const MAX_REQUESTS = 50;

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

async function fetchFixtures(date: string): Promise<unknown> {
  const cacheKey = `fixtures:${date}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (requestCount >= MAX_REQUESTS) {
    if (cached) return cached.data;
    throw new Error("API request limit reached for today");
  }

  const apiKey = await getAdminSetting(
    "football_api_key",
    process.env["FOOTBALL_API_KEY"] ?? ""
  );
  if (!apiKey) {
    throw new Error("Football API key is not configured. Set it in Admin → API Settings.");
  }

  const baseUrl = await getAdminSetting(
    "football_api_url",
    "https://v3.football.api-sports.io"
  );

  requestCount++;
  const url = `${baseUrl}/fixtures?date=${date}`;
  const resp = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (!resp.ok) {
    throw new Error(`Football API error: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

router.get("/fixtures", async (req, res) => {
  try {
    const date = (req.query["date"] as string) || new Date().toISOString().split("T")[0];
    const data = await fetchFixtures(date);
    res.json({ ok: true, data, requestCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
});

router.get("/fixtures/requests", (_req, res) => {
  res.json({ requestCount, maxRequests: MAX_REQUESTS });
});

export default router;
