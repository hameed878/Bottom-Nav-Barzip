import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Props {
  onBack: () => void;
  onUsdtAddress: () => void;
}

type View = "main" | "change-password" | "forgot-password" | "update-phone" | "update-email";

const iconPath = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-400">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
      <button onClick={onBack} className="p-1 text-gray-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">{title}</h1>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <div className="relative">
        <input
          type={isPass && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
        />
        {isPass && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {show
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
      style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
      {loading ? "Please wait…" : label}
    </button>
  );
}

function Alert({ msg, ok }: { msg: string; ok?: boolean }) {
  return (
    <div className={`text-sm px-4 py-2.5 rounded-xl ${ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
      {msg}
    </div>
  );
}

// ── Change Login Password ─────────────────────────────────────────────────────
function ChangePasswordView({ onBack }: { onBack: () => void }) {
  const [old, setOld] = useState("");
  const [neo, setNeo] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (neo !== confirm) { setMsg({ text: "New passwords do not match", ok: false }); return; }
    if (neo.length < 6) { setMsg({ text: "New password must be at least 6 characters", ok: false }); return; }
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: old, newPassword: neo }),
      });
      const d = await r.json();
      if (d.ok) {
        setMsg({ text: "Password changed! Logging you out…", ok: true });
        setTimeout(() => logout(), 1800);
      } else {
        setMsg({ text: d.error ?? "Failed to change password", ok: false });
      }
    } catch {
      setMsg({ text: "Network error, please try again", ok: false });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <BackHeader title="Change Login Password" onBack={onBack} />
      <form onSubmit={submit} className="flex flex-col gap-4 p-5 mt-2">
        <Field label="Current Password" type="password" value={old} onChange={setOld} placeholder="Enter your current password" />
        <Field label="New Password" type="password" value={neo} onChange={setNeo} placeholder="At least 6 characters" />
        <Field label="Confirm New Password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
        {msg && <Alert msg={msg.text} ok={msg.ok} />}
        <SubmitBtn loading={loading} label="Update Password" />
      </form>
    </div>
  );
}

// ── Forgot Login Password (logged-in: send OTP to account email) ──────────────
function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const { user, logout } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/auth/send-code-me", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "reset-password" }),
      });
      const d = await r.json();
      if (d.ok) {
        setMaskedEmail(d.maskedEmail);
        setDevCode(d.devCode ?? null);
        setStep(2);
        setMsg({ text: "Verification code sent to your email.", ok: true });
      } else {
        setMsg({ text: d.error ?? "Failed to send code", ok: false });
      }
    } catch { setMsg({ text: "Network error", ok: false }); }
    finally { setLoading(false); }
  };

  const verifyAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setMsg({ text: "Enter the 6-digit code", ok: false }); return; }
    setMsg(null); setStep(3);
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirm) { setMsg({ text: "Passwords do not match", ok: false }); return; }
    if (newPwd.length < 6) { setMsg({ text: "Password must be at least 6 characters", ok: false }); return; }
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/auth/reset-password-otp", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), newPassword: newPwd }),
      });
      const d = await r.json();
      if (d.ok) {
        setMsg({ text: "Password changed! Logging you out…", ok: true });
        setTimeout(() => logout(), 1800);
      } else {
        setMsg({ text: d.error ?? "Failed to reset password", ok: false });
        if (d.error?.includes("expired") || d.error?.includes("Incorrect")) setStep(2);
      }
    } catch { setMsg({ text: "Network error", ok: false }); }
    finally { setLoading(false); }
  };

  const stepLabels = ["Send Code", "Verify", "Reset"];

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <BackHeader title="Reset Password" onBack={onBack} />

      {/* Step indicator */}
      <div className="flex items-center px-5 pt-5 pb-2 gap-0">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center" style={{ flex: i < 2 ? "1" : "none" }}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "text-white" : "text-gray-400 bg-gray-200"}`}
                style={step >= s ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } : {}}>
                {step > s ? "✓" : s}
              </div>
              <span className="text-[10px] text-gray-400">{stepLabels[i]}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mb-4 mx-1 ${step > s ? "bg-orange-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — show account email, send button */}
      {step === 1 && (
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm text-gray-500">A verification code will be sent to your registered email address.</p>
          <div className="bg-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Account email</p>
            <p className="text-sm font-semibold text-gray-700">
              {user?.email
                ? (() => {
                    const [local, domain] = (user.email).split("@");
                    const masked = local.length <= 2 ? local[0] + "*" : local[0] + "*".repeat(Math.min(local.length - 2, 4)) + local[local.length - 1];
                    return masked + "@" + domain;
                  })()
                : <span className="text-red-400 text-xs">No email linked to your account</span>
              }
            </p>
          </div>
          {msg && <Alert msg={msg.text} ok={msg.ok} />}
          <button
            onClick={sendCode}
            disabled={loading || !user?.email}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
            {loading ? "Sending…" : "Send Verification Code"}
          </button>
        </div>
      )}

      {/* Step 2 — enter code */}
      {step === 2 && (
        <form onSubmit={verifyAndProceed} className="flex flex-col gap-4 p-5">
          <p className="text-sm text-gray-500">Enter the 6-digit code sent to <b>{maskedEmail}</b></p>
          {devCode && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
              <span className="font-semibold">Dev mode — code:</span> <span className="font-mono tracking-widest text-sm">{devCode}</span>
            </div>
          )}
          <Field label="Verification Code" value={code} onChange={setCode} placeholder="6-digit code" />
          {msg && <Alert msg={msg.text} ok={msg.ok} />}
          <SubmitBtn loading={loading} label="Verify Code" />
          <button type="button" onClick={() => { setCode(""); setMsg(null); setStep(1); }}
            className="text-xs text-orange-500 text-center py-1">← Resend code</button>
        </form>
      )}

      {/* Step 3 — new password */}
      {step === 3 && (
        <form onSubmit={resetPassword} className="flex flex-col gap-4 p-5">
          <p className="text-sm text-gray-500">Choose a new password for your account.</p>
          <Field label="New Password" type="password" value={newPwd} onChange={setNewPwd} placeholder="At least 6 characters" />
          <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
          {msg && <Alert msg={msg.text} ok={msg.ok} />}
          <SubmitBtn loading={loading} label="Reset Password" />
        </form>
      )}
    </div>
  );
}

// ── Update Phone Number ───────────────────────────────────────────────────────
function UpdatePhoneView({ onBack }: { onBack: () => void }) {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setMsg({ text: "Please enter a phone number", ok: false }); return; }
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/auth/update-phone", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        await refreshUser();
        setMsg({ text: "Phone number updated!", ok: true });
        setTimeout(() => onBack(), 1500);
      } else {
        setMsg({ text: d.error ?? "Failed to update phone", ok: false });
      }
    } catch { setMsg({ text: "Network error", ok: false }); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <BackHeader title="Update Mobile Number" onBack={onBack} />
      <form onSubmit={submit} className="flex flex-col gap-4 p-5 mt-2">
        {user?.phone && (
          <div className="text-xs text-gray-400 bg-gray-100 px-4 py-2 rounded-lg">
            Current number: <b className="text-gray-600">{user.phone}</b>
          </div>
        )}
        <Field label="New Phone Number" type="tel" value={phone} onChange={setPhone} placeholder="+92 300 0000000" />
        {msg && <Alert msg={msg.text} ok={msg.ok} />}
        <SubmitBtn loading={loading} label="Update Phone Number" />
      </form>
    </div>
  );
}

// ── Update Email (verify current → enter new) ─────────────────────────────────
function UpdateEmailView({ onBack }: { onBack: () => void }) {
  const { user, refreshUser } = useAuth();
  // step 1: show current email + send code button
  // step 2: verify code
  // step 3: enter new email + save
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/auth/send-code-me", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "verify-current-email" }),
      });
      const d = await r.json();
      if (d.ok) {
        setDevCode(d.devCode ?? null);
        setStep(2);
        setMsg({ text: "Code sent to your current email.", ok: true });
      } else {
        setMsg({ text: d.error ?? "Failed to send code", ok: false });
      }
    } catch { setMsg({ text: "Network error", ok: false }); }
    finally { setLoading(false); }
  };

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setMsg({ text: "Enter the 6-digit code", ok: false }); return; }
    setMsg(null); setStep(3);
  };

  const saveNewEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) { setMsg({ text: "Please enter a new email address", ok: false }); return; }
    setLoading(true); setMsg(null);
    try {
      const r = await fetch("/api/auth/update-email-verified", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), newEmail: newEmail.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        await refreshUser();
        setMsg({ text: "Email updated successfully!", ok: true });
        setTimeout(() => onBack(), 1500);
      } else {
        setMsg({ text: d.error ?? "Failed to update email", ok: false });
        if (d.error?.includes("expired") || d.error?.includes("Incorrect")) setStep(2);
      }
    } catch { setMsg({ text: "Network error", ok: false }); }
    finally { setLoading(false); }
  };

  const stepLabels = ["Verify", "Code", "New Email"];

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <BackHeader title="Update Email" onBack={onBack} />

      {/* Step indicator */}
      <div className="flex items-center px-5 pt-5 pb-2 gap-0">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center" style={{ flex: i < 2 ? "1" : "none" }}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "text-white" : "text-gray-400 bg-gray-200"}`}
                style={step >= s ? { background: "linear-gradient(135deg,#f97316,#ef4444)" } : {}}>
                {step > s ? "✓" : s}
              </div>
              <span className="text-[10px] text-gray-400">{stepLabels[i]}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mb-4 mx-1 ${step > s ? "bg-orange-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — show current email, send code to it */}
      {step === 1 && (
        <div className="flex flex-col gap-4 p-5 mt-2">
          <p className="text-sm text-gray-500">
            We'll send a verification code to your current email to confirm your identity.
          </p>
          <div className="bg-gray-100 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Current email</p>
            <p className="text-sm font-semibold text-gray-700 select-none">
              {user?.email ?? <span className="text-red-400 text-xs">No email linked</span>}
            </p>
          </div>
          {msg && <Alert msg={msg.text} ok={msg.ok} />}
          <button
            onClick={sendCode}
            disabled={loading || !user?.email}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
            {loading ? "Sending…" : "Send Verification Code"}
          </button>
        </div>
      )}

      {/* Step 2 — enter code */}
      {step === 2 && (
        <form onSubmit={verifyCode} className="flex flex-col gap-4 p-5 mt-2">
          <p className="text-sm text-gray-500">Enter the 6-digit code sent to your current email.</p>
          {devCode && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
              <span className="font-semibold">Dev mode — code:</span> <span className="font-mono tracking-widest text-sm">{devCode}</span>
            </div>
          )}
          <Field label="Verification Code" value={code} onChange={setCode} placeholder="6-digit code" />
          {msg && <Alert msg={msg.text} ok={msg.ok} />}
          <SubmitBtn loading={loading} label="Verify Code" />
          <button type="button" onClick={() => { setCode(""); setMsg(null); setStep(1); }}
            className="text-xs text-orange-500 text-center py-1">← Resend code</button>
        </form>
      )}

      {/* Step 3 — enter new email */}
      {step === 3 && (
        <form onSubmit={saveNewEmail} className="flex flex-col gap-4 p-5 mt-2">
          <p className="text-sm text-gray-500">Enter the new email address for your account.</p>
          <Field label="New Email Address" type="email" value={newEmail} onChange={setNewEmail} placeholder="new@email.com" />
          {msg && <Alert msg={msg.text} ok={msg.ok} />}
          <SubmitBtn loading={loading} label="Save New Email" />
        </form>
      )}
    </div>
  );
}

// ── Main Menu ─────────────────────────────────────────────────────────────────
export default function SecurityCenterPage({ onBack, onUsdtAddress }: Props) {
  const [view, setView] = useState<View>("main");

  if (view === "change-password") return <ChangePasswordView onBack={() => setView("main")} />;
  if (view === "forgot-password") return <ForgotPasswordView onBack={() => setView("main")} />;
  if (view === "update-phone")    return <UpdatePhoneView    onBack={() => setView("main")} />;
  if (view === "update-email")    return <UpdateEmailView    onBack={() => setView("main")} />;

  const sections = [
    {
      items: [
        { label: "USDT address", onClick: onUsdtAddress, icon: iconPath("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4v4m0 4v.01") },
        { label: "Wallet list",  onClick: () => {},       icon: iconPath("M4 6h16M4 12h16M4 18h16") },
      ],
    },
    {
      items: [
        { label: "Change login password",  onClick: () => setView("change-password"), icon: iconPath("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z") },
        { label: "Forgot login password",  onClick: () => setView("forgot-password"), icon: iconPath("M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01") },
      ],
    },
    {
      items: [
        { label: "Update mobile phone number", onClick: () => setView("update-phone"), icon: iconPath("M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.63 19 19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 5.65 5.65l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.07 16l-.15.92z") },
        { label: "Update Email",              onClick: () => setView("update-email"),  icon: iconPath("M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2l8 5 8-5") },
      ],
    },
  ];

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <div className="bg-white flex items-center gap-3 px-4 pt-10 pb-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 flex-1 text-center pr-6">Security Center</h1>
      </div>

      <div className="flex flex-col gap-3 pt-3 pb-8 px-3">
        {sections.map((section, si) => (
          <div key={si} className="bg-white rounded-xl overflow-hidden shadow-sm">
            {section.items.map((item) => (
              <button key={item.label} onClick={item.onClick}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0 active:bg-gray-50">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm text-gray-800">{item.label}</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-400">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
