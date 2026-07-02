import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface Props {
  onBack: () => void;
}

/* ─── Pakistani usernames pool ──────────────────────────────── */
const PAKISTANI_USERNAMES = [
  "zara.malik92","hamza_qureshi","ayesha.noor_","usman.ch07","hira_fatima03",
  "bilal.ahmed_pk","mahnoor.raja","talha_butt19","sana.iqbal__","faizan.sheikh",
  "nimra.khan21","arslan_chaudhry","maryam.raza_","danish.siddiqui","fatima.baig",
  "rehman_butt","zainab.ali05","asad.mehmood","aliza.khan__","omer.farooq",
  "iqra.nasir_","shahzaib.ch","laiba.mirza","junaid.akhtar","huma.malik",
  "muneeb.rashid","anam.sheikh","waqas.javed","rabia.hassan","ahsan.raza",
  "zoya.qureshi_","saad.tariq","amna.siddiqui","bilal.mirza_","sobia.naseer",
  "tahir_hussain","nadia.sultan","kamran.baig","misbah.ali","adnan.ch09",
  "shazia.rehman","umar.sheikh_","farah.iqbal","zubair.malik","komal.khan03",
  "faisal.ahmed","rimsha.raza","asim.chaudhry","sumera.butt","salman.qureshi",
  "mehwish.tariq","junaid.sultan","aqsa.mirza_","farhan.nasir","zara.hussain",
  "murad.javed","bushra.ali_","naveed.ch","laiba.khan07","yasir.mehmood",
  "areeba.iqbal","hassan.raza_","uzma.sheikh","waleed.tariq","madiha.baig",
  "imran.ch19","saima.malik_","ali.qureshi","noor.fatima","shoaib.ahmed",
  "alina.butt_","waqar.hassan","mehak.rehman","zeeshan.ch","faiza.mirza",
  "kamran.akhtar","amna.baig__","saeed.sultan","hira.naseer","mujtaba.ali",
  "sana.tariq_","farida.javed","danish.khan","zara.raza05","talal.butt",
  "iman.sheikh_","usman.mirza","laraib.hassan","asad.tariq_","nimra.butt",
  "shahid.mehmood","aisha.ch","bilal.sultan","rida.qureshi_","umer.nasir",
  "nayab.ali","moiz.raza","kiran.baig_","fawad.malik","tooba.ahmed",
  "siraj.ch07","areej.iqbal","sohail.javed","zainab.butt_","anas.rehman",
  "mahira.khan","farooq.sultan","tayyba.mirza","aaqib.naseer","hania.raza_",
  "zahid.sheikh","amna.tariq","uzair.ch","safiya.ali_","mohsin.qureshi",
  "nida.hassan","ijaz.mehmood","rania.malik","faizan.butt_","saad.mirza",
  "aliza.rehman","waqas.sultan","maha.iqbal_","haroon.ahmed","zara.naseer",
  "bilal.javed","iqra.raza__","arslan.ch21","fatimah.baig","danish.mirza",
  "sara.sheikh_","muneeb.tariq","hira.butt","kamran.malik_","samia.qureshi",
  "adeel.hassan","layla.ali_","sharjeel.raza","nadia.tariq","aamir.mehmood",
  "hina.javed_","talha.sultan","rida.naseer","usman.akhtar","maryam.baig_",
  "zohaib.ch","ayesha.malik","syed.hassan_","zara.butt","nabeel.rehman",
  "farah.raza_","ahad.qureshi","noor.ali__","sarim.tariq","anum.sheikh",
  "irfan.ch15","aliya.mirza_","khalid.javed","laiba.hassan","asim.butt",
  "sana.malik_","zaheer.ahmed","maira.iqbal","fakhar.ch","maryam.tariq_",
  "shoaib.sultan","zoya.raza","asad.ali_","rania.butt","omer.malik",
  "hoor.rehman_","bilal.naseer","warda.qureshi","suleman.ch","hiba.javed_",
  "faisal.raza","zainab.tariq","murad.baig_","asia.sheikh","noman.ali",
  "rimsha.mirza_","taimoor.hassan","naba.malik","umar.javed","amna.raza_",
  "saad.butt","faiza.naseer","shahzad.ch","iqra.tariq_","jawad.rehman",
  "hina.ali","danish.butt_","kiran.raza","moaaz.sheikh","sumbal.iqbal_",
  "zubair.ch","naila.hassan","akhtar.malik","hira.rehman_","farhan.butt",
  "aliza.mirza","talib.javed_","maha.naseer","amir.tariq","uzma.ali__",
  "asad.ch05","shanza.raza","hamid.qureshi","mahnoor.butt_","saad.akhtar",
  "fatima.rehman","faizan.mirza_","anas.hassan","nida.javed","waleed.ch",
  "areeba.malik_","danish.rehman","sara.naseer","mujtaba.tariq_","huma.baig",
  "adnan.javed","laiba.raza__","shahzaib.ali","farah.hassan_","waqas.butt",
  "samira.ch","kaleem.malik","rabia.mirza_","zohaib.rehman","noor.butt",
  "kamran.naseer_","zara.javed","salim.tariq","hira.qureshi_","syed.raza",
];

/* Weighted amounts: lower amounts appear more often for realism */
const WIN_AMOUNTS_POOL = [
  "PKR 10","PKR 10","PKR 10","PKR 10",
  "PKR 50","PKR 50","PKR 50",
  "PKR 100","PKR 100",
  "PKR 500","PKR 500",
  "PKR 1K",
  "PKR 5K",
  "1 LAC PKR",
];

function randomUsername() {
  return PAKISTANI_USERNAMES[Math.floor(Math.random() * PAKISTANI_USERNAMES.length)];
}
function randomAmount() {
  return WIN_AMOUNTS_POOL[Math.floor(Math.random() * WIN_AMOUNTS_POOL.length)];
}
function formatWinAmount(pkr: number) {
  if (pkr >= 100000) return "1 LAC PKR";
  if (pkr >= 5000) return "PKR 5K";
  if (pkr >= 1000) return "PKR 1K";
  return `PKR ${pkr}`;
}

/* ─── Wheel configuration ───────────────────────────────────── */
const SEGMENTS = [
  { label: "PKR 10",      value: 10,     red: true  },
  { label: "PKR 50",      value: 50,     red: true  },
  { label: "TRY\nAGAIN",  value: 0,      red: false },
  { label: "PKR 100",     value: 100,    red: true  },
  { label: "PKR 500",     value: 500,    red: true  },
  { label: "TRY\nAGAIN",  value: 0,      red: false },
  { label: "PKR 1K",      value: 1000,   red: true  },
  { label: "PKR 5K",      value: 5000,   red: true  },
  { label: "TRY\nAGAIN",  value: 0,      red: false },
  { label: "1 LAC\nPKR",  value: 100000, red: true  },
];
const N       = SEGMENTS.length;
const SEG_DEG = 360 / N;

const LAND: Record<string, number[]> = {
  "10":        [0],
  "50":        [1],
  "100":       [3],
  "try-again": [2, 5, 8],
};

/* ─── Geometry helpers ──────────────────────────────────────── */
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function slicePath(cx: number, cy: number, oR: number, start: number, end: number) {
  const s = polar(cx, cy, oR, start);
  const e = polar(cx, cy, oR, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${oR} ${oR} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

/* ─── Wheel SVG ─────────────────────────────────────────────── */
function WheelSVG({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  const SIZE   = 360;
  const cx = 180, cy = 180;
  const radius = SIZE / 2 - 4;
  const innerR = radius - 11;
  const textR  = innerR * 0.62;
  const hubR   = SIZE * 0.105;
  const hubInR = hubR * 0.42;

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE }}>
      {/* Pointer — fixed */}
      <div style={{
        position: "absolute", top: -8, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
        pointerEvents: "none",
      }}>
        <svg viewBox="0 0 46 54" width={46} height={54}>
          <defs>
            <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#fff6cf" />
              <stop offset="55%"  stopColor="#e8b923" />
              <stop offset="100%" stopColor="#a9750f" />
            </linearGradient>
          </defs>
          <path
            d="M23 54 C10 38 4 26 4 16 A19 19 0 0 1 42 16 C42 26 36 38 23 54 Z"
            fill="url(#ptGrad)" stroke="#7a4e08" strokeWidth="1.5"
          />
          <circle cx="23" cy="17" r="7" fill="#d4151c" stroke="#7a4e08" strokeWidth="1" />
        </svg>
      </div>

      {/* Spinning wheel */}
      <div style={{
        width: SIZE, height: SIZE,
        transform: `rotate(${rotation}deg)`,
        transition: spinning ? "transform 5.2s cubic-bezier(0.12, 0.85, 0.16, 1)" : "none",
        willChange: "transform",
      }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <defs>
            <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#fff6cf" />
              <stop offset="50%"  stopColor="#e8b923" />
              <stop offset="100%" stopColor="#a9750f" />
            </linearGradient>
            <radialGradient id="hubGrad" cx="35%" cy="30%" r="65%">
              <stop offset="0%"   stopColor="#fff6cf" />
              <stop offset="45%"  stopColor="#e8b923" />
              <stop offset="100%" stopColor="#a9750f" />
            </radialGradient>
            <radialGradient id="hubRedGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%"   stopColor="#d4151c" />
              <stop offset="100%" stopColor="#a30f14" />
            </radialGradient>
          </defs>

          <circle cx={cx} cy={cy} r={radius} fill="url(#rimGrad)" />
          {Array.from({ length: 180 }).map((_, i) => {
            const deg = i * 2;
            const p1  = polar(cx, cy, innerR + 1, deg);
            const p2  = polar(cx, cy, radius - 1, deg);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />;
          })}
          <circle cx={cx} cy={cy} r={radius - 1} fill="none" stroke="#fff6cf" strokeWidth="1.5" />

          {SEGMENTS.map((_, i) => (
            <path key={i} d={slicePath(cx, cy, innerR, i * SEG_DEG, (i + 1) * SEG_DEG)}
              fill={i % 2 === 0 ? "#d4151c" : "#fffaf0"} />
          ))}

          {SEGMENTS.map((_, i) => {
            const p = polar(cx, cy, innerR, i * SEG_DEG);
            return <line key={i} x1={cx} y1={cy} x2={p.x.toFixed(2)} y2={p.y.toFixed(2)} stroke="#d8a93a" strokeWidth="0.75" />;
          })}

          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#c89a2a" strokeWidth="1" />

          {SEGMENTS.map((seg, i) => {
            const midDeg  = i * SEG_DEG + SEG_DEG / 2;
            const tp      = polar(cx, cy, textR, midDeg);
            const isRed   = i % 2 === 0;
            const isSpec  = seg.label.startsWith("TRY") || seg.label.startsWith("1 LAC");
            const lines   = seg.label.split("\n");
            return (
              <g key={i} transform={`rotate(${midDeg + 90}, ${tp.x.toFixed(2)}, ${tp.y.toFixed(2)})`}>
                {lines.map((line, li) => {
                  const lineH = isSpec ? 10 : 13;
                  const yOff  = (li - (lines.length - 1) / 2) * lineH;
                  return (
                    <text key={li} x={tp.x} y={tp.y + yOff}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={isRed ? "#fff2c9" : "#c8121a"}
                      fontSize={isSpec ? 9.5 : 12} fontWeight="bold"
                      fontFamily="'Trebuchet MS','Segoe UI',sans-serif"
                      style={{ userSelect: "none" }}>
                      {line}
                    </text>
                  );
                })}
              </g>
            );
          })}

          <circle cx={cx} cy={cy} r={hubR + 4} fill="rgba(0,0,0,0.15)" />
          <circle cx={cx} cy={cy} r={hubR} fill="url(#hubGrad)" />
          <circle cx={cx} cy={cy} r={hubInR} fill="url(#hubRedGrad)" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Winner Toast ──────────────────────────────────────────── */
let _feedId = 0;
interface FeedItem { id: number; username: string; amount: string; isReal?: boolean }

function makeItem(isReal = false, username = randomUsername(), amount = randomAmount()): FeedItem {
  return { id: _feedId++, username, amount, isReal };
}

type Phase = "enter" | "show" | "exit";

function WinnerToast({ realWin }: { realWin?: { username: string; amount: string } | null }) {
  const [current, setCurrent] = useState<FeedItem>(() => makeItem());
  const [phase,   setPhase]   = useState<Phase>("exit"); // start hidden
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // store the cycle fn in a ref so it's always current, no stale closure
  const cycleRef  = useRef<(item: FeedItem) => void>(() => {});

  cycleRef.current = (item: FeedItem) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent(item);
    setPhase("enter");                                        // slide in from below
    timerRef.current = setTimeout(() => {
      setPhase("show");                                       // fully visible
      timerRef.current = setTimeout(() => {
        setPhase("exit");                                     // slide out upward
        timerRef.current = setTimeout(() => {
          cycleRef.current(makeItem());                       // next random item
        }, 380);
      }, 2200 + Math.random() * 1000);
    }, 320);
  };

  // kick off on mount
  useEffect(() => {
    timerRef.current = setTimeout(() => cycleRef.current(makeItem()), 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // inject real user win immediately
  useEffect(() => {
    if (!realWin) return;
    cycleRef.current(makeItem(true, realWin.username, realWin.amount));
  }, [realWin]);

  const translateY = phase === "enter" ? "28px" : phase === "exit" ? "-28px" : "0px";
  const opacity    = phase === "show"  ? 1 : 0;

  return (
    /* Fixed iOS-26-style glass rectangle — bubble stays, only text moves */
    <div style={{
      width: "100%", maxWidth: 360,
      marginBottom: 10,
      overflow: "hidden",
      position: "relative",
      background: "transparent",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
      border: "none",
      borderRadius: 16,
      boxShadow: "none",
    }}>

      {/* Inner text area — fixed height, clips animation */}
      <div style={{
        height: 42,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
      }}>
        {/* Animated text row */}
        <div style={{
          position: "absolute", left: 16, right: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 0,
          transform: `translateY(${translateY})`,
          opacity,
          transition: "transform 0.38s cubic-bezier(0.34,1.05,0.64,1), opacity 0.3s ease",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          <span style={{
            fontSize: 13,
            color: "rgba(255,248,230,0.95)",
            letterSpacing: 0.15,
          }}>
            <span style={{ fontWeight: 700, color: current.isReal ? "#ffd700" : "#ffffff" }}>
              {current.username}
            </span>
            <span style={{ color: "rgba(255,248,230,0.65)", fontWeight: 400 }}>{" just won "}</span>
            <span style={{ fontWeight: 800, color: current.isReal ? "#ffd700" : "#e8b923" }}>
              {current.amount}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Wheel audio ───────────────────────────────────────────── */
function createAudioCtx(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch { return null; }
}

/** Single short ratchet "tick" */
function playTick(ctx: AudioContext, t: number, vol = 0.18) {
  // noise burst shaped into a click
  const bufLen = Math.floor(ctx.sampleRate * 0.03);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 6);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;

  // small bandpass around 1.2kHz gives a wood-on-wood feel
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1200;
  bp.Q.value = 1.2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime + t);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.03);

  src.connect(bp);
  bp.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime + t);
}

/** Continuous spinning whirr — filtered noise sweep that rises then falls */
function playWheelSpinSound(spinDuration = 5.2) {
  const ctx = createAudioCtx();
  if (!ctx) return () => {};

  const start = ctx.currentTime;
  const end   = start + spinDuration;
  const peak  = start + spinDuration * 0.38; // wheel at max speed

  // ── White noise source ──────────────────────────────────────
  const bufSec = Math.ceil(spinDuration + 1);
  const buf    = ctx.createBuffer(1, ctx.sampleRate * bufSec, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  // ── Resonant bandpass — pitch follows speed ─────────────────
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 2.5;
  bp.frequency.setValueAtTime(90,   start);          // slow spin-up
  bp.frequency.exponentialRampToValueAtTime(520, peak);  // fast middle
  bp.frequency.exponentialRampToValueAtTime(80,  end);   // slow stop

  // ── Second bandpass layer adds body ────────────────────────
  const bp2 = ctx.createBiquadFilter();
  bp2.type = "bandpass";
  bp2.Q.value = 1.2;
  bp2.frequency.setValueAtTime(160,  start);
  bp2.frequency.exponentialRampToValueAtTime(900, peak);
  bp2.frequency.exponentialRampToValueAtTime(140, end);

  // ── Gain envelope: fade in → sustain → fade out ─────────────
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.28, start + 0.35);
  gain.gain.setValueAtTime(0.28, end - 0.6);
  gain.gain.linearRampToValueAtTime(0, end);

  // ── Mix the two filter layers ───────────────────────────────
  const mix = ctx.createGain();
  mix.gain.value = 0.5;

  noise.connect(bp);
  noise.connect(bp2);
  bp.connect(mix);
  bp2.connect(mix);
  mix.connect(gain);
  gain.connect(ctx.destination);

  noise.start(start);
  noise.stop(end + 0.05);

  const cleanup = setTimeout(() => ctx.close(), (spinDuration + 1) * 1000);
  return () => { clearTimeout(cleanup); try { noise.stop(); } catch {} ctx.close(); };
}

/** Schedule click ticks for one spin, matching CSS easing */
function playWheelSounds(spinDuration = 5.2, segments = 10, extraSpins = 7) {
  const ctx = createAudioCtx();
  if (!ctx) return () => {};

  const totalClicks = extraSpins * segments + segments;
  const times: number[] = [];

  for (let i = 0; i <= totalClicks; i++) {
    const p = i / totalClicks;
    let eased: number;
    if (p < 0.5) {
      eased = 2 * p * p;
    } else {
      eased = 1 - Math.pow(-2 * p + 2, 2) / 2;
    }
    times.push(eased * spinDuration);
  }

  const filtered: number[] = [];
  times.forEach(t => {
    if (!filtered.length || t - filtered[filtered.length - 1] > 0.012) filtered.push(t);
  });

  filtered.forEach((t, i) => {
    const progress = i / filtered.length;
    const vol = progress < 0.15 || progress > 0.85 ? 0.10 : 0.18;
    playTick(ctx, t, vol);
  });

  const cleanup = setTimeout(() => ctx.close(), (spinDuration + 0.5) * 1000);
  return () => { clearTimeout(cleanup); ctx.close(); };
}

/** Short ascending win chime */
function playWinSound() {
  const ctx = createAudioCtx();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.13;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  });
  setTimeout(() => ctx.close(), 1200);
}

/* ─── Spin history item ─────────────────────────────────────── */
interface HistoryItem {
  id: string; result: string; won: number; net: number;
  balanceAfter: string; createdAt: string;
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function LuckyWheelPage({ onBack }: Props) {
  const { user, refreshUser } = useAuth();
  const [rotation,  setRotation]  = useState(0);
  const [spinning,  setSpinning]  = useState(false);
  const [result,    setResult]    = useState<{ result: string; won: number; newBalance: string; spinCost: number } | null>(null);
  const [error,     setError]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [, setHistory]            = useState<HistoryItem[]>([]);
  const [realWin,   setRealWin]   = useState<{ username: string; amount: string } | null>(null);
  const [wheelSize, setWheelSize] = useState(360);

  // Responsive wheel size
  useEffect(() => {
    const update = () => setWheelSize(Math.max(220, Math.min(360, window.innerWidth - 32)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const balance = parseFloat(user?.balancePkr ?? "0");
  const canSpin = balance >= 100 && !spinning;

  const loadHistory = () =>
    fetch("/api/spin/history", { credentials: "include" })
      .then(r => r.json()).then(d => { if (d.ok) setHistory(d.history); }).catch(() => {});

  useEffect(() => { loadHistory(); }, []);

  const handleSpin = async () => {
    if (!canSpin) return;
    setError("");
    setShowModal(false);
    setResult(null);
    setRealWin(null);
    setSpinning(true);

    try {
      const res  = await fetch("/api/spin", { method: "POST", credentials: "include" });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Spin failed");
        setSpinning(false);
        return;
      }

      const candidates = LAND[data.result] ?? [1];
      const landIdx    = candidates[Math.floor(Math.random() * candidates.length)];
      const segCenter       = landIdx * SEG_DEG + SEG_DEG / 2;
      const targetEffective = (360 - segCenter + 360) % 360;
      const currentEffective = ((rotation % 360) + 360) % 360;
      const delta           = (targetEffective - currentEffective + 360) % 360;
      const extraSpins      = 6 + Math.floor(Math.random() * 3);
      const finalRot        = rotation + delta + extraSpins * 360 + (delta < 45 ? 360 : 0);

      setRotation(finalRot);
      playWheelSpinSound(5.2);
      playWheelSounds(5.2, 10, extraSpins);

      setTimeout(async () => {
        await refreshUser();
        setResult(data);
        setShowModal(true);
        setSpinning(false);
        loadHistory();
        // Show real user win in the feed + win chime
        if (data.won > 0 && user?.username) {
          setRealWin({ username: user.username, amount: formatWinAmount(data.won) });
          playWinSound();
        }
      }, 5400);
    } catch {
      setError("Network error. Please try again.");
      setSpinning(false);
    }
  };

  const isWin      = (result?.won ?? 0) > 0;
  const wheelScale = wheelSize / 360;

  return (
    <div style={{
      minHeight: "100svh",
      display: "flex",
      flexDirection: "column",
      background: "radial-gradient(circle at 50% 35%, #ff3b30 0%, #d4151c 45%, #a30f14 100%)",
      color: "#fff8ec",
      fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
      overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "20px 16px 0", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%",
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff6cf" strokeWidth={2} width={20} height={20}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{
          flex: 1, margin: 0, textAlign: "center",
          fontSize: "clamp(16px,4vw,24px)",
          letterSpacing: 3, textTransform: "uppercase",
          color: "#fff4c2",
          textShadow: "0 2px 0 #a9750f, 0 4px 10px rgba(0,0,0,0.4)",
        }}>
          Lucky Spin
        </h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "8px 16px 20px",
      }}>

        {/* Winner Toast — above balance */}
        <WinnerToast realWin={realWin} />

        {/* Balance */}
        <div style={{
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,246,207,0.2)",
          borderRadius: 12, padding: "6px 20px",
          fontSize: 13, marginBottom: 14,
          color: "#fff6cf", fontWeight: 700,
        }}>
          Balance: PKR {balance.toFixed(2)}
        </div>

        {/* Wheel — responsive via scale */}
        <div style={{
          position: "relative",
          width: wheelSize, height: wheelSize,
          filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.45))",
          marginBottom: 16,
          flexShrink: 0,
        }}>
          <div style={{
            width: 360, height: 360,
            transformOrigin: "top left",
            transform: `scale(${wheelScale})`,
          }}>
            <WheelSVG rotation={rotation} spinning={spinning} />
          </div>
        </div>

        {/* Cost label */}
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,248,236,0.7)", letterSpacing: 1 }}>
          Cost: PKR 100 per spin
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,100,100,0.5)",
            borderRadius: 10, padding: "8px 20px",
            color: "#ff9090", fontSize: 13, marginBottom: 12, textAlign: "center",
          }}>
            {error}
          </div>
        )}

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={!canSpin}
          style={{
            padding: "14px 46px",
            fontSize: 18, fontWeight: "bold",
            letterSpacing: 2, textTransform: "uppercase",
            color: canSpin ? "#a30f14" : "rgba(255,248,236,0.6)",
            background: canSpin
              ? "linear-gradient(180deg, #fff4c2 0%, #e8b923 60%, #a9750f 100%)"
              : "rgba(80,20,20,0.5)",
            border: canSpin ? "none" : "1px solid rgba(255,248,236,0.15)",
            borderRadius: 40,
            cursor: canSpin ? "pointer" : "not-allowed",
            boxShadow: canSpin ? "0 6px 0 #a9750f, 0 10px 18px rgba(0,0,0,0.4)" : "none",
            transition: "transform 0.08s ease, box-shadow 0.08s ease",
            fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
          }}
          onMouseDown={e => { if (canSpin) (e.currentTarget.style.transform = "translateY(4px)"); }}
          onMouseUp={e => { (e.currentTarget.style.transform = "none"); }}
        >
          {spinning ? "Spinning…" : !canSpin && balance < 100 ? "Low Balance" : "SPIN"}
        </button>
      </div>

      {/* Result modal */}
      {showModal && result && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.82)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 50, backdropFilter: "blur(3px)",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(145deg,#fff6cf,#e8b923 40%,#a9750f 70%,#e8b923)",
              borderRadius: 28, padding: 3,
              boxShadow: isWin
                ? "0 0 48px rgba(232,185,35,0.55), 0 12px 40px rgba(0,0,0,0.7)"
                : "0 0 28px rgba(163,15,20,0.5), 0 12px 40px rgba(0,0,0,0.7)",
              width: "82%", maxWidth: 310,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              background: "radial-gradient(circle at 50% 15%, #5c0a0a 0%, #2e0505 55%, #1a0303 100%)",
              borderRadius: 26, padding: "32px 24px 28px",
              display: "flex", flexDirection: "column", alignItems: "center",
              fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
              overflow: "hidden", position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -40, left: "50%",
                transform: "translateX(-50%)",
                width: 200, height: 80, borderRadius: "50%",
                background: isWin
                  ? "radial-gradient(ellipse, rgba(232,185,35,0.25) 0%, transparent 70%)"
                  : "radial-gradient(ellipse, rgba(255,80,80,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: isWin
                  ? "linear-gradient(145deg,#fff6cf,#e8b923 50%,#a9750f)"
                  : "linear-gradient(145deg,#5a0000,#a30f14)",
                border: `3px solid ${isWin ? "#fff6cf" : "rgba(255,100,100,0.3)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 34,
                boxShadow: isWin ? "0 4px 18px rgba(232,185,35,0.45)" : "0 4px 18px rgba(0,0,0,0.5)",
                marginBottom: 18,
              }}>
                {isWin ? "🏆" : "🎯"}
              </div>

              <p style={{
                margin: "0 0 6px", fontWeight: 900, fontSize: 24,
                textAlign: "center", textTransform: "uppercase", letterSpacing: 3,
                color: isWin ? "#fff4c2" : "rgba(255,200,200,0.9)",
                textShadow: isWin ? "0 2px 0 #7a4e00, 0 0 20px rgba(232,185,35,0.4)" : "0 2px 0 #6a0000",
              }}>
                {isWin ? "You Won!" : "Try Again"}
              </p>

              <div style={{
                width: 60, height: 2,
                background: "linear-gradient(90deg, transparent, #e8b923, transparent)",
                marginBottom: 18,
              }} />

              {isWin && (
                <div style={{
                  background: "linear-gradient(180deg,#fff6cf 0%,#e8b923 55%,#a9750f 100%)",
                  borderRadius: 50, padding: "10px 36px", marginBottom: 18,
                  boxShadow: "0 4px 0 #6a3a00, 0 6px 20px rgba(232,185,35,0.3)",
                }}>
                  <span style={{ color: "#5a0a00", fontWeight: 900, fontSize: 26, letterSpacing: 1 }}>
                    +PKR {result.won}
                  </span>
                </div>
              )}

              <p style={{ margin: "0 0 4px", color: "rgba(255,246,207,0.45)", fontSize: 11, textAlign: "center", letterSpacing: 0.5 }}>
                {isWin
                  ? `PKR ${result.won} added · Cost: PKR ${result.spinCost}`
                  : `Cost: PKR ${result.spinCost} · Better luck next time!`}
              </p>
              <p style={{ margin: "0 0 24px", color: "rgba(255,246,207,0.3)", fontSize: 10, letterSpacing: 0.5 }}>
                Balance: PKR {parseFloat(result.newBalance).toFixed(2)}
              </p>

              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "linear-gradient(180deg,#fff4c2 0%,#e8b923 55%,#a9750f 100%)",
                  color: "#5a0a00", border: "none", borderRadius: 50,
                  padding: "13px 36px", fontWeight: 900, fontSize: 13,
                  cursor: "pointer", letterSpacing: 2, textTransform: "uppercase",
                  fontFamily: "'Trebuchet MS','Segoe UI',sans-serif",
                  boxShadow: "0 5px 0 #6a3a00, 0 8px 20px rgba(0,0,0,0.4)",
                  width: "100%", transition: "transform 0.08s ease",
                }}
                onMouseDown={e => { e.currentTarget.style.transform = "translateY(3px)"; e.currentTarget.style.boxShadow = "0 2px 0 #6a3a00"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 5px 0 #6a3a00, 0 8px 20px rgba(0,0,0,0.4)"; }}
              >
                {isWin ? "Collect & Spin Again" : "Spin Again"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
