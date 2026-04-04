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
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <g transform="rotate(-5, 20, 28)">
            <path d="M15 38 L13 22 L14 18 L26 18 L27 22 L25 38 Z" fill="#5d6d7e" />
            <path d="M16 38 L14 22 L15 19 L25 19 L26 22 L24 38 Z" fill="#85929e" />
            <line x1="15" y1="24" x2="25" y2="24" stroke="#5d6d7e" strokeWidth="0.5" opacity="0.6" />
            <line x1="15" y1="28" x2="25" y2="28" stroke="#5d6d7e" strokeWidth="0.5" opacity="0.6" />
            <line x1="15" y1="32" x2="25" y2="32" stroke="#5d6d7e" strokeWidth="0.5" opacity="0.6" />
            <line x1="14.5" y1="36" x2="25.5" y2="36" stroke="#5d6d7e" strokeWidth="0.5" opacity="0.6" />
            <rect x="11" y="21" width="18" height="1.5" rx="0.5" fill="#4a4a4a" />
            <line x1="12" y1="22.5" x2="12" y2="24" stroke="#4a4a4a" strokeWidth="0.8" />
            <line x1="28" y1="22.5" x2="28" y2="24" stroke="#4a4a4a" strokeWidth="0.8" />
            <path d="M12 19 Q14 13 20 12 Q26 13 28 19 Z" fill="#2c3e50" />
            <path d="M13 18.5 Q15 14 20 13 Q25 14 27 18.5 Z" fill="#34495e" />
            <line x1="20" y1="12" x2="20" y2="10" stroke="#2c3e50" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="15" x2="20" y2="2" stroke="#d5d8dc" strokeWidth="1.2" />
            <line x1="18.5" y1="4" x2="20" y2="3.5" stroke="#d5d8dc" strokeWidth="0.6" />
            <line x1="18.5" y1="6.5" x2="20" y2="6" stroke="#d5d8dc" strokeWidth="0.6" />
            <line x1="19" y1="9" x2="20" y2="8.5" stroke="#d5d8dc" strokeWidth="0.6" />
            <line x1="21" y1="15" x2="36" y2="15" stroke="#d5d8dc" strokeWidth="1.2" />
            <line x1="34" y1="13.5" x2="33.5" y2="15" stroke="#d5d8dc" strokeWidth="0.6" />
            <line x1="30.5" y1="13.5" x2="30" y2="15" stroke="#d5d8dc" strokeWidth="0.6" />
            <line x1="27" y1="14" x2="26.5" y2="15" stroke="#d5d8dc" strokeWidth="0.6" />
            <line x1="20" y1="16" x2="20" y2="30" stroke="#b2bec3" strokeWidth="1.2" />
            <line x1="21.5" y1="27.5" x2="20" y2="27" stroke="#b2bec3" strokeWidth="0.6" />
            <line x1="21.5" y1="24" x2="20" y2="23.5" stroke="#b2bec3" strokeWidth="0.6" />
            <line x1="19" y1="15" x2="4" y2="15" stroke="#b2bec3" strokeWidth="1.2" />
            <line x1="6" y1="16.5" x2="6.5" y2="15" stroke="#b2bec3" strokeWidth="0.6" />
            <line x1="9.5" y1="16.5" x2="10" y2="15" stroke="#b2bec3" strokeWidth="0.6" />
            <line x1="13" y1="16" x2="13.5" y2="15" stroke="#b2bec3" strokeWidth="0.6" />
            <circle cx="20" cy="15" r="2" fill="#74b9ff" stroke="#2c3e50" strokeWidth="1" />
            <circle cx="20" cy="15" r="0.8" fill="#0984e3" />
            <path d="M18 38 L18 34 Q18 32 20 32 Q22 32 22 34 L22 38" fill="#2c3e50" />
            <rect x="18.5" y="25" width="3" height="2.5" rx="0.5" fill="#ffeaa7" opacity="0.7" />
          </g>
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

// Detect power-up-worthy matches (4+ in a line)
function findPowerUpMatches(board) {
  const powerUps = [];
  // Check horizontal runs
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
  // Check vertical runs
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
  const houses = useMemo(() => {
    const h = [];
    for (let i = 0; i < 14; i++) h.push({
      x: i * 52 - 20, w: 40 + Math.random() * 16, h: 60 + Math.random() * 50,
      color: ["#c0392b","#2980b9","#f39c12","#27ae60","#8e44ad","#d35400","#2c3e50"][i % 7],
      roofType: Math.floor(Math.random() * 3),
    });
    return h;
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #1a1a4e 0%, #1e3a6e 40%, #2d6ea0 70%, #4a90c4 100%)" }} />
      {[...Array(30)].map((_, i) => <div key={`s${i}`} style={{ position: "absolute", left: `${Math.random()*100}%`, top: `${Math.random()*40}%`, width: 2, height: 2, borderRadius: "50%", background: "#fff", opacity: 0.3+Math.random()*0.5, animation: `twinkle ${2+Math.random()*3}s ease-in-out infinite`, animationDelay: `${Math.random()*3}s` }} />)}
      <div style={{ position: "absolute", right: "12%", top: "8%", width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #ffeaa7, #fdcb6e 60%, #f39c12)", boxShadow: "0 0 40px rgba(253,203,110,0.4)" }} />
      {[0,1,2].map(i => <div key={`c${i}`} style={{ position: "absolute", top: `${10+i*12}%`, left: "-20%", width: 120+i*30, height: 30+i*8, borderRadius: 30, background: "rgba(255,255,255,0.04)", animation: `cloudDrift ${40+i*15}s linear infinite`, animationDelay: `${i*10}s` }} />)}
      <svg style={{ position: "absolute", bottom: "18%", left: 0, width: "100%", height: "30%" }} viewBox="0 0 700 150" preserveAspectRatio="none">
        {houses.map((h, i) => <g key={i}><rect x={h.x} y={150-h.h} width={h.w} height={h.h} fill={h.color} opacity="0.25" />{h.roofType < 2 && <polygon points={`${h.x},${150-h.h} ${h.x+h.w/2},${150-h.h-(h.roofType===0?18:25)} ${h.x+h.w},${150-h.h}`} fill={h.color} opacity="0.3" />}{[0.3,0.65].map((wy,wi) => <rect key={wi} x={h.x+h.w*0.2} y={150-h.h*wy} width={h.w*0.25} height={h.h*0.1} fill="#ffeaa7" opacity="0.35" rx="1" />)}</g>)}
      </svg>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "20%", background: "linear-gradient(180deg, #1a5276, #154360 50%, #0e2f44)", overflow: "hidden" }}>
        {[...Array(6)].map((_,i) => <div key={`sh${i}`} style={{ position: "absolute", left: `${-10+i*20}%`, top: `${20+Math.random()*40}%`, width: "25%", height: 1, background: "rgba(116,185,255,0.2)", animation: `shimmer ${3+Math.random()*2}s ease-in-out infinite`, animationDelay: `${Math.random()*2}s` }} />)}
      </div>
      {[{left:"6%",bottom:"22%"},{right:"4%",bottom:"26%"}].map((pos,i) => <div key={`wm${i}`} style={{ position: "absolute", ...pos, zIndex: 1 }}><svg width="48" height="64" viewBox="0 0 48 64"><rect x="21" y="28" width="6" height="36" fill="rgba(255,255,255,0.08)" rx="1" /><g style={{ transformOrigin: "24px 24px", animation: "spin 8s linear infinite" }}><rect x="22" y="2" width="4" height="22" fill="rgba(255,255,255,0.12)" rx="2" /><rect x="26" y="22" width="22" height="4" fill="rgba(255,255,255,0.12)" rx="2" /><rect x="22" y="26" width="4" height="22" fill="rgba(255,255,255,0.1)" rx="2" /><rect x="0" y="22" width="22" height="4" fill="rgba(255,255,255,0.1)" rx="2" /></g><circle cx="24" cy="24" r="3" fill="rgba(255,255,255,0.15)" /></svg></div>)}
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
  const [totalScore, setTotalScore] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState(new Set());
  const [tideRow, setTideRow] = useState(ROWS);
  const [movesSinceTide, setMovesSinceTide] = useState(0);
  const [completedLevels, setCompletedLevels] = useState(new Set());
  const [shakeCell, setShakeCell] = useState(null);
  const [particles, setParticles] = useState([]);
  const [muted, setMuted] = useState(false);
  const [comboText, setComboText] = useState(null);
  const [powerUpCells, setPowerUpCells] = useState(new Set());
  const audioRef = useRef(null);
  const boardElRef = useRef(null);
  const touchStartRef = useRef(null);
  const checkTimerRef = useRef(null);
  const endTriggeredRef = useRef(false);

  // Refs for win/lose check inside callbacks
  const collectedRef = useRef({});
  const movesLeftRef = useRef(0);
  const scoreRef = useRef(0);
  useEffect(() => { collectedRef.current = collected; }, [collected]);
  useEffect(() => { movesLeftRef.current = movesLeft; }, [movesLeft]);
  useEffect(() => { scoreRef.current = score; }, [score]);

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
        // Check win/lose after a short delay to let state settle
        setTimeout(() => checkWinLose(), 120);
        return;
      }
      setAnimating(true);
      setMatchedCells(new Set(matches.map(([r, c]) => `${r},${c}`)));
      audioRef.current?.playMatch(cascadeLevel);

      // Detect power-ups
      const pups = findPowerUpMatches(b);
      let extraClears = new Set();
      if (pups.length > 0) {
        audioRef.current?.playPowerUp();
        const puCells = new Set();
        pups.forEach(pu => {
          if (pu.type === "bomb") {
            // 3x3 area
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

      // Merge matches + power-up clears
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
      setMovesLeft(m => m - 1);
      const newMST = movesSinceTide + 1;
      setMovesSinceTide(newMST);
      if (level.tideInterval > 0 && newMST >= level.tideInterval) {
        setTideRow(t => Math.max(1, t - 1));
        setMovesSinceTide(0);
      }
      processMatches(next);
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
          {totalScore > 0 && <p style={S.totalScore}>🏆 Total: {totalScore}</p>}
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
                    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                    background: isFlooded ? "linear-gradient(180deg, #1565a0, #2196c8)"
                      : isPowerUp ? "rgba(255,213,79,0.3)"
                      : isSelected ? "rgba(244,166,35,0.2)" : "rgba(30,58,95,0.6)",
                    boxShadow: isPowerUp ? "0 0 20px rgba(255,213,79,0.5), 0 0 0 2px #ffd54f"
                      : isSelected ? "0 0 0 2px #f4a623, 0 0 16px rgba(244,166,35,0.35)"
                      : isMatched ? `0 0 20px ${piece?.color||"#fff"}80`
                      : "inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)",
                    transform: isMatched ? "scale(1.2)" : isSelected ? "scale(1.06)" : "scale(1)",
                    opacity: isMatched ? 0 : isFlooded ? 0.55 : 1,
                    animation: isShaking ? "canalShake 0.35s ease" : isPowerUp ? "powerGlow 0.5s ease" : undefined,
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
        @keyframes twinkle { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
        @keyframes cloudDrift { 0%{transform:translateX(-30%)} 100%{transform:translateX(130vw)} }
        @keyframes shimmer { 0%,100%{opacity:0.1;transform:translateX(0)} 50%{opacity:0.35;transform:translateX(10px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes comboIn { 0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.3)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1) translateY(-30px)} }
        @keyframes resultIn { from{opacity:0;transform:translateY(30px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes powerGlow { 0%{box-shadow:0 0 0 rgba(255,213,79,0)} 50%{box-shadow:0 0 30px rgba(255,213,79,0.7)} 100%{box-shadow:0 0 0 rgba(255,213,79,0)} }
      `}</style>
    </div>
  );
}

// ─── STYLES ───
const S = {
  container: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 8px 24px", fontFamily: "'DM Sans', sans-serif", color: "#f0e6d3", position: "relative", overflow: "hidden" },
  menuInner: { position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, maxWidth: 480, width: "100%", paddingTop: 20 },
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
