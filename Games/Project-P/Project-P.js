// ===== PROJECT P =====
// A top-down RPG tour of Connor's real projects — talk, learn, battle.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE = 16, SCALE = 3;
const CW = 960, CH = 624;                 // canvas size (20 x 13 tiles)
const MAP_W = 40, MAP_H = 30;             // map size in tiles
const VIEW_W = CW / SCALE, VIEW_H = CH / SCALE; // logical viewport (320 x 208)

// ===== PALETTE =====
const C = {
  grass:  '#22301f', grass2: '#283823', tallg: '#35502e',
  path:   '#5d5343', path2:  '#514734',
  treeT:  '#2f4a2c', treeB:  '#233722', trunk: '#3d3122',
  water:  '#1d3a55', water2: '#27496a',
  flower: '#fcbf49', flower2:'#e07a5f',
  wall:   '#3a352e', wallD:  '#2c2822', door: '#241d15', win: '#fcbf49',
  sign:   '#6b5b40', signD:  '#4a3f2c',
  text:   '#f0ede8', muted:  '#999', dark: '#0d0d0d',
  yellow: '#fcbf49', green:  '#81b29a', red: '#e07a5f', blue: '#7b8cde',
};

// ===== MAP =====
// Built programmatically: G grass, T tree, P path, W water, F/f flowers, g tall grass
const map = [];
for (let y = 0; y < MAP_H; y++) map.push(Array(MAP_W).fill('G'));

function vline(x, y1, y2, ch) { for (let y = y1; y <= y2; y++) map[y][x] = ch; }
function hline(y, x1, x2, ch) { for (let x = x1; x <= x2; x++) map[y][x] = ch; }
function rect(x1, y1, x2, y2, ch) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) map[y][x] = ch; }

rect(0, 0, MAP_W - 1, 1, 'T');            // borders
rect(0, MAP_H - 2, MAP_W - 1, MAP_H - 1, 'T');
rect(0, 0, 1, MAP_H - 1, 'T');
rect(MAP_W - 2, 0, MAP_W - 1, MAP_H - 1, 'T');

vline(20, 8, 26, 'P');                    // main street
hline(15, 4, 35, 'P');                    // east-west road
rect(16, 13, 24, 16, 'P');                // central plaza
vline(8, 8, 15, 'P');  vline(31, 8, 15, 'P');   // north building stubs
vline(8, 24, 26, 'P'); vline(31, 24, 26, 'P');  // south building stubs
hline(26, 8, 31, 'P');                    // south lane
rect(13, 20, 16, 23, 'W');                // pond

// decorative tree clumps
rect(2, 2, 3, 3, 'T'); rect(36, 2, 37, 3, 'T');
rect(2, 26, 3, 27, 'T'); rect(36, 26, 37, 27, 'T');
rect(17, 2, 23, 4, 'T');                  // grove north of main street's end

const FLOWERS = [[4,11],[12,11],[26,11],[35,11],[4,17],[35,17],[12,27],[25,27],[15,18],[24,18],[5,14],[34,14],[18,11],[22,11]];
FLOWERS.forEach(([x, y], i) => { if (map[y][x] === 'G') map[y][x] = i % 2 ? 'f' : 'F'; });
const TALLG = [[3,5],[4,5],[3,6],[36,5],[35,6],[36,6],[3,24],[4,25],[36,24],[35,25],[17,27],[18,27],[22,27],[23,27],[13,3],[14,3],[26,3],[27,3]];
TALLG.forEach(([x, y]) => { if (map[y][x] === 'G') map[y][x] = 'g'; });

// ===== BUILDINGS & SIGNS =====
const BUILDINGS = [
  { x: 5,  y: 3,  w: 7, h: 5, accent: C.yellow, door: 8  }, // GenGO lab
  { x: 28, y: 3,  w: 7, h: 5, accent: C.green,  door: 31 }, // Post Guardian HQ
  { x: 5,  y: 19, w: 7, h: 5, accent: C.red,    door: 8  }, // Pulsefex workshop
  { x: 28, y: 19, w: 7, h: 5, accent: C.blue,   door: 31 }, // Oracle stadium
];

const SIGNS = [
  { x: 18, y: 14, lines: [["PROJECT P — TOWN OF SHIPPED CODE.", "Four trainers guard four real projects.", "Beat them all!"]] },
  { x: 9,  y: 8,  lines: [["GENGO! LAB — Android · Java · UX Research.", "\"Language learning on the GO.\""]] },
  { x: 32, y: 8,  lines: [["POST GUARDIAN HQ — Chrome · Gemini API.", "\"Pause before you post.\""]] },
  { x: 9,  y: 24, lines: [["PULSEFEX WORKSHOP — C · STM32 · I2C.", "\"Real-time heart rate, real hardware.\""]] },
  { x: 32, y: 24, lines: [["BASEBALL ORACLE STADIUM — Python · Node · ML.", "\"~60% accuracy vs the bookies.\""]] },
];

// ===== SOLIDITY =====
const solid = [];
for (let y = 0; y < MAP_H; y++) {
  solid.push([]);
  for (let x = 0; x < MAP_W; x++) solid[y].push(map[y][x] === 'T' || map[y][x] === 'W');
}
BUILDINGS.forEach(b => { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) solid[y][x] = true; });
SIGNS.forEach(s => solid[s.y][s.x] = true);

// ===== CREATURES & BATTLES =====
const DUCK_MOVES = [
  { name: 'DEBUG',          pow: 16, acc: 100 },
  { name: 'REFACTOR',       pow: 20, acc: 90  },
  { name: 'STACK OVERFLOW', pow: 30, acc: 65  },
  { name: 'COFFEE BREAK',   heal: 24, uses: 3 },
];

// ===== NPCS =====
const NPCS = [
  {
    id: 'prof', name: 'PROF. PIXEL', tx: 21, ty: 13, dir: 'down',
    pal: { hair: '#bbb', skin: '#d9a066', shirt: '#e8e4da', pants: '#555' },
    dialog: [
      ["Welcome to PROJECT P! I'm PROF. PIXEL.", "This little town holds Connor's real-world", "projects — living right here as trainers."],
      ["Four trainers guard four projects: GenGO!,", "Post Guardian, Pulsefex, and Baseball Oracle.", "Talk to them, learn their stories, battle them!"],
      ["Move with WASD or the arrow keys.", "Talk and confirm with SPACE.", "Your partner RUBBER DUCK is ready. Go get 'em!"],
    ],
    dialogMid: [
      ["How goes the journey? Beat all four trainers", "to clear the town — the counter up top", "keeps score for you."],
    ],
    dialogClear: [
      ["Incredible! You cleared all four projects!", "GenGO!, Post Guardian, Pulsefex and Baseball", "Oracle — the whole portfolio, defeated."],
      ["Want the full write-ups, screenshots and tech", "stacks? Visit the Projects page on this very", "site. Thanks for playing PROJECT P!"],
    ],
  },
  {
    id: 'gengo', name: 'YUKI', tx: 7, ty: 10, dir: 'right',
    pal: { hair: '#2e2620', skin: '#e8b98a', shirt: C.yellow, pants: '#444' },
    dialog: [
      ["YUKI: Oh! A challenger! I've been studying", "vocabulary with GenGO! — an Android app Connor", "built in Java for a UX research study at York."],
      ["It tests FOUR ways to study: tapping, typing,", "voice, and dragging. The hypothesis? More", "interaction means better memorisation."],
      ["Turns out... the opposite! Simple tapping won.", "Science loves a plot twist. And speaking of", "tests — let's test YOU!"],
    ],
    dialogPost: [
      ["YUKI: Tapping beat every flashy method —", "sometimes the simplest answer wins.", "GenGO! ...yeah, the name is a Japanese pun."],
    ],
    battle: {
      creature: 'GENGO-CHAN', hp: 52, sprite: 'gengo', accent: C.yellow,
      moves: [
        { name: 'TAP ATTACK',    pow: 12, acc: 100 },
        { name: 'TYPING TEST',   pow: 16, acc: 90  },
        { name: 'VOICE COMMAND', pow: 20, acc: 75  },
        { name: 'DRAG & DROP',   pow: 14, acc: 95  },
      ],
    },
  },
  {
    id: 'postg', name: 'MAYA', tx: 32, ty: 10, dir: 'left',
    pal: { hair: '#4a3320', skin: '#c68958', shirt: C.green, pants: '#3a3a3a' },
    dialog: [
      ["MAYA: Ever fired off a post you regretted five", "seconds later? Post Guardian fixes that. Built", "in 24 hours at Hack the 6ix 2025."],
      ["It's a Chrome extension that reads your draft", "as you type and asks the Gemini API to check the", "tone — aggression, negativity, misinfo risk."],
      ["Feedback, never censorship — YOU keep the", "final call. Now let's see you keep your", "cool in battle!"],
    ],
    dialogPost: [
      ["MAYA: Thoughtful, not judgmental — that was the", "whole design challenge. One small moment of", "friction at exactly the right time."],
    ],
    battle: {
      creature: 'GUARDIAN-BOT', hp: 58, sprite: 'guardian', accent: C.green,
      moves: [
        { name: 'TONE CHECK',    pow: 13, acc: 100 },
        { name: 'GEMINI BEAM',   pow: 22, acc: 75  },
        { name: 'DRAFT DELETE',  pow: 17, acc: 90  },
        { name: 'MINDFUL PAUSE', heal: 16, uses: 2 },
      ],
    },
  },
  {
    id: 'pulse', name: 'VOLT', tx: 7, ty: 25, dir: 'right',
    pal: { hair: '#1e1e1e', skin: '#8d5a3b', shirt: C.red, pants: '#3a3a3a' },
    dialog: [
      ["VOLT: Feel that? My heart rate's climbing!", "Pulsefex is an embedded heart monitor built on", "the STM32WB55RG microcontroller. Raw C!"],
      ["Connor wrote a custom I2C driver to push pixels", "to an OLED screen, designed the circuit, and", "soldered the whole board — his first time!"],
      ["Live heart rate and SpO2 from a MAX30102", "sensor, rendered in real time.", "Let's get YOUR pulse up!"],
    ],
    dialogPost: [
      ["VOLT: From software comfort zone to soldering", "iron — that's how you learn embedded.", "128 by 64 pixels of pure I2C glory."],
    ],
    battle: {
      creature: 'PULSE-FEX', hp: 64, sprite: 'pulse', accent: C.red,
      moves: [
        { name: 'I2C BURST',  pow: 15, acc: 95  },
        { name: 'SOLDER IRON', pow: 19, acc: 85 },
        { name: 'SPO2 DRAIN', pow: 13, acc: 100, drain: 6 },
        { name: 'OLED FLASH', pow: 23, acc: 70  },
      ],
    },
  },
  {
    id: 'oracle', name: 'ACE', tx: 32, ty: 25, dir: 'left',
    pal: { hair: '#5a2f1d', skin: '#e8b98a', shirt: C.blue, pants: '#2e2e2e' },
    dialog: [
      ["ACE: I never call a game without checking", "Baseball Oracle — Connor's ML app that predicts", "MLB winners at roughly 60% accuracy."],
      ["A random forest trained in Python on 13,000+", "games with 53 features — exported to JSON and", "served by Node.js on Railway. No runtime Python!"],
      ["It even scrapes FanDuel odds with Playwright.", "The odds of you beating me? Let's find out", "the hard way!"],
    ],
    dialogPost: [
      ["ACE: ~60% against the bookies is no joke.", "Python trains the trees, Node walks them.", "It's live on Railway — go try a prediction!"],
    ],
    battle: {
      creature: 'ORACLE-9', hp: 70, sprite: 'oracle', accent: C.blue,
      moves: [
        { name: 'FASTBALL',      pow: 16, acc: 95  },
        { name: '53 FEATURES',   pow: 14, acc: 100 },
        { name: 'PLATT SCALE',   pow: 20, acc: 85  },
        { name: 'RANDOM FOREST', pow: 26, acc: 65  },
      ],
    },
  },
];
NPCS.forEach(n => n.defeated = false);

// ===== STATE =====
const SPAWN = { tx: 20, ty: 16 };
let mode = 'title'; // title | world | dialog | transition | battle
let player = { tx: SPAWN.tx, ty: SPAWN.ty, x: SPAWN.tx * TILE, y: SPAWN.ty * TILE,
               dir: 'down', moving: false, fx: 0, fy: 0, tx2: 0, ty2: 0, t: 0, step: 0, stepT: 0 };
let dialog = null;     // { pages, page, chars, onEnd }
let battle = null;
let transition = null; // { t, dur, npc }
let animT = 0;
let lastTime = 0;

const keys = {};
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const badges = () => NPCS.filter(n => n.battle && n.defeated).length;

// ===== TERRAIN PRE-RENDER =====
const mapCanvas = document.createElement('canvas');
mapCanvas.width = MAP_W * TILE;
mapCanvas.height = MAP_H * TILE;
const mg = mapCanvas.getContext('2d');
const waterTiles = [];

function renderMap() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const ch = map[y][x], px = x * TILE, py = y * TILE;
      // grass base with subtle checker
      mg.fillStyle = (x + y) % 2 ? C.grass : C.grass2;
      mg.fillRect(px, py, TILE, TILE);
      if ((x * 7 + y * 13) % 11 === 0) { mg.fillStyle = C.tallg; mg.fillRect(px + 6, py + 9, 1, 2); mg.fillRect(px + 11, py + 4, 1, 2); }
      if (ch === 'P') {
        mg.fillStyle = C.path; mg.fillRect(px, py, TILE, TILE);
        mg.fillStyle = C.path2;
        if ((x * 3 + y * 5) % 4 === 0) mg.fillRect(px + 3, py + 5, 2, 1);
        if ((x * 5 + y * 3) % 4 === 1) mg.fillRect(px + 10, py + 11, 2, 1);
      } else if (ch === 'T') {
        mg.fillStyle = C.treeB; mg.fillRect(px, py + 6, TILE, 10);
        mg.fillStyle = C.trunk; mg.fillRect(px + 6, py + 11, 4, 5);
        mg.fillStyle = C.treeT; mg.fillRect(px + 1, py, 14, 9);
        mg.fillRect(px + 3, py - 2, 10, 4);
        mg.fillStyle = C.treeB; mg.fillRect(px + 2, py + 6, 4, 2); mg.fillRect(px + 10, py + 4, 3, 2);
      } else if (ch === 'W') {
        mg.fillStyle = C.water; mg.fillRect(px, py, TILE, TILE);
        waterTiles.push([x, y]);
      } else if (ch === 'F' || ch === 'f') {
        mg.fillStyle = ch === 'F' ? C.flower : C.flower2;
        mg.fillRect(px + 4, py + 5, 2, 2); mg.fillRect(px + 10, py + 9, 2, 2);
        mg.fillStyle = '#3a5c33'; mg.fillRect(px + 5, py + 7, 1, 3); mg.fillRect(px + 11, py + 11, 1, 2);
      } else if (ch === 'g') {
        mg.fillStyle = C.tallg;
        for (let k = 0; k < 5; k++) mg.fillRect(px + 2 + k * 3, py + 6 + (k % 2) * 3, 2, 7 - (k % 2) * 3);
      }
    }
  }
  // water edge highlight
  mg.fillStyle = C.water2;
  waterTiles.forEach(([x, y]) => {
    if (map[y - 1][x] !== 'W') mg.fillRect(x * TILE, y * TILE, TILE, 2);
  });
  BUILDINGS.forEach(drawBuilding);
  SIGNS.forEach(s => {
    const px = s.x * TILE, py = s.y * TILE;
    mg.fillStyle = C.signD; mg.fillRect(px + 7, py + 8, 2, 6);
    mg.fillStyle = C.sign;  mg.fillRect(px + 2, py + 2, 12, 7);
    mg.fillStyle = C.signD; mg.fillRect(px + 4, py + 4, 8, 1); mg.fillRect(px + 4, py + 6, 6, 1);
  });
}

function drawBuilding(b) {
  const px = b.x * TILE, py = b.y * TILE, w = b.w * TILE, h = b.h * TILE;
  // walls
  mg.fillStyle = C.wall;  mg.fillRect(px, py + 20, w, h - 20);
  mg.fillStyle = C.wallD; mg.fillRect(px, py + h - 4, w, 4);
  // roof (accent, darkened by overlay)
  mg.fillStyle = b.accent; mg.fillRect(px - 2, py, w + 4, 22);
  mg.fillStyle = 'rgba(13,13,13,0.55)'; mg.fillRect(px - 2, py, w + 4, 22);
  mg.fillStyle = b.accent; mg.fillRect(px - 2, py + 20, w + 4, 2);
  // roof ridges
  mg.fillStyle = 'rgba(13,13,13,0.25)';
  for (let rx = px + 2; rx < px + w; rx += 12) mg.fillRect(rx, py + 2, 6, 18);
  // windows
  for (let wx = px + 10; wx < px + w - 12; wx += 22) {
    if (Math.abs(wx + 5 - (b.door * TILE + 8)) < 14) continue; // skip above door
    mg.fillStyle = C.win; mg.fillRect(wx, py + 30, 10, 9);
    mg.fillStyle = 'rgba(13,13,13,0.5)'; mg.fillRect(wx + 4, py + 30, 2, 9); mg.fillRect(wx, py + 34, 10, 1);
  }
  // door
  const dx = b.door * TILE + 3;
  mg.fillStyle = C.door; mg.fillRect(dx, py + h - 20, 10, 20);
  mg.fillStyle = b.accent; mg.fillRect(dx + 7, py + h - 11, 2, 2);
}
renderMap();

// ===== SPRITES =====
function drawPerson(g, x, y, dir, step, pal) {
  const flip = dir === 'left';
  g.save();
  if (flip) { g.translate(x + 16, y); g.scale(-1, 1); }
  else g.translate(x, y);
  const d = flip ? 'right' : dir;
  const R = (rx, ry, rw, rh, c) => { g.fillStyle = c; g.fillRect(rx, ry, rw, rh); };

  // legs (step 1 lifts left, step 2 lifts right)
  const lo = step === 1 ? 1 : 0, ro = step === 2 ? 1 : 0;
  R(5, 12 - lo, 2, 3, pal.pants); R(5, 15 - lo, 2, 1, '#1a1a1a');
  R(9, 12 - ro, 2, 3, pal.pants); R(9, 15 - ro, 2, 1, '#1a1a1a');
  // body + arms
  R(4, 8, 8, 4, pal.shirt);
  R(3, 8, 1, 3, pal.shirt); R(12, 8, 1, 3, pal.shirt);
  R(3, 11, 1, 1, pal.skin); R(12, 11, 1, 1, pal.skin);
  // head
  R(4, 2, 8, 6, pal.skin);
  if (d === 'down') {
    R(4, 1, 8, 2, pal.hair); R(3, 2, 1, 3, pal.hair); R(12, 2, 1, 3, pal.hair);
    if (pal.cap) R(4, 3, 8, 1, pal.capD || pal.hair);
    R(6, 5, 1, 1, '#151515'); R(9, 5, 1, 1, '#151515');
  } else if (d === 'up') {
    R(4, 1, 8, 6, pal.hair);
  } else { // right (or flipped left)
    R(4, 1, 8, 2, pal.hair); R(3, 2, 2, 4, pal.hair);
    if (pal.cap) R(9, 3, 5, 1, pal.capD || pal.hair);
    R(10, 5, 1, 1, '#151515');
  }
  g.restore();
}

const PLAYER_PAL = { hair: C.yellow, cap: true, capD: '#c99225', skin: '#e8b98a', shirt: '#3d3d3d', pants: '#2a2a2a' };

// Battle creature sprites — drawn in a 24x24 logical box
const CREATURES = {
  duck(g) { // front
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(4, 10, 14, 9, C.yellow); R(8, 3, 9, 8, C.yellow);
    R(3, 12, 2, 4, C.yellow);                 // tail
    R(5, 12, 5, 4, '#c99225');                // wing
    R(13, 6, 2, 2, '#151515');                // eye
    R(17, 7, 4, 3, '#e07a5f');                // beak
    R(8, 19, 3, 2, '#e07a5f'); R(13, 19, 3, 2, '#e07a5f');
  },
  duckBack(g) {
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(4, 10, 14, 9, C.yellow); R(7, 3, 9, 8, C.yellow);
    R(17, 13, 3, 3, C.yellow);
    R(6, 12, 10, 3, '#c99225');               // wing stripe
    R(15, 6, 2, 2, '#e07a5f');                // beak tip peeking
    R(8, 19, 3, 2, '#e07a5f'); R(13, 19, 3, 2, '#e07a5f');
  },
  gengo(g) { // flashcard critter
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(3, 9, 3, 6, C.yellow); R(18, 9, 3, 6, C.yellow);       // wings
    R(6, 4, 12, 16, '#e8e4da');                              // card
    R(6, 4, 12, 1, C.yellow); R(6, 19, 12, 1, C.yellow);     // card edges
    R(8, 7, 8, 1, '#555'); R(8, 9, 6, 1, '#555');            // text lines
    R(9, 13, 2, 2, '#151515'); R(14, 13, 2, 2, '#151515');   // eyes
    R(11, 16, 3, 1, '#e07a5f');                              // smile
    R(8, 20, 2, 2, '#c9c4b8'); R(14, 20, 2, 2, '#c9c4b8');   // feet
  },
  guardian(g) { // shield bot
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(5, 3, 14, 11, C.green);
    R(6, 14, 12, 3, C.green); R(8, 17, 8, 2, C.green); R(10, 19, 4, 2, C.green);
    R(7, 6, 10, 4, '#a8ccb8');                               // visor band
    R(9, 7, 2, 2, '#151515'); R(14, 7, 2, 2, '#151515');     // eyes
    R(11, 12, 2, 2, '#e8e4da'); R(10, 13, 1, 1, '#e8e4da');  // check emblem
    R(5, 3, 14, 1, '#a8ccb8');
  },
  pulse(g) { // heart monitor
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(5, 4, 6, 5, C.red); R(13, 4, 6, 5, C.red);
    R(4, 8, 16, 7, C.red);
    R(6, 15, 12, 3, C.red); R(9, 18, 6, 2, C.red); R(11, 20, 2, 1, C.red);
    R(7, 9, 10, 5, '#151515');                               // screen
    // ECG trace
    const e = '#81b29a';
    R(8, 11, 2, 1, e); R(10, 9, 1, 3, e); R(11, 11, 1, 1, e); R(12, 12, 1, 2, e); R(13, 11, 3, 1, e);
    R(6, 5, 2, 2, '#f0b8a8');                                // shine
  },
  oracle(g) { // prophetic baseball
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const b = '#e8e4da';
    R(7, 3, 10, 2, b); R(5, 5, 14, 2, b); R(4, 7, 16, 9, b); R(5, 16, 14, 2, b); R(7, 18, 10, 2, b);
    // stitches
    R(6, 6, 1, 2, C.red); R(5, 9, 1, 3, C.red); R(6, 13, 1, 2, C.red);
    R(17, 6, 1, 2, C.red); R(18, 9, 1, 3, C.red); R(17, 13, 1, 2, C.red);
    // mystic eye
    R(9, 9, 6, 5, C.blue); R(11, 10, 2, 3, '#151515');
    R(8, 8, 1, 1, C.blue); R(15, 8, 1, 1, C.blue); R(8, 14, 1, 1, C.blue); R(15, 14, 1, 1, C.blue);
  },
};

// ===== WORLD LOGIC =====
function walkable(tx, ty) {
  if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false;
  if (solid[ty][tx]) return false;
  for (const n of NPCS) if (n.tx === tx && n.ty === ty) return false;
  return true;
}

function updateWorld(dt) {
  const t = dt / 16.667;
  if (player.moving) {
    player.t += dt / 190;
    player.stepT += dt;
    if (player.stepT > 95) { player.stepT = 0; player.step = player.step === 1 ? 2 : 1; }
    if (player.t >= 1) {
      player.tx = player.tx2; player.ty = player.ty2;
      player.x = player.tx * TILE; player.y = player.ty * TILE;
      player.moving = false; player.step = 0;
      tryStartMove(); // keep walking if key held
    } else {
      player.x = (player.tx + (player.tx2 - player.tx) * player.t) * TILE;
      player.y = (player.ty + (player.ty2 - player.ty) * player.t) * TILE;
    }
  } else {
    tryStartMove();
  }
}

function heldDir() {
  if (keys.up) return 'up';
  if (keys.down) return 'down';
  if (keys.left) return 'left';
  if (keys.right) return 'right';
  return null;
}

function tryStartMove() {
  const d = heldDir();
  if (!d || player.moving) return;
  player.dir = d;
  const [dx, dy] = DIRS[d];
  const nx = player.tx + dx, ny = player.ty + dy;
  if (!walkable(nx, ny)) return;
  player.tx2 = nx; player.ty2 = ny;
  player.t = 0; player.moving = true;
  if (player.step === 0) player.step = 1;
}

function tryInteract() {
  const [dx, dy] = DIRS[player.dir];
  const tx = player.tx + dx, ty = player.ty + dy;
  const npc = NPCS.find(n => n.tx === tx && n.ty === ty);
  if (npc) {
    npc.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[player.dir];
    let pages, onEnd = null;
    if (npc.id === 'prof') {
      pages = badges() === 4 ? npc.dialogClear : (badges() === 0 ? npc.dialog : npc.dialogMid);
    } else if (npc.defeated) {
      pages = npc.dialogPost;
    } else {
      pages = npc.dialog;
      onEnd = () => beginTransition(npc);
    }
    dialog = { pages, page: 0, chars: 0, onEnd };
    mode = 'dialog';
    return;
  }
  const sign = SIGNS.find(s => s.x === tx && s.y === ty);
  if (sign) {
    dialog = { pages: sign.lines, page: 0, chars: 0, onEnd: null };
    mode = 'dialog';
  }
}

function advanceDialog() {
  const page = dialog.pages[dialog.page];
  const total = page.join('').length;
  if (dialog.chars < total) { dialog.chars = total; return; }  // reveal all
  if (dialog.page < dialog.pages.length - 1) { dialog.page++; dialog.chars = 0; return; }
  const end = dialog.onEnd;
  dialog = null;
  mode = 'world';
  if (end) end();
}

// ===== BATTLE =====
function beginTransition(npc) {
  transition = { t: 0, dur: 700, npc };
  mode = 'transition';
}

function startBattle(npc) {
  const b = npc.battle;
  battle = {
    npc,
    enemy: { name: b.creature, hp: b.hp, maxHp: b.hp, shownHp: b.hp,
             sprite: b.sprite, accent: b.accent,
             moves: b.moves.map(m => ({ ...m, usesLeft: m.uses || Infinity })) },
    duck: { name: 'RUBBER DUCK', hp: 70, maxHp: 70, shownHp: 70,
            moves: DUCK_MOVES.map(m => ({ ...m, usesLeft: m.uses || Infinity })) },
    state: 'msg', cursor: 0, msgQ: [], msgChars: 0,
    flashEnemy: 0, flashDuck: 0, after: null,
  };
  queueMsg([`${npc.name} sent out ${b.creature}!`, 'Go get \'em, RUBBER DUCK!'], () => { battle.state = 'menu'; });
  mode = 'battle';
}

function queueMsg(msgs, after) {
  battle.msgQ.push(...msgs);
  battle.after = after || null;
  battle.state = 'msg';
  battle.msgChars = 0;
}

function advanceBattleMsg() {
  const cur = battle.msgQ[0];
  if (battle.msgChars < cur.length) { battle.msgChars = cur.length; return; }
  battle.msgQ.shift();
  battle.msgChars = 0;
  if (battle.msgQ.length === 0) {
    const fn = battle.after;
    battle.after = null;
    if (fn) fn();
  }
}

function playerMove(i) {
  const duck = battle.duck, en = battle.enemy;
  const m = duck.moves[i];
  if (m.usesLeft <= 0) { queueMsg(['No uses left!'], () => { battle.state = 'menu'; }); return; }
  m.usesLeft--;
  const msgs = [`RUBBER DUCK used ${m.name}!`];
  if (m.heal) {
    duck.hp = Math.min(duck.maxHp, duck.hp + m.heal);
    msgs.push('RUBBER DUCK restored some HP!');
  } else if (Math.random() * 100 < m.acc) {
    const dmg = m.pow + Math.floor(Math.random() * 7) - 3;
    en.hp = Math.max(0, en.hp - dmg);
    battle.flashEnemy = 400;
    if (m.pow >= 26) msgs.push("It's a critical hit of caffeine and rage!");
  } else {
    msgs.push('...but it missed!');
  }
  if (en.hp <= 0) {
    queueMsg(msgs.concat([`${en.name} crashed! (segfault)`]), winBattle);
  } else {
    queueMsg(msgs, enemyTurn);
  }
}

function enemyTurn() {
  const duck = battle.duck, en = battle.enemy;
  let pool = en.moves.filter(m => !m.heal && m.usesLeft > 0);
  const healMove = en.moves.find(m => m.heal && m.usesLeft > 0);
  let m;
  if (healMove && en.hp < en.maxHp * 0.4 && Math.random() < 0.6) m = healMove;
  else m = pool[Math.floor(Math.random() * pool.length)];
  m.usesLeft--;
  const msgs = [`${en.name} used ${m.name}!`];
  if (m.heal) {
    en.hp = Math.min(en.maxHp, en.hp + m.heal);
    msgs.push(`${en.name} restored some HP!`);
  } else if (Math.random() * 100 < m.acc) {
    const dmg = m.pow + Math.floor(Math.random() * 7) - 3;
    duck.hp = Math.max(0, duck.hp - dmg);
    battle.flashDuck = 400;
    if (m.drain) {
      en.hp = Math.min(en.maxHp, en.hp + m.drain);
      msgs.push(`${en.name} drained some energy!`);
    }
  } else {
    msgs.push('...but it missed!');
  }
  if (duck.hp <= 0) {
    queueMsg(msgs.concat(['RUBBER DUCK fainted!', 'You hurried back to the plaza...']), loseBattle);
  } else {
    queueMsg(msgs, () => { battle.state = 'menu'; });
  }
}

function winBattle() {
  battle.npc.defeated = true;
  const done = badges() === 4;
  const msgs = [`You defeated ${battle.npc.name}!`, 'RUBBER DUCK was patched up to full HP.'];
  if (done) msgs.push('That\'s ALL FOUR projects! PROF. PIXEL', 'is waiting for you at the plaza!');
  queueMsg(msgs, () => { battle = null; mode = 'world'; });
}

function loseBattle() {
  queueMsg([], null);
  player.tx = SPAWN.tx; player.ty = SPAWN.ty;
  player.x = SPAWN.tx * TILE; player.y = SPAWN.ty * TILE;
  player.moving = false; player.dir = 'down';
  battle = null;
  mode = 'world';
}

// ===== DRAWING: WORLD =====
function camPos() {
  let cx = player.x + 8 - VIEW_W / 2;
  let cy = player.y + 8 - VIEW_H / 2;
  cx = Math.max(0, Math.min(MAP_W * TILE - VIEW_W, cx));
  cy = Math.max(0, Math.min(MAP_H * TILE - VIEW_H, cy));
  return [cx, cy];
}

function drawWorld() {
  const [cx, cy] = camPos();
  ctx.setTransform(SCALE, 0, 0, SCALE, -cx * SCALE, -cy * SCALE);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mapCanvas, 0, 0);

  // animated water shimmer
  ctx.fillStyle = 'rgba(123,140,222,0.35)';
  const ph = Math.floor(animT / 400) % 3;
  waterTiles.forEach(([x, y]) => {
    ctx.fillRect(x * TILE + 3 + ph * 3, y * TILE + 4, 4, 1);
    ctx.fillRect(x * TILE + 9 - ph * 2, y * TILE + 10, 3, 1);
  });

  // entities sorted by y so lower ones draw on top
  const ents = NPCS.map(n => ({ y: n.ty * TILE, draw: () => drawPerson(ctx, n.tx * TILE, n.ty * TILE - 2, n.dir, 0, n.pal) }));
  ents.push({ y: player.y, draw: () => drawPerson(ctx, player.x, player.y - 2, player.dir, player.moving ? player.step : 0, PLAYER_PAL) });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // HUD: progress
  ctx.fillStyle = 'rgba(13,13,13,0.75)';
  ctx.fillRect(12, 12, 208, 34);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.strokeRect(12.5, 12.5, 207, 33);
  ctx.fillStyle = C.text;
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PROJECTS', 24, 34);
  NPCS.filter(n => n.battle).forEach((n, i) => {
    ctx.fillStyle = n.defeated ? n.battle.accent : 'rgba(255,255,255,0.15)';
    ctx.fillRect(140 + i * 18, 22, 12, 12);
  });

  if (mode === 'dialog' && dialog) drawDialog();
}

function drawDialog() {
  const bx = 20, bh = 150, by = CH - bh - 16, bw = CW - 40;
  ctx.fillStyle = 'rgba(13,13,13,0.94)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(252,191,73,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);

  const page = dialog.pages[dialog.page];
  ctx.fillStyle = C.text;
  ctx.font = '14px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  let remaining = dialog.chars;
  page.forEach((line, i) => {
    const show = line.slice(0, Math.max(0, remaining));
    remaining -= line.length;
    ctx.fillText(show, bx + 26, by + 42 + i * 34);
  });
  // continue arrow
  const total = page.join('').length;
  if (dialog.chars >= total && Math.floor(animT / 400) % 2 === 0) {
    ctx.fillStyle = C.yellow;
    ctx.fillText('▼', bx + bw - 40, by + bh - 20);
  }
}

// ===== DRAWING: BATTLE =====
function drawCreature(name, x, y, scale, flashT) {
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, x, y);
  ctx.imageSmoothingEnabled = false;
  if (flashT > 0 && Math.floor(flashT / 80) % 2 === 0) ctx.globalAlpha = 0.25;
  CREATURES[name](ctx);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
}

function drawHpPanel(x, y, name, hp, maxHp, shownHp, accent) {
  ctx.fillStyle = 'rgba(20,20,20,0.95)';
  ctx.fillRect(x, y, 330, 74);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, 328, 72);
  ctx.fillStyle = C.text;
  ctx.font = '13px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(name, x + 16, y + 28);
  // bar
  const bw = 250, frac = Math.max(0, shownHp / maxHp);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x + 16, y + 42, bw, 12);
  ctx.fillStyle = frac > 0.5 ? C.green : frac > 0.22 ? C.yellow : C.red;
  ctx.fillRect(x + 16, y + 42, bw * frac, 12);
  ctx.fillStyle = C.muted;
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`${Math.ceil(Math.max(0, shownHp))}/${maxHp}`, x + 274 - 0, y + 52);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 5, 74);
}

function drawBattle(dt) {
  const b = battle;
  // animate shown HP toward actual
  b.enemy.shownHp += (b.enemy.hp - b.enemy.shownHp) * Math.min(1, dt / 180);
  b.duck.shownHp += (b.duck.hp - b.duck.shownHp) * Math.min(1, dt / 180);
  if (b.flashEnemy > 0) b.flashEnemy -= dt;
  if (b.flashDuck > 0) b.flashDuck -= dt;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#101010';
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 8; i++) ctx.fillRect(0, i * 56, CW, 1);

  // platforms
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.ellipse(700, 268, 130, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(240, 432, 150, 30, 0, 0, Math.PI * 2); ctx.fill();

  // creatures
  drawCreature(b.enemy.sprite, 628, 120, 6, b.flashEnemy);
  drawCreature('duckBack', 156, 268, 7, b.flashDuck);

  // HP panels
  drawHpPanel(40, 40, b.enemy.name, b.enemy.hp, b.enemy.maxHp, b.enemy.shownHp, b.enemy.accent);
  drawHpPanel(590, 330, b.duck.name, b.duck.hp, b.duck.maxHp, b.duck.shownHp, C.yellow);

  // bottom panel
  const py = CH - 156;
  ctx.fillStyle = 'rgba(13,13,13,0.96)';
  ctx.fillRect(16, py, CW - 32, 140);
  ctx.strokeStyle = 'rgba(252,191,73,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(17, py + 1, CW - 34, 138);

  ctx.font = '14px "Press Start 2P", monospace';
  ctx.textAlign = 'left';

  if (b.state === 'msg' && b.msgQ.length) {
    const cur = b.msgQ[0];
    ctx.fillStyle = C.text;
    // wrap into two lines max at ~58 chars
    const shown = cur.slice(0, b.msgChars);
    const l1 = shown.slice(0, 58), l2 = shown.slice(58);
    ctx.fillText(l1, 40, py + 46);
    if (l2) ctx.fillText(l2, 40, py + 82);
    if (b.msgChars >= cur.length && Math.floor(animT / 400) % 2 === 0) {
      ctx.fillStyle = C.yellow;
      ctx.fillText('▼', CW - 70, py + 116);
    }
  } else if (b.state === 'menu') {
    ctx.fillStyle = C.muted;
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillText('WHAT WILL RUBBER DUCK DO?', 40, py + 30);
    ctx.font = '14px "Press Start 2P", monospace';
    b.duck.moves.forEach((m, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const mx = 70 + col * 440, my = py + 66 + row * 40;
      ctx.fillStyle = i === b.cursor ? C.yellow : C.text;
      if (i === b.cursor) ctx.fillText('▶', mx - 28, my);
      ctx.fillText(m.name, mx, my);
      if (m.uses) {
        ctx.fillStyle = C.muted;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(`x${m.usesLeft}`, mx + 250, my);
        ctx.font = '14px "Press Start 2P", monospace';
      }
    });
    // move info
    const sel = b.duck.moves[b.cursor];
    ctx.fillStyle = C.muted;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(sel.heal ? `HEALS ${sel.heal} HP` : `PWR ${sel.pow}  ACC ${sel.acc}`, 40, py + 128);
  }
}

// ===== DRAWING: TRANSITION =====
function drawTransition() {
  drawWorld();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const f = transition.t / transition.dur;
  ctx.fillStyle = C.dark;
  const bars = 8;
  for (let i = 0; i < bars; i++) {
    const bw = CW * Math.min(1, f * 1.6);
    if (i % 2 === 0) ctx.fillRect(0, i * CH / bars, bw, CH / bars + 1);
    else ctx.fillRect(CW - bw, i * CH / bars, bw, CH / bars + 1);
  }
}

// ===== MAIN LOOP =====
function loop(time) {
  const dt = Math.min(50, time - lastTime || 16);
  lastTime = time;
  animT += dt;

  if (mode === 'world') {
    updateWorld(dt);
    drawWorld();
  } else if (mode === 'dialog') {
    if (dialog) {
      const total = dialog.pages[dialog.page].join('').length;
      if (dialog.chars < total) dialog.chars = Math.min(total, dialog.chars + dt * 0.06);
    }
    drawWorld();
  } else if (mode === 'transition') {
    transition.t += dt;
    drawTransition();
    if (transition.t >= transition.dur) {
      const npc = transition.npc;
      transition = null;
      startBattle(npc);
    }
  } else if (mode === 'battle') {
    if (battle) {
      if (battle.state === 'msg' && battle.msgQ.length) {
        const cur = battle.msgQ[0];
        if (battle.msgChars < cur.length) battle.msgChars = Math.min(cur.length, battle.msgChars + dt * 0.06);
      }
      drawBattle(dt);
    }
  } else {
    drawWorld(); // title: world visible behind overlay
  }
  requestAnimationFrame(loop);
}

// ===== INPUT =====
const KEYMAP = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

document.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  const dir = KEYMAP[e.key];
  if (dir) keys[dir] = true;
  const confirm = e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z';

  if (mode === 'world' && confirm && !e.repeat) tryInteract();
  else if (mode === 'dialog' && confirm && !e.repeat) advanceDialog();
  else if (mode === 'battle' && battle && !e.repeat) {
    if (battle.state === 'msg') { if (confirm) advanceBattleMsg(); }
    else if (battle.state === 'menu') {
      if (dir === 'left' || dir === 'right') battle.cursor = battle.cursor % 2 === 0 ? battle.cursor + 1 : battle.cursor - 1;
      if (dir === 'up' || dir === 'down') battle.cursor = (battle.cursor + 2) % 4;
      if (confirm) playerMove(battle.cursor);
    }
  }
});
document.addEventListener('keyup', e => {
  const dir = KEYMAP[e.key];
  if (dir) keys[dir] = false;
});

// touch controls
function bindTouch(id, down, up) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); down(); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => up && up()));
}
['up', 'down', 'left', 'right'].forEach(d => bindTouch('t-' + d, () => {
  keys[d] = true;
  if (mode === 'battle' && battle && battle.state === 'menu') {
    if (d === 'left' || d === 'right') battle.cursor = battle.cursor % 2 === 0 ? battle.cursor + 1 : battle.cursor - 1;
    else battle.cursor = (battle.cursor + 2) % 4;
  }
}, () => keys[d] = false));
bindTouch('t-a', () => {
  if (mode === 'world') tryInteract();
  else if (mode === 'dialog') advanceDialog();
  else if (mode === 'battle' && battle) {
    if (battle.state === 'msg') advanceBattleMsg();
    else if (battle.state === 'menu') playerMove(battle.cursor);
  }
});

// ===== START =====
function startAdventure() {
  document.getElementById('startOverlay').style.display = 'none';
  mode = 'world';
}

requestAnimationFrame(loop);
