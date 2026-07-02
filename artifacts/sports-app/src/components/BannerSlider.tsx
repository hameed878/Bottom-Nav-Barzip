import { useState, useEffect } from "react";

const slides = [
  {
    id: 1,
    bg: "linear-gradient(135deg, #1a3a5c 0%, #2980b9 60%, #85c1e9 100%)",
    title: "AGENT REBATE RATION CHART",
    lines: [
      { pct: "8%", desc: "of level 1 subordinate's earnings", color: "#f9ca24" },
      { pct: "5%", desc: "of level 2 subordinate's earnings", color: "#6ab04c" },
      { pct: "3%", desc: "of level 3 subordinate's earnings", color: "#22a6b3" },
    ],
  },
  {
    id: 2,
    bg: "linear-gradient(135deg, #1a1a5c 0%, #6c3483 60%, #a569bd 100%)",
    title: "WELCOME BONUS OFFER",
    lines: [
      { pct: "100%", desc: "first deposit bonus up to $500", color: "#f9ca24" },
      { pct: "50%", desc: "reload bonus every week", color: "#6ab04c" },
      { pct: "10%", desc: "cashback on all losses", color: "#22a6b3" },
    ],
  },
  {
    id: 3,
    bg: "linear-gradient(135deg, #1a3a1a 0%, #196f3d 60%, #58d68d 100%)",
    title: "VIP EXCLUSIVE BENEFITS",
    lines: [
      { pct: "VIP1", desc: "Dedicated account manager", color: "#f9ca24" },
      { pct: "VIP2", desc: "Priority withdrawals within 1hr", color: "#6ab04c" },
      { pct: "VIP3", desc: "Private events & higher limits", color: "#22a6b3" },
    ],
  },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <div className="relative mx-0 overflow-hidden" style={{ height: 140 }}>
      <div
        className="w-full h-full flex flex-col justify-center px-4 py-3 transition-all duration-700"
        style={{ background: slide.bg }}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="1.5" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span
            className="text-white font-extrabold text-sm tracking-wide"
            style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}
          >
            RBT.CC
          </span>
          <span
            className="text-white font-extrabold text-xs tracking-widest ml-1"
            style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}
          >
            {slide.title}
          </span>
        </div>

        {slide.lines.map((line, i) => (
          <div key={i} className="flex items-baseline gap-2 leading-tight">
            <span
              className="font-extrabold text-base w-10 text-right"
              style={{ color: line.color, textShadow: "0 0 8px rgba(0,0,0,0.4)" }}
            >
              {line.pct}
            </span>
            <span className="text-white text-xs font-medium" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
              {line.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 right-3 flex gap-1">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all"
            style={{
              width: i === current ? 16 : 6,
              height: 6,
              background: i === current ? "white" : "rgba(255,255,255,0.5)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
