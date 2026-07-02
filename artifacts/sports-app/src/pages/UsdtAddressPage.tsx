import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Wallet {
  id: number;
  currency: string;
  network: string;
  address: string;
  createdAt: string;
}

interface Props {
  onBack: () => void;
  onAdd: () => void;
}

function truncateAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function UsdtAddressPage({ onBack, onAdd }: Props) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/wallets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setWallets(d.wallets); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    setMenuOpen(null);
    await fetch(`/api/wallets/${id}`, { method: "DELETE", credentials: "include" });
    setDeleting(null);
    load();
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-full" onClick={() => setMenuOpen(null)}>
      {/* Header */}
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600 hover:text-gray-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">USDT address</h1>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} className="w-7 h-7">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No USDT address linked yet</p>
          </div>
        ) : (
          wallets.map((w) => (
            <div
              key={w.id}
              className="rounded-2xl p-4 text-white relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Watermark */}
              <div className="absolute right-2 bottom-2 opacity-10 pointer-events-none">
                <svg viewBox="0 0 80 80" className="w-20 h-20" fill="white">
                  <path d="M40 4C20.1 4 4 20.1 4 40s16.1 36 36 36 36-16.1 36-36S59.9 4 40 4zm0 8c5.5 0 10.5 1.6 14.8 4.4L16.4 54.8C13.6 50.5 12 45.5 12 40c0-15.4 12.6-28 28-28zm0 56c-5.5 0-10.5-1.6-14.8-4.4l38.4-38.4C66.4 29.5 68 34.5 68 40c0 15.4-12.6 28-28 28z" />
                </svg>
              </div>

              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "#26a17b" }}>T</div>
                  <div>
                    <p className="text-sm font-semibold">{user?.username ?? "—"}</p>
                    <p className="text-xs text-white/70">{w.network}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === w.id ? null : w.id); }}
                    className="p-1 text-white/80 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  {menuOpen === w.id && (
                    <div className="absolute right-0 top-7 bg-white rounded-xl shadow-xl z-20 min-w-[120px] overflow-hidden">
                      <button
                        onClick={() => handleDelete(w.id)}
                        disabled={deleting === w.id}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 font-medium hover:bg-red-50 active:bg-red-100 disabled:opacity-50"
                      >
                        {deleting === w.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <p className="text-center text-lg font-bold tracking-wider mt-1">
                {truncateAddress(w.address)}
              </p>
            </div>
          ))
        )}

        {/* Add button */}
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2"
          style={{ borderColor: "#2563eb", color: "#2563eb", background: "#eff6ff" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" strokeLinecap="round" />
          </svg>
          Add To Virtual Currency
        </button>
      </div>
    </div>
  );
}
