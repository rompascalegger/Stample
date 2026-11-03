"use strict";
// Stample: peel stamps off postcards from a chain of pen pals and keep the best copy of each in your album.
// The world (197 countries and their ~25,000 stamps) comes from stamps_filled.xml; pen pals and texts from data.js.

const $ = (id) => document.getElementById(id);
const NOW_YEAR = 2026;
const SAVE_KEY = "stample-v2";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const VALUES = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 500];
// [minimum quality, name, stars]
const GRADES = [[90, "GEM MINT", 5], [75, "SUPERB", 4], [60, "VERY FINE", 3], [45, "FINE", 2], [25, "FAIR", 1], [0, "POOR", 0]];
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

let actx = null;
function audio() {
  if (!S.sound) return null;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
  } catch (e) { return null; }
  return actx;
}
function noise(dur, { freq = 2000, q = 1, type = "bandpass", vol = 0.2, delay = 0 } = {}) {
  const a = audio(); if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = rand() * 2 - 1;
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain();
  const t = a.currentTime + delay;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}
function tone(freq, dur, { type = "sine", vol = 0.12, delay = 0, to = null } = {}) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(); o.type = type;
  const g = a.createGain();
  const t = a.currentTime + delay;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  paper() { noise(0.35, { freq: 1800, q: 0.6, vol: 0.22 }); },
  peel(speed) { noise(0.05, { freq: 2200 + speed * 2500, q: 3, vol: 0.04 + Math.min(0.14, speed * 0.1) }); },
  tear() { noise(0.28, { type: "highpass", freq: 1400, vol: 0.5 }); noise(0.14, { freq: 500, vol: 0.3, delay: 0.04 }); },
  pop() { tone(500, 0.14, { to: 950, vol: 0.14 }); noise(0.08, { freq: 3200, vol: 0.12 }); },
  thunk() { tone(120, 0.2, { type: "triangle", vol: 0.3, to: 55 }); noise(0.07, { freq: 400, vol: 0.25 }); },
  chime(stars) { [523, 659, 784, 1047, 1319, 1568].slice(0, stars + 1).forEach((f, i) => tone(f, 0.45, { delay: i * 0.09, vol: 0.1, type: "triangle" })); },
  flip() { noise(0.22, { freq: 1100, q: 0.7, vol: 0.18 }); },
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
  const rips = tears.map((t) => `<polygon points="${tearPoly(t)}"/>`).join("");
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
  const cond = [35, 24, 13, 4][Math.min(t, 3)];
  const cut = extra.cut == null ? 0.8 : extra.cut;
  const cutPts = Math.round(10 * cut);
  const luck = Math.max(0, 1 - Math.hypot(mark.ox / 46, mark.oy / 56));
  const luckPts = Math.round(20 * luck);
  const x = { st, mark, luck, cut, to: extra.to, today: extra.today };
  const sp = SPECIALS.filter((s) => s.test(x)).map((s) => s.key);
  const spPts = Math.min(35, sp.reduce((n, k) => n + SPECIAL[k].pts, 0));
  const combo = COMBOS.find((c) => c.keys.every((k) => sp.includes(k))) || null;
  return { cond, tears: t, cut, cutPts, luck, luckPts, sp, spPts, combo, q: cond + cutPts + luckPts + spPts };
}
const gradeOf = (q) => GRADES.find(([min]) => q >= min);
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
const condName = (t) => ["Mint", "One tear", "Two tears", "Torn"][Math.min(t, 3)];
const cutName = (c) => c >= 0.95 ? "flawless" : c >= 0.8 ? "neat" : c >= 0.55 ? "wobbly" : "ragged";

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

function makeCard(from, prev) {
  const f = BY_CODE[from];
  let to;
  do { to = pick(COUNTRIES).code; } while (to === from || to === prev);
  const st = pickStamp(f);
  const angle = rand() * Math.PI * 2;
  const r = Math.pow(rand(), 0.75);
  return {
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
}

// ---------- Desk ----------

const stampEl = $("stamp");
const workEl = $("work");
const postcard = $("postcard");
let flipped = false;
// The dotted tear-out line around the stamp, in stamp units (the stamp is 100 × 120)
const CUT = { x0: -8, y0: -8, x1: 108, y1: 128 };
const CUT_W = CUT.x1 - CUT.x0, CUT_H = CUT.y1 - CUT.y0, CUT_P = 2 * (CUT_W + CUT_H);
const BINS = 42, BIN_NEED = 40;
// Corners are peeled one by one: top left, top right, bottom right, bottom left
const CORNERS = [[0, 0], [100, 0], [100, 120], [0, 120]];
const peel = {
  strain: 0, maxStrain: 0, active: false, x: 0, y: 0, t: 0, lastSound: 0, lastNag: 0,
  bins: [], devSum: 0, devLen: 0, inside: 0, grab: false,
};

const phase = () => !S.card ? "none" : S.card.done ? "done" : S.card.cut == null ? "cut" : "peel";
const activeCorner = () => S.card.corners.findIndex((c) => c < 1);

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
  $("pc-front").innerHTML = `<div class="front-sky" style="--h:${card.hue}">
      <span class="front-sun"></span>
      <span class="front-motif">${look(st).motif}</span>
      <div class="greet"><small>Greetings from</small><b>${esc(f.name)}</b><small>${esc(f.city)}</small></div>
      <span class="front-flag">${flag(f.code)}</span>
    </div>`;
  $("card-no").innerHTML = `Postcard #${card.no} · from ${flagHtml(f.code)} <b>${esc(f.person)}</b>, ${esc(f.city)}`;
  const chain = [...S.chain.slice(-5), card.from, card.to];
  $("chain").innerHTML = chain.map((c, i) => `<span class="${i === chain.length - 1 ? "dest" : ""}" title="${esc(BY_CODE[c]?.name || "?")}">${flag(c)}</span>`).join("<i>›</i>");

  Object.assign(peel, { strain: 0, maxStrain: 0, active: false, bins: new Array(BINS).fill(false), devSum: 0, devLen: 0, inside: 0, grab: false });
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
    "② Peel it: drag from the glowing corner toward the middle, gently. Corner by corner.";
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

// The dotted line, the torn part of it and the scissors; later the curling corners and the glowing handle
function renderWork() {
  const ph = phase();
  let html = "";
  if (ph === "cut") {
    html += `<rect class="cutline" x="${CUT.x0}" y="${CUT.y0}" width="${CUT_W}" height="${CUT_H}"/>`;
    const L = CUT_P / BINS;
    peel.bins.forEach((on, i) => {
      if (!on) return;
      const pts = [0, 0.5, 1].map((k) => cutPoint(i * L + k * L * 0.999).map((v) => v.toFixed(1)).join(","));
      html += `<polyline class="cutdone" points="${pts.join(" ")}"/>`;
    });
    const next = peel.bins.indexOf(false);
    if (next >= 0) {
      const [nx, ny] = cutPoint(next * L + L / 2);
      html += `<text class="scissors" x="${nx.toFixed(1)}" y="${(ny + 3).toFixed(1)}" text-anchor="middle">✂</text>`;
    }
  } else if (ph === "peel") {
    S.card.corners.forEach((c, i) => {
      if (c <= 0) return;
      const [cx, cy] = CORNERS[i];
      const k = 4 + c * 22, sx = cx ? -1 : 1, sy = cy ? -1 : 1;
      html += `<polygon class="curl" points="${cx + sx * k},${cy} ${cx},${cy + sy * k} ${cx + sx * k},${cy + sy * k}"/>`;
    });
    const a = activeCorner();
    if (a >= 0) html += `<circle class="handle" cx="${CORNERS[a][0]}" cy="${CORNERS[a][1]}" r="7"/>`;
  }
  workEl.innerHTML = html;
}

function progress() {
  const ph = phase();
  if (ph === "cut") return Math.min(1, peel.bins.filter(Boolean).length / BIN_NEED);
  if (ph === "peel") return S.card.corners.reduce((n, c) => n + Math.min(1, c), 0) / 4;
  return ph === "done" ? 1 : 0;
}

function updateMeters() {
  const p = progress() * 100;
  $("peel-fill").style.width = p + "%";
  $("peel-pct").textContent = Math.floor(p) + "%";
  $("strain-fill").style.width = Math.min(100, peel.strain) + "%";
  $("strain-fill").classList.toggle("hot", peel.strain > 65);
  const t = S.card ? S.card.tears.length : 0;
  $("tears").textContent = t ? "✂".repeat(Math.min(t, 4)) : "♡";
  $("tears").title = t ? `${t} tear${t > 1 ? "s" : ""}: ${condName(t)}` : "No tears yet: mint";
  if (phase() !== "peel") return;
  stampEl.style.setProperty("--lift", (p / 100).toFixed(3));
  stampEl.classList.toggle("tense", peel.strain > 70);
}

function fragility(st) { return 1 + (NOW_YEAR - st.year) / 150; }

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
  const frag = fragility(STAMPS[S.card.stampId]);
  // Drawing across the stamp itself cuts into it
  if (x > 5 && x < 95 && y > 5 && y < 115) {
    peel.inside += dist;
    if (peel.inside > 18) { peel.inside = 0; tear("✂ you cut into the stamp!"); }
    updateMeters();
    return;
  }
  const { d, s } = cutNearest(x, y);
  const safe = 0.45 / Math.sqrt(frag);
  peel.strain += Math.max(0, speed - safe) * dist * 1.6 * frag;
  if (d < 16) { peel.devSum += d * dist; peel.devLen += dist; }
  if (d < 6) {
    rustle(speed);
    if (speed > safe * 1.7) nag("Too fast! Tear it slowly");
    else {
      const b = Math.floor(s / (CUT_P / BINS)) % BINS;
      if (!peel.bins[b]) { peel.bins[b] = true; renderWork(); }
    }
  }
  peel.maxStrain = Math.max(peel.maxStrain, peel.strain);
  if (peel.strain >= 100) tear();
  if (peel.bins.filter(Boolean).length >= BIN_NEED) finishCut();
  updateMeters();
}

function finishCut() {
  const card = S.card;
  const dev = peel.devLen ? peel.devSum / peel.devLen : 0;
  card.cut = Math.round(Math.max(0, Math.min(1, 1 - dev / 7)) * 100) / 100;
  peel.active = false;
  peel.strain = 0;
  noise(0.45, { freq: 2600, q: 0.8, vol: 0.3 });
  toast(`✂ Cut out! ${cutName(card.cut)}`, card.cut >= 0.8 ? "good" : "");
  $("stamp-spot").classList.add("cut");
  save();
  setHint();
  renderWork();
  updateMeters();
}

// ② Peeling a corner: only strokes that start at the glowing corner and pull toward the middle count
function cornerStep(x, y, dx, dy, dist, speed) {
  if (!peel.grab) return;
  const card = S.card;
  const frag = fragility(STAMPS[card.stampId]);
  const a = activeCorner();
  const [cx, cy] = CORNERS[a];
  if (Math.hypot(x - cx, y - cy) > 70) { peel.grab = false; return; }
  const ix = 50 - cx, iy = 60 - cy;
  const dot = (dx * ix + dy * iy) / (Math.hypot(ix, iy) * dist);
  const safe = 0.3 / Math.sqrt(frag);
  if (dot > 0.55) {
    card.corners[a] = Math.min(1, card.corners[a] + dist * dot / (110 * card.glue));
    peel.strain += dist * 0.05 + Math.max(0, speed - safe) * dist * 1.4 * frag;
    rustle(speed);
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
  tone(700 + a * 150, 0.15, { type: "triangle" });
  save();
  if (a === 3) finishPeel();
  else toast(["Corner one!", "Two down!", "One to go!"][a], "good");
}

function tear(msg) {
  const card = S.card;
  card.tears.push({ s: ri(0, 3), p: Math.round(rand() * 100) / 100 });
  peel.strain = 35;
  sfx.tear();
  toast(msg || pick(TEAR_QUIPS), "bad");
  stampEl.innerHTML = stampSVG(STAMPS[card.stampId], { mark: card.mark, tears: card.tears });
  postcard.classList.remove("shake"); void postcard.offsetWidth; postcard.classList.add("shake");
  save();
  if (card.tears.length >= 4) egg("confetti", "Confetti maker: that stamp is more hole than stamp");
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
      q: sc.q, tears: card.tears, mark: card.mark, cut: card.cut, to: card.to, today: card.today, sp: sc.sp,
      n: (old ? old.n : 0) + 1, from: card.from, t: Date.now(),
    };
  } else old.n++;
  S.total++;
  S.pals[card.from] = (S.pals[card.from] || 0) + 1;
  save();
  updateChips();

  sfx.pop();
  stampEl.classList.add("peeled");
  workEl.innerHTML = "";
  $("glue").classList.add("show");
  stampEl.disabled = true;
  $("next-btn").disabled = false;
  $("hint").textContent = "Got it!";
  setTimeout(() => {
    if (sc.sp.length) playAlerts(sc, () => showResult(st, sc, status, old));
    else showResult(st, sc, status, old);
  }, 650);
}

// Crazy alerts: one loud banner per special, then the combo (if any) even louder. A tap skips them.
function playAlerts(sc, done) {
  const items = sc.sp.map((k) => SPECIAL[k]);
  if (sc.combo) items.push({ name: sc.combo.name, emoji: sc.combo.emoji, text: "COMBO!", mega: true });
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
    el.className = "alert" + (it.mega ? " mega" : "");
    el.innerHTML = `<div class="alert-rays"></div><div class="alert-inner">
      <span class="alert-emoji">${it.emoji}</span><b class="alert-name">${esc(it.name)}</b>
      <span class="alert-text">${esc(it.text)}${it.pts ? ` · +${it.pts}` : ""}</span></div>`;
    document.body.classList.remove("quake"); void document.body.offsetWidth; document.body.classList.add("quake");
    fanfare(it.mega);
    confetti(it.mega ? 120 : 45);
    timer = setTimeout(show, it.mega ? 2300 : 1400);
  };
  el.onclick = finish;
  show();
}
function fanfare(mega) {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: "square", vol: 0.05, delay: i * 0.07 }));
  noise(0.4, { freq: 3000, q: 0.5, vol: 0.12 });
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
  $("r-grade").innerHTML = `<span class="stars">${stars(gstars)}</span> <b>${gname}</b> <span class="q">${sc.q}/100</span>` +
    (status === "DUPLICATE" ? `<small>your album copy: ${old.q}/100, kept</small>` : status === "BETTER COPY!" ? `<small>was ${old.q}/100</small>` : "");
  $("r-rows").innerHTML = breakdownRows(st, card.mark, sc);
  openModal("result");
  sfx.chime(gstars);
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
    const [cx, cy] = CORNERS[activeCorner()];
    peel.grab = Math.hypot(x - cx, y - cy) < 26;
    if (!peel.grab) nag("Start at the glowing corner");
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
  if (phase() === "cut") cutStep(x, y, dist, dist / dt);
  else if (phase() === "peel") cornerStep(x, y, dx, dy, dist, dist / dt);
});
const stopPeel = () => { peel.active = false; peel.grab = false; };
workEl.addEventListener("pointerup", stopPeel);
workEl.addEventListener("pointercancel", stopPeel);
// Keyboard: gentle taps of Space work slowly and safely, holding it down (key repeat) is far too fast
stampEl.addEventListener("keydown", (e) => {
  if (e.key !== " " && e.key !== "Enter") return;
  e.preventDefault();
  audio();
  const ph = phase();
  if (flipped || (ph !== "cut" && ph !== "peel")) return;
  peel.strain += e.repeat ? 28 : 6;
  peel.maxStrain = Math.max(peel.maxStrain, peel.strain);
  rustle(0.2);
  if (peel.strain >= 100) tear();
  if (ph === "cut") {
    const b = peel.bins.indexOf(false);
    if (b >= 0) peel.bins[b] = true;
    peel.devSum += 20; peel.devLen += 10;
    if (peel.bins.filter(Boolean).length >= BIN_NEED) finishCut();
  } else {
    const a = activeCorner();
    S.card.corners[a] = Math.min(1, S.card.corners[a] + 0.08);
    if (S.card.corners[a] >= 1) cornerDone(a);
  }
  renderWork();
  updateMeters();
});

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(100, now - lastFrame);
  lastFrame = now;
  if (peel.strain > 0 && S.card && !S.card.done) {
    peel.strain = Math.max(0, peel.strain - dt * 0.03);
    updateMeters();
  }
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
  return `<button class="slot" type="button" data-id="${st.id}" title="${esc(st.desc)} · ${gname}">
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
      html += `<section class="sec"><h3>${sp.emoji} ${sp.name} <small>${sp.text} · +${sp.pts} · ${list.length}</small></h3>
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
  "gem", "dream", "zen", "penny", "answer", "nightowl", "umbrella", "confetti", "sos", "icecream", "flipflop", "palm"];
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
  noise(0.12, { freq: 500, q: 0.5, vol: 0.25 });
  if (stage > 4) {
    stage = 0;
    noise(0.9, { freq: 900, q: 0.4, vol: 0.3 });
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
  noise(0.15, { freq: 1500, vol: 0.15 });
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
  tone(900 + squeaks * 60, 0.09, { type: "square", vol: 0.05, to: 1400 });
  $("flipflop").classList.remove("hop"); void $("flipflop").offsetWidth; $("flipflop").classList.add("hop");
  if (++squeaks === 5) egg("flipflop", "Flip-flop symphony: squeak squeak");
});
$("palm").addEventListener("click", () => {
  const c = document.createElement("span");
  c.className = "coconut";
  c.textContent = "🥥";
  $("palm").appendChild(c);
  setTimeout(() => { noise(0.1, { freq: 300, vol: 0.4 }); toast("BONK!"); }, 650);
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
  tone(1800, 0.05, { type: "square", vol: 0.06 }); tone(1800, 0.05, { type: "square", vol: 0.06, delay: 0.09 });
  toast("🦀 snip snip!");
  egg("crab", "Crab whisperer: you caught the crab");
});
$("gull").addEventListener("click", () => {
  tone(1400, 0.25, { type: "sawtooth", vol: 0.05, to: 900 }); tone(1500, 0.3, { type: "sawtooth", vol: 0.05, to: 800, delay: 0.25 });
  toast("MINE! MINE!");
  egg("gull", "Gull-ible: the seagull wants your stamps");
});
function washBottle() {
  const b = $("bottle");
  b.style.left = ri(25, 70) + "vw";
  b.classList.add("ashore");
  noise(0.8, { freq: 700, q: 0.4, vol: 0.18 });
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
  tone(220 + Math.min(ball.hits, 30) * 12, 0.08, { type: "triangle", vol: 0.25 });
  noise(0.05, { freq: 800, vol: 0.2 });
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
        noise(0.06, { freq: 300, vol: 0.18 });
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
