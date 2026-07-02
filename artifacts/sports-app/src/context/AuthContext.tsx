import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  balancePkr: string;
  walletBalance: string;
  totalTrade: string;
  frozenTrade: string;
  vipLevel: number;
  referralCode: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  invitationCode?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE = "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const setUserRef = useRef(setUser);
  setUserRef.current = setUser;

  // Central fetch helper — auto-clears session on any 401 response.
  // This catches stale React state (e.g. server restarted, session lost)
  // and forces the login screen immediately.
  const apiFetch = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    const text = await res.text();
    let data: Record<string, unknown>;
    if (!text) {
      data = { ok: false, error: `Server returned empty response (${res.status})` };
    } else {
      try {
        data = JSON.parse(text);
      } catch {
        data = { ok: false, error: `Unexpected server response (${res.status})` };
      }
    }
    // Any 401 means the session is gone — clear user so the login screen shows.
    // Skip this for the /auth/me probe itself (handled by refreshUser below).
    if (res.status === 401 && !path.startsWith("/auth/me") && !path.startsWith("/auth/login")) {
      setUserRef.current(null);
    }
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/auth/me`, { credentials: "include" });
      const text = await res.text();
      let data: Record<string, unknown> = { ok: false };
      if (text) {
        try { data = JSON.parse(text); } catch { /* ignore */ }
      }
      setUser(data.ok ? (data.user as AuthUser) : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (data.ok) setUser(data.user as AuthUser);
    return data as { ok: boolean; error?: string };
  };

  const register = async (regData: RegisterData) => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(regData),
    });
    if (data.ok) setUser(data.user as AuthUser);
    return data as { ok: boolean; error?: string };
  };

  const logout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
