import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CaptchaField, useCaptchaCode } from "@/components/Captcha";

interface Props {
  onGoRegister: () => void;
}

function InputField({
  icon, placeholder, value, onChange, type = "text", suffix,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
      <span className="shrink-0 opacity-70">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
      />
      {suffix}
    </div>
  );
}

export default function LoginPage({ onGoRegister }: Props) {
  const { login } = useAuth();
  const { code, refresh } = useCaptchaCode();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!username.trim()) return setError("Please enter your username");
    if (!password.trim()) return setError("Please enter your password");
    if (captcha.trim().toLowerCase() !== code.toLowerCase()) {
      refresh();
      setCaptcha("");
      return setError("Verification code incorrect");
    }
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Login failed");
      refresh();
      setCaptcha("");
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #05102a 0%, #091d50 35%, #0e2f7a 60%, #05102a 100%)" }}
    >
      {/* Stadium atmosphere layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Stadium floodlights top-left */}
        <div style={{ position:"absolute", top:-60, left:-40, width:260, height:260,
          background:"radial-gradient(circle, rgba(255,220,100,0.18) 0%, transparent 70%)" }} />
        {/* Stadium floodlights top-right */}
        <div style={{ position:"absolute", top:-60, right:-40, width:260, height:260,
          background:"radial-gradient(circle, rgba(255,220,100,0.18) 0%, transparent 70%)" }} />
        {/* Blue accent glow center */}
        <div style={{ position:"absolute", top:"15%", left:"50%", transform:"translateX(-50%)", width:320, height:200,
          background:"radial-gradient(ellipse, rgba(37,99,235,0.25) 0%, transparent 70%)" }} />

        {/* Pitch / grass area bottom half */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"48%",
          background:"linear-gradient(180deg, transparent 0%, rgba(0,60,20,0.55) 30%, rgba(0,45,15,0.85) 100%)" }} />

        {/* Pitch line — centre circle */}
        <svg viewBox="0 0 400 200" className="absolute w-full" style={{ bottom:0, opacity:0.22 }} fill="none" stroke="white" strokeWidth="1.2" xmlns="http://www.w3.org/2000/svg">
          {/* Halfway line */}
          <line x1="0" y1="80" x2="400" y2="80"/>
          {/* Centre circle */}
          <ellipse cx="200" cy="80" rx="55" ry="35"/>
          {/* Centre spot */}
          <circle cx="200" cy="80" r="3" fill="white" stroke="none"/>
          {/* Left penalty box */}
          <rect x="0" y="45" width="70" height="70"/>
          {/* Right penalty box */}
          <rect x="330" y="45" width="70" height="70"/>
          {/* Pitch border */}
          <rect x="2" y="10" width="396" height="150"/>
          {/* Stripe effect */}
          {[40,80,120,160,200,240,280,320,360].map((x,i)=>(
            <line key={i} x1={x} y1="10" x2={x} y2="160" strokeWidth="0.4" strokeOpacity="0.5"/>
          ))}
        </svg>

        {/* Football player silhouette */}
        <svg viewBox="0 0 120 220" className="absolute" style={{ bottom:"30%", left:"50%", transform:"translateX(-50%)", height:"42%", opacity:0.13 }} fill="white" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <circle cx="60" cy="22" r="18"/>
          {/* Body */}
          <path d="M38 44 Q60 54 82 44 L90 130 L72 220 L60 210 L48 220 L30 130 Z"/>
          {/* Left arm - raised */}
          <path d="M38 50 L8 20 L14 14 L44 48"/>
          {/* Right arm */}
          <path d="M82 50 L110 90 L104 96 L78 58"/>
          {/* Ball at foot */}
          <circle cx="40" cy="200" r="14" fill="white" opacity="0.8"/>
          <line x1="40" y1="186" x2="40" y2="214" stroke="#0e2f7a" strokeWidth="1.5"/>
          <line x1="26" y1="200" x2="54" y2="200" stroke="#0e2f7a" strokeWidth="1.5"/>
        </svg>

        {/* Gold coin accent circles */}
        {[
          {top:"18%",left:"12%",size:22,op:0.55},
          {top:"32%",right:"10%",size:16,op:0.4},
          {top:"12%",right:"22%",size:12,op:0.35},
          {top:"42%",left:"8%",size:10,op:0.3},
        ].map((c,i)=>(
          <div key={i} style={{
            position:"absolute", top:c.top, left:c.left, right:(c as any).right,
            width:c.size, height:c.size, borderRadius:"50%",
            background:"radial-gradient(circle, #fbbf24, #d97706)",
            opacity:c.op, boxShadow:"0 0 8px rgba(251,191,36,0.6)"
          }}/>
        ))}
      </div>

      <div className="relative flex flex-col flex-1 px-6 pt-16 pb-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 flex items-center justify-center mb-3">
            <img src="/logo.png" alt="XRT.LLC" className="w-24 h-24 object-contain" style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.55))" }} />
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 mb-4">
          <InputField
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" /></svg>}
            placeholder="Please enter the username"
            value={username}
            onChange={setUsername}
          />

          <InputField
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" /></svg>}
            placeholder="Please enter the password"
            value={password}
            onChange={setPassword}
            type={showPw ? "text" : "password"}
            suffix={
              <button onClick={() => setShowPw((v) => !v)} className="text-white/60 hover:text-white shrink-0">
                {showPw
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                }
              </button>
            }
          />

          <CaptchaField value={captcha} onChange={setCaptcha} onRefresh={refresh} code={code} />
        </div>

        {/* Links */}
        <div className="flex justify-between mb-6">
          <button className="text-xs text-white/60 hover:text-white">Forgot login password</button>
          <button className="text-xs text-white/60 hover:text-white">Online service</button>
          <button className="text-xs text-white/60 hover:text-white">App Download</button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30">
            <p className="text-red-300 text-xs text-center">{error}</p>
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base mb-3 disabled:opacity-60 transition-opacity active:opacity-80"
          style={{ background: "linear-gradient(90deg, #1d4ed8, #2563eb)" }}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        {/* Register button */}
        <button
          onClick={onGoRegister}
          className="w-full py-3.5 rounded-2xl font-bold text-base border border-white/20 text-white/80 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          Register
        </button>
      </div>
    </div>
  );
}
