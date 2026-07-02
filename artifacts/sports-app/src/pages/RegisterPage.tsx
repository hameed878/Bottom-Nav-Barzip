import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CaptchaField, useCaptchaCode } from "@/components/Captcha";

interface Props {
  onGoLogin: () => void;
  prefillCode?: string;
}

function InputField({
  icon, placeholder, value, onChange, type = "text", suffix, prefix,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
      <span className="shrink-0 opacity-70">{icon}</span>
      {prefix}
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

const EyeIcon = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className="text-white/60 hover:text-white shrink-0">
    {show
      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
    }
  </button>
);

export default function RegisterPage({ onGoLogin, prefillCode = "" }: Props) {
  const { register } = useAuth();
  const { code, refresh } = useCaptchaCode();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [email, setEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState(prefillCode);
  const [phone, setPhone] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!username.trim()) return setError("Please enter a username");
    if (!password.trim()) return setError("Please enter a password");
    if (password !== confirmPw) return setError("Passwords do not match");
    if (!email.trim()) return setError("Please enter your email");
    if (!phone.trim()) return setError("Please enter your phone number");
    if (captcha.trim().toLowerCase() !== code.toLowerCase()) {
      refresh(); setCaptcha(""); return setError("Verification code incorrect");
    }
    setLoading(true);
    const result = await register({
      username: username.trim(),
      password,
      email: email.trim(),
      phone: phone.trim(),
      invitationCode: invitationCode.trim() || undefined,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Registration failed");
      refresh(); setCaptcha("");
    }
  };

  const lockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" /></svg>;
  const userIcon = <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" /></svg>;
  const mailIcon = <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 6 10-6" strokeLinecap="round" /></svg>;
  const phoneIcon = <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 5.65 5.65l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.07 16l-.15.92z" /></svg>;
  const giftIcon = <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4"><path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" /></svg>;

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #05102a 0%, #091d50 35%, #0e2f7a 60%, #05102a 100%)" }}
    >
      {/* Stadium atmosphere — same as login */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", top:-60, left:-40, width:260, height:260, background:"radial-gradient(circle, rgba(255,220,100,0.18) 0%, transparent 70%)" }} />
        <div style={{ position:"absolute", top:-60, right:-40, width:260, height:260, background:"radial-gradient(circle, rgba(255,220,100,0.18) 0%, transparent 70%)" }} />
        <div style={{ position:"absolute", top:"15%", left:"50%", transform:"translateX(-50%)", width:320, height:200, background:"radial-gradient(ellipse, rgba(37,99,235,0.25) 0%, transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"48%", background:"linear-gradient(180deg, transparent 0%, rgba(0,60,20,0.55) 30%, rgba(0,45,15,0.85) 100%)" }} />
        <svg viewBox="0 0 400 200" className="absolute w-full" style={{ bottom:0, opacity:0.22 }} fill="none" stroke="white" strokeWidth="1.2">
          <line x1="0" y1="80" x2="400" y2="80"/>
          <ellipse cx="200" cy="80" rx="55" ry="35"/>
          <circle cx="200" cy="80" r="3" fill="white" stroke="none"/>
          <rect x="0" y="45" width="70" height="70"/>
          <rect x="330" y="45" width="70" height="70"/>
          <rect x="2" y="10" width="396" height="150"/>
          {[40,80,120,160,200,240,280,320,360].map((x,i)=>(
            <line key={i} x1={x} y1="10" x2={x} y2="160" strokeWidth="0.4" strokeOpacity="0.5"/>
          ))}
        </svg>
        <svg viewBox="0 0 120 220" className="absolute" style={{ bottom:"30%", left:"50%", transform:"translateX(-50%)", height:"42%", opacity:0.13 }} fill="white">
          <circle cx="60" cy="22" r="18"/>
          <path d="M38 44 Q60 54 82 44 L90 130 L72 220 L60 210 L48 220 L30 130 Z"/>
          <path d="M38 50 L8 20 L14 14 L44 48"/>
          <path d="M82 50 L110 90 L104 96 L78 58"/>
          <circle cx="40" cy="200" r="14" fill="white" opacity="0.8"/>
          <line x1="40" y1="186" x2="40" y2="214" stroke="#0e2f7a" strokeWidth="1.5"/>
          <line x1="26" y1="200" x2="54" y2="200" stroke="#0e2f7a" strokeWidth="1.5"/>
        </svg>
        {[
          {top:"18%",left:"12%",size:22,op:0.55},
          {top:"32%",right:"10%",size:16,op:0.4},
          {top:"12%",right:"22%",size:12,op:0.35},
          {top:"42%",left:"8%",size:10,op:0.3},
        ].map((c,i)=>(
          <div key={i} style={{ position:"absolute", top:c.top, left:(c as any).left, right:(c as any).right, width:c.size, height:c.size, borderRadius:"50%", background:"radial-gradient(circle, #fbbf24, #d97706)", opacity:c.op, boxShadow:"0 0 8px rgba(251,191,36,0.6)" }}/>
        ))}
      </div>

      <div className="relative flex flex-col flex-1 px-6 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onGoLogin} className="text-white/60 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-white font-bold text-lg">Register</span>
          <button onClick={onGoLogin} className="text-white/60 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3 mb-4">
          <InputField icon={userIcon} placeholder="Please enter the username" value={username} onChange={setUsername} />
          <InputField icon={lockIcon} placeholder="Please enter the password" value={password} onChange={setPassword}
            type={showPw ? "text" : "password"} suffix={<EyeIcon show={showPw} onToggle={() => setShowPw(v => !v)} />} />
          <InputField icon={lockIcon} placeholder="Please enter the password ag..." value={confirmPw} onChange={setConfirmPw}
            type={showCpw ? "text" : "password"} suffix={<EyeIcon show={showCpw} onToggle={() => setShowCpw(v => !v)} />} />
          <InputField icon={mailIcon} placeholder="Please enter email" value={email} onChange={setEmail} type="email" />
          <InputField icon={giftIcon} placeholder="Please enter the invitation code" value={invitationCode} onChange={setInvitationCode} />

          {/* Phone with country code */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-3">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1 shrink-0">
              <span className="text-white text-xs font-bold">+92</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-3 h-3">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Please enter your mobile phone n..."
              className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
            />
          </div>

          <CaptchaField value={captcha} onChange={setCaptcha} onRefresh={refresh} code={code} />
        </div>

        {/* Links */}
        <div className="flex justify-between mb-4">
          <button className="text-xs text-white/60 hover:text-white">Online service</button>
          <button className="text-xs text-white/60 hover:text-white">App Download</button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30">
            <p className="text-red-300 text-xs text-center">{error}</p>
          </div>
        )}

        {/* Register button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base disabled:opacity-60 transition-opacity active:opacity-80"
          style={{ background: "linear-gradient(90deg, #1d4ed8, #2563eb)" }}
        >
          {loading ? "Creating account…" : "Register"}
        </button>
      </div>
    </div>
  );
}
