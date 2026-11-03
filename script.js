"use strict";
// Stample: peel stamps off postcards from a chain of pen pals and keep the best copy of each in your album.
// The world (197 countries and their ~25,000 stamps) comes from stamps_filled.xml; pen pals and texts from data.js.

const $ = (id) => document.getElementById(id);
const NOW_YEAR = 2026;
const SAVE_KEY = "stample-v2";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const VALUES = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 500];
// [minimum quality, name, stars]
// Quality can sink below zero: a stamp can be ruined all the way to destruction
const GRADES = [[90, "GEM MINT", 5], [75, "SUPERB", 4], [60, "VERY FINE", 3], [45, "FINE", 2], [25, "FAIR", 1], [0, "POOR", 0],
  [-30, "WRECK", -1], [-Infinity, "PHILATELIC CATASTROPHE", -2]];
// This many tears and the stamp falls apart
const DESTROY_AT = 8;
// Rarity decides how often a stamp turns up on a card: famous (sourced) stamps are the rarest
const RARITY = {
  legendary: { name: "Legendary", weight: 0.25 },
  rare: { name: "Rare", weight: 1 },
  uncommon: { name: "Uncommon", weight: 2 },
  common: { name: "Common", weight: 3 },
};

// ---------- Random helpers ----------

const rand = Math.random;
const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const flag = (code) => /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "🏳️";
const flagHtml = (code) => `<span class="flag">${flag(code)}</span>`;

// ---------- The world ----------

let COUNTRIES = [];
const BY_CODE = {};
const STAMPS = {};
let CATALOG_SIZE = 0;

async function loadWorld() {
  const res = await fetch("stamps_filled.xml");
  if (!res.ok) throw new Error("stamps_filled.xml: " + res.status);
  const doc = new DOMParser().parseFromString(await res.text(), "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("stamps_filled.xml is not valid XML");

  const people = {};
  for (const row of PEOPLE_ROWS.trim().split("\n")) {
    const [name, code, city, person, hello, bye, unit] = row.split("|");
    people[name] = { name, code, city, person, hello, bye, unit };
  }

  for (const el of doc.documentElement.children) {
    if (el.tagName !== "country") continue;
    const name = el.getAttribute("name");
    const p = people[name] || { name, code: name.slice(0, 2).toUpperCase(), city: name, person: "Alex", hello: "Hello", bye: "Bye", unit: "c" };
    const c = { ...p, stamps: [], first: null };
    const perYear = {};
    for (const s of el.children) {
      const year = +s.getAttribute("year");
      if (s.tagName === "firstStamp") c.first = { year, desc: s.textContent.trim() };
      if (s.tagName !== "stamp" || !year) continue;
      const base = `${c.code}-${year}`;
      const n = perYear[base] = (perYear[base] || 0) + 1;
      const src = s.getAttribute("source") || "unknown";
      const st = {
        id: n > 1 ? `${base}-${String.fromCharCode(64 + n)}` : base,
        code: c.code, year, desc: s.textContent.trim() || "Definitive issue", src,
      };
      st.rarity = src !== "unknown" ? "legendary" : year < 1900 ? "rare" : year < 1950 ? "uncommon" : "common";
      c.stamps.push(st);
      STAMPS[st.id] = st;
    }
    c.stamps.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
    if (!c.stamps.length) continue;
    COUNTRIES.push(c);
    BY_CODE[c.code] = c;
    CATALOG_SIZE += c.stamps.length;
  }
  COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));
}

// What a stamp looks like never changes: it is seeded by its id
function look(st) {
  if (st.look) return st.look;
  const r = seeded(hashStr(st.id));
  const m = MOTIFS.find(([re]) => re.test(st.desc));
  let ink = INKS[Math.floor(r() * INKS.length)];
  if (/\bblack\b/i.test(st.desc)) ink = "#222226";
  else if (/\bred\b/i.test(st.desc)) ink = "#a3202b";
  else if (/\bblue\b/i.test(st.desc)) ink = "#1f3f8c";
  const hue = Math.floor(r() * 360);
  st.look = {
    motif: m ? m[1] : MOTIF_FALLBACK[Math.floor(r() * MOTIF_FALLBACK.length)],
    ink,
    tint: `hsl(${hue} 45% 90%)`,
    value: VALUES[Math.floor(r() * VALUES.length)],
  };
  return st.look;
}

// ---------- Save ----------

let S = { album: {}, total: 0, pals: {}, card: null, cardNo: 0, chain: [], sound: true, sort: "origin", eggs: {}, shells: [] };

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) S = { ...S, ...JSON.parse(raw) };
  } catch (e) { /* private mode or broken save: start fresh */ }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ }
}

// ---------- Sound ----------

// Everything goes through one soft bus: a gentle low-pass and a compressor take the edge off every sound
let actx = null, bus = null;
function audio() {
  if (!S.sound) return null;
  try {
    if (!actx) {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4800; lp.Q.value = 0.5;
      const comp = actx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 4;
      bus = actx.createGain(); bus.gain.value = 0.75;
      bus.connect(lp).connect(comp).connect(actx.destination);
    }
    if (actx.state === "suspended") actx.resume();
  } catch (e) { return null; }
  return actx;
}
function noise(dur, { freq = 2000, q = 1, type = "bandpass", vol = 0.2, delay = 0, to = null } = {}) {
  const a = audio(); if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = rand() * 2 - 1;
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = type; f.Q.value = q;
  const g = a.createGain();
  const t = a.currentTime + delay;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  // A soft attack instead of a click
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(t);
}
function tone(freq, dur, { type = "sine", vol = 0.12, delay = 0, to = null, wobble = 0 } = {}) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(); o.type = type;
  const g = a.createGain();
  const t = a.currentTime + delay;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  if (wobble) {
    // Cartoon vibrato
    const lfo = a.createOscillator(), lg = a.createGain();
    lfo.frequency.value = 18; lg.gain.value = wobble;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t); lfo.stop(t + dur + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  paper() { noise(0.4, { freq: 900, q: 0.5, vol: 0.12, to: 1800 }); },
  peel(speed) { noise(0.06, { freq: 1100 + speed * 900, q: 2, vol: 0.025 + Math.min(0.05, speed * 0.04) }); },
  // A soft zipper whose pitch climbs as the tear-out goes around
  rip(p, speed) { noise(0.07, { freq: 700 + p * 1300 + speed * 300, q: 4, vol: 0.05 }); tone(300 + p * 500, 0.05, { vol: 0.015, type: "triangle" }); },
  // A cartoon "oops": a soft paper fwip and a sliding-down whistle
  // Each further tear slides lower and sadder
  tear(n = 1) { noise(0.2, { freq: 1200, q: 1, vol: 0.12, to: 400 }); tone(Math.max(180, 640 - n * 45), 0.35, { to: Math.max(90, 220 - n * 15), vol: 0.08, type: "triangle", wobble: 12 + n * 3 }); },
  // Wah, wah, wah, waaah
  sadTrombone() { [[294, 0.35], [277, 0.35], [262, 0.35], [247, 1.1]].forEach(([f, d], i) => tone(f, d, { type: "triangle", vol: 0.1, delay: i * 0.38, to: i === 3 ? 200 : null, wobble: i === 3 ? 9 : 3 })); },
  pop() { tone(420, 0.12, { to: 900, vol: 0.12 }); tone(900, 0.08, { vol: 0.05, delay: 0.07 }); },
  // A rubber band boing when glue strands let go
  snap() { tone(260, 0.4, { to: 180, vol: 0.12, type: "triangle", wobble: 30 }); noise(0.05, { freq: 1500, vol: 0.05 }); },
  thunk() { tone(140, 0.2, { type: "sine", vol: 0.25, to: 70 }); },
  chime(stars) { [523, 659, 784, 1047, 1319, 1568].slice(0, stars + 1).forEach((f, i) => tone(f, 0.5, { delay: i * 0.09, vol: 0.08, type: "sine" })); },
  flip() { noise(0.25, { freq: 700, q: 0.6, vol: 0.1, to: 1500 }); },
  whoosh() { noise(0.6, { freq: 400, q: 0.7, vol: 0.12, to: 1400 }); },
  sparkle() { [1568, 2093, 2637, 2093].forEach((f, i) => tone(f, 0.18, { delay: i * 0.06, vol: 0.04 })); },
  squelch() { tone(180, 0.25, { to: 90, vol: 0.12, type: "triangle", wobble: 20 }); },
};

// ---------- Stamp drawing (SVG, 100 × 120 units) ----------

let uid = 0;

function tearPoly(t) {
  // A jagged bite out of one edge: side 0 top, 1 right, 2 bottom, 3 left; pos along the edge
  const pts = [[0, -2], [5, 9], [9, 4], [14, 13], [19, 5], [24, -2]];
  const along = 12 + t.p * 52;
  return pts.map(([a, b]) => {
    switch (t.s) {
      case 0: return [along + a, b];
      case 1: return [100 - b, along + a + 8];
      case 2: return [along + a, 120 - b];
      default: return [b, along + a + 8];
    }
  }).map((p) => p.join(",")).join(" ");
}

function markG(mark, pathId) {
  const c = BY_CODE[mark.code] || { name: "?", city: "?" };
  const cx = 50 + mark.ox, cy = 60 + mark.oy;
  let ring = `${c.name} ★ ${c.city} ★ `.toUpperCase();
  if (ring.length > 34) ring = `★ ${c.name} ★ `.toUpperCase();
  let waves = "";
  for (let i = 0; i < 5; i++) {
    waves += `<path d="M${cx - 30} ${cy - 12 + i * 6} q-5 -3 -10 0 t-10 0 t-10 0 t-10 0 t-10 0 t-10 0" stroke-width="1.3" stroke-dasharray="9 1.6"/>`;
  }
  return `<g transform="rotate(${mark.rot} ${cx} ${cy})" opacity=".8" fill="none" stroke="${mark.ink}">
    <circle cx="${cx}" cy="${cy}" r="26" stroke-width="1.8"/>
    <circle cx="${cx}" cy="${cy}" r="15.5" stroke-width="1"/>
    <path id="${pathId}" d="M${cx - 20.5} ${cy} a20.5 20.5 0 1 1 41 0 a20.5 20.5 0 1 1 -41 0" stroke="none"/>
    <text font-size="5.6" fill="${mark.ink}" stroke="none" font-family="Special Elite, monospace" textLength="126" lengthAdjust="spacingAndGlyphs"><textPath href="#${pathId}">${esc(ring)}</textPath></text>
    <text x="${cx}" y="${cy - 1.5}" text-anchor="middle" font-size="5.6" fill="${mark.ink}" stroke="none" font-family="Special Elite, monospace">${mark.day} ${MONTHS[mark.mon]}</text>
    <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="8" fill="${mark.ink}" stroke="none" font-family="Special Elite, monospace">${mark.year}</text>
    ${waves}
  </g>`;
}

function stampSVG(st, { mark = null, tears = [] } = {}) {
  const u = "s" + ++uid;
  const L = look(st);
  const c = BY_CODE[st.code];
  let holes = "";
  for (let x = 4; x <= 96; x += 8) holes += `<circle cx="${x}" cy="0" r="3"/><circle cx="${x}" cy="120" r="3"/>`;
  for (let y = 4; y <= 116; y += 8) holes += `<circle cx="0" cy="${y}" r="3"/><circle cx="100" cy="${y}" r="3"/>`;
  let rips = tears.map((t) => `<polygon points="${tearPoly(t)}"/>`).join("");
  // From the fourth tear on, cracks run from the edge into the stamp
  tears.slice(3).forEach((t, i) => {
    const along = 18 + t.p * 52;
    let [x, y] = [[along, 0], [100, along + 10], [along, 120], [0, along + 10]][t.s];
    const pts = [`${x},${y}`];
    for (let k = 1; k <= 5; k++) {
      x += (50 - x) * 0.2 + Math.sin(t.p * 40 + k * 2.3 + i) * 6;
      y += (60 - y) * 0.2 + Math.cos(t.p * 31 + k * 1.7 + i) * 6;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    rips += `<polyline points="${pts.join(" ")}" fill="none" stroke="#000" stroke-width="1.8" stroke-linejoin="bevel"/>`;
  });
  const name = c.name.toUpperCase();
  const fit = name.length > 12 ? ` textLength="76" lengthAdjust="spacingAndGlyphs"` : "";
  return `<svg class="stamp-svg" viewBox="0 0 100 120" overflow="visible" aria-hidden="true">
    <defs><mask id="${u}m"><rect width="100" height="120" fill="#fff"/><g fill="#000">${holes}${rips}</g></mask></defs>
    <g mask="url(#${u}m)">
      <rect width="100" height="120" fill="#fbf6ea"/>
      <rect x="7" y="7" width="86" height="106" fill="${L.ink}"/>
      <rect x="10" y="10" width="80" height="100" fill="${L.tint}"/>
      <text x="50" y="21" text-anchor="middle" font-size="${name.length > 12 ? 7 : 8.5}" fill="${L.ink}" font-family="Alfa Slab One, serif"${fit}>${esc(name)}</text>
      <ellipse cx="50" cy="56" rx="31" ry="29" fill="#fff" opacity=".55"/>
      <text x="50" y="68" text-anchor="middle" font-size="33" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${L.motif}</text>
      <rect x="10" y="91" width="80" height="19" fill="${L.ink}"/>
      <text x="15" y="104.5" font-size="9.5" fill="#fff" font-family="Alfa Slab One, serif">${L.value}${esc(c.unit.length > 2 ? " " + c.unit : c.unit)}</text>
      <text x="85" y="104.5" text-anchor="end" font-size="8.5" fill="#fff" font-family="Special Elite, monospace">${st.year}</text>
      ${mark ? markG(mark, u + "p") : ""}
    </g>
  </svg>`;
}

// The part of the seal that landed on the card around the stamp (the stamp itself is masked out)
function cardMarkSVG(mark) {
  const u = "s" + ++uid;
  return `<svg viewBox="-60 -60 220 240" overflow="visible" aria-hidden="true">
    <defs><mask id="${u}m"><rect x="-60" y="-60" width="220" height="240" fill="#fff"/><rect width="100" height="120" fill="#000"/></mask></defs>
    <g mask="url(#${u}m)">${markG(mark, u + "p")}</g>
  </svg>`;
}

// ---------- Quality ----------

// Specials: ways the seal and the stamp line up. Together they are one quality category, worth up to 35.
// x = { st, mark, luck, cut, to, today }
const SPECIALS = [
  { key: "home", name: "HOME SEAL", emoji: "🏠", pts: 15, text: "sealed in its very own country", test: (x) => x.mark.code === x.st.code },
  { key: "firstday", name: "FIRST DAY", emoji: "📅", pts: 10, text: "sealed the year it came out", test: (x) => x.mark.year === x.st.year },
  { key: "bullseye", name: "BULLSEYE", emoji: "🎯", pts: 5, text: "the seal hit dead center", test: (x) => x.luck >= 0.9 },
  { key: "century", name: "CENTURY", emoji: "💯", pts: 8, text: "sealed exactly 100 years after its release", test: (x) => x.mark.year - x.st.year === 100 },
  { key: "jubilee", name: "JUBILEE", emoji: "🎉", pts: 4, text: "sealed on a round anniversary", test: (x) => { const d = x.mark.year - x.st.year; return d > 0 && d !== 100 && d % 25 === 0; } },
  { key: "boomerang", name: "BOOMERANG", emoji: "🪃", pts: 5, text: "sealed in the country it was flying to", test: (x) => x.mark.code === x.to },
  { key: "today", name: "TODAY!", emoji: "🗓️", pts: 5, text: "the seal shows today's date", test: (x) => !!x.today },
  { key: "double", name: "DOUBLE DATE", emoji: "📆", pts: 3, text: "day and month are the same number", test: (x) => x.mark.day === x.mark.mon + 1 },
  { key: "palindrome", name: "PALINDROME", emoji: "🔁", pts: 3, text: "the seal year reads the same backwards", test: (x) => { const y = String(x.mark.year); return y === [...y].reverse().join(""); } },
  { key: "antique", name: "ANTIQUE", emoji: "🕰️", pts: 3, text: "issued before 1900", test: (x) => x.st.year < 1900 },
  { key: "legend", name: "LEGENDARY", emoji: "👑", pts: 5, text: "a famous stamp of philately", test: (x) => x.st.rarity === "legendary" },
  { key: "surgeon", name: "SURGEON", emoji: "✂️", pts: 3, text: "a flawless cut", test: (x) => x.cut >= 0.95 },
  { key: "shiny", name: "SHINY CARD", emoji: "🌟", pts: 5, text: "it came on a shiny postcard", test: (x) => !!x.shiny },
  // Anti-specials: they cost points, and nothing caps how many
  { key: "butcher", name: "BUTCHER", emoji: "🔪", pts: -5, text: "that was not a cut, that was a crime", test: (x) => x.cut < 0 },
  { key: "confetti", name: "CONFETTI", emoji: "🎊", pts: -10, text: "more holes than stamp", test: (x) => x.tears >= 5 },
  { key: "totalloss", name: "TOTAL LOSS", emoji: "💥", pts: -25, text: "the stamp is no more", test: (x) => x.tears >= DESTROY_AT },
];
const SPECIAL = Object.fromEntries(SPECIALS.map((sp) => [sp.key, sp]));
const COMBOS = [
  { keys: ["home", "firstday", "bullseye"], name: "THE HOLY GRAIL", emoji: "🏆" },
  { keys: ["century", "home"], name: "HOMECOMING CENTURY", emoji: "🎂" },
  { keys: ["home", "firstday"], name: "PHILATELIST'S DREAM", emoji: "💫" },
  { keys: ["boomerang", "firstday"], name: "TIME TRAVELLER", emoji: "🛸" },
];

// extra = { cut, to, today } from the card (old album copies have no cut: they count as a decent 0.8)
function score(st, mark, tears, extra = {}) {
  const t = tears.length;
  // 35, 24, 13, 4, then 8 points less for every further tear
  const cond = t <= 3 ? [35, 24, 13, 4][t] : 4 - (t - 3) * 8;
  const cut = extra.cut == null ? 0.8 : extra.cut;
  const cutPts = Math.round(10 * cut);
  const luck = Math.max(0, 1 - Math.hypot(mark.ox / 46, mark.oy / 56));
  const luckPts = Math.round(20 * luck);
  const x = { st, mark, luck, cut, tears: t, to: extra.to, today: extra.today, shiny: extra.shiny };
  const sp = SPECIALS.filter((s) => s.test(x)).map((s) => s.key);
  const good = sp.reduce((n, k) => n + Math.max(0, SPECIAL[k].pts), 0);
  const bad = sp.reduce((n, k) => n + Math.min(0, SPECIAL[k].pts), 0);
  const spPts = Math.min(35, good) + bad;
  const combo = COMBOS.find((c) => c.keys.every((k) => sp.includes(k))) || null;
  return { cond, tears: t, cut, cutPts, luck, luckPts, sp, spPts, combo, q: cond + cutPts + luckPts + spPts };
}
const gradeOf = (q) => GRADES.find(([min]) => q >= min);
const stars = (n) => n < 0 ? "💀".repeat(n === -1 ? 1 : 3) : "★".repeat(n) + "☆".repeat(5 - n);
const condName = (t) => t >= DESTROY_AT ? "Destroyed" : t >= 6 ? "Confetti" : t >= 4 ? "Shredded" : ["Mint", "One tear", "Two tears", "Torn"][t];
const cutName = (c) => c >= 0.95 ? "flawless" : c >= 0.8 ? "neat" : c >= 0.55 ? "wobbly" : c >= 0 ? "ragged" : "butchered";

// ---------- Postcards ----------

// Given names come first except where the family name usually leads
function callName(c) {
  if (["CN", "TW", "KR", "KP", "VN"].includes(c.code) || c.person.startsWith("Fra ")) return c.person;
  return c.person.split(" ")[0];
}

function pickStamp(c) {
  let total = 0;
  for (const st of c.stamps) total += RARITY[st.rarity].weight;
  let r = rand() * total;
  for (const st of c.stamps) { r -= RARITY[st.rarity].weight; if (r <= 0) return st; }
  return c.stamps[c.stamps.length - 1];
}

function writeText(f, t, p) {
  const fill = (s) => s
    .replace(/\{to\}/g, callName(t)).replace(/\{from\}/g, callName(f))
    .replace(/\{city\}/g, f.city).replace(/\{country\}/g, f.name).replace(/\{dest\}/g, t.name)
    .replace(/\{prev\}/g, p ? p.name : "abroad").replace(/\{prevName\}/g, p ? callName(p) : "a friend")
    .replace(/\{smell\}/g, pick(SMELLS)).replace(/\{smell2\}/g, pick(SMELLS));
  const lines = [`${f.hello}, ${callName(t)}!`];
  if (p && rand() < 0.75) lines.push(fill(pick(TEXT_PREV)));
  lines.push(fill(pick(TEXT_PLACE)));
  lines.push(fill(pick(rand() < 0.5 ? TEXT_DEST : TEXT_FUNNY)));
  return { lines, ps: rand() < 0.45 ? fill(pick(TEXT_PS)) : "", sign: `${f.bye},\n${callName(f)}` };
}

// Card gimmicks: each card may come with a few. The crab is a secret stowaway, so it gets no badge.
const MODS = {
  sticky: { emoji: "🍯", name: "Extra sticky", chance: 0.12 },
  wet: { emoji: "💧", name: "Got wet at sea", chance: 0.12 },
  windy: { emoji: "💨", name: "Windy day", chance: 0.15 },
  sandy: { emoji: "🏖️", name: "Sandy and scratchy", chance: 0.1 },
  shiny: { emoji: "🌟", name: "Shiny!", chance: 0.06 },
  crab: { emoji: "", name: "", chance: 0.07 },
};

// Every pen pal has their own handwriting and ink; every card its own paper, border, doodles and picture side
const PENS = ["Caveat", "Patrick Hand", "Indie Flower", "Gochi Hand", "Kalam", "Shadows Into Light", "Reenie Beanie", "Nanum Pen Script", "Gloria Hallelujah", "Covered By Your Grace"];
const PEN_INKS = ["#23305e", "#1d4f8a", "#3a2a6b", "#7a2a3a", "#1f5a3a", "#2b2b2b", "#8a3a1a", "#0f6a7a"];
const DOODLES = ["❤️", "☀️", "🌺", "⭐", "🐟", "🌴", "😎", "🍕", "🐱", "🌈", "✈️", "🎈", "🍦", "🐚", "🦩", "🍉", "🌻", "🎵", "🙃", "👋"];
const PAPERS = 7, BORDERS = 5, FRONTS = 4;

function cardStyle(no, from) {
  const r = seeded(hashStr(`style:${no}:${from}`));
  const doodles = [];
  const n = Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    doodles.push({ e: DOODLES[Math.floor(r() * DOODLES.length)], x: Math.round(4 + r() * 50), y: Math.round(60 + r() * 34), r: Math.round(r() * 50 - 25), s: Math.round(5 + r() * 4) });
  }
  return {
    paper: Math.floor(r() * PAPERS), border: Math.floor(r() * BORDERS), front: Math.floor(r() * FRONTS),
    tilt: Math.round((r() * 3 - 1.5) * 10) / 10, stain: r() < 0.25 ? { x: Math.round(10 + r() * 70), y: Math.round(10 + r() * 70) } : null,
    doodles,
  };
}

function applyCardStyle(card) {
  const st = card.style;
  const pen = seeded(hashStr("pen:" + card.from));
  postcard.style.setProperty("--pen", `"${PENS[Math.floor(pen() * PENS.length)]}"`);
  postcard.style.setProperty("--pen-ink", PEN_INKS[Math.floor(pen() * PEN_INKS.length)]);
  postcard.style.setProperty("--tilt", st.tilt + "deg");
  postcard.dataset.paper = st.paper;
  postcard.dataset.border = st.border;
  postcard.dataset.front = st.front;
  $("doodles").innerHTML = st.doodles.map((d) =>
    `<span style="left:${d.x}%;top:${d.y}%;transform:rotate(${d.r}deg);font-size:${d.s}cqw">${d.e}</span>`).join("") +
    (st.stain ? `<i class="stain" style="left:${st.stain.x}%;top:${st.stain.y}%"></i>` : "");
}

function makeCard(from, prev) {
  const f = BY_CODE[from];
  let to;
  do { to = pick(COUNTRIES).code; } while (to === from || to === prev);
  const st = pickStamp(f);
  const angle = rand() * Math.PI * 2;
  const r = Math.pow(rand(), 0.75);
  const card = {
    no: ++S.cardNo, from, to, prev, stampId: st.id,
    mark: {
      code: rand() < 0.3 ? from : pick(COUNTRIES).code,
      year: rand() < 0.15 ? st.year : ri(st.year, NOW_YEAR),
      day: ri(1, 28), mon: ri(0, 11),
      ox: Math.round(Math.cos(angle) * r * 46 * 10) / 10,
      oy: Math.round(Math.sin(angle) * r * 56 * 10) / 10,
      rot: ri(-30, 30), ink: pick(MARK_INKS),
    },
    glue: Math.round((0.8 + rand() * 0.6) * 100) / 100,
    tears: [], done: false,
    text: writeText(f, BY_CODE[to], prev ? BY_CODE[prev] : null),
    hue: ri(0, 359),
  };
  card.mods = Object.keys(MODS).filter((k) => rand() < MODS[k].chance);
  if (card.mods.includes("sticky") && card.mods.includes("wet")) card.mods = card.mods.filter((k) => k !== "wet");
  if (card.mods.includes("sticky")) card.glue = Math.round(card.glue * 1.4 * 100) / 100;
  if (card.mods.includes("wet")) card.glue = Math.round(card.glue * 0.65 * 100) / 100;
  card.shiny = card.mods.includes("shiny");
  card.method = pickMethod();
  card.loose = 0;
  card.style = cardStyle(card.no, from);
  return card;
}

// ---------- Desk ----------

const stampEl = $("stamp");
const workEl = $("work");
const postcard = $("postcard");
let flipped = false;
// The dotted tear-out line around the stamp, in stamp units (the stamp is 100 × 120)
const CUT = { x0: -8, y0: -8, x1: 108, y1: 128 };
const CUT_W = CUT.x1 - CUT.x0, CUT_H = CUT.y1 - CUT.y0, CUT_P = 2 * (CUT_W + CUT_H);
const BINS = 42, BIN_NEED = 39;
// Corners are peeled one by one: top left, top right, bottom right, bottom left
const CORNERS = [[0, 0], [100, 0], [100, 120], [0, 120]];
const peel = {
  strain: 0, maxStrain: 0, active: false, x: 0, y: 0, t: 0, lastSound: 0, lastNag: 0,
  bins: [], devSum: 0, devLen: 0, inside: 0, grab: false,
  bits: [], pull: 0, streak: 0, streakLevel: 0, snip: false, angle: 0, lastSnip: 0, lastBin: null,
  temp: 0, heating: false, marker: 0, mdir: 1, mspeed: 0, tdir: 0, trun: 0,
};
// Steady-hand streaks while cutting: units traced along the line without slipping off or rushing
const STREAKS = [[70, "Steady!"], [180, "Smooth hands!"], [320, "Like butter! 🧈"]];

// After the cut-out, each card picks one way to get the stamp off the paper
const METHODS = {
  corners: { name: "PEEL THE CORNERS", emoji: "🤏", weight: 3, hint: "② Peel it: drag from the glowing corner toward the middle, gently. Corner by corner." },
  steam: { name: "STEAM IT", emoji: "♨️", weight: 2, hint: "② Steam it: hold down to heat the kettle. Keep the thermometer in the green zone. Too hot and it curls!" },
  rhythm: { name: "WIGGLE IT LOOSE", emoji: "🎯", weight: 2, hint: "② Wiggle it: tap when the marker is in the green zone. It gets faster!" },
  tickle: { name: "TICKLE IT OFF", emoji: "🪶", weight: 2, hint: "② Tickle it: rub quickly back and forth over the stamp until it laughs itself off the card." },
};
const methodOf = (card) => (card && METHODS[card.method] ? card.method : "corners");
function pickMethod() {
  const keys = Object.keys(METHODS);
  let r = rand() * keys.reduce((n, k) => n + METHODS[k].weight, 0);
  for (const k of keys) { r -= METHODS[k].weight; if (r <= 0) return k; }
  return "corners";
}

const phase = () => !S.card ? "none" : S.card.done || S.card.destroyed ? "done" : S.card.cut == null ? "cut" : "peel";
const activeCorner = () => S.card.corners.findIndex((c) => c < 1);

// The picture side comes in a few layouts
function frontHtml(card, st, f) {
  const motif = look(st).motif;
  const kind = card.style ? card.style.front : 0;
  if (kind === 1) {
    return `<div class="front-polaroid" style="--h:${card.hue}">
      <div class="pola p1"><div class="pola-pic" style="--h:${card.hue}"><span>${motif}</span></div><i>${esc(f.city)}!</i></div>
      <div class="pola p2"><div class="pola-pic" style="--h:${(card.hue + 140) % 360}"><span>${flag(f.code)}</span></div><i>wish you were here</i></div>
      <div class="pola-title">${esc(f.name)}</div></div>`;
  }
  if (kind === 2) {
    const letters = [...f.name.toUpperCase()].map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join("");
    return `<div class="front-retro" style="--h:${card.hue}">
      <div class="retro-sun"></div><div class="retro-stripes"></div>
      <div class="retro-greet"><small>Greetings from</small><b>${letters}</b></div><span class="retro-motif">${motif}</span></div>`;
  }
  if (kind === 3) {
    return `<div class="front-night" style="--h:${card.hue}">
      <span class="night-moon">🌙</span><span class="night-motif">${motif}</span>
      <div class="greet"><small>Good night from</small><b>${esc(f.name)}</b><small>${esc(f.city)} ✨</small></div>
      <span class="front-flag">${flag(f.code)}</span></div>`;
  }
  return `<div class="front-sky" style="--h:${card.hue}">
      <span class="front-sun"></span>
      <span class="front-motif">${motif}</span>
      <div class="greet"><small>Greetings from</small><b>${esc(f.name)}</b><small>${esc(f.city)}</small></div>
      <span class="front-flag">${flag(f.code)}</span>
    </div>`;
}

function renderCard() {
  const card = S.card;
  const st = STAMPS[card.stampId];
  const f = BY_CODE[card.from], t = BY_CODE[card.to];
  const text = card.text;
  if (!card.corners) card.corners = [0, 0, 0, 0];
  $("pc-text").innerHTML = text.lines.map(esc).join(" ") +
    (text.ps ? `<span class="ps">${esc(text.ps)}</span>` : "") +
    `<span class="sign">${esc(text.sign).replace("\n", "<br>")}</span>`;
  $("to-name").textContent = t.person;
  $("to-city").textContent = t.city;
  $("to-country").innerHTML = `${esc(t.name.toUpperCase())} ${flagHtml(t.code)}`;
  stampEl.innerHTML = stampSVG(st, { mark: card.mark, tears: card.tears });
  $("card-mark").innerHTML = cardMarkSVG(card.mark);
  $("pc-front").innerHTML = frontHtml(card, st, f);
  $("card-no").innerHTML = `Postcard #${card.no} · from ${flagHtml(f.code)} <b>${esc(f.person)}</b>, ${esc(f.city)}`;
  const mods = card.mods || [];
  $("card-mods").innerHTML = mods.filter((k) => MODS[k] && MODS[k].emoji)
    .map((k) => `<span class="mod mod-${k}" title="${esc(MODS[k].name)}">${MODS[k].emoji} ${esc(MODS[k].name)}</span>`).join("");
  for (const k of ["wet", "sandy", "shiny", "sticky"]) postcard.classList.toggle("mod-" + k, mods.includes(k));
  gustIn = 4000 + rand() * 4000;
  if (mods.includes("shiny") && !card.done) setTimeout(sfx.sparkle, 400);
  const chain = [...S.chain.slice(-5), card.from, card.to];
  $("chain").innerHTML = chain.map((c, i) => `<span class="${i === chain.length - 1 ? "dest" : ""}" title="${esc(BY_CODE[c]?.name || "?")}">${flag(c)}</span>`).join("<i>›</i>");

  Object.assign(peel, {
    strain: 0, maxStrain: 0, active: false, bins: new Array(BINS).fill(false), devSum: 0, devLen: 0, inside: 0, grab: false,
    bits: [], pull: 0, streak: 0, streakLevel: 0, lastBin: null,
    temp: 0, heating: false, marker: 0, mdir: 1, mspeed: 0.0009 * (1 + (STAMPS[card.stampId].year < 1900 ? 0.3 : 0)), tdir: 0, trun: 0,
  });
  if (!card.method) card.method = "corners";
  if (!card.style) card.style = cardStyle(card.no, card.from);
  applyCardStyle(card);
  $("work-bits").innerHTML = "";
  drawScissors(null);
  requestAnimationFrame(fitMessage);
  stampEl.classList.toggle("gone", card.done);
  stampEl.classList.remove("peeled", "tense");
  stampEl.style.setProperty("--lift", 0);
  stampEl.disabled = card.done;
  $("stamp-spot").classList.toggle("cut", card.cut != null);
  $("glue").classList.toggle("show", card.done);
  $("next-btn").disabled = !card.done;
  postcard.classList.remove("flipped");
  flipped = false;
  setHint();
  renderWork();
  updateMeters();
}

function setHint() {
  const ph = phase();
  $("hint").textContent = ph === "done" ? "Stamp's in the album. On to the next postcard!" :
    ph === "cut" ? "① Tear it out: trace the dotted line around the stamp, slowly. Don't cut into the stamp!" :
    METHODS[methodOf(S.card)].hint;
  $("m-peel-label").textContent = ph === "cut" ? "CUT" : "PEEL";
}

// Long messages shrink until they fit on the card
function fitMessage() {
  const p = $("pc-text");
  let size = 3.6;
  p.style.fontSize = size + "cqw";
  while (p.parentElement.scrollHeight > p.parentElement.clientHeight + 1 && size > 2.2) {
    size -= 0.15;
    p.style.fontSize = size + "cqw";
  }
}

function cutPoint(s) {
  s = ((s % CUT_P) + CUT_P) % CUT_P;
  if (s < CUT_W) return [CUT.x0 + s, CUT.y0];
  s -= CUT_W;
  if (s < CUT_H) return [CUT.x1, CUT.y0 + s];
  s -= CUT_H;
  if (s < CUT_W) return [CUT.x1 - s, CUT.y1];
  s -= CUT_W;
  return [CUT.x0, CUT.y1 - s];
}

// Distance to the tear-out line and how far along it (0 … CUT_P) the nearest point is
function cutNearest(x, y) {
  const cx = Math.max(CUT.x0, Math.min(CUT.x1, x)), cy = Math.max(CUT.y0, Math.min(CUT.y1, y));
  const sides = [
    [Math.hypot(x - cx, y - CUT.y0), cx - CUT.x0],
    [Math.hypot(x - CUT.x1, y - cy), CUT_W + cy - CUT.y0],
    [Math.hypot(x - cx, y - CUT.y1), CUT_W + CUT_H + CUT.x1 - cx],
    [Math.hypot(x - CUT.x0, y - cy), 2 * CUT_W + CUT_H + CUT.y1 - cy],
  ];
  const [d, s] = sides.reduce((a, b) => (b[0] < a[0] ? b : a));
  return { d, s };
}

// Which way is "outward" from the tear-out line at a point along it
function cutNormal(s) {
  s = ((s % CUT_P) + CUT_P) % CUT_P;
  if (s < CUT_W) return [0, 1];
  if (s < CUT_W + CUT_H) return [1, 0];
  if (s < 2 * CUT_W + CUT_H) return [0, 1];
  return [1, 0];
}
// The same wobble every time for the same spot of the same card
const jitter = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233 + S.card.no * 3.17) * 43758.5453; return v - Math.floor(v) - 0.5; };
const f1 = (v) => v.toFixed(1);

// The dotted line, the ripped part of it (white fibers around a dark gap) and the scissors;
// later the corners: glue left on the card, stretchy glue strands and the folded-back flap
function renderWork() {
  const ph = phase();
  let html = "";
  if (ph === "cut") {
    html += `<rect class="cutline" x="${CUT.x0}" y="${CUT.y0}" width="${CUT_W}" height="${CUT_H}"/>`;
    const L = CUT_P / BINS;
    let fibers = "", gaps = "", hairs = "";
    peel.bins.forEach((on, i) => {
      if (!on) return;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const s = i * L + (k / 6) * L * 0.999;
        const [px, py] = cutPoint(s);
        const [nx, ny] = cutNormal(s);
        const j = jitter(i, k) * 1.8;
        pts.push(`${f1(px + nx * j)},${f1(py + ny * j)}`);
      }
      fibers += `<polyline points="${pts.join(" ")}"/>`;
      gaps += `<polyline points="${pts.join(" ")}"/>`;
      const s = i * L + L * (0.3 + 0.4 * (jitter(i, 9) + 0.5));
      const [hx, hy] = cutPoint(s), [nx, ny] = cutNormal(s), side = jitter(i, 11) > 0 ? 1 : -1;
      hairs += `<line x1="${f1(hx)}" y1="${f1(hy)}" x2="${f1(hx + nx * side * 2.6 + ny * 0.8)}" y2="${f1(hy + ny * side * 2.6 + nx * 0.8)}"/>`;
    });
    html += `<g class="tear-fiber">${fibers}</g><g class="tear-hair">${hairs}</g><g class="tear-gap">${gaps}</g>`;
    const next = peel.bins.indexOf(false);
    if (next >= 0 && !peel.active) {
      const [nx, ny] = cutPoint(next * L + L / 2);
      html += `<text class="scissors" x="${f1(nx)}" y="${f1(ny + 3)}" text-anchor="middle">✂</text>`;
    }
  } else if (ph === "peel" && methodOf(S.card) !== "corners") {
    html += minigameSVG();
  } else if (ph === "peel") {
    const a = activeCorner();
    S.card.corners.forEach((c, i) => {
      const pull = i === a ? peel.pull : 0;
      if (c <= 0 && pull <= 0.3) return;
      const [cx, cy] = CORNERS[i];
      const k = 4 + c * 22 + pull, sx = cx ? -1 : 1, sy = cy ? -1 : 1;
      const tx = cx + sx * k, ty = cy + sy * k;
      html += `<polygon class="residue" points="${cx},${cy} ${f1(tx)},${cy} ${cx},${f1(ty)}"/>`;
      if (i === a) {
        // Glue strands between the card and the underside of the flap, stretching as you pull
        for (const f of [0.25, 0.5, 0.75]) {
          const bx = cx + sx * k * f * 0.5, by = cy + sy * k * (1 - f) * 0.5;
          const ex = tx - sx * k * (1 - f) * 0.5, ey = ty - sy * k * f * 0.5;
          const sag = 1 + pull * 0.25;
          html += `<path class="strand" d="M${f1(bx)},${f1(by)} Q${f1((bx + ex) / 2 + sag)},${f1((by + ey) / 2 + sag)} ${f1(ex)},${f1(ey)}"/>`;
        }
      }
      html += `<polygon class="curl" points="${f1(tx)},${cy} ${cx},${f1(ty)} ${f1(tx)},${f1(ty)}"/>`;
    });
    if (a >= 0) html += `<circle class="handle" cx="${CORNERS[a][0]}" cy="${CORNERS[a][1]}" r="7"/>`;
  }
  $("work-main").innerHTML = html;
}

// Paper crumbs and glue flecks: x, y in stamp units, speeds in units per ms
function spawnBits(x, y, n, { colors = ["#fbf6ea", "#efe2c4", "#fff"], spread = 1, up = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    peel.bits.push({
      x, y, vx: (rand() - 0.5) * 0.14 * spread, vy: (rand() - 0.75) * 0.14 * spread - up,
      r: rand() * 360, vr: (rand() - 0.5) * 0.7, age: 0, life: 700 + rand() * 700,
      w: 1 + rand() * 2, c: pick(colors),
    });
  }
  if (peel.bits.length > 160) peel.bits.splice(0, peel.bits.length - 160);
}
function stepBits(dt) {
  if (!peel.bits.length) return;
  for (const b of peel.bits) {
    b.age += dt;
    if (!b.emoji) b.vy += 0.0004 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.r += b.vr * dt;
  }
  peel.bits = peel.bits.filter((b) => b.age < b.life);
  $("work-bits").innerHTML = peel.bits.map((b) => b.emoji
    ? `<text class="laugh" x="${f1(b.x)}" y="${f1(b.y)}" opacity="${(1 - b.age / b.life).toFixed(2)}" text-anchor="middle">${b.emoji}</text>`
    : `<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.w * 0.6)}" fill="${b.c}" opacity="${(1 - b.age / b.life).toFixed(2)}" transform="rotate(${Math.round(b.r)} ${f1(b.x)} ${f1(b.y)})"/>`).join("");
}

// The scissors follow your finger while you cut, pointing the way you go
function drawScissors(x, y, angle) {
  $("work-cursor").innerHTML = x == null ? "" :
    `<text class="cursor-sc${peel.snip ? " shut" : ""}" x="${f1(x)}" y="${f1(y)}" text-anchor="middle" dominant-baseline="central" transform="rotate(${Math.round(angle + 180)} ${f1(x)} ${f1(y)})">✂</text>`;
}

function progress() {
  const ph = phase();
  if (ph === "cut") return Math.min(1, peel.bins.filter(Boolean).length / BIN_NEED);
  if (ph === "peel") {
    if (methodOf(S.card) !== "corners") return Math.min(1, S.card.loose || 0);
    return S.card.corners.reduce((n, c) => n + Math.min(1, c), 0) / 4;
  }
  return ph === "done" ? 1 : 0;
}

function updateMeters() {
  const p = progress() * 100;
  $("peel-fill").style.width = p + "%";
  $("peel-pct").textContent = Math.floor(p) + "%";
  $("strain-fill").style.width = Math.min(100, peel.strain) + "%";
  $("strain-fill").classList.toggle("hot", peel.strain > 65);
  const t = S.card ? S.card.tears.length : 0;
  const cond = t <= 3 ? [35, 24, 13, 4][t] : 4 - (t - 3) * 8;
  $("tears").textContent = t ? `✂${t} ${cond > 0 ? "+" : ""}${cond}` : "♡";
  $("tears").classList.toggle("neg", cond < 0);
  $("tears").title = t ? `${t} tear${t > 1 ? "s" : ""}: ${condName(t)}` : "No tears yet: mint";
  updateQuick();
  if (phase() !== "peel") return;
  stampEl.style.setProperty("--lift", (p / 100).toFixed(3));
  stampEl.style.setProperty("--steam", methodOf(S.card) === "steam" ? peel.temp.toFixed(2) : 0);
  stampEl.classList.toggle("tense", peel.strain > 70);
}

function fragility(st) { return 1 + (NOW_YEAR - st.year) / 150; }
// Sand in the glue makes everything scratchier
function cardFrag() { return fragility(STAMPS[S.card.stampId]) * (hasMod("sandy") ? 1.25 : 1); }
const hasMod = (k) => !!(S.card && S.card.mods && S.card.mods.includes(k));

function nag(text) {
  const now = performance.now();
  if (now - peel.lastNag < 1400) return;
  peel.lastNag = now;
  toast(text, "bad");
}
function rustle(speed) {
  const now = performance.now();
  if (now - peel.lastSound < 45) return;
  peel.lastSound = now;
  sfx.peel(speed);
}

// ① Tracing the tear-out line: dist in stamp units, speed in units per ms
function cutStep(x, y, dist, speed) {
  const frag = cardFrag();
  // Drawing across the stamp itself cuts into it
  if (x > 5 && x < 95 && y > 5 && y < 115) {
    peel.inside += dist;
    peel.streak = 0; peel.streakLevel = 0;
    if (peel.inside > 18) { peel.inside = 0; tear("✂ you cut into the stamp!"); }
    updateMeters();
    return;
  }
  const { d, s } = cutNearest(x, y);
  const safe = 0.45 / Math.sqrt(frag);
  peel.strain += Math.max(0, speed - safe) * dist * 1.6 * frag;
  if (d < 16) { peel.devSum += d * dist; peel.devLen += dist; }
  if (d < 9) {
    const now = performance.now();
    if (now - peel.lastSound > 40) { sfx.rip(progress(), speed); peel.lastSound = now; }
    if (rand() < 0.35) spawnBits(x, y, 1);
    if (speed > safe * 2.4) {
      nag("Too fast! Tear it slowly");
      peel.streak = 0; peel.streakLevel = 0;
    } else {
      const b = Math.floor(s / (CUT_P / BINS)) % BINS;
      // Bridge small skips between the last stretch you tore and this one
      const gap = peel.lastBin == null ? 0 : (b - peel.lastBin + BINS) % BINS;
      const back = peel.lastBin == null ? 0 : (peel.lastBin - b + BINS) % BINS;
      if (gap > 1 && gap <= 3) for (let k = 1; k < gap; k++) peel.bins[(peel.lastBin + k) % BINS] = true;
      if (back > 1 && back <= 3) for (let k = 1; k < back; k++) peel.bins[(b + k) % BINS] = true;
      peel.lastBin = b;
      if (!peel.bins[b]) { peel.bins[b] = true; spawnBits(x, y, 3); renderWork(); }
      peel.streak += dist;
      const next = STREAKS[peel.streakLevel];
      if (next && peel.streak >= next[0]) {
        peel.streakLevel++;
        toast(next[1], "good");
        tone(660 + peel.streakLevel * 220, 0.18, { type: "triangle", vol: 0.1 });
        spawnBits(x, y, 8, { colors: ["#ffd23f", "#29c4e0", "#ff6b6b"], spread: 1.6 });
        if (peel.streakLevel === STREAKS.length) egg("butter", "Like butter: one long, perfectly steady cut");
      }
    }
  } else if (d > 12) {
    peel.streak = 0; peel.streakLevel = 0;
  }
  peel.maxStrain = Math.max(peel.maxStrain, peel.strain);
  if (peel.strain >= 100) tear();
  if (peel.bins.filter(Boolean).length >= BIN_NEED) finishCut();
  updateMeters();
}

function finishCut() {
  const card = S.card;
  const dev = peel.devLen ? peel.devSum / peel.devLen : 0;
  card.cut = Math.round(Math.max(-1, Math.min(1, 1 - dev / 10)) * 100) / 100;
  peel.active = false;
  peel.strain = 0;
  drawScissors(null);
  noise(0.45, { freq: 2600, q: 0.8, vol: 0.3 });
  sfx.pop();
  toast(`✂ Cut out! ${cutName(card.cut)}`, card.cut >= 0.8 ? "good" : "");
  // The piece pops loose with a puff of paper crumbs all along the torn edge
  for (let i = 0; i < 24; i++) {
    const [px, py] = cutPoint((i / 24) * CUT_P);
    spawnBits(px, py, 2, { spread: 1.8, up: 0.05 });
  }
  const spot = $("stamp-spot");
  spot.classList.add("cut");
  spot.classList.remove("popout"); void spot.offsetWidth; spot.classList.add("popout");
  setTimeout(() => spot.classList.remove("popout"), 800);
  if (hasMod("crab")) setTimeout(stowaway, 500);
  const m = METHODS[methodOf(card)];
  setTimeout(() => { toast(`${m.emoji} ${m.name}!`, "good"); sfx.pop(); }, hasMod("crab") ? 1600 : 700);
  save();
  setHint();
  renderWork();
  updateMeters();
}

// ② Peeling a corner: only strokes that start at the glowing corner and pull toward the middle count
function cornerStep(x, y, dx, dy, dist, speed) {
  if (!peel.grab) return;
  const card = S.card;
  const frag = cardFrag();
  const a = activeCorner();
  const [cx, cy] = CORNERS[a];
  if (Math.hypot(x - cx, y - cy) > 70) { peel.grab = false; return; }
  const ix = 50 - cx, iy = 60 - cy;
  const dot = (dx * ix + dy * iy) / (Math.hypot(ix, iy) * dist);
  const safe = 0.3 / Math.sqrt(frag);
  if (dot > 0.55) {
    card.corners[a] = Math.min(1, card.corners[a] + dist * dot / (110 * card.glue));
    peel.strain += dist * 0.05 + Math.max(0, speed - safe) * dist * 1.4 * frag;
    // The flap stretches with your pull and springs back when you let go
    peel.pull = Math.min(12, peel.pull + dist * dot * 0.18);
    rustle(speed);
    if (rand() < 0.08) jelly();
    if (rand() < 0.15) spawnBits(cx + (50 - cx) * 0.2, cy + (60 - cy) * 0.2, 1, { colors: ["#f3e3a8", "#fff6d0"] });
  } else {
    peel.strain += dist * 0.4;
    nag("Wrong way! Pull toward the middle");
  }
  peel.maxStrain = Math.max(peel.maxStrain, peel.strain);
  if (peel.strain >= 100) tear();
  if (card.corners[a] >= 1) cornerDone(a);
  renderWork();
  updateMeters();
}

function cornerDone(a) {
  peel.grab = false;
  peel.pull = 0;
  // The glue strands snap
  sfx.snap();
  const [cx, cy] = CORNERS[a];
  spawnBits(cx + (50 - cx) * 0.25, cy + (60 - cy) * 0.25, 10, { colors: ["#f3e3a8", "#fff6d0", "#fbf6ea"], spread: 1.5 });
  tone(700 + a * 150, 0.15, { type: "triangle" });
  save();
  jelly(true);
  if (a === 3) finishPeel();
  else toast(["Corner one!", "Two down!", "One to go!"][a], "good");
}

function tear(msg) {
  const card = S.card;
  card.tears.push({ s: ri(0, 3), p: Math.round(rand() * 100) / 100 });
  peel.strain = 35;
  const n = card.tears.length;
  sfx.tear(n);
  toast(msg ? msg : n <= TEAR_JOKES.length ? TEAR_JOKES[n - 1] : pick(TEAR_QUIPS), "bad");
  const st = STAMPS[card.stampId];
  stampEl.innerHTML = stampSVG(st, { mark: card.mark, tears: card.tears });
  // Shreds of the stamp itself fly off where it tore
  const t = card.tears[card.tears.length - 1];
  const along = 18 + t.p * 52;
  const [tx, ty] = [[along, 2], [98, along + 10], [along, 118], [2, along + 10]][t.s];
  spawnBits(tx, ty, 14, { colors: [look(st).ink, look(st).tint, "#fbf6ea"], spread: 2.2, up: 0.04 });
  peel.streak = 0; peel.streakLevel = 0;
  postcard.classList.remove("shake"); void postcard.offsetWidth; postcard.classList.add("shake");
  save();
  if (n >= 4) egg("confetti", "Confetti maker: that stamp is more hole than stamp");
  if (n >= DESTROY_AT) destroyStamp();
}

// Too many tears: the stamp falls apart in your hands, and goes into the album anyway
function destroyStamp() {
  const card = S.card;
  if (card.done || card.destroyed) return;
  const st = STAMPS[card.stampId];
  card.destroyed = true;
  card.cut = Math.min(card.cut ?? -0.5, -0.5);
  card.corners = [1, 1, 1, 1];
  peel.active = false;
  peel.maxStrain = 100;
  stampEl.classList.add("crumble");
  spawnBits(50, 60, 60, { colors: [look(st).ink, look(st).tint, "#fbf6ea", "#222"], spread: 3, up: 0.06 });
  sfx.sadTrombone();
  toast("💥 KAPUTT. The stamp has left the building.", "bad");
  egg("destroyer", "Destroyer: you tore a stamp to pieces");
  setTimeout(() => { stampEl.classList.remove("crumble"); finishPeel(); }, 900);
}

function isToday(mark) {
  const d = new Date();
  return mark.day === d.getDate() && mark.mon === d.getMonth();
}

function finishPeel() {
  const card = S.card;
  if (card.done) return;
  card.done = true;
  card.today = isToday(card.mark);
  peel.active = false;
  const st = STAMPS[card.stampId];
  const sc = score(st, card.mark, card.tears, card);
  const old = S.album[st.id];
  let status;
  if (!old) status = "NEW STAMP!";
  else if (sc.q > old.q) status = "BETTER COPY!";
  else status = "DUPLICATE";
  if (!old || sc.q > old.q) {
    S.album[st.id] = {
      q: sc.q, tears: card.tears, mark: card.mark, cut: card.cut, to: card.to, today: card.today, shiny: card.shiny, destroyed: !!card.destroyed, sp: sc.sp,
      n: (old ? old.n : 0) + 1, from: card.from, t: Date.now(),
    };
  } else old.n++;
  S.total++;
  S.pals[card.from] = (S.pals[card.from] || 0) + 1;
  save();
  updateChips();

  sfx.pop();
  stampEl.classList.add("peeled");
  $("work-main").innerHTML = "";
  spawnBits(50, 60, 26, { colors: ["#f3e3a8", "#fff6d0", look(st).tint], spread: 2.4, up: 0.08 });
  $("glue").classList.add("show");
  stampEl.disabled = true;
  $("next-btn").disabled = false;
  $("hint").textContent = "Got it!";
  // Skip the show if the player already moved on to the next card
  const result = () => { if (S.card === card) showResult(st, sc, status, old); };
  setTimeout(() => {
    if (S.card !== card) return;
    if (sc.sp.length || sc.q < 0) playAlerts(sc, result);
    else result();
  }, 650);
}

// Crazy alerts: one loud banner per special, then the combo (if any) even louder. A tap skips them.
function playAlerts(sc, done) {
  // Good news first, then the bad news
  const items = sc.sp.map((k) => SPECIAL[k]).sort((a, b) => (b.pts > 0) - (a.pts > 0));
  if (sc.combo) items.splice(items.filter((it) => it.pts > 0).length, 0, { name: sc.combo.name, emoji: sc.combo.emoji, text: "COMBO!", pts: 0, mega: true });
  if (sc.q < 0) items.push({ name: "PHILATELIC CATASTROPHE", emoji: "☠️", text: pick(DOOM_JOKES), pts: 0, mega: true, doom: true });
  const el = $("alert");
  let i = 0, timer = 0;
  const finish = () => {
    clearTimeout(timer);
    el.hidden = true;
    el.onclick = null;
    document.body.classList.remove("quake");
    done();
  };
  const show = () => {
    if (i >= items.length) return finish();
    const it = items[i++];
    el.hidden = false;
    const doom = it.doom || it.pts < 0;
    el.className = "alert" + (it.mega ? " mega" : "") + (doom ? " doom" : "");
    el.innerHTML = `<div class="alert-rays"></div><div class="alert-inner">
      <span class="alert-emoji">${it.emoji}</span><b class="alert-name">${esc(it.name)}</b>
      <span class="alert-text">${esc(it.text)}${it.pts ? ` · ${it.pts > 0 ? "+" : ""}${it.pts}` : ""}</span></div>`;
    document.body.classList.remove("quake"); void document.body.offsetWidth; document.body.classList.add("quake");
    if (doom) { sfx.sadTrombone(); skulls(it.mega ? 40 : 14); }
    else { fanfare(it.mega); confetti(it.mega ? 120 : 45); }
    timer = setTimeout(show, it.mega ? 2300 : 1400);
  };
  el.onclick = finish;
  show();
}
// Falling skulls and broken hearts instead of confetti
function skulls(n) {
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "confetti skull";
    c.textContent = pick(["💀", "💔", "🪦", "😭", "🗑️"]);
    c.style.left = rand() * 100 + "vw";
    c.style.animationDuration = 2 + rand() * 2 + "s";
    c.style.animationDelay = rand() * 0.5 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}
function fanfare(mega) {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, { type: "triangle", vol: 0.08, delay: i * 0.07 }));
  sfx.whoosh();
  tone(1047, 0.5, { delay: 0.3, vol: 0.06, wobble: 25 });
  if (mega) [1319, 1568, 2093, 2637].forEach((f, i) => tone(f, 0.5, { type: "triangle", vol: 0.09, delay: 0.3 + i * 0.12 }));
}

function showResult(st, sc, status, old) {
  const card = S.card;
  const [, gname, gstars] = gradeOf(sc.q);
  $("r-status").textContent = status;
  $("r-status").className = "r-status " + (status === "DUPLICATE" ? "dup" : "new");
  $("r-stamp").innerHTML = stampSVG(st, { mark: card.mark, tears: card.tears });
  $("r-title").textContent = st.desc;
  $("r-id").innerHTML = `#${st.id} · ${flagHtml(st.code)} ${esc(BY_CODE[st.code].name)} · <span class="rar ${st.rarity}">${RARITY[st.rarity].name}</span>`;
  $("r-grade").innerHTML = `<span class="stars">${stars(gstars)}</span> <b>${gname}</b> <span class="q${sc.q < 0 ? " neg" : ""}">${sc.q}/100</span>` +
    (status === "DUPLICATE" ? `<small>your album copy: ${old.q}/100, kept</small>` : status === "BETTER COPY!" ? `<small>was ${old.q}/100</small>` : "") +
    `<small class="quip">“${esc(pick(GRADE_QUIPS[gname]))}”</small>`;
  $("r-rows").innerHTML = breakdownRows(st, card.mark, sc);
  $("result").classList.toggle("doom", sc.q < 0);
  openModal("result");
  if (gstars < 0) sfx.sadTrombone(); else sfx.chime(gstars);
  if (sc.q < 0) egg("catastrophe", "Philatelic catastrophe: quality below zero");
  if (gstars >= 4) { toast(gname + "!", "good"); confetti(gstars * 12); }
  if (sc.q >= 90) egg("gem", "Gem hunter: a GEM MINT stamp");
  if (sc.sp.includes("home") && sc.sp.includes("firstday")) egg("dream", "Philatelist's dream: home seal on the first day");
  if (peel.maxStrain < 25) egg("zen", "Zen peeler: barely any strain at all");
  if (st.id === "GB-1840") egg("penny", "The Penny Black! The world's very first stamp");
}

function breakdownRows(st, mark, sc) {
  const sealC = BY_CODE[mark.code];
  const chips = sc.sp.map((k) => `<span class="sp-chip">${SPECIAL[k].emoji} ${SPECIAL[k].name}</span>`).join("");
  return `
    <tr><td>Condition</td><td>${condName(sc.tears)}</td><td>${sc.cond}</td></tr>
    <tr><td>Cut</td><td>${cutName(sc.cut)} (${Math.round(sc.cut * 100)}%)</td><td>${sc.cutPts}</td></tr>
    <tr><td>Luck</td><td>seal ${Math.round(sc.luck * 100)}% centered</td><td>${sc.luckPts}</td></tr>
    <tr><td>Seal</td><td>${flagHtml(mark.code)} ${esc(sealC ? sealC.name : "?")} · ${mark.day} ${MONTHS[mark.mon]} ${mark.year} <small>(issued ${st.year})</small></td><td></td></tr>
    <tr><td>Specials</td><td>${chips || "none"}${sc.combo ? `<div class="combo">${sc.combo.emoji} ${esc(sc.combo.name)}</div>` : ""}</td><td>${sc.spPts}</td></tr>
    <tr class="sum"><td>Quality</td><td></td><td>${sc.q}</td></tr>`;
}

function nextCard() {
  closeModal("result");
  const card = S.card;
  if (!card || !card.done) return;
  S.chain.push(card.from);
  if (S.chain.length > 12) S.chain.splice(0, S.chain.length - 12);
  postcard.classList.add("leave");
  sfx.paper();
  setTimeout(() => {
    S.card = makeCard(card.to, card.from);
    save();
    renderCard();
    postcard.classList.remove("leave");
    postcard.classList.add("arrive");
    setTimeout(() => postcard.classList.remove("arrive"), 600);
    if (S.card.no === 42) egg("answer", "Postcard #42: the answer to everything is stamps");
    if (S.card.no % 7 === 0 || rand() < 0.08) washBottle();
  }, 380);
}

// ---------- Quick rip ----------

// One yank, no minigame. The odds drop for old, rare, already torn or well-glued stamps.
function quickChance(card) {
  const st = STAMPS[card.stampId];
  let c = 0.95 - (NOW_YEAR - st.year) * 0.0032 - (card.glue - 0.8) * 0.45 - card.tears.length * 0.08 -
    { legendary: 0.15, rare: 0.06, uncommon: 0.02, common: 0 }[st.rarity];
  if (card.cut != null) c += 0.08;
  c += (card.corners || []).filter((k) => k >= 1).length * 0.03 + (card.loose || 0) * 0.12;
  if (card.mods && card.mods.includes("sandy")) c -= 0.05;
  return Math.max(0.05, Math.min(0.95, c));
}

function updateQuick() {
  if (peel.rolling) return;
  const btn = $("quick-btn");
  const ph = phase();
  btn.disabled = ph !== "cut" && ph !== "peel";
  if (btn.disabled) { $("quick-pct").textContent = "–"; btn.dataset.odds = ""; return; }
  const c = quickChance(S.card);
  $("quick-pct").textContent = Math.round(c * 100) + "%";
  btn.dataset.odds = c >= 0.7 ? "good" : c >= 0.35 ? "mid" : "bad";
}

function quickRip() {
  const ph = phase();
  if ((ph !== "cut" && ph !== "peel") || flipped || peel.rolling) return;
  audio();
  const card = S.card;
  const chance = quickChance(card);
  const roll = rand();
  peel.rolling = true;
  peel.active = false;
  $("quick-btn").disabled = true;
  // A little drumroll of numbers first
  let n = 0;
  const tick = setInterval(() => {
    $("quick-pct").textContent = ri(1, 99);
    tone(600 + n * 35, 0.05, { vol: 0.04, type: "triangle" });
    n++;
  }, 65);
  setTimeout(() => {
    clearInterval(tick);
    peel.rolling = false;
    const ok = roll < chance;
    const r = Math.round(roll * 100), need = Math.round(chance * 100);
    sfx.whoosh();
    card.corners = [1, 1, 1, 1];
    card.loose = 1;
    if (ok) {
      card.cut = Math.min(card.cut ?? 0.6, 0.6);
      toast(`⚡ Clean rip! rolled ${r}, needed under ${need}`, "good");
      spawnBits(50, 60, 20, { spread: 2.2, up: 0.06 });
      if (chance < 0.25) egg("lucky", "Against the odds: a quick rip under 25% that worked");
    } else {
      const hits = ri(1, 3);
      for (let i = 0; i < hits; i++) card.tears.push({ s: ri(0, 3), p: Math.round(rand() * 100) / 100 });
      if (card.tears.length >= DESTROY_AT) card.destroyed = true;
      card.cut = Math.min(card.cut ?? 0.3, 0.3);
      sfx.tear();
      toast(`💥 RRRIP! rolled ${r}, needed under ${need}`, "bad");
      const st = STAMPS[card.stampId];
      stampEl.innerHTML = stampSVG(st, { mark: card.mark, tears: card.tears });
      spawnBits(50, 60, 30, { colors: [look(st).ink, look(st).tint, "#fbf6ea"], spread: 2.6, up: 0.05 });
      postcard.classList.remove("shake"); void postcard.offsetWidth; postcard.classList.add("shake");
    }
    peel.maxStrain = 100;
    $("stamp-spot").classList.add("cut");
    finishPeel();
    updateQuick();
  }, 750);
}

// ---------- Gimmicks during the work ----------

let gustIn = 5000;
function gimmickStep(dt) {
  if (!hasMod("windy") || flipped || !$("splash").classList.contains("gone")) return;
  const ph = phase();
  if (ph !== "cut" && ph !== "peel") return;
  gustIn -= dt;
  if (gustIn > 0) return;
  gustIn = 4000 + rand() * 6000;
  sfx.whoosh();
  toast("💨 Gust!", "bad");
  postcard.classList.remove("gust"); void postcard.offsetWidth; postcard.classList.add("gust");
  // A gust tugs at the paper; holding on with your finger (dragging right now) makes it worse
  peel.strain += peel.active ? 30 : 14;
  spawnBits(rand() * 100, rand() * 120, 6, { colors: ["#f7d58c", "#e9c27a"], spread: 2 });
  if (peel.strain >= 100) tear("💨 the wind ripped it!");
}

function stowaway() {
  const spot = $("stamp-spot");
  const c = document.createElement("span");
  c.className = "stowaway";
  c.textContent = "🦀";
  spot.appendChild(c);
  tone(1500, 0.05, { type: "triangle", vol: 0.07 }); tone(1700, 0.05, { type: "triangle", vol: 0.07, delay: 0.1 });
  toast("🦀 a tiny stowaway!", "good");
  setTimeout(() => c.remove(), 2600);
  egg("stowaway", "Stowaway: a tiny crab was hiding under the stamp");
}

// ---------- Removal minigames ----------

// A bouncy jelly wobble of the stamp (the picture only, so its corners stay where they are)
function jelly(big) {
  stampEl.classList.remove("jelly", "jelly-big");
  void stampEl.offsetWidth;
  stampEl.classList.add(big ? "jelly-big" : "jelly");
}

function loosen(amount) {
  const card = S.card;
  card.loose = Math.min(1, (card.loose || 0) + amount);
  if (card.loose >= 1) {
    peel.heating = false;
    jelly(true);
    sfx.snap();
    spawnBits(50, 60, 20, { colors: ["#f3e3a8", "#fff6d0", "#fff"], spread: 2, up: 0.05 });
    finishPeel();
  }
}

function minigameDown(m, x, y) {
  if (m === "steam") peel.heating = true;
  else if (m === "rhythm") rhythmTap();
  else if (m === "tickle") Object.assign(peel, { tdir: 0, trun: 0 });
}

function keyMinigame(m, repeat) {
  if (m === "steam") peel.heating = true;
  else if (m === "rhythm" && !repeat) rhythmTap();
  else if (m === "tickle") tickleStep(50, 60, (peel.tdir || 1) * -6, 6);
}

// ♨️ Steam: hold to heat. The stamp loosens only while the thermometer sits in the green zone.
function steamZone(card) {
  if (!card.zone) {
    const lo = 0.45 + rand() * 0.2;
    card.zone = [Math.round(lo * 100) / 100, Math.round((lo + 0.2) * 100) / 100];
  }
  return card.zone;
}

// 🎯 Rhythm: a marker swings along a bar; tap while it is in the zone
function rhythmTap() {
  const card = S.card;
  const hits = card.hits || 0;
  const half = Math.max(0.05, 0.1 - hits * 0.012);
  if (Math.abs(peel.marker - 0.5) < half) {
    card.hits = hits + 1;
    peel.mspeed *= 1.22;
    tone(520 + hits * 90, 0.25, { type: "triangle", vol: 0.1, wobble: 30 });
    toast(pick(["Nice!", "Wiggle!", "Boing!", "Loosening!", "Groovy!"]), "good");
    spawnBits(50, 60, 8, { spread: 1.6 });
    jelly(true);
    loosen(0.2);
  } else {
    peel.strain += 24;
    peel.maxStrain = Math.max(peel.maxStrain, peel.strain);
    tone(160, 0.25, { to: 110, vol: 0.1, wobble: 20 });
    toast(pick(["Missed! 🙃", "Nope!", "Off-beat!", "The stamp laughs at you"]), "bad");
    jelly();
    if (peel.strain >= 100) tear();
  }
  updateMeters();
}

// 🪶 Tickle: every quick change of direction tickles it a bit looser
function tickleStep(x, y, dx, dist) {
  const dir = Math.sign(dx);
  if (!dir) return;
  if (peel.tdir && dir !== peel.tdir && (peel.trun || 0) > 3) {
    const before = S.card.loose || 0;
    loosen(0.03);
    jelly();
    const now = performance.now();
    if (now - peel.lastSound > 90) {
      peel.lastSound = now;
      tone(900 + rand() * 500, 0.09, { type: "triangle", vol: 0.06, wobble: 80 });
    }
    if (rand() < 0.4) peel.bits.push({ x: 50 + (rand() - 0.5) * 60, y: 50 + (rand() - 0.5) * 60, vx: 0, vy: -0.03, r: 0, vr: 0, age: 0, life: 700, w: 0, c: "", emoji: pick(["😆", "🤣", "hihi", "haha", "😂"]) });
    const after = S.card.loose || 0;
    for (const [at, msg] of [[0.25, "hehe…"], [0.5, "HAHA STOP"], [0.75, "I can't— 🤣"]]) if (before < at && after >= at) toast(msg, "good");
    peel.trun = 0;
  }
  if (dir !== peel.tdir) peel.trun = 0;
  peel.tdir = dir;
  peel.trun = (peel.trun || 0) + dist;
  $("work-cursor").innerHTML = `<text class="feather" x="${f1(x)}" y="${f1(y)}" text-anchor="middle" dominant-baseline="central">🪶</text>`;
}

function minigameStep(dt) {
  if (phase() !== "peel" || flipped) return;
  const m = methodOf(S.card);
  if (m === "steam") {
    const [lo, hi] = steamZone(S.card);
    peel.temp = Math.max(0, Math.min(1, peel.temp + (peel.heating ? dt * 0.00045 : -dt * 0.0003)));
    if (peel.temp >= lo && peel.temp <= hi) {
      if (rand() < dt * 0.02) spawnBits(20 + rand() * 60, 118, 1, { colors: ["#ffffff", "#e8f6ff"], spread: 0.4, up: 0.09 });
      loosen(dt * 0.00022);
    } else if (peel.temp > hi + 0.06) {
      peel.strain += dt * 0.07;
      peel.maxStrain = Math.max(peel.maxStrain, peel.strain);
      nag("Too hot! It's curling!");
      if (peel.strain >= 100) tear("♨️ it cooked!");
    }
    renderWork();
    updateMeters();
  } else if (m === "rhythm") {
    if (!peel.mspeed) peel.mspeed = 0.0009;
    peel.marker += peel.mdir * peel.mspeed * dt;
    if (peel.marker > 1) { peel.marker = 1; peel.mdir = -1; }
    if (peel.marker < 0) { peel.marker = 0; peel.mdir = 1; }
    renderWork();
  }
}

function minigameSVG() {
  const card = S.card;
  const m = methodOf(card);
  const loose = card.loose || 0;
  let html = "";
  // Every minigame lifts all four corners a little as the stamp gets looser
  if (loose > 0) {
    CORNERS.forEach(([cx, cy]) => {
      const k = 3 + loose * 14, sx = cx ? -1 : 1, sy = cy ? -1 : 1;
      html += `<polygon class="residue" points="${cx},${cy} ${f1(cx + sx * k)},${cy} ${cx},${f1(cy + sy * k)}"/>`;
      html += `<polygon class="curl" points="${f1(cx + sx * k)},${cy} ${cx},${f1(cy + sy * k)} ${f1(cx + sx * k)},${f1(cy + sy * k)}"/>`;
    });
  }
  if (m === "steam") {
    const [lo, hi] = steamZone(card);
    const H = 112, y0 = 4;
    html += `<rect class="thermo" x="103" y="${y0}" width="7" height="${H}" rx="3.5"/>
      <rect class="thermo-zone" x="103" y="${f1(y0 + H * (1 - hi))}" width="7" height="${f1(H * (hi - lo))}"/>
      <rect class="thermo-fill${peel.temp > hi ? " hot" : ""}" x="104.5" y="${f1(y0 + H * (1 - peel.temp))}" width="4" height="${f1(H * peel.temp)}" rx="2"/>
      <circle class="thermo-bulb${peel.temp > hi ? " hot" : ""}" cx="106.5" cy="${y0 + H + 4}" r="5"/>
      <text class="kettle${peel.heating ? " on" : ""}" x="50" y="131" text-anchor="middle">♨️</text>`;
    if (peel.heating) {
      for (let i = 0; i < 3; i++) {
        const sx = 30 + i * 20, ph = performance.now() / 180 + i;
        html += `<path class="steam" d="M${sx} 124 q${f1(Math.sin(ph) * 4)} -8 0 -16 q${f1(-Math.sin(ph) * 4)} -8 0 -16"/>`;
      }
    }
  } else if (m === "rhythm") {
    const hits = card.hits || 0;
    const half = Math.max(0.05, 0.1 - hits * 0.012);
    html += `<rect class="rbar" x="0" y="123" width="100" height="7" rx="3.5"/>
      <rect class="rzone" x="${f1((0.5 - half) * 100)}" y="123" width="${f1(half * 200)}" height="7" rx="2"/>
      <rect class="rmark" x="${f1(peel.marker * 100 - 1.5)}" y="120" width="3" height="13" rx="1.5"/>
      <text class="rhits" x="50" y="-4" text-anchor="middle">${"●".repeat(hits)}${"○".repeat(Math.max(0, 5 - hits))}</text>`;
  } else if (m === "tickle") {
    html += `<text class="tickle-hint" x="50" y="-4" text-anchor="middle">⇠ rub rub rub ⇢</text>`;
  }
  return html;
}

// ---------- Cutting and peeling input ----------

function toUnits(e) {
  const r = workEl.getBoundingClientRect();
  return [-14 + (e.clientX - r.left) / r.width * 128, -14 + (e.clientY - r.top) / r.height * 148];
}
workEl.addEventListener("pointerdown", (e) => {
  const ph = phase();
  if ((ph !== "cut" && ph !== "peel") || flipped) return;
  e.preventDefault();
  audio();
  workEl.setPointerCapture(e.pointerId);
  const [x, y] = toUnits(e);
  Object.assign(peel, { active: true, x, y, t: performance.now(), inside: 0 });
  if (ph === "peel") {
    const [cx, cy] = CORNERS[Math.max(0, activeCorner())];
    const m = methodOf(S.card);
    if (m === "corners") {
      peel.grab = Math.hypot(x - cx, y - cy) < 34;
      if (!peel.grab) nag("Start at the glowing corner");
    } else minigameDown(m, x, y);
  }
});
workEl.addEventListener("pointermove", (e) => {
  if (!peel.active) return;
  const [x, y] = toUnits(e);
  const now = performance.now();
  const dt = Math.max(8, now - peel.t);
  const dx = x - peel.x, dy = y - peel.y;
  const dist = Math.hypot(dx, dy);
  Object.assign(peel, { x, y, t: now });
  if (dist <= 0) return;
  if (phase() === "cut") {
    if (dist > 0.4) peel.angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (now - peel.lastSnip > 110) { peel.snip = !peel.snip; peel.lastSnip = now; }
    drawScissors(x, y, peel.angle);
    cutStep(x, y, dist, dist / dt);
  }
  else if (phase() === "peel") {
    if (methodOf(S.card) === "corners") cornerStep(x, y, dx, dy, dist, dist / dt);
    else if (methodOf(S.card) === "tickle") tickleStep(x, y, dx, dist);
  }
});
const stopPeel = () => {
  peel.active = false;
  peel.grab = false;
  peel.heating = false;
  $("work-cursor").innerHTML = "";
  drawScissors(null);
  if (phase() === "cut") renderWork();
};
workEl.addEventListener("pointerup", stopPeel);
workEl.addEventListener("pointercancel", stopPeel);
// Keyboard: gentle taps of Space work slowly and safely, holding it down (key repeat) is far too fast
stampEl.addEventListener("keydown", (e) => {
  if (e.key !== " " && e.key !== "Enter") return;
  e.preventDefault();
  audio();
  const ph = phase();
  if (flipped || (ph !== "cut" && ph !== "peel")) return;
  const game = ph === "peel" && methodOf(S.card) !== "corners";
  if (!game) {
    peel.strain += e.repeat ? 28 : 6;
    peel.maxStrain = Math.max(peel.maxStrain, peel.strain);
    rustle(0.2);
    if (peel.strain >= 100) tear();
  }
  if (S.card.done || S.card.destroyed) return;
  if (ph === "cut") {
    const b = peel.bins.indexOf(false);
    if (b >= 0) peel.bins[b] = true;
    peel.devSum += 20; peel.devLen += 10;
    if (peel.bins.filter(Boolean).length >= BIN_NEED) finishCut();
  } else if (methodOf(S.card) === "corners") {
    const a = activeCorner();
    S.card.corners[a] = Math.min(1, S.card.corners[a] + 0.08);
    jelly();
    if (S.card.corners[a] >= 1) cornerDone(a);
  } else {
    keyMinigame(methodOf(S.card), e.repeat);
  }
  renderWork();
  updateMeters();
});
stampEl.addEventListener("keyup", () => { peel.heating = false; });

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(100, now - lastFrame);
  lastFrame = now;
  if (peel.strain > 0 && S.card && !S.card.done) {
    peel.strain = Math.max(0, peel.strain - dt * 0.03);
    updateMeters();
  }
  // A stretched flap springs back once you stop pulling
  if (peel.pull > 0 && !peel.grab) {
    peel.pull = Math.max(0, peel.pull - dt * 0.03);
    renderWork();
  }
  stepBits(dt);
  minigameStep(dt);
  gimmickStep(dt);
  ballStep(dt);
  requestAnimationFrame(frame);
}

// ---------- Album ----------

function albumStats() {
  const ids = Object.keys(S.album);
  const countries = new Set(ids.map((id) => STAMPS[id]?.code).filter(Boolean));
  return { unique: ids.length, countries: countries.size };
}

function updateChips() {
  const a = albumStats();
  $("c-album").textContent = a.unique;
  $("c-catalog").textContent = CATALOG_SIZE.toLocaleString("en");
  $("c-total").textContent = S.total;
  $("c-countries").textContent = a.countries;
  $("c-world").textContent = COUNTRIES.length;
}

function slotHtml(st) {
  const rec = st && S.album[st.id];
  if (!rec) return `<div class="slot unknown" aria-label="Unknown stamp">?</div>`;
  const [, gname, gs] = gradeOf(rec.q);
  return `<button class="slot${rec.destroyed ? " wrecked" : ""}" type="button" data-id="${st.id}" title="${esc(st.desc)} · ${gname}">
    ${stampSVG(st, { mark: rec.mark, tears: rec.tears })}
    <span class="slot-id">${st.id}</span>
    <span class="slot-q g${gs}">${stars(gs)}</span>
  </button>`;
}

let openCountry = null;

function renderAlbum() {
  const a = albumStats();
  $("album-sub").textContent = `${a.unique.toLocaleString("en")} of ${CATALOG_SIZE.toLocaleString("en")} stamps · ${a.countries} of ${COUNTRIES.length} countries · ${S.total} peeled`;
  document.querySelectorAll("#album .tab").forEach((b) => b.classList.toggle("on", b.dataset.sort === S.sort));
  const have = Object.keys(S.album).map((id) => STAMPS[id]).filter(Boolean);
  const missing = CATALOG_SIZE - have.length;
  const rest = `<section class="sec"><h3>? <small>${missing.toLocaleString("en")} stamps still unknown</small></h3><div class="grid"><div class="slot unknown">?</div><div class="slot unknown">?</div><div class="slot unknown">?</div></div></section>`;
  let html = "";

  if (S.sort === "origin") {
    const unknown = [];
    for (const c of COUNTRIES) {
      const got = c.stamps.filter((st) => S.album[st.id]);
      if (!got.length) { unknown.push(c); continue; }
      const open = openCountry === c.code;
      const body = open
        ? c.stamps.map(slotHtml).join("")
        : got.map(slotHtml).join("") + `<button class="slot unknown more" type="button" data-open="${c.code}">? ×${c.stamps.length - got.length}</button>`;
      html += `<section class="sec">
        <h3><button class="c-head" type="button" data-open="${c.code}">${flagHtml(c.code)} ${esc(c.name)} <small>${got.length}/${c.stamps.length} · ${open ? "▾ all, by year" : "▸ show all"}</small></button></h3>
        <div class="grid">${body}</div></section>`;
    }
    html += `<section class="sec"><h3>? <small>${unknown.length} countries still unknown</small></h3>
      <div class="grid">${unknown.map(() => `<div class="slot unknown country">?</div>`).join("")}</div></section>`;
  } else if (S.sort === "year") {
    have.sort((x, y) => x.year - y.year || x.code.localeCompare(y.code));
    const groups = {};
    for (const st of have) (groups[Math.floor(st.year / 10) * 10] ||= []).push(st);
    for (const [dec, list] of Object.entries(groups)) {
      html += `<section class="sec"><h3>${dec}s <small>${list.length}</small></h3><div class="grid">${list.map(slotHtml).join("")}</div></section>`;
    }
    html += rest;
  } else if (S.sort === "quality") {
    have.sort((x, y) => S.album[y.id].q - S.album[x.id].q || x.year - y.year);
    const groups = new Map();
    for (const st of have) {
      const g = gradeOf(S.album[st.id].q);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(st);
    }
    for (const [[, name, gs], list] of groups) {
      html += `<section class="sec"><h3><span class="stars g${gs}">${stars(gs)}</span> ${name} <small>${list.length}</small></h3><div class="grid">${list.map(slotHtml).join("")}</div></section>`;
    }
    html += rest;
  } else if (S.sort === "specials") {
    // A stamp shows up under every special its album copy has
    for (const sp of SPECIALS) {
      const list = have.filter((st) => (S.album[st.id].sp || []).includes(sp.key)).sort((x, y) => S.album[y.id].q - S.album[x.id].q);
      html += `<section class="sec"><h3>${sp.emoji} ${sp.name} <small>${sp.text} · ${sp.pts > 0 ? "+" : ""}${sp.pts} · ${list.length}</small></h3>
        <div class="grid">${list.length ? list.map(slotHtml).join("") : `<div class="slot unknown">?</div>`}</div></section>`;
    }
    const plain = have.filter((st) => !(S.album[st.id].sp || []).length);
    if (plain.length) html += `<section class="sec"><h3>Plain <small>no specials (yet) · ${plain.length}</small></h3><div class="grid">${plain.map(slotHtml).join("")}</div></section>`;
  } else {
    const known = COUNTRIES.filter((c) => S.pals[c.code]);
    html += `<section class="sec"><h3>Pen pals <small>${known.length} of ${COUNTRIES.length} have written to you</small></h3><div class="pals">` +
      known.map((c) => `<div class="pal">${flagHtml(c.code)}<b>${esc(c.person)}</b><span>${esc(c.city)}, ${esc(c.name)}</span><small>${S.pals[c.code]} card${S.pals[c.code] > 1 ? "s" : ""} · “${esc(c.hello)}!”</small></div>`).join("") +
      COUNTRIES.filter((c) => !S.pals[c.code]).slice(0, 6).map(() => `<div class="pal unknown"><span class="flag">?</span><b>? ? ?</b><span>somewhere</span></div>`).join("") +
      `</div></section>`;
  }
  if (!have.length && S.sort !== "pals") html = `<p class="empty hand">Your album is empty. Peel your first stamp!</p>` + html;
  $("album-body").innerHTML = html;
}

$("album-body").addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]");
  if (o) {
    openCountry = openCountry === o.dataset.open ? null : o.dataset.open;
    renderAlbum();
    return;
  }
  const s = e.target.closest(".slot[data-id]");
  if (s) showDetail(s.dataset.id);
});
document.querySelectorAll("#album .tab").forEach((b) => b.addEventListener("click", () => {
  S.sort = b.dataset.sort;
  save();
  renderAlbum();
  $("album-body").scrollTop = 0;
}));

function showDetail(id) {
  const st = STAMPS[id], rec = S.album[id];
  if (!st || !rec) return;
  const c = BY_CODE[st.code];
  const sc = score(st, rec.mark, rec.tears, rec);
  const [, gname, gs] = gradeOf(sc.q);
  const from = BY_CODE[rec.from];
  $("detail-body").innerHTML = `
    <div class="r-stamp">${stampSVG(st, { mark: rec.mark, tears: rec.tears })}</div>
    <p class="r-title">${esc(st.desc)}</p>
    <p class="r-id">#${st.id} · ${flagHtml(st.code)} ${esc(c.name)} · issued ${st.year} · <span class="rar ${st.rarity}">${RARITY[st.rarity].name}</span></p>
    <div class="r-grade"><span class="stars">${stars(gs)}</span> <b>${gname}</b> <span class="q">${sc.q}/100</span></div>
    <table class="r-table"><tbody>${breakdownRows(st, rec.mark, sc)}</tbody></table>
    <p class="d-foot">${rec.n} cop${rec.n > 1 ? "ies" : "y"} peeled · best one from ${from ? `${flagHtml(from.code)} ${esc(from.person)}` : "?"}${st.src !== "unknown" ? `<br><small>source: ${esc(st.src)}</small>` : ""}</p>`;
  openModal("detail");
}

// ---------- Modals, toast ----------

function openModal(id) { $(id).hidden = false; }
function closeModal(id) { $(id).hidden = true; }
document.querySelectorAll(".modal").forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m || e.target.closest(".modal-close")) m.hidden = true;
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  for (const id of ["detail", "album", "help", "result"]) if (!$(id).hidden) { closeModal(id); break; }
});

let toastTimer = 0;
function toast(text, kind = "") {
  const t = $("toast");
  t.textContent = text;
  t.className = "toast show " + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1300);
}

// ---------- Buttons ----------

$("album-btn").addEventListener("click", () => { renderAlbum(); openModal("album"); });
$("r-album").addEventListener("click", () => { closeModal("result"); renderAlbum(); openModal("album"); });
$("help-btn").addEventListener("click", () => openModal("help"));
$("next-btn").addEventListener("click", nextCard);
$("quick-btn").addEventListener("click", quickRip);
$("r-next").addEventListener("click", nextCard);
$("flip-btn").addEventListener("click", () => {
  flipped = !flipped;
  peel.active = false;
  postcard.classList.toggle("flipped", flipped);
  sfx.flip();
});
$("mute").addEventListener("click", () => {
  S.sound = !S.sound;
  $("mute").classList.toggle("off", !S.sound);
  save();
});
$("help-grades").innerHTML = GRADES.map(([min, name, gs]) => `<span><span class="stars g${gs}">${stars(gs)}</span> ${name} ${min}+</span>`).join("");

// ---------- The beach and its secrets ----------

const EGGS = ["sun", "shades", "volley10", "volley25", "crab", "gull", "bottle", "shells", "castle", "logo", "aloha", "pennytyped",
  "gem", "dream", "zen", "penny", "answer", "nightowl", "umbrella", "confetti", "sos", "icecream", "flipflop", "palm", "butter", "stowaway", "lucky", "destroyer", "catastrophe"];
const BOTTLE_NOTES = [
  "The sun has a secret. Click it. A lot.",
  "There are five shells hidden on this beach.",
  "Old gamers know a code. Up, up…",
  "Try typing ALOHA. Go on.",
  "A penny for your thoughts? Type it.",
  "Sandcastles need four pats. The tide disagrees.",
  "The crab is shy, but not that shy.",
  "Keep the volleyball up 10 times. Then 25.",
  "The best stamp ever printed was black and cost a penny.",
  "Peel like nobody is watching. Slowly.",
  "Somebody's logo deserves a postmark too.",
  "If you're lost at sea, type SOS.",
];

function egg(key, title) {
  if (S.eggs[key]) return;
  S.eggs[key] = Date.now();
  save();
  setTimeout(() => { toast("🥚 " + title, "egg"); confetti(40); tone(880, 0.3, { delay: 0.05 }); tone(1320, 0.4, { delay: 0.15 }); }, 250);
  updateEggCount();
}
function updateEggCount() {
  $("egg-count").textContent = Object.keys(S.eggs).filter((k) => EGGS.includes(k)).length;
  $("egg-total").textContent = EGGS.length;
}

function confetti(n) {
  const colors = ["#c8423a", "#2a74c4", "#f2c230", "#48a868", "#fff"];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = rand() * 100 + "vw";
    c.style.background = pick(colors);
    c.style.animationDuration = 1.6 + rand() * 1.8 + "s";
    c.style.animationDelay = rand() * 0.4 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}

// Sky: day, sunset, night. Seven quick taps on the sun move it along.
const SKIES = ["", "sunset", "night"];
let sky = 0, sunTaps = 0, sunTimer = 0;
function setSky(i) {
  sky = i;
  document.body.classList.remove("sunset", "night");
  if (SKIES[i]) document.body.classList.add(SKIES[i]);
}
$("sun").addEventListener("click", () => {
  tone(660 + sunTaps * 80, 0.12, { vol: 0.08 });
  sunTaps++;
  clearTimeout(sunTimer);
  sunTimer = setTimeout(() => { sunTaps = 0; }, 2500);
  if (sunTaps >= 7) {
    sunTaps = 0;
    setSky((sky + 1) % SKIES.length);
    egg("sun", "Sun worshipper: you moved the sun");
  }
});

// Shells: five hidden on the sand, the same five until you find them all
function placeShells() {
  if (S.shells.length !== 5) {
    S.shells = Array.from({ length: 5 }, () => ({ x: rand() < 0.5 ? ri(1, 11) : ri(88, 96), y: ri(40, 92), f: false }));
    save();
  }
  S.shells.forEach((sh, i) => {
    if (sh.f) return;
    const b = document.createElement("button");
    b.className = "prop shell";
    b.type = "button";
    b.tabIndex = -1;
    b.textContent = pick(["🐚", "🐚", "🦪", "⭐"]);
    b.style.left = sh.x + "vw";
    b.style.top = sh.y + "vh";
    b.addEventListener("click", () => {
      sh.f = true;
      b.classList.add("found");
      tone(1046 + i * 120, 0.25, { type: "triangle" });
      const found = S.shells.filter((s) => s.f).length;
      toast(`🐚 ${found}/5`);
      save();
      if (found === 5) egg("shells", "Shell collector: all five shells");
    });
    $("props").appendChild(b);
  });
}

// Sandcastle: four pats build it, then a wave takes it
const CASTLE = ["🏰", "⛱️", "🛖", "🏯", "🏰"];
$("castle").addEventListener("click", () => {
  const el = $("castle");
  let stage = +el.dataset.stage + 1;
  noise(0.15, { freq: 400, q: 0.6, vol: 0.12 });
  if (stage > 4) {
    stage = 0;
    noise(0.9, { freq: 500, q: 0.5, vol: 0.14, to: 1200 });
    toast("🌊 the tide took it");
  } else if (stage === 4) {
    egg("castle", "Architect: a real sandcastle");
  }
  el.dataset.stage = stage;
  el.textContent = stage ? CASTLE[stage] : "🏰";
  el.style.fontSize = 46 + stage * 8 + "px";
});

$("umbrella").addEventListener("click", () => {
  const el = $("umbrella");
  el.textContent = el.textContent === "⛱️" ? "🌂" : "⛱️";
  noise(0.2, { freq: 700, vol: 0.08, to: 1400 });
  egg("umbrella", "Shady business: you folded the umbrella");
});

$("icecream").addEventListener("click", () => {
  const el = $("icecream");
  if (el.dataset.licks === "3") return;
  el.dataset.licks = +(el.dataset.licks || 0) + 1;
  tone(1200, 0.06, { vol: 0.05 });
  el.style.fontSize = 40 - el.dataset.licks * 7 + "px";
  if (el.dataset.licks === "3") {
    el.textContent = "🥶";
    toast("BRAIN FREEZE!", "bad");
    egg("icecream", "Brain freeze: you ate the whole ice cream");
    setTimeout(() => { el.textContent = "🍦"; el.dataset.licks = 0; el.style.fontSize = ""; }, 8000);
  }
});
let squeaks = 0;
$("flipflop").addEventListener("click", () => {
  tone(700 + squeaks * 80, 0.12, { type: "triangle", vol: 0.08, to: 1200, wobble: 40 });
  $("flipflop").classList.remove("hop"); void $("flipflop").offsetWidth; $("flipflop").classList.add("hop");
  if (++squeaks === 5) egg("flipflop", "Flip-flop symphony: squeak squeak");
});
$("palm").addEventListener("click", () => {
  const c = document.createElement("span");
  c.className = "coconut";
  c.textContent = "🥥";
  $("palm").appendChild(c);
  setTimeout(() => { tone(400, 0.25, { to: 150, vol: 0.14, wobble: 20 }); toast("BONK!"); }, 650);
  setTimeout(() => c.remove(), 2600);
  egg("palm", "Coconut bonk: shook the palm tree");
});

// Visitors: a crab, a seagull and now and then a bottle
function visit(id, cls, ms) {
  const el = $(id);
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}
function scheduleVisitors() {
  setTimeout(() => { visit("crab", "walk", 14500); scheduleVisitors.crab(); }, ri(15, 40) * 1000);
  setTimeout(() => { visit("gull", "fly", 12500); scheduleVisitors.gull(); }, ri(8, 25) * 1000);
}
scheduleVisitors.crab = () => setTimeout(() => { visit("crab", "walk", 14500); scheduleVisitors.crab(); }, ri(45, 90) * 1000);
scheduleVisitors.gull = () => setTimeout(() => { visit("gull", "fly", 12500); scheduleVisitors.gull(); }, ri(30, 70) * 1000);
$("crab").addEventListener("click", () => {
  tone(1500, 0.05, { type: "triangle", vol: 0.07 }); tone(1700, 0.05, { type: "triangle", vol: 0.07, delay: 0.09 });
  toast("🦀 snip snip!");
  egg("crab", "Crab whisperer: you caught the crab");
});
$("gull").addEventListener("click", () => {
  tone(1300, 0.22, { type: "triangle", vol: 0.07, to: 900, wobble: 60 }); tone(1400, 0.28, { type: "triangle", vol: 0.07, to: 800, delay: 0.25, wobble: 60 });
  toast("MINE! MINE!");
  egg("gull", "Gull-ible: the seagull wants your stamps");
});
function washBottle() {
  const b = $("bottle");
  b.style.left = ri(25, 70) + "vw";
  b.classList.add("ashore");
  noise(0.8, { freq: 400, q: 0.5, vol: 0.1, to: 1000 });
}
$("bottle").addEventListener("click", () => {
  $("bottle").classList.remove("ashore");
  sfx.pop();
  toast("📜 " + pick(BOTTLE_NOTES), "egg");
  egg("bottle", "Message received: a note in a bottle");
});

// Logo: five taps cancel it with a postmark
let logoTaps = 0;
$("logo").addEventListener("click", () => {
  if (++logoTaps === 5) {
    $("logo").classList.add("cancelled");
    sfx.thunk();
    egg("logo", "Self-cancelling: even the logo got a postmark");
  }
});

// Typed codes and the old one
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let keys = [], typed = "";
document.addEventListener("keydown", (e) => {
  keys = [...keys, e.key].slice(-KONAMI.length);
  if (keys.join() === KONAMI.join()) {
    $("sun").classList.add("shades");
    egg("shades", "Cool customer: the sun put on its shades");
  }
  if (e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-12);
  if (typed.endsWith("aloha")) {
    document.body.classList.toggle("hula");
    egg("aloha", "Aloha! The postcard does the hula");
  }
  if (typed.endsWith("penny")) {
    toast("🖤 1840: the Penny Black, the first stamp ever", "egg");
    egg("pennytyped", "A penny for your thoughts");
  }
  if (typed.endsWith("sos")) {
    washBottle();
    egg("sos", "SOS: a bottle washes ashore");
  }
});

// The volleyball: tap it to bump it up, and keep it in the air
const ball = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, hits: 0, air: false };
const ballEl = $("ball"), ballShadow = $("ball-shadow"), ballCount = $("ball-count");
const ground = () => window.innerHeight - 64;
function resetBall() {
  ball.x = Math.min(window.innerWidth - 60, Math.max(8, window.innerWidth * 0.12));
  ball.y = ground();
}
ballEl.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  audio();
  if (ball.air) ball.hits++;
  else ball.hits = 0;
  ball.air = true;
  ball.vy = -(780 + rand() * 220);
  ball.vx = (rand() - 0.5) * 360;
  tone(330 + Math.min(ball.hits, 30) * 20, 0.14, { type: "sine", vol: 0.16, to: 500 + Math.min(ball.hits, 30) * 20 });
  noise(0.04, { freq: 600, vol: 0.06 });
  if (ball.hits) {
    ballCount.textContent = ball.hits;
    ballCount.classList.add("show");
  }
  if (ball.hits === 10) egg("volley10", "Beach legend: 10 bumps in a row");
  if (ball.hits === 25) egg("volley25", "Olympic volley: 25 bumps in a row");
});
function ballStep(dt) {
  const s = dt / 1000;
  if (ball.air) {
    ball.vy += 1900 * s;
    ball.x += ball.vx * s;
    ball.y += ball.vy * s;
    ball.rot += ball.vx * s * 2;
    const maxX = window.innerWidth - 56;
    if (ball.x < 4 || ball.x > maxX) { ball.vx *= -0.8; ball.x = Math.max(4, Math.min(maxX, ball.x)); }
    if (ball.y < 4) { ball.y = 4; ball.vy = Math.abs(ball.vy) * 0.5; }
    if (ball.y >= ground()) {
      ball.y = ground();
      if (ball.vy > 260) {
        ball.vy *= -0.38;
        tone(160, 0.1, { to: 110, vol: 0.08 });
      } else {
        ball.air = false;
        ball.vy = ball.vx = 0;
        if (ball.hits >= 3) toast(`🏐 ${ball.hits} in a row!`);
        ball.hits = 0;
        ballCount.classList.remove("show");
      }
      ball.vx *= 0.7;
    }
  }
  ballEl.style.transform = `translate(${ball.x}px, ${ball.y}px) rotate(${ball.rot}deg)`;
  const h = Math.max(0, ground() - ball.y);
  const sc = Math.max(0.35, 1 - h / 600);
  ballShadow.style.transform = `translate(${ball.x + 4}px, ${ground() + 46}px) scale(${sc})`;
  ballShadow.style.opacity = sc;
  ballCount.style.transform = `translate(${ball.x + 16}px, ${ball.y - 30}px)`;
}
window.addEventListener("resize", () => { if (!ball.air) resetBall(); });

// ---------- Start ----------

async function init() {
  load();
  $("mute").classList.toggle("off", !S.sound);
  updateEggCount();
  resetBall();
  ballStep(0);
  placeShells();
  scheduleVisitors();
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 6) {
    egg("nightowl", "Night owl: peeling stamps under the stars");
  }
  try {
    await loadWorld();
  } catch (e) {
    $("loading").textContent = "The mail didn't arrive (" + e.message + "). Run Stample from a web server, e.g. python -m http.server";
    return;
  }
  // Drop album entries whose stamp no longer exists in the XML
  // and rescore the rest with the current rules
  for (const id of Object.keys(S.album)) {
    const rec = S.album[id];
    if (!STAMPS[id]) { delete S.album[id]; continue; }
    const sc = score(STAMPS[id], rec.mark, rec.tears, rec);
    rec.q = sc.q;
    rec.sp = sc.sp;
  }
  if (!S.card || !BY_CODE[S.card.from] || !STAMPS[S.card.stampId]) S.card = makeCard(pick(COUNTRIES).code, null);
  save();
  updateChips();
  renderCard();
  $("loading").hidden = true;
  $("start").hidden = false;
  $("start").focus();
  requestAnimationFrame(frame);
}

$("start").addEventListener("click", () => {
  $("splash").classList.add("gone");
  audio();
  sfx.paper();
  postcard.classList.add("arrive");
  setTimeout(() => postcard.classList.remove("arrive"), 600);
});

init();
