// ===== JOUST =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = 800, H = 540;
const TOP = 36;              // HUD ceiling
const LAVA_Y = 506;
const GRAV = 0.14;
const FLAP_P = 3.3;          // player flap impulse
const FLAP_E = 3.4;          // enemy flap impulse
const HW = 12, HH = 13;      // bird hitbox half-extents

// Platforms: classic floating-ledge layout (bottom row is flush to the
// edges so you can run off one side and wrap onto the other)
const PLATS = [
  { x: 0,   y: 468, w: 190, h: 16 },
  { x: 265, y: 468, w: 270, h: 16 },
  { x: 610, y: 468, w: 190, h: 16 },
  { x: 60,  y: 332, w: 170, h: 14 },
  { x: 570, y: 332, w: 170, h: 14 },
  { x: 315, y: 240, w: 170, h: 14 },
  { x: 0,   y: 150, w: 120, h: 14 },
  { x: 680, y: 150, w: 120, h: 14 },
];
const PLAYER_PAD = { x: 400, y: 468 };
const ENEMY_PADS = [ { x: 145, y: 332 }, { x: 655, y: 332 }, { x: 400, y: 240 } ];

const TIER = [
  { name: 'BOUNDER',     rider: '#e07a5f', pts: 500,  maxVx: 1.9, flapCd: 300 },
  { name: 'HUNTER',      rider: '#f0ede8', pts: 750,  maxVx: 2.4, flapCd: 250 },
  { name: 'SHADOW LORD', rider: '#7b8cde', pts: 1500, maxVx: 2.9, flapCd: 200 },
];

// ===== STATE =====
let state = 'menu'; // menu | playing | paused | gameover
let player = null;
let enemies = [], eggs = [], particles = [], popups = [], pending = [], bubbles = [];
let ptero = null;
let score = 0, best, lives = 0, wave = 1, waveTime = 0, eggChain = 0, nextLifeAt = 20000;
let banner = null;   // { text, t, dur }
let pteroRespawnT = 0;
let lastTime = 0;

const keys = { left: false, right: false, flap: false };
let flapCd = 0;

best = parseInt(localStorage.getItem('joustBest') || '0');

// ===== HELPERS =====
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function wrapDelta(a, b) {
  let d = (b - a) % W;
  if (d >  W / 2) d -= W;
  if (d < -W / 2) d += W;
  return d;
}
function overlap(a, b, hw, hh) {
  return Math.abs(wrapDelta(a.px, b.px)) < hw && Math.abs(a.py - b.py) < hh;
}

// ===== GAME SETUP =====
function newPlayer() {
  return { px: PLAYER_PAD.x, py: PLAYER_PAD.y - HH, vx: 0, vy: 0, facing: 1,
           grounded: true, wing: 0, run: 0, alive: true, deadT: 0, invulnT: 2200, matT: 900 };
}

function startGame() {
  document.getElementById('startOverlay').style.display = 'none';
  document.getElementById('gameOverOverlay').style.display = 'none';
  document.getElementById('pauseOverlay').style.display = 'none';
  score = 0; lives = 3; wave = 1; nextLifeAt = 20000;
  player = newPlayer();
  enemies = []; eggs = []; particles = []; popups = []; pending = []; bubbles = [];
  ptero = null; pteroRespawnT = 0;
  state = 'playing';
  startWave(1);
  updateHudDom();
}

function startWave(n) {
  waveTime = 0; eggChain = 0;
  ptero = null; pteroRespawnT = 0;
  banner = { text: 'WAVE ' + n, t: 0, dur: 1400 };
  const count = Math.min(2 + n, 6);
  for (let i = 0; i < count; i++) {
    const pad = ENEMY_PADS[Math.floor(Math.random() * ENEMY_PADS.length)];
    pending.push({ delay: 700 + i * 850, tier: pickTier(n), x: pad.x, y: pad.y });
  }
}

function pickTier(n) {
  const shadow = Math.min(0.45, Math.max(0, (n - 3) * 0.12));
  const hunter = Math.min(0.50, Math.max(0, (n - 1) * 0.18));
  const r = Math.random();
  if (r < shadow) return 2;
  if (r < shadow + hunter) return 1;
  return 0;
}

function spawnEnemy(tier, x, y) {
  enemies.push({ px: x, py: y - HH, vx: 0, vy: 0, facing: Math.random() < 0.5 ? 1 : -1,
                 grounded: true, wing: 0, run: 0, tier,
                 matT: 1100, flapCd: 0, decideT: 0,
                 wanderX: Math.random() * W, wanderY: 100 + Math.random() * 320 });
}

// ===== SCORING =====
function addScore(pts, x, y, color) {
  score += pts;
  if (x !== undefined) popups.push({ x, y, text: '+' + pts, t: 0, color: color || '#fcbf49' });
  while (score >= nextLifeAt) {
    lives++;
    nextLifeAt += 20000;
    popups.push({ x: player.px, y: player.py - 30, text: 'EXTRA LIFE!', t: 0, color: '#81b29a' });
  }
  if (score > best) { best = score; localStorage.setItem('joustBest', best); }
  updateHudDom();
}

function updateHudDom() { /* HUD is canvas-drawn; hook kept for future side panels */ }

// ===== PHYSICS =====
function physics(o, t, dir, maxVx) {
  const accel = o.grounded ? 0.22 : 0.12;
  if (dir) { o.vx += dir * accel * t; o.facing = dir; }
  else if (o.grounded) o.vx *= Math.pow(0.86, t);
  o.vx = clamp(o.vx, -maxVx, maxVx);
  o.vy = clamp(o.vy + GRAV * t, -5, 4.8);
  const prevY = o.py;
  o.px += o.vx * t;
  o.py += o.vy * t;
  o.px = ((o.px % W) + W) % W;
  if (o.py - HH < TOP) { o.py = TOP + HH; if (o.vy < 0) o.vy = 0.4; }
  resolvePlatforms(o, prevY);
  if (!o.grounded) o.wing += 0.14 * t * (o.vy < 0 ? 2.2 : 1);
  o.run += Math.abs(o.vx) * 0.25 * t;
}

function resolvePlatforms(o, prevY) {
  o.grounded = false;
  for (const p of PLATS) {
    let ox = null;
    for (const off of [0, -W, W]) {
      const x = o.px + off;
      if (x + HW > p.x && x - HW < p.x + p.w) { ox = off; break; }
    }
    if (ox === null) continue;
    const feet = o.py + HH, prevFeet = prevY + HH;
    const head = o.py - HH, prevHead = prevY - HH;
    if (o.vy >= 0 && prevFeet <= p.y + 5 && feet >= p.y) {
      o.py = p.y - HH; o.vy = 0; o.grounded = true;
    } else if (o.vy < 0 && prevHead >= p.y + p.h - 5 && head <= p.y + p.h) {
      o.py = p.y + p.h + HH; o.vy = 0.5;
    } else if (feet > p.y + 5 && head < p.y + p.h - 5) {
      const x = o.px + ox;
      o.px = (x < p.x + p.w / 2 ? p.x - HW : p.x + p.w + HW) - ox;
      o.px = ((o.px % W) + W) % W;
      o.vx *= -0.5;
    }
  }
}

// ===== UPDATE =====
function update(dt) {
  const t = dt / 16.667;
  waveTime += dt;

  // --- player ---
  if (player.alive) {
    if (player.matT > 0) player.matT -= dt;
    else {
      if (player.invulnT > 0) player.invulnT -= dt;
      flapCd -= dt;
      if (keys.flap && flapCd <= 0) { player.vy -= FLAP_P; player.wing = 0; flapCd = 210; }
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      physics(player, t, dir, 3.0);
      if (player.py + HH > LAVA_Y) killPlayer();
    }
  } else {
    player.deadT -= dt;
    if (player.deadT <= 0) {
      if (lives > 0) player = newPlayer();
      else return gameOver();
    }
  }

  // --- pending spawns ---
  for (let i = pending.length - 1; i >= 0; i--) {
    pending[i].delay -= dt;
    if (pending[i].delay <= 0) {
      spawnEnemy(pending[i].tier, pending[i].x, pending[i].y);
      pending.splice(i, 1);
    }
  }

  // --- enemies ---
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.matT > 0) { e.matT -= dt; continue; }
    enemyAI(e, dt, t);
    physics(e, t, e.dir, TIER[e.tier].maxVx);
    if (e.py + HH > LAVA_Y) { burst(e.px, e.py, TIER[e.tier].rider); enemies.splice(i, 1); continue; }
    // enemy vs enemy repel
    for (let j = i - 1; j >= 0; j--) {
      const o = enemies[j];
      if (o.matT > 0) continue;
      if (overlap(e, o, HW * 2, HH * 2 - 4)) {
        const s = Math.sign(wrapDelta(o.px, e.px)) || 1;
        e.vx = s * 1.8; o.vx = -s * 1.8;
        e.vy -= 0.4; o.vy -= 0.4;
      }
    }
  }

  // --- jousts ---
  if (player.alive && player.matT <= 0) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.matT > 0) continue;
      if (!overlap(player, e, HW * 2, HH * 2)) continue;
      const dy = e.py - player.py;
      if (dy > 7) {
        // player wins
        burst(e.px, e.py, TIER[e.tier].rider);
        addScore(TIER[e.tier].pts, e.px, e.py, TIER[e.tier].rider);
        eggs.push({ px: e.px, py: e.py, vx: e.vx * 0.5, vy: -1.2, tier: e.tier,
                    phase: 'egg', t: 0, grounded: false });
        enemies.splice(i, 1);
      } else if (dy < -7 && player.invulnT <= 0) {
        killPlayer();
        break;
      } else {
        // tie (or invulnerable) — bounce apart
        const s = Math.sign(wrapDelta(e.px, player.px)) || 1;
        player.vx = s * 2.4; e.vx = -s * 2.4;
        player.vy -= 0.6; e.vy -= 0.6;
      }
    }
  }

  // --- eggs ---
  for (let i = eggs.length - 1; i >= 0; i--) {
    const g = eggs[i];
    g.t += dt;
    // simple physics
    g.vy = clamp(g.vy + GRAV * t, -5, 4.6);
    const prevY = g.py;
    g.px = (((g.px + g.vx * t) % W) + W) % W;
    g.py += g.vy * t;
    g.grounded = false;
    for (const p of PLATS) {
      for (const off of [0, -W, W]) {
        const x = g.px + off;
        if (x + 5 > p.x && x - 5 < p.x + p.w &&
            g.vy >= 0 && prevY + 6 <= p.y + 5 && g.py + 6 >= p.y) {
          g.py = p.y - 6;
          g.vy = g.vy > 1.4 ? -g.vy * 0.35 : 0;
          g.vx *= 0.9;
          g.grounded = true;
        }
      }
    }
    if (g.py > LAVA_Y) { burst(g.px, LAVA_Y - 4, '#e07a5f'); eggs.splice(i, 1); continue; }
    // hatch progression
    if (g.phase === 'egg' && g.t > 9000)  { g.phase = 'hatchling'; g.t = 0; }
    if (g.phase === 'hatchling' && g.t > 3500) {
      spawnEnemy(Math.min(g.tier + 1, 2), g.px, g.py + 6);
      eggs.splice(i, 1);
      continue;
    }
    // collect
    if (player.alive && player.matT <= 0 && overlap(player, g, HW + 6, HH + 8)) {
      eggChain++;
      addScore(Math.min(250 * eggChain, 1000), g.px, g.py, '#81b29a');
      eggs.splice(i, 1);
    }
  }

  // --- pterodactyl ---
  updatePtero(dt, t);

  // --- particles & popups ---
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * t; p.y += p.vy * t; p.vy += 0.08 * t; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = popups.length - 1; i >= 0; i--) {
    popups[i].t += dt;
    if (popups[i].t > 1100) popups.splice(i, 1);
  }

  // --- lava bubbles ---
  if (Math.random() < 0.06 * t) {
    bubbles.push({ x: Math.random() * W, y: H, r: 1.5 + Math.random() * 3, life: 2200 });
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y -= 0.25 * t; b.life -= dt;
    if (b.life <= 0 || b.y < LAVA_Y + 4) bubbles.splice(i, 1);
  }

  // --- banner / wave clear ---
  if (banner) {
    banner.t += dt;
    if (banner.t >= banner.dur) {
      const wasClear = banner.clear;
      banner = null;
      if (wasClear) { wave++; startWave(wave); }
    }
  } else if (enemies.length === 0 && eggs.length === 0 && pending.length === 0) {
    banner = { text: 'WAVE ' + wave + ' CLEAR', t: 0, dur: 1800, clear: true };
  }
}

function enemyAI(e, dt, t) {
  e.decideT -= dt;
  if (e.decideT <= 0) {
    e.decideT = 1500 + Math.random() * 2000;
    e.wanderX = Math.random() * W;
    e.wanderY = 100 + Math.random() * 320;
  }
  const hunting = e.tier > 0 && player.alive && player.matT <= 0;
  const tx = hunting ? player.px : e.wanderX;
  const ty = hunting ? player.py - (e.tier === 2 ? 34 : 8) : e.wanderY;
  const dx = wrapDelta(e.px, tx);
  e.dir = Math.abs(dx) < 14 ? 0 : Math.sign(dx);
  e.flapCd -= dt;
  if (e.flapCd <= 0) {
    const want = e.py > ty;
    const panic = e.py + HH > LAVA_Y - 46; // lava below — climb no matter what
    if (want || panic || Math.random() < 0.04 * t) {
      e.vy -= FLAP_E;
      e.wing = 0;
      e.flapCd = TIER[e.tier].flapCd * (0.8 + Math.random() * 0.5);
    }
  }
}

function updatePtero(dt, t) {
  if (!ptero) {
    if (waveTime > 40000 && enemies.length + eggs.length + pending.length > 0) {
      pteroRespawnT -= dt;
      if (pteroRespawnT <= 0) {
        const fromLeft = Math.random() < 0.5;
        ptero = { px: fromLeft ? -20 : W + 20, py: 120 + Math.random() * 200,
                  baseY: 200, vx: fromLeft ? 2.6 : -2.6, dirT: 2000, bob: 0 };
        ptero.baseY = ptero.py;
        popups.push({ x: W / 2, y: 90, text: 'PTERODACTYL!', t: 0, color: '#e07a5f' });
      }
    }
    return;
  }
  const pt = ptero;
  pt.bob += dt;
  pt.dirT -= dt;
  if (pt.dirT <= 0 && player.alive) {
    pt.dirT = 2000 + Math.random() * 1200;
    pt.vx = Math.sign(wrapDelta(pt.px, player.px)) * 2.6 || 2.6;
  }
  if (player.alive) pt.baseY += clamp(player.py - pt.baseY, -0.5 * t, 0.5 * t);
  pt.px = (((pt.px + pt.vx * t) % W) + W) % W;
  pt.py = clamp(pt.baseY + Math.sin(pt.bob * 0.004) * 26, TOP + 14, LAVA_Y - 20);

  if (player.alive && player.matT <= 0 &&
      Math.abs(wrapDelta(player.px, pt.px)) < HW + 16 && Math.abs(player.py - pt.py) < HH + 8) {
    const facingIt = Math.sign(wrapDelta(player.px, pt.px)) === player.facing;
    if (Math.abs(player.py - pt.py) < 7 && facingIt) {
      burst(pt.px, pt.py, '#c8b4e8');
      addScore(1000, pt.px, pt.py, '#c8b4e8');
      ptero = null;
      pteroRespawnT = 12000;
    } else if (player.invulnT <= 0) {
      killPlayer();
    }
  }
}

function killPlayer() {
  burst(player.px, player.py, '#fcbf49');
  player.alive = false;
  player.deadT = 1600;
  lives--;
  updateHudDom();
}

function gameOver() {
  state = 'gameover';
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalBest').textContent = 'BEST ' + best;
  document.getElementById('gameOverOverlay').style.display = 'flex';
}

function burst(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
                     life: 500 + Math.random() * 400, color });
  }
}

// ===== DRAWING =====
function draw() {
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, W, H);

  // lava glow
  const glow = ctx.createLinearGradient(0, LAVA_Y - 70, 0, LAVA_Y);
  glow.addColorStop(0, 'rgba(224,122,95,0)');
  glow.addColorStop(1, 'rgba(224,122,95,0.14)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, LAVA_Y - 70, W, 70);

  // lava
  const lava = ctx.createLinearGradient(0, LAVA_Y, 0, H);
  lava.addColorStop(0, '#e07a5f');
  lava.addColorStop(0.25, '#a83c22');
  lava.addColorStop(1, '#5c1708');
  ctx.fillStyle = lava;
  ctx.fillRect(0, LAVA_Y, W, H - LAVA_Y);
  ctx.fillStyle = 'rgba(252,191,73,0.5)';
  ctx.fillRect(0, LAVA_Y, W, 2);
  for (const b of bubbles) {
    ctx.fillStyle = 'rgba(252,191,73,0.35)';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  }

  // platforms
  for (const p of PLATS) {
    ctx.fillStyle = '#1e1c19';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(252,191,73,0.3)';
    ctx.fillRect(p.x, p.y, p.w, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
  }

  // eggs
  for (const g of eggs) drawWrapped(g.px, x => drawEgg(x, g));

  // enemies
  for (const e of enemies) {
    drawWrapped(e.px, x => {
      if (e.matT > 0) drawShimmer(x, e.py, TIER[e.tier].rider, e.matT);
      else drawBird(x, e.py, e.facing, e.wing, e.run, e.grounded, '#4a4640', '#332f2b', TIER[e.tier].rider);
    });
  }

  // pterodactyl
  if (ptero) drawWrapped(ptero.px, x => drawPtero(x, ptero));

  // player
  if (player && player.alive) {
    const blink = player.invulnT > 0 && player.matT <= 0 && Math.floor(player.invulnT / 110) % 2 === 0;
    drawWrapped(player.px, x => {
      if (player.matT > 0) drawShimmer(x, player.py, '#fcbf49', player.matT);
      else if (!blink) drawBird(x, player.py, player.facing, player.wing, player.run, player.grounded, '#fcbf49', '#c99225', '#f0ede8');
    });
  }

  // particles
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life / 400);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  // popups
  ctx.textAlign = 'center';
  ctx.font = '700 13px "DM Sans", sans-serif';
  for (const p of popups) {
    ctx.globalAlpha = 1 - p.t / 1100;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y - p.t * 0.035);
  }
  ctx.globalAlpha = 1;

  drawHUD();

  // wave banner
  if (banner && state === 'playing') {
    const fade = Math.min(1, banner.t / 200, (banner.dur - banner.t) / 300);
    ctx.globalAlpha = Math.max(0, fade);
    ctx.fillStyle = '#fcbf49';
    ctx.font = '52px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(banner.text, W / 2, 216);
    ctx.globalAlpha = 1;
  }
}

function drawWrapped(px, fn) {
  fn(px);
  if (px < 60) fn(px + W);
  if (px > W - 60) fn(px - W);
}

function drawBird(x, y, facing, wing, run, grounded, body, wingCol, rider) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // legs
  const swing = grounded ? Math.sin(run) * 4 : 3;
  ctx.strokeStyle = body;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-3 - swing, 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, 5);  ctx.lineTo(3 + swing, 12);  ctx.stroke();

  // tail
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-16, -5); ctx.lineTo(-8, -5); ctx.closePath(); ctx.fill();

  // body
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 6.5, 0, 0, Math.PI * 2); ctx.fill();

  // neck + head + beak
  ctx.strokeStyle = body;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(7, -2); ctx.quadraticCurveTo(12, -6, 13, -11); ctx.stroke();
  ctx.beginPath(); ctx.arc(13, -12, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(15, -13.5); ctx.lineTo(21, -11.5); ctx.lineTo(15, -10); ctx.closePath(); ctx.fill();

  // wing
  const wa = grounded ? 0.15 : Math.sin(wing) * 0.9;
  ctx.save();
  ctx.translate(-1, -1);
  ctx.rotate(-wa);
  ctx.fillStyle = wingCol;
  ctx.beginPath(); ctx.ellipse(-2, -2, 8, 3.4, -0.35, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // rider
  ctx.fillStyle = rider;
  ctx.fillRect(-4, -16, 7, 9);
  ctx.beginPath(); ctx.arc(0, -19, 3, 0, Math.PI * 2); ctx.fill();

  // lance
  ctx.strokeStyle = '#cfcabc';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-2, -13); ctx.lineTo(17, -15); ctx.stroke();

  ctx.restore();
}

function drawEgg(x, g) {
  if (g.phase === 'egg') {
    const wobble = g.t > 7000 ? Math.sin(g.t * 0.04) * 1.5 : 0;
    ctx.save();
    ctx.translate(x + wobble, g.py);
    ctx.fillStyle = '#f0ede8';
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = TIER[g.tier].rider;
    ctx.fillRect(-2, -2, 2, 2);
    ctx.fillRect(1, 1, 2, 2);
    ctx.restore();
  } else {
    // hatchling rider, waiting for a new mount
    const bob = Math.sin(g.t * 0.008) * 1.2;
    ctx.save();
    ctx.translate(x, g.py + bob);
    ctx.fillStyle = TIER[Math.min(g.tier + 1, 2)].rider;
    ctx.fillRect(-3, -6, 6, 8);
    ctx.beginPath(); ctx.arc(0, -9, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(-2, 6); ctx.moveTo(2, 2); ctx.lineTo(2, 6); ctx.stroke();
    ctx.restore();
  }
}

function drawPtero(x, pt) {
  const flap = Math.sin(pt.bob * 0.012) * 9;
  ctx.save();
  ctx.translate(x, pt.py);
  ctx.scale(Math.sign(pt.vx) || 1, 1);
  ctx.fillStyle = '#8a9499';
  // wings
  ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-16, -8 + flap); ctx.lineTo(-6, 2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, 0);  ctx.lineTo(-8, -10 + flap); ctx.lineTo(-2, 2); ctx.closePath(); ctx.fill();
  // body
  ctx.beginPath(); ctx.ellipse(2, 0, 10, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  // head crest + open jaws
  ctx.beginPath(); ctx.moveTo(9, -2); ctx.lineTo(6, -9); ctx.lineTo(12, -3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(22, -6); ctx.lineTo(12, -1); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, 0);  ctx.lineTo(21, 4);  ctx.lineTo(12, 1);  ctx.closePath(); ctx.fill();
  // eye
  ctx.fillStyle = '#e07a5f';
  ctx.fillRect(9, -4, 2, 2);
  ctx.restore();
}

function drawShimmer(x, y, color, matT) {
  const a = 0.25 + 0.35 * Math.abs(Math.sin(matT * 0.012));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - HW, y - HH - 6, HW * 2, HH * 2 + 6);
  ctx.globalAlpha = a * 0.5;
  ctx.fillStyle = color;
  ctx.fillRect(x - HW, y - HH - 6, HW * 2, HH * 2 + 6);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, TOP - 1, W, 1);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f0ede8';
  ctx.font = '20px "Bebas Neue", sans-serif';
  ctx.fillText('SCORE ' + (score || 0), 16, 25);
  ctx.fillStyle = '#888';
  ctx.fillText('HI ' + best, 170, 25);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#888';
  ctx.fillText(state === 'menu' ? 'JOUST' : 'WAVE ' + wave, W / 2, 25);

  // lives
  ctx.textAlign = 'right';
  if (state !== 'menu') {
    for (let i = 0; i < Math.min(lives, 6); i++) {
      const lx = W - 20 - i * 20;
      ctx.fillStyle = '#fcbf49';
      ctx.beginPath();
      ctx.moveTo(lx - 6, 26); ctx.lineTo(lx + 6, 26); ctx.lineTo(lx, 13);
      ctx.closePath(); ctx.fill();
    }
  }
}

// ===== LOOP =====
function loop(time) {
  const dt = Math.min(40, time - lastTime || 16);
  lastTime = time;
  if (state === 'playing') update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ===== INPUT =====
document.addEventListener('keydown', e => {
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
  if (k === 'p' || k === 'P') { togglePause(); return; }
  if (k === 'ArrowLeft'  || k === 'a' || k === 'A') keys.left = true;
  if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = true;
  if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
    keys.flap = true;
    if (!e.repeat) flapCd = 0; // fresh press always flaps instantly (mashing works)
  }
});
document.addEventListener('keyup', e => {
  const k = e.key;
  if (k === 'ArrowLeft'  || k === 'a' || k === 'A') keys.left = false;
  if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
  if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') keys.flap = false;
});

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    document.getElementById('pauseOverlay').style.display = 'flex';
  } else if (state === 'paused') {
    state = 'playing';
    document.getElementById('pauseOverlay').style.display = 'none';
    lastTime = performance.now();
  }
}

// touch controls
function bindTouch(id, down, up) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('pointerdown', e => { e.preventDefault(); down(); });
  el.addEventListener('pointerup',     () => up());
  el.addEventListener('pointerleave',  () => up());
  el.addEventListener('pointercancel', () => up());
}
bindTouch('t-left',  () => keys.left = true,  () => keys.left = false);
bindTouch('t-right', () => keys.right = true, () => keys.right = false);
bindTouch('t-flap',  () => { keys.flap = true; flapCd = 0; }, () => keys.flap = false);

// idle scene behind the start overlay
requestAnimationFrame(loop);
