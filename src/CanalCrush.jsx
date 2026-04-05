import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as Tone from "tone";

// ─── CONFIG ───
const COLS = 7;
const ROWS = 8;
const PIECES = [
  { id: "tulip", name: "Tulip", color: "#e84393" },
  { id: "cheese", name: "Cheese", color: "#fdcb6e" },
  { id: "waffle", name: "Stroopwafel", color: "#8B5A2B" },
  { id: "clog", name: "Clog", color: "#daa520" },
  { id: "windmill", name: "Windmill", color: "#74b9ff" },
  { id: "bike", name: "Bike", color: "#00b894" },
];
const LEVELS = [
  { name: "Delft", target: { tulip: 10, cheese: 8 }, moves: 20, tideInterval: 0, desc: "The pottery capital" },
  { name: "Gouda", target: { cheese: 12, waffle: 10 }, moves: 22, tideInterval: 8, desc: "Famous for its cheese" },
  { name: "Amsterdam", target: { tulip: 10, bike: 12, cheese: 8 }, moves: 25, tideInterval: 7, desc: "City of canals" },
  { name: "Kinderdijk", target: { windmill: 14, tulip: 10 }, moves: 22, tideInterval: 6, desc: "Windmill wonderland" },
  { name: "Haarlem", target: { waffle: 12, clog: 10, bike: 8 }, moves: 28, tideInterval: 6, desc: "Tulip heartland" },
  { name: "Utrecht", target: { tulip: 14, cheese: 12, windmill: 10 }, moves: 30, tideInterval: 5, desc: "The hidden gem" },
  { name: "Leiden", target: { bike: 14, waffle: 12, clog: 10 }, moves: 28, tideInterval: 5, desc: "University city" },
  { name: "Rotterdam", target: { tulip: 16, cheese: 14, bike: 12, windmill: 10 }, moves: 35, tideInterval: 4, desc: "The modern port" },
];

// ─── SVG PIECE ART ───
const PieceSVG = ({ id, size = 32 }) => {
  switch (id) {
    case "tulip":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <line x1="20" y1="38" x2="20" y2="18" stroke="#27ae60" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="14" cy="28" rx="4" ry="6" fill="#27ae60" opacity="0.7" transform="rotate(-30 14 28)" />
          <ellipse cx="26" cy="28" rx="4" ry="6" fill="#27ae60" opacity="0.7" transform="rotate(30 26 28)" />
          <path d="M10 18 Q12 4 20 2 Q28 4 30 18 Q25 22 20 22 Q15 22 10 18Z" fill="#e84393" />
          <path d="M15 16 Q17 6 20 4 Q23 6 25 16 Q22 19 20 19 Q18 19 15 16Z" fill="#fd79a8" />
          <circle cx="20" cy="12" r="1.5" fill="#fff" opacity="0.6" />
        </svg>
      );
    case "cheese":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <g transform="rotate(-12, 20, 24)">
            <path d="M4 28 L20 6 L36 28 Z" fill="#fdcb6e" stroke="#e17055" strokeWidth="1.5" />
            <path d="M4 28 L36 28 L36 34 Q20 38 4 34 Z" fill="#f9ca24" stroke="#e17055" strokeWidth="1.5" />
            <circle cx="15" cy="24" r="2.5" fill="#e17055" opacity="0.5" />
            <circle cx="24" cy="22" r="2" fill="#e17055" opacity="0.5" />
            <circle cx="20" cy="28" r="1.5" fill="#e17055" opacity="0.4" />
            <circle cx="18" cy="16" r="1.8" fill="#e17055" opacity="0.4" />
          </g>
        </svg>
      );
    case "waffle":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#6B3A1F" />
          <circle cx="20" cy="20" r="14" fill="#8B5A2B" />
          <circle cx="20" cy="20" r="12.5" fill="#A0703C" />
          <line x1="9" y1="14" x2="31" y2="14" stroke="#6B3A1F" strokeWidth="1" opacity="0.6" />
          <line x1="8" y1="20" x2="32" y2="20" stroke="#6B3A1F" strokeWidth="1" opacity="0.6" />
          <line x1="9" y1="26" x2="31" y2="26" stroke="#6B3A1F" strokeWidth="1" opacity="0.6" />
          <line x1="14" y1="7" x2="14" y2="33" stroke="#6B3A1F" strokeWidth="1" opacity="0.6" />
          <line x1="20" y1="6" x2="20" y2="34" stroke="#6B3A1F" strokeWidth="1" opacity="0.6" />
          <line x1="26" y1="7" x2="26" y2="33" stroke="#6B3A1F" strokeWidth="1" opacity="0.6" />
          <path d="M10 19 Q20 12 30 19" fill="none" stroke="#C4956A" strokeWidth="2.5" opacity="0.7" />
          <path d="M12 22 Q20 28 28 22" fill="none" stroke="#C4956A" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );
    case "clog":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <g transform="rotate(8, 20, 26)">
            <path d="M8 33 L30 33 Q34 33 35 32 L36 30 Q37 28 36 27 L8 29 Q6 30 7 32 Z" fill="#b8860b" />
            <path d="M8 29 Q4 28 3 24 Q2 18 4 14 Q6 10 12 9 Q18 7 24 8 Q30 9 34 12 Q37 15 37 20 Q37 25 36 27 L8 29Z" fill="#daa520" />
            <path d="M10 28 Q6 26 5 22 Q4 17 6 13 Q8 10 14 10 Q20 9 26 10 Q31 11 34 14 Q36 17 35 22 Q35 26 34 27 L10 28Z" fill="#f0c050" />
            <ellipse cx="28" cy="16" rx="7" ry="5" fill="#8B6914" />
            <ellipse cx="28" cy="15.5" rx="5.5" ry="3.5" fill="#6B4F12" />
            <path d="M3 24 Q2 18 4 14 Q5 11 8 10" fill="none" stroke="#c8960c" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 18 Q16 16 26 17" fill="none" stroke="#c8960c" strokeWidth="0.8" opacity="0.5" />
            <path d="M7 22 Q15 20 28 21" fill="none" stroke="#c8960c" strokeWidth="0.8" opacity="0.5" />
            <path d="M9 26 Q18 24 32 25" fill="none" stroke="#c8960c" strokeWidth="0.8" opacity="0.4" />
            <circle cx="12" cy="18" r="2.5" fill="none" stroke="#e8d070" strokeWidth="0.8" opacity="0.7" />
            <circle cx="12" cy="18" r="0.8" fill="#e8d070" opacity="0.6" />
            <path d="M6 15 Q7 12 10 11" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.3" />
          </g>
        </svg>
      );
    case "windmill":
      // Proper Dutch windmill: brick tower + cap + 4 diagonal sails in X pattern
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          {/* ── Back sails (drawn first, behind the tower) ── */}
          {/* SW blade – down-left */}
          <polygon points="19,15 21,13 8,27 6,25" fill="#90a4ae" opacity="0.8" />
          <line x1="8.5" y1="24.5" x2="13" y2="19" stroke="#78909c" strokeWidth="0.8" />
          <line x1="11" y1="22" x2="15" y2="17" stroke="#78909c" strokeWidth="0.7" />
          {/* SE blade – down-right */}
          <polygon points="21,15 19,13 32,27 34,25" fill="#b0bec5" opacity="0.8" />
          <line x1="31.5" y1="24.5" x2="27" y2="19" stroke="#90a4ae" strokeWidth="0.8" />
          <line x1="29" y1="22" x2="25" y2="17" stroke="#90a4ae" strokeWidth="0.7" />

          {/* ── Brick tower body ── */}
          <polygon points="13,39 27,39 25,20 15,20" fill="#7d5a47" />
          {/* Highlight face */}
          <polygon points="14,39 26,39 24.5,20.5 15.5,20.5" fill="#9a7060" />
          {/* Mortar / brick lines */}
          <line x1="14.5" y1="26" x2="25.5" y2="26" stroke="#6d4c41" strokeWidth="0.8" opacity="0.55" />
          <line x1="14.5" y1="32" x2="25.5" y2="32" stroke="#6d4c41" strokeWidth="0.8" opacity="0.55" />
          {/* Arched door */}
          <path d="M17.5 39 L17.5 33.5 A2.5 2.5 0 0 1 22.5 33.5 L22.5 39 Z" fill="#3e2723" />
          {/* Window */}
          <rect x="17.5" y="22" width="5" height="3.5" rx="0.8" fill="#81d4fa" opacity="0.6" />
          <line x1="20" y1="22" x2="20" y2="25.5" stroke="#4fc3f7" strokeWidth="0.5" opacity="0.5" />

          {/* ── Cap / bonnet ── */}
          <path d="M14.5 20.5 Q17 13.5 20 13 Q23 13.5 25.5 20.5 Z" fill="#4a3728" />
          <ellipse cx="20" cy="20.5" rx="6.5" ry="2" fill="#5d4037" />

          {/* ── Front sails (drawn over cap, in front) ── */}
          {/* NW blade – up-left */}
          <polygon points="21,13 19,15 6,1 8,3" fill="#eceff1" stroke="#b0bec5" strokeWidth="0.5" />
          <line x1="7.5" y1="3.5" x2="12.5" y2="9" stroke="#cfd8dc" strokeWidth="0.8" />
          <line x1="10" y1="6.5" x2="14.5" y2="11" stroke="#cfd8dc" strokeWidth="0.7" />
          {/* NE blade – up-right */}
          <polygon points="19,13 21,15 34,1 32,3" fill="#dde4e8" stroke="#b0bec5" strokeWidth="0.5" />
          <line x1="32.5" y1="3.5" x2="27.5" y2="9" stroke="#b0bec5" strokeWidth="0.8" />
          <line x1="30" y1="6.5" x2="25.5" y2="11" stroke="#b0bec5" strokeWidth="0.7" />

          {/* ── Hub ── */}
          <circle cx="20" cy="14" r="2.8" fill="#546e7a" stroke="#37474f" strokeWidth="0.8" />
          <circle cx="20" cy="14" r="1.1" fill="#1e272e" />
        </svg>
      );
    case "bike":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <circle cx="11" cy="28" r="8" fill="none" stroke="#00b894" strokeWidth="2.5" />
          <circle cx="29" cy="28" r="8" fill="none" stroke="#00b894" strokeWidth="2.5" />
          <circle cx="11" cy="28" r="1.5" fill="#00b894" />
          <circle cx="29" cy="28" r="1.5" fill="#00b894" />
          <line x1="11" y1="28" x2="20" y2="16" stroke="#00b894" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="16" x2="29" y2="28" stroke="#00b894" strokeWidth="2" strokeLinecap="round" />
          <line x1="11" y1="28" x2="22" y2="28" stroke="#00b894" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="16" x2="16" y2="14" stroke="#00b894" strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="14" x2="22" y2="14" stroke="#636e72" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="20" cy="12" r="1.5" fill="#636e72" />
        </svg>
      );
    default:
      return null;
  }
};

// ─── PARTICLES ───
function Particles({ particles }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20 }}>
      {particles.map((p) => (
        <div key={p.id} style={{
          position: "absolute", left: p.x, top: p.y, width: p.size, height: p.size,
          borderRadius: p.shape === "circle" ? "50%" : "2px", background: p.color,
          animation: `particleFly ${p.duration}ms ease-out forwards`,
          animationDelay: `${p.delay}ms`,
        }} />
      ))}
    </div>
  );
}
let pIdC = 0;
function spawnParticles(x, y, color, count = 8) {
  const ps = [];
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const d = 30 + Math.random() * 40;
    ps.push({ id: pIdC++, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
      size: 4 + Math.random() * 6, color, shape: Math.random() > 0.5 ? "circle" : "square",
      duration: 400 + Math.random() * 300, delay: i * 20 });
  }
  return ps;
}

// ─── AUDIO ───
class AudioEngine {
  constructor() { this.ready = false; this.muted = false; this.bgPlaying = false; }
  async init() {
    if (this.ready) return;
    await Tone.start();
    this.matchSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 }, volume: -12,
    }).toDestination();
    this.swooshSynth = new Tone.NoiseSynth({
      noise: { type: "pink" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 }, volume: -24,
    }).toDestination();
    this.fanfareSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square" }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.5 }, volume: -14,
    }).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" }, envelope: { attack: 0.05, decay: 0.3, sustain: 0.3, release: 0.4 }, volume: -20,
    }).toDestination();
    this.bassSynth = new Tone.Synth({
      oscillator: { type: "sine" }, envelope: { attack: 0.05, decay: 0.4, sustain: 0.4, release: 0.5 }, volume: -22,
    }).toDestination();
    const melody = [["G4","8n"],["A4","8n"],["B4","8n"],["D5","8n"],["B4","8n"],["A4","8n"],["G4","4n"],
      ["E4","8n"],["G4","8n"],["A4","8n"],["B4","8n"],["A4","8n"],["G4","8n"],["E4","4n"],
      ["D4","8n"],["E4","8n"],["G4","8n"],["A4","8n"],["B4","8n"],["A4","8n"],["G4","4n"],
      ["A4","8n"],["B4","8n"],["D5","8n"],["B4","8n"],["A4","8n"],["G4","8n"],["G4","4n"]];
    const bassNotes = [["G2","2n"],["G2","2n"],["C3","2n"],["C3","2n"],["D3","2n"],["D3","2n"],["G2","2n"],["G2","2n"]];
    let mt = 0;
    const mp = new Tone.Part((t, v) => { if (!this.muted) this.synth?.triggerAttackRelease(v.note, v.dur, t); },
      melody.map(([note, dur]) => { const x = mt; mt += Tone.Time(dur).toSeconds(); return { time: x, note, dur }; }));
    mp.loop = true; mp.loopEnd = mt;
    let bt = 0;
    const bp = new Tone.Part((t, v) => { if (!this.muted) this.bassSynth?.triggerAttackRelease(v.note, v.dur, t); },
      bassNotes.map(([note, dur]) => { const x = bt; bt += Tone.Time(dur).toSeconds(); return { time: x, note, dur }; }));
    bp.loop = true; bp.loopEnd = bt;
    this.bgParts = [mp, bp]; this.ready = true;
  }
  startBg() { if (!this.ready || this.bgPlaying || this.muted) return; Tone.getTransport().bpm.value = 130; this.bgParts.forEach(p => p.start(0)); Tone.getTransport().start(); this.bgPlaying = true; }
  stopBg() { if (!this.bgPlaying) return; Tone.getTransport().stop(); this.bgParts?.forEach(p => p.stop()); this.bgPlaying = false; }
  playMatch(c = 0) { if (!this.ready || this.muted) return; const n = ["E5","G5","B5","D6","E6"]; this.matchSynth?.triggerAttackRelease(n[Math.min(c, 4)], "16n"); }
  playSwap() { if (!this.ready || this.muted) return; this.swooshSynth?.triggerAttackRelease("16n"); }
  playPowerUp() { if (!this.ready || this.muted) return; const n = Tone.now(); this.fanfareSynth?.triggerAttackRelease("E5","16n",n); this.fanfareSynth?.triggerAttackRelease("G5","16n",n+0.08); this.fanfareSynth?.triggerAttackRelease("B5","16n",n+0.16); }
  playFanfare() { if (!this.ready || this.muted) return; const n = Tone.now(); this.fanfareSynth?.triggerAttackRelease("C5","8n",n); this.fanfareSynth?.triggerAttackRelease("E5","8n",n+0.15); this.fanfareSynth?.triggerAttackRelease("G5","8n",n+0.3); this.fanfareSynth?.triggerAttackRelease(["C5","E5","G5","C6"],"4n",n+0.5); }
  playFail() { if (!this.ready || this.muted) return; const n = Tone.now(); this.matchSynth?.triggerAttackRelease("C3","8n",n); this.matchSynth?.triggerAttackRelease("B2","8n",n+0.2); }
  toggleMute() { this.muted = !this.muted; if (this.muted) this.stopBg(); else this.startBg(); return this.muted; }
}

// ─── GAME LOGIC ───
function randomPiece() { return PIECES[Math.floor(Math.random() * PIECES.length)].id; }
function createBoard() {
  let b; do { b = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => randomPiece())); } while (findAllMatches(b).length > 0);
  return b;
}
function findAllMatches(board) {
  const m = new Set();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const v = board[r][c]; if (!v) continue;
    if (c + 2 < COLS && board[r][c+1] === v && board[r][c+2] === v) { let e = c+2; while (e+1 < COLS && board[r][e+1] === v) e++; for (let i = c; i <= e; i++) m.add(`${r},${i}`); }
    if (r + 2 < ROWS && board[r+1]?.[c] === v && board[r+2]?.[c] === v) { let e = r+2; while (e+1 < ROWS && board[e+1]?.[c] === v) e++; for (let i = r; i <= e; i++) m.add(`${i},${c}`); }
  }
  return [...m].map(s => s.split(",").map(Number));
}

function findPowerUpMatches(board) {
  const powerUps = [];
  for (let r = 0; r < ROWS; r++) {
    let c = 0;
    while (c < COLS) {
      const v = board[r][c]; if (!v) { c++; continue; }
      let e = c;
      while (e + 1 < COLS && board[r][e + 1] === v) e++;
      const len = e - c + 1;
      const mid = Math.floor((c + e) / 2);
      if (len >= 5) powerUps.push({ type: "bomb", r, c: mid });
      else if (len === 4) powerUps.push({ type: "row", r, c: mid });
      c = e + 1;
    }
  }
  for (let c = 0; c < COLS; c++) {
    let r = 0;
    while (r < ROWS) {
      const v = board[r]?.[c]; if (!v) { r++; continue; }
      let e = r;
      while (e + 1 < ROWS && board[e + 1]?.[c] === v) e++;
      const len = e - r + 1;
      const mid = Math.floor((r + e) / 2);
      if (len >= 5) powerUps.push({ type: "bomb", r: mid, c });
      else if (len === 4) powerUps.push({ type: "col", r: mid, c });
      r = e + 1;
    }
  }
  return powerUps;
}

function applyGravity(board) {
  const n = board.map(r => [...r]);
  for (let c = 0; c < COLS; c++) {
    let w = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) { if (n[r][c]) { n[w][c] = n[r][c]; if (w !== r) n[r][c] = null; w--; } }
    for (let r = w; r >= 0; r--) n[r][c] = randomPiece();
  }
  return n;
}
function cloneBoard(b) { return b.map(r => [...r]); }
function getPiece(id) { return PIECES.find(p => p.id === id) || PIECES[0]; }

// ─── BACKGROUND ───
function CanalBackground() {
  // Deterministic house data — no Math.random() so it's stable across renders
  const houses = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    x: i * 50 - 15,
    w: 34 + (i * 7 + 3) % 14,
    h: 62 + (i * 13 + 5) % 52,
    color: ["#6B1A0A", "#3B2008", "#2C3E1A", "#1A2C3E", "#4A2010", "#2A3A4A", "#5A1A10"][i % 7],
    gable: i % 3,  // 0=step gable, 1=pointed, 2=neck gable
  })), []);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>

      {/* Dutch dramatic sky: deep blue at top → golden horizon glow → canal */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #0a1628 0%, #12253f 28%, #1a3a62 52%, #24578a 65%, #c47b2a 78%, #e8941a 84%, #bf6a10 88%, #1a3a5c 93%, #0a2030 100%)",
      }} />

      {/* Stars — deterministic positions so they don't shuffle on re-render */}
      {Array.from({ length: 28 }, (_, i) => (
        <div key={`s${i}`} style={{
          position: "absolute",
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 19 + 7) % 48}%`,
          width: i % 5 === 0 ? 3 : 2,
          height: i % 5 === 0 ? 3 : 2,
          borderRadius: "50%",
          background: "#fff",
          opacity: 0.25 + (i % 5) * 0.1,
          animation: `twinkle ${2 + (i % 4) * 0.7}s ease-in-out infinite`,
          animationDelay: `${(i % 6) * 0.5}s`,
        }} />
      ))}

      {/* Moon — large, warm, very Dutch */}
      <div style={{
        position: "absolute", right: "9%", top: "5%",
        width: 50, height: 50, borderRadius: "50%",
        background: "radial-gradient(circle at 38% 35%, #fff9e6, #ffeaa7 55%, #f9ca24 85%, #e8b020)",
        boxShadow: "0 0 60px rgba(255,220,80,0.3), 0 0 120px rgba(255,180,30,0.12)",
      }} />

      {/* Dramatic Dutch clouds — big billowing shapes */}
      {[
        { top: "9%",  left: "-8%",  w: 200, h: 60, delay: 0,  dur: 50 },
        { top: "19%", left: "25%",  w: 260, h: 45, delay: 14, dur: 68 },
        { top: "6%",  left: "55%",  w: 150, h: 52, delay: 6,  dur: 55 },
        { top: "24%", left: "-35%", w: 210, h: 38, delay: 22, dur: 75 },
        { top: "14%", left: "70%",  w: 180, h: 42, delay: 35, dur: 62 },
      ].map((cl, i) => (
        <div key={`c${i}`} style={{
          position: "absolute",
          top: cl.top, left: cl.left,
          width: cl.w, height: cl.h,
          borderRadius: "55% 65% 45% 55% / 60% 50% 65% 45%",
          background: i % 2 === 0
            ? "rgba(255,255,255,0.065)"
            : "rgba(210,230,255,0.045)",
          animation: `cloudDrift ${cl.dur}s linear infinite`,
          animationDelay: `${cl.delay}s`,
        }} />
      ))}

      {/* Horizon glow line — the famous Dutch golden light on the horizon */}
      <div style={{
        position: "absolute",
        bottom: "18%", left: 0, right: 0,
        height: 3,
        background: "linear-gradient(90deg, transparent, rgba(232,148,26,0.4) 20%, rgba(255,180,50,0.6) 50%, rgba(232,148,26,0.4) 80%, transparent)",
        filter: "blur(2px)",
      }} />

      {/* Dutch canal houses with step gables */}
      <svg
        style={{ position: "absolute", bottom: "18%", left: 0, width: "100%", height: "30%" }}
        viewBox="0 0 750 150"
        preserveAspectRatio="none"
      >
        {houses.map((h, i) => {
          const baseY = 150;
          const topY = baseY - h.h;
          const bodyTop = topY + (h.gable === 0 ? 24 : 18);
          const mid = h.x + h.w / 2;
          const s = h.w * 0.22; // step width

          // Step gable: Dutch "trapgevel" — stair-stepped sides
          const gablePoints = h.gable === 0
            ? [
                [h.x,         bodyTop],
                [h.x,         topY + 16],
                [h.x + s,     topY + 16],
                [h.x + s,     topY + 9],
                [h.x + s*2,   topY + 9],
                [h.x + s*2,   topY + 2],
                [mid,          topY - 4],    // peak
                [h.x+h.w-s*2, topY + 2],
                [h.x+h.w-s*2, topY + 9],
                [h.x+h.w-s,   topY + 9],
                [h.x+h.w-s,   topY + 16],
                [h.x+h.w,     topY + 16],
                [h.x+h.w,     bodyTop],
              ].map(p => p.join(",")).join(" ")
            : h.gable === 1
            // Pointed / spout gable
            ? `${h.x},${bodyTop} ${h.x},${topY+8} ${mid},${topY} ${h.x+h.w},${topY+8} ${h.x+h.w},${bodyTop}`
            // Neck gable
            : `${h.x},${bodyTop} ${h.x},${topY+10} ${h.x+s},${topY+5} ${mid-3},${topY} ${mid+3},${topY} ${h.x+h.w-s},${topY+5} ${h.x+h.w},${topY+10} ${h.x+h.w},${bodyTop}`;

          return (
            <g key={i}>
              {/* House body */}
              <rect x={h.x} y={bodyTop} width={h.w} height={baseY - bodyTop} fill={h.color} opacity="0.35" />
              {/* Gable */}
              <polygon points={gablePoints} fill={h.color} opacity="0.4" />
              {/* Glowing windows */}
              {[0.28, 0.58].map((wy, wi) => (
                <g key={wi}>
                  <rect
                    x={h.x + h.w * 0.1} y={bodyTop + (baseY - bodyTop) * wy}
                    width={h.w * 0.32} height={(baseY - bodyTop) * 0.13}
                    fill="#ffeaa7" opacity="0.38" rx="1"
                  />
                  <rect
                    x={h.x + h.w * 0.58} y={bodyTop + (baseY - bodyTop) * wy}
                    width={h.w * 0.32} height={(baseY - bodyTop) * 0.13}
                    fill="#ffe57f" opacity="0.3" rx="1"
                  />
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Tulip field strip — colourful horizontal bands between houses and water */}
      <div style={{
        position: "absolute", bottom: "18%", left: 0, right: 0, height: "3.5%",
        display: "flex", overflow: "hidden",
      }}>
        {["#e84393","#fdcb6e","#e17055","#a29bfe","#fd79a8","#00cec9","#f9ca24","#e84393"].map((c, i) => (
          <div key={i} style={{ flex: 1, background: c, opacity: 0.22 }} />
        ))}
      </div>

      {/* Canal water with reflections */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "20%",
        background: "linear-gradient(180deg, #1a4a70 0%, #0f2d45 55%, #081d2e 100%)",
        overflow: "hidden",
      }}>
        {/* Golden horizon reflection on water */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, transparent, rgba(232,148,26,0.35) 30%, rgba(255,180,50,0.5) 50%, rgba(232,148,26,0.35) 70%, transparent)",
          filter: "blur(1px)",
        }} />
        {/* Water shimmer lines */}
        {Array.from({ length: 8 }, (_, i) => (
          <div key={`sh${i}`} style={{
            position: "absolute",
            left: `${i * 13 + 2}%`,
            top: `${18 + (i % 3) * 26}%`,
            width: "20%", height: 1,
            background: "rgba(116,185,255,0.22)",
            animation: `shimmer ${2.4 + i * 0.45}s ease-in-out infinite`,
            animationDelay: `${i * 0.32}s`,
          }} />
        ))}
        {/* Boat silhouette */}
        <div style={{
          position: "absolute", bottom: "28%", left: "18%",
          width: 70, height: 10,
          background: "rgba(8,20,38,0.85)",
          clipPath: "polygon(4% 100%, 0% 0%, 100% 0%, 96% 100%)",
          borderRadius: "0 0 3px 3px",
        }} />
        {/* Boat mast */}
        <div style={{
          position: "absolute", bottom: "28%", left: "calc(18% + 32px)",
          width: 2, height: 20,
          background: "rgba(8,20,38,0.7)",
          transform: "translateY(-100%)",
        }} />
      </div>
    </div>
  );
}

// ─── MAIN ───
export default function CanalCrush() {
  const [screen, setScreen] = useState("menu");
  const [levelIdx, setLevelIdx] = useState(0);
  const [board, setBoard] = useState(null);
  const [selected, setSelected] = useState(null);
  const [movesLeft, setMovesLeft] = useState(0);
  const [collected, setCollected] = useState({});
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(() => parseInt(localStorage.getItem("canalCrushTotalScore") || "0", 10));
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("canalCrushHighScore") || "0", 10));
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState(new Set());
  const [tideRow, setTideRow] = useState(ROWS);
  const [movesSinceTide, setMovesSinceTide] = useState(0);
  const [completedLevels, setCompletedLevels] = useState(() => {
    try { const s = localStorage.getItem("canalCrushCompleted"); return s ? new Set(JSON.parse(s)) : new Set(); }
    catch { return new Set(); }
  });
  const [shakeCell, setShakeCell] = useState(null);
  const [particles, setParticles] = useState([]);
  const [muted, setMuted] = useState(false);
  const [comboText, setComboText] = useState(null);
  const [powerUpCells, setPowerUpCells] = useState(new Set());
  const [swapAnim, setSwapAnim] = useState(null); // { "r,c": animName }
  const audioRef = useRef(null);
  const boardElRef = useRef(null);
  const touchStartRef = useRef(null);
  const endTriggeredRef = useRef(false);

  const collectedRef = useRef({});
  const movesLeftRef = useRef(0);
  const scoreRef = useRef(0);
  useEffect(() => { collectedRef.current = collected; }, [collected]);
  useEffect(() => { movesLeftRef.current = movesLeft; }, [movesLeft]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Persist scores to localStorage
  useEffect(() => {
    if (totalScore > 0) {
      localStorage.setItem("canalCrushTotalScore", String(totalScore));
      if (totalScore > highScore) {
        setHighScore(totalScore);
        localStorage.setItem("canalCrushHighScore", String(totalScore));
      }
    }
  }, [totalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist completed levels
  useEffect(() => {
    if (completedLevels.size > 0) {
      localStorage.setItem("canalCrushCompleted", JSON.stringify([...completedLevels]));
    }
  }, [completedLevels]);

  const level = LEVELS[levelIdx];

  useEffect(() => { audioRef.current = new AudioEngine(); return () => audioRef.current?.stopBg(); }, []);
  const ensureAudio = async () => { if (!audioRef.current?.ready) await audioRef.current?.init(); };

  const checkWinLose = useCallback(() => {
    if (endTriggeredRef.current) return;
    const col = collectedRef.current;
    const ml = movesLeftRef.current;
    const sc = scoreRef.current;
    const lv = LEVELS[levelIdx];
    const allMet = Object.entries(lv.target).every(([k, v]) => (col[k] || 0) >= v);
    if (allMet) {
      endTriggeredRef.current = true;
      audioRef.current?.stopBg();
      audioRef.current?.playFanfare();
      setCompletedLevels(prev => new Set([...prev, levelIdx]));
      setTotalScore(s => s + sc + ml * 5);
      setScreen("win");
    } else if (ml <= 0) {
      endTriggeredRef.current = true;
      audioRef.current?.stopBg();
      audioRef.current?.playFail();
      setScreen("lose");
    }
  }, [levelIdx]);

  const startLevel = useCallback(async (idx) => {
    await ensureAudio();
    endTriggeredRef.current = false;
    setLevelIdx(idx);
    setBoard(createBoard());
    setSelected(null);
    setMovesLeft(LEVELS[idx].moves);
    setCollected({});
    setScore(0);
    setTideRow(ROWS);
    setMovesSinceTide(0);
    setAnimating(false);
    setMatchedCells(new Set());
    setParticles([]);
    setComboText(null);
    setPowerUpCells(new Set());
    setSwapAnim(null);
    setScreen("game");
    audioRef.current?.startBg();
  }, []);

  const getCellCenter = (r, c) => {
    const el = boardElRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: (rect.width / COLS) * c + (rect.width / COLS) / 2, y: (rect.height / ROWS) * r + (rect.height / ROWS) / 2 };
  };

  const processMatches = useCallback(
    (b, cascadeLevel = 0) => {
      const matches = findAllMatches(b);
      if (matches.length === 0) {
        setBoard(b);
        setAnimating(false);
        setTimeout(() => checkWinLose(), 120);
        return;
      }
      setAnimating(true);
      setMatchedCells(new Set(matches.map(([r, c]) => `${r},${c}`)));
      audioRef.current?.playMatch(cascadeLevel);

      const pups = findPowerUpMatches(b);
      let extraClears = new Set();
      if (pups.length > 0) {
        audioRef.current?.playPowerUp();
        const puCells = new Set();
        pups.forEach(pu => {
          if (pu.type === "bomb") {
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
              const nr = pu.r + dr, nc = pu.c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) { extraClears.add(`${nr},${nc}`); puCells.add(`${nr},${nc}`); }
            }
          } else if (pu.type === "row") {
            for (let cc = 0; cc < COLS; cc++) { extraClears.add(`${pu.r},${cc}`); puCells.add(`${pu.r},${cc}`); }
          } else if (pu.type === "col") {
            for (let rr = 0; rr < ROWS; rr++) { extraClears.add(`${rr},${pu.c}`); puCells.add(`${rr},${pu.c}`); }
          }
        });
        setPowerUpCells(puCells);
        setTimeout(() => setPowerUpCells(new Set()), 500);
      }

      if (cascadeLevel > 0) {
        const combos = ["Nice!", "Great!", "Amazing!", "Incredible!", "PRACHTIG!"];
        setComboText(combos[Math.min(cascadeLevel - 1, combos.length - 1)]);
        setTimeout(() => setComboText(null), 800);
      }

      const allClears = new Set([...matches.map(([r,c]) => `${r},${c}`), ...extraClears]);

      const counts = {};
      allClears.forEach(key => {
        const [r, c] = key.split(",").map(Number);
        const id = b[r]?.[c];
        if (id) counts[id] = (counts[id] || 0) + 1;
      });
      const matchScore = allClears.size * 10 + (allClears.size > 3 ? (allClears.size - 3) * 15 : 0) + cascadeLevel * 25 + pups.length * 50;

      const newP = [];
      allClears.forEach(key => {
        const [r, c] = key.split(",").map(Number);
        const pos = getCellCenter(r, c);
        if (b[r]?.[c]) newP.push(...spawnParticles(pos.x, pos.y, getPiece(b[r][c]).color, pups.length > 0 ? 10 : 6));
      });
      setParticles(prev => [...prev, ...newP]);
      setTimeout(() => setParticles(prev => prev.filter(p => !newP.includes(p))), 900);

      setTimeout(() => {
        const cleared = cloneBoard(b);
        allClears.forEach(key => { const [r, c] = key.split(",").map(Number); cleared[r][c] = null; });
        const fallen = applyGravity(cleared);
        setBoard(fallen);
        setMatchedCells(new Set());
        setScore(s => s + matchScore);
        setCollected(prev => {
          const next = { ...prev };
          Object.entries(counts).forEach(([k, v]) => { next[k] = (next[k] || 0) + v; });
          return next;
        });
        setTimeout(() => processMatches(fallen, cascadeLevel + 1), 200);
      }, 350);
    },
    [checkWinLose]
  );

  const swap = useCallback(
    (r1, c1, r2, c2) => {
      if (animating) return;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) { setSelected(null); return; }
      const next = cloneBoard(board);
      [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
      if (findAllMatches(next).length === 0) {
        setShakeCell(`${r2},${c2}`);
        setTimeout(() => setShakeCell(null), 400);
        setSelected(null);
        return;
      }
      audioRef.current?.playSwap();
      setSelected(null);
      setAnimating(true);
      setMovesLeft(m => m - 1);
      const newMST = movesSinceTide + 1;
      setMovesSinceTide(newMST);
      if (level.tideInterval > 0 && newMST >= level.tideInterval) {
        setTideRow(t => Math.max(1, t - 1));
        setMovesSinceTide(0);
      }
      // Commit the swap visually right away, then slide the tiles into position
      const dc = c2 - c1, dr = r2 - r1;
      setBoard(next);
      setSwapAnim({
        [`${r2},${c2}`]: dc > 0 ? "slideFromLeft"  : dc < 0 ? "slideFromRight" : dr > 0 ? "slideFromTop"    : "slideFromBottom",
        [`${r1},${c1}`]: dc > 0 ? "slideFromRight" : dc < 0 ? "slideFromLeft"  : dr > 0 ? "slideFromBottom" : "slideFromTop",
      });
      setTimeout(() => {
        setSwapAnim(null);
        processMatches(next);
      }, 160);
    },
    [board, animating, movesSinceTide, level, processMatches]
  );

  const handleCellClick = useCallback(
    (r, c) => {
      if (animating || screen !== "game" || r >= tideRow) return;
      if (!selected) setSelected([r, c]);
      else if (selected[0] === r && selected[1] === c) setSelected(null);
      else swap(selected[0], selected[1], r, c);
    },
    [selected, animating, screen, tideRow, swap]
  );

  const handleTouchStart = (r, c, e) => {
    touchStartRef.current = { r, c, x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const { r, c } = touchStartRef.current;
    touchStartRef.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) { handleCellClick(r, c); return; }
    let tr = r, tc = c;
    if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
    else tr += dy > 0 ? 1 : -1;
    if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) {
      if (!selected) setSelected([r, c]);
      swap(r, c, tr, tc);
    }
  };

  const targetProgress = level
    ? Object.entries(level.target).map(([id, needed]) => ({ ...getPiece(id), needed, have: collected[id] || 0, done: (collected[id] || 0) >= needed }))
    : [];

  const handleToggleMute = async () => { await ensureAudio(); setMuted(audioRef.current?.toggleMute()); };
  const goMenu = () => { audioRef.current?.stopBg(); setScreen("menu"); };
  const tileSize = "clamp(38px, 11.5vw, 54px)";

  // ─── MENU ───
  if (screen === "menu") {
    return (
      <div style={S.container}>
        <CanalBackground />
        <div style={S.menuInner}>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 4 }}><PieceSVG id="tulip" size={52} /></div>
            <h1 style={S.title}>Canal Crush</h1>
            <p style={S.subtitle}>A Dutch Match-Three Adventure</p>
          </div>
          <button onClick={handleToggleMute} style={S.muteBtn}>{muted ? "🔇 Sound Off" : "🔊 Sound On"}</button>
          <div style={S.levelGrid}>
            {LEVELS.map((lv, i) => {
              const done = completedLevels.has(i);
              return (
                <button key={i} onClick={() => startLevel(i)} style={{
                  ...S.levelBtn, borderColor: done ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.06)",
                  animation: "fadeInUp 0.4s ease both", animationDelay: `${i * 0.06}s`,
                }}>
                  <div style={{ ...S.levelNumBadge, background: done ? "linear-gradient(135deg,#4caf50,#27ae60)" : "linear-gradient(135deg,#f4a623,#e17055)" }}>
                    {done ? "⭐" : i + 1}
                  </div>
                  <span style={S.levelName}>{lv.name}</span>
                  <span style={S.levelDesc}>{lv.desc}</span>
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    {Object.keys(lv.target).map(id => <span key={id} style={{ display: "inline-flex" }}><PieceSVG id={id} size={14} /></span>)}
                  </div>
                </button>
              );
            })}
          </div>
          {highScore > 0 && <p style={S.totalScore}>🏆 Best: {highScore}</p>}
          {totalScore > 0 && <p style={{ ...S.totalScore, color: "#8aa4c0", fontSize: "0.82rem" }}>This run: {totalScore}</p>}
          <div style={{ fontSize: "0.7rem", color: "#5a7a9a", textAlign: "center", maxWidth: 320 }}>
            Match 4 in a row → <b>Bicycle Bell</b> (clears row/column)<br/>
            Match 5+ in a row → <b>King's Day Bomb</b> (clears 3×3)
          </div>
        </div>
      </div>
    );
  }

  // ─── WIN ───
  if (screen === "win") {
    return (
      <div style={S.container}><CanalBackground />
        <div style={S.resultCard}>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 12 }}>
            <PieceSVG id="tulip" size={48} /><span style={{ fontSize: "2.5rem" }}>🎉</span><PieceSVG id="cheese" size={48} />
          </div>
          <h2 style={S.resultTitle}>Prachtig!</h2>
          <p style={S.resultSub}>You cleared {level.name}!</p>
          <div style={S.scoreBox}>
            <span>Score: {score}</span>
            <span style={{ color: "#74b9ff" }}>+ {movesLeft * 5} bonus</span>
            <span style={{ color: "#ffd54f", fontWeight: 800 }}>= {score + movesLeft * 5}</span>
          </div>
          <div style={S.resultBtns}>
            {levelIdx + 1 < LEVELS.length && <button onClick={() => startLevel(levelIdx + 1)} style={S.primaryBtn}>Next → {LEVELS[levelIdx + 1].name}</button>}
            <button onClick={goMenu} style={S.secondaryBtn}>← Back to Map</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOSE ───
  if (screen === "lose") {
    return (
      <div style={S.container}><CanalBackground />
        <div style={S.resultCard}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🌊</div>
          <h2 style={{ ...S.resultTitle, color: "#ef5350" }}>The tide rose!</h2>
          <p style={S.resultSub}>The canal flooded the dock at {level.name}</p>
          <div style={S.resultBtns}>
            <button onClick={() => startLevel(levelIdx)} style={S.primaryBtn}>Try Again</button>
            <button onClick={goMenu} style={S.secondaryBtn}>← Back to Map</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── GAME ───
  return (
    <div style={S.container}>
      <CanalBackground />
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <div style={S.hud}>
          <button onClick={goMenu} style={S.backBtn}>← Map</button>
          <div style={{ textAlign: "center" }}>
            <span style={S.hudCity}>{level.name}</span>
            <div style={{ fontSize: "0.7rem", color: "#8aa4c0" }}>{score} pts</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={handleToggleMute} style={S.muteBtnSmall}>{muted ? "🔇" : "🔊"}</button>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: movesLeft <= 5 ? "#ef5350" : "#ffd54f", fontWeight: 800, fontSize: "1.4rem", lineHeight: 1 }}>{movesLeft}</div>
              <div style={{ fontSize: "0.55rem", color: "#8aa4c0", marginTop: 1 }}>moves</div>
            </div>
          </div>
        </div>

        <div style={S.targets}>
          {targetProgress.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5, opacity: t.done ? 0.4 : 1, transition: "opacity 0.3s" }}>
              <PieceSVG id={t.id} size={22} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: t.done ? "#4caf50" : "#f0e6d3", textDecoration: t.done ? "line-through" : "none" }}>
                {Math.min(t.have, t.needed)}/{t.needed}
              </span>
            </div>
          ))}
        </div>

        {level.tideInterval > 0 && tideRow < ROWS && (
          <div style={S.tideWarning}>
            🌊 Tide: {ROWS - tideRow} row{ROWS - tideRow !== 1 ? "s" : ""} flooded
            {level.tideInterval - movesSinceTide <= 2 && <span style={{ color: "#ef5350", fontWeight: 700 }}> — rising soon!</span>}
          </div>
        )}

        {comboText && <div style={S.comboText}>{comboText}</div>}

        <div ref={boardElRef} style={{
          display: "grid", gridTemplateColumns: `repeat(${COLS}, ${tileSize})`, gridTemplateRows: `repeat(${ROWS}, ${tileSize})`,
          gap: "3px", background: "rgba(10,20,40,0.85)", backdropFilter: "blur(12px)",
          borderRadius: "14px", padding: "6px", position: "relative", touchAction: "none",
          border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <Particles particles={particles} />
          {board?.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isMatched = matchedCells.has(`${r},${c}`);
              const isFlooded = r >= tideRow;
              const isShaking = shakeCell === `${r},${c}`;
              const isPowerUp = powerUpCells.has(`${r},${c}`);
              const swapDir = swapAnim?.[`${r},${c}`];
              const piece = cell ? getPiece(cell) : null;
              return (
                <div key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onTouchStart={e => handleTouchStart(r, c, e)}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    width: tileSize, height: tileSize,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "8px", cursor: isFlooded ? "default" : "pointer",
                    userSelect: "none", WebkitUserSelect: "none",
                    position: "relative", zIndex: swapDir ? 10 : undefined,
                    transition: swapDir ? "none" : "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                    background: isFlooded ? "linear-gradient(180deg, #1565a0, #2196c8)"
                      : isPowerUp ? "rgba(255,213,79,0.3)"
                      : isSelected ? "rgba(244,166,35,0.2)" : "rgba(30,58,95,0.6)",
                    boxShadow: isPowerUp ? "0 0 20px rgba(255,213,79,0.5), 0 0 0 2px #ffd54f"
                      : isSelected ? "0 0 0 2px #f4a623, 0 0 16px rgba(244,166,35,0.35)"
                      : isMatched ? `0 0 20px ${piece?.color||"#fff"}80`
                      : "inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)",
                    transform: isMatched ? "scale(1.2)" : isSelected ? "scale(1.06)" : "scale(1)",
                    opacity: isMatched ? 0 : isFlooded ? 0.55 : 1,
                    animation: isShaking ? "canalShake 0.35s ease"
                      : swapDir ? `${swapDir} 0.16s cubic-bezier(0.4,0,0.2,1)`
                      : isPowerUp ? "powerGlow 0.5s ease" : undefined,
                  }}>
                  {isFlooded ? <span style={{ fontSize: "clamp(14px,4vw,20px)", opacity: 0.7 }}>🌊</span>
                    : cell && <PieceSVG id={cell} size={Math.min(window.innerWidth * 0.07, 32)} />}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes canalShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(2px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes particleFly { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,-50%) scale(0) translateY(-20px)} }
        @keyframes twinkle { 0%,100%{opacity:0.25} 50%{opacity:0.85} }
        @keyframes cloudDrift { 0%{transform:translateX(-30%)} 100%{transform:translateX(130vw)} }
        @keyframes shimmer { 0%,100%{opacity:0.08;transform:translateX(0)} 50%{opacity:0.3;transform:translateX(12px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes comboIn { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.3)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1) translateY(-30px)} }
        @keyframes resultIn { from{opacity:0;transform:translateY(30px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes powerGlow { 0%{box-shadow:0 0 0 rgba(255,213,79,0)} 50%{box-shadow:0 0 30px rgba(255,213,79,0.7)} 100%{box-shadow:0 0 0 rgba(255,213,79,0)} }
        @keyframes slideFromLeft   { from{transform:translateX(calc(-100% - 3px))} to{transform:none} }
        @keyframes slideFromRight  { from{transform:translateX(calc(100% + 3px))}  to{transform:none} }
        @keyframes slideFromTop    { from{transform:translateY(calc(-100% - 3px))} to{transform:none} }
        @keyframes slideFromBottom { from{transform:translateY(calc(100% + 3px))}  to{transform:none} }
      `}</style>
    </div>
  );
}

// ─── STYLES ───
const S = {
  container: { height: "100dvh", maxHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", padding: "env(safe-area-inset-top, 10px) 8px env(safe-area-inset-bottom, 8px)", fontFamily: "'DM Sans', sans-serif", color: "#f0e6d3", position: "relative", overflow: "hidden" },
  menuInner: { position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, maxWidth: 480, width: "100%", paddingTop: 10, flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: 16 },
  title: { fontSize: "2.6rem", fontFamily: "'Fredoka', sans-serif", fontWeight: 700, margin: 0, background: "linear-gradient(135deg, #f4a623 0%, #ffd54f 50%, #f39c12 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-1px" },
  subtitle: { margin: "4px 0 0", color: "#8aa4c0", fontSize: "0.9rem", letterSpacing: "0.5px" },
  muteBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 16px", color: "#8aa4c0", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" },
  muteBtnSmall: { background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: 4 },
  levelGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, width: "100%", padding: "0 8px" },
  levelBtn: { background: "rgba(20,40,70,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 12px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", color: "#f0e6d3", transition: "all 0.2s ease", fontFamily: "inherit" },
  levelNumBadge: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 4, boxShadow: "0 2px 8px rgba(244,166,35,0.3)" },
  levelName: { fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Fredoka', sans-serif" },
  levelDesc: { fontSize: "0.65rem", color: "#8aa4c0" },
  totalScore: { color: "#ffd54f", fontWeight: 700, fontSize: "1rem", margin: 0, fontFamily: "'Fredoka', sans-serif" },
  hud: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 440, marginBottom: 8 },
  backBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#8aa4c0", fontSize: "0.8rem", cursor: "pointer", padding: "6px 10px", fontFamily: "inherit" },
  hudCity: { fontWeight: 700, fontSize: "1.2rem", fontFamily: "'Fredoka', sans-serif", background: "linear-gradient(135deg, #f4a623, #ffd54f)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  targets: { display: "flex", gap: 14, marginBottom: 6, padding: "8px 18px", background: "rgba(20,40,70,0.7)", backdropFilter: "blur(8px)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" },
  tideWarning: { fontSize: "0.75rem", color: "#2196c8", marginBottom: 4, fontWeight: 500 },
  comboText: { position: "fixed", top: "40%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "'Fredoka', sans-serif", fontSize: "2.2rem", fontWeight: 700, color: "#ffd54f", textShadow: "0 0 20px rgba(255,213,79,0.6), 0 2px 4px rgba(0,0,0,0.5)", zIndex: 100, pointerEvents: "none", animation: "comboIn 0.8s ease-out forwards" },
  resultCard: { position: "relative", zIndex: 2, background: "rgba(20,40,70,0.85)", backdropFilter: "blur(16px)", borderRadius: 24, padding: "44px 32px 32px", textAlign: "center", maxWidth: 360, width: "90%", marginTop: "15vh", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", animation: "resultIn 0.5s ease" },
  resultTitle: { fontSize: "2rem", fontWeight: 700, margin: "0 0 8px", fontFamily: "'Fredoka', sans-serif", color: "#ffd54f" },
  resultSub: { margin: "0 0 16px", color: "#8aa4c0", fontSize: "1rem" },
  scoreBox: { display: "flex", flexDirection: "column", gap: 2, fontSize: "0.95rem", marginBottom: 20, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.04)" },
  resultBtns: { display: "flex", flexDirection: "column", gap: 10 },
  primaryBtn: { background: "linear-gradient(135deg, #f4a623, #e17055)", border: "none", borderRadius: 12, padding: "14px 24px", color: "#fff", fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Fredoka', sans-serif", boxShadow: "0 4px 20px rgba(244,166,35,0.35)" },
  secondaryBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 24px", color: "#8aa4c0", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
};
