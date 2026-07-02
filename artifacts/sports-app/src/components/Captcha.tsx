import { useState, useRef, useEffect } from "react";

interface CaptchaProps {
  value: string;
  onChange: (v: string) => void;
  onRefresh?: () => void;
  code: string;
}

export function useCaptchaCode() {
  const [code, setCode] = useState(() => makeCode());
  const refresh = () => setCode(makeCode());
  return { code, refresh };
}

function makeCode() {
  const chars = "0123456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const COLORS = ["#e74c3c", "#2563eb", "#16a085", "#8e44ad", "#f39c12", "#1abc9c"];

export function CaptchaDisplay({ code, onClick }: { code: string; onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 72;
    canvas.height = 32;
    ctx.clearRect(0, 0, 72, 32);

    // Background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, 72, 32);

    // Noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = COLORS[Math.floor(Math.random() * COLORS.length)] + "88";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 72, Math.random() * 32);
      ctx.lineTo(Math.random() * 72, Math.random() * 32);
      ctx.stroke();
    }

    // Draw each digit with a different color
    code.split("").forEach((char, i) => {
      ctx.font = `bold ${18 + Math.floor(Math.random() * 4)}px monospace`;
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.save();
      ctx.translate(8 + i * 16, 22 + (Math.random() * 4 - 2));
      ctx.rotate((Math.random() - 0.5) * 0.3);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    // Noise dots
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = COLORS[Math.floor(Math.random() * COLORS.length)] + "66";
      ctx.fillRect(Math.random() * 72, Math.random() * 32, 2, 2);
    }
  }, [code]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded cursor-pointer border border-white/20"
      onClick={onClick}
      title="Click to refresh"
    />
  );
}

export function CaptchaField({ value, onChange, onRefresh, code }: CaptchaProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4 shrink-0 opacity-70">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Verification code"
          maxLength={4}
          className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
        />
      </div>
      <CaptchaDisplay code={code} onClick={onRefresh ?? (() => {})} />
    </div>
  );
}
