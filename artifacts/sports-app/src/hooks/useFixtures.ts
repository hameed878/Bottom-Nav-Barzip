import { useState, useEffect, useCallback } from "react";

export interface Team {
  id: number;
  name: string;
  logo: string;
}

export interface Fixture {
  id: number;
  date: string;
  timestamp: number;
  venue: string | null;
  status: { short: string; long: string; elapsed: number | null };
  league: { id: number; name: string; country: string; logo: string; season: number; round: string };
  homeTeam: Team;
  awayTeam: Team;
  goals: { home: number | null; away: number | null };
}

interface RawFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    venue?: { name?: string };
    status: { short: string; long: string; elapsed: number | null };
  };
  league: { id: number; name: string; country: string; logo: string; season: number; round: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

const memCache: Record<string, { data: Fixture[]; ts: number }> = {};
const CACHE_MS = 30 * 60 * 1000;

function mapFixture(raw: RawFixture): Fixture {
  return {
    id: raw.fixture.id,
    date: raw.fixture.date,
    timestamp: raw.fixture.timestamp,
    venue: raw.fixture.venue?.name ?? null,
    status: raw.fixture.status,
    league: raw.league,
    homeTeam: raw.teams.home,
    awayTeam: raw.teams.away,
    goals: raw.goals,
  };
}

export function useFixtures(date: string) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (memCache[date] && Date.now() - memCache[date].ts < CACHE_MS) {
      setFixtures(memCache[date].data);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const base = import.meta.env.BASE_URL ?? "/";
      const url = `${base}api/fixtures?date=${date}`.replace(/\/\//g, "/");
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "API error");
      const raw = (json.data as { response?: RawFixture[] }).response ?? [];
      const mapped = raw.map(mapFixture);
      memCache[date] = { data: mapped, ts: Date.now() };
      setFixtures(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { fixtures, loading, error, refetch: fetchData };
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
