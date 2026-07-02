import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Props {
  onBack: () => void;
}

export default function InvitationCenterPage({ onBack }: Props) {
  const { user } = useAuth();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const referralCode = user?.referralCode ?? "";
  const inviteLink = `${window.location.origin}/#/register?ref=${referralCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteLink)}&bgcolor=ffffff&color=000000&margin=10`;

  const copy = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-3 border-b border-gray-100">
        <button onClick={onBack} className="p-1 text-gray-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-gray-800 pr-6">Invitation Center</h1>
      </div>

      {/* QR illustration area */}
      <div
        className="relative flex flex-col items-center pt-10 pb-14"
        style={{ background: "linear-gradient(160deg, #e8f4ff 0%, #f0f8ff 60%, #fff 100%)" }}
      >
        {/* QR card */}
        <div
          className="relative rounded-2xl p-4 shadow-xl flex flex-col items-center gap-3"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)", width: 240 }}
        >
          <p className="text-white text-xs font-semibold text-center leading-snug">
            Long press the QR code to save to the phone album
          </p>
          <div className="bg-white rounded-xl p-2">
            {referralCode ? (
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-44 h-44 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-gray-300 text-sm">
                Login to view
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-3 px-5 pt-6 pb-8">
        {/* Invitation code */}
        <div
          className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 gap-3"
        >
          <span className="text-sm text-gray-500 shrink-0 w-28">Invitation code</span>
          <span className="text-gray-300 shrink-0">|</span>
          <span className="flex-1 text-sm font-semibold text-gray-800 tracking-wider">
            {referralCode || "—"}
          </span>
          <button
            onClick={() => copy(referralCode, "code")}
            className="shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
            title="Copy"
          >
            {copied === "code" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} className="w-5 h-5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>

        {/* Invite link */}
        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 gap-3">
          <span className="text-sm text-gray-500 shrink-0 w-28">Invite link</span>
          <span className="text-gray-300 shrink-0">|</span>
          <span className="flex-1 text-xs text-blue-500 truncate">
            {referralCode ? inviteLink : "—"}
          </span>
          <button
            onClick={() => copy(inviteLink, "link")}
            className="shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
            title="Copy"
          >
            {copied === "link" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} className="w-5 h-5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
