import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  from: "user" | "agent";
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    from: "agent",
    text: "👋 Hello! Welcome to XRT.LLC support. How can I help you today?",
    time: now(),
  },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const AUTO_REPLIES = [
  "Thanks for reaching out! Our team will get back to you shortly.",
  "I understand. Let me look into that for you.",
  "Please allow 1–3 minutes for an agent to connect.",
  "For urgent issues you can also contact us on Telegram.",
];

let replyIdx = 0;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LiveChatPanel({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: Date.now(), from: "user", text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        from: "agent",
        text: AUTO_REPLIES[replyIdx % AUTO_REPLIES.length],
        time: now(),
      };
      replyIdx++;
      setMessages((prev) => [...prev, reply]);
    }, 1000);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl shadow-2xl transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ background: "#f5f6fa", maxHeight: "82vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-t-2xl shrink-0"
          style={{ background: "linear-gradient(90deg, #1a3a6e 0%, #2563eb 100%)" }}
        >
          <div className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l4.94-1.37A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-bold">XRT Live Support</p>
            <p className="text-blue-200 text-xs">Online</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.from === "agent" && (
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l4.94-1.37A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                </div>
              )}
              <div className={`flex flex-col gap-0.5 max-w-[75%] ${msg.from === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                    msg.from === "user"
                      ? "text-white rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                  style={msg.from === "user" ? { background: "#2563eb" } : {}}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ background: "#2563eb" }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 -rotate-45">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
