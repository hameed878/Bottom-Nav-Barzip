import { useEffect, useState } from "react";

const HOT_LABELS = ["🔥 TOP MATCH", "⚽ LIVE NOW", "🏆 FINALS", "💰 BIG ODDS"];

export default function HotEvents({ onWheelClick }: { onWheelClick?: () => void }) {
  const [labelIdx, setLabelIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLabelIdx(i => (i + 1) % HOT_LABELS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-2 mt-3 mb-1 flex items-center gap-3">
      {/* Hot Events button */}
      <button
        className="flex items-center gap-2 flex-1 rounded-xl px-4 py-3 text-white font-bold text-sm shadow-lg active:scale-95 transition-transform relative overflow-hidden"
        style={{ background: "linear-gradient(110deg,#1e3a8a 0%,#2563eb 50%,#1d4ed8 100%)" }}
      >
        {/* Shimmer sweep */}
        <span className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%)",
          animation: "shimmer 2.4s linear infinite",
        }} />
        {/* Pulsing flame */}
        <span className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full shrink-0"
          style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", animation: "pulseBadge 1s ease-in-out infinite alternate" }}>
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <path d="M12 2s-4 4.5-4 8a4 4 0 0 0 8 0c0-1.5-.5-3-1.5-4.5C14 7 14 9 12 10c0-2.5-2-5-2-5-.5 2-1 3-1 4a3 3 0 0 0 6 0c0-3-3-7-3-7z"/>
          </svg>
        </span>
        {/* Cycling label */}
        <span className="relative z-10 flex-1 text-left font-black tracking-wide" style={{ minWidth: 0 }}>
          <span key={labelIdx} style={{ display: "inline-block", animation: "slideIn 0.35s ease" }}>
            {HOT_LABELS[labelIdx]}
          </span>
        </span>
        {/* Arrow */}
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4 shrink-0 relative z-10 opacity-70">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Spin Wheel — wheel spins, DRAIN NOW stays still */}
      <button onClick={onWheelClick} className="relative shrink-0 active:scale-95 transition-transform" style={{ width: 72, height: 72 }}>
        {/* Spinning wheel image */}
        <img
          src="/spin-wheel.png"
          alt="spin wheel"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            animation: "spinWheel 5s linear infinite",
            display: "block",
          }}
        />
        {/* Stationary DRAIN NOW badge at center */}
        <img
          src="/drain-now.png"
          alt="Drain Now"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "52%",
            height: "52%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      </button>

      <style>{`
        @keyframes spinWheel {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes pulseBadge {
          from { transform: scale(1); box-shadow: 0 0 0px rgba(239,68,68,0.6); }
          to   { transform: scale(1.12); box-shadow: 0 0 10px rgba(239,68,68,0.9); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
