/* ══════════════════════════════════════════════════
   SIMON GAME v2 — Full Logic
   New: Modes, Combo system, Countdown, Score floats,
   Per-step progress, Leaderboard filters, Animations
   ══════════════════════════════════════════════════ */

// ─── Audio ───────────────────────────────────────────────────────────────
let actx = null;
const getActx = () => { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; };

const FREQS = { green: 415, red: 330, yellow: 262, blue: 220 };

function playTone(color, ms = 220) {
  if (!soundOn) return;
  try {
    const ctx = getActx();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = FREQS[color] || 300;
    g.gain.setValueAtTime(0.28, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + ms / 1000);
  } catch (e) {}
}

function playError() {
  if (!soundOn) return;
  try {
    const ctx = getActx();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = 90;
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.55);
  } catch (e) {}
}

function playWin() {
  if (!soundOn) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    try {
      const ctx = getActx();
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.13;
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    } catch (e) {}
  });
}

function playComboSound(comboCount) {
  if (!soundOn) return;
  try {
    const ctx = getActx();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = 600 + comboCount * 50;
    osc.type = 'triangle';
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

// ─── Constants ──────────────────────────────────────────────────────────
const COLORS   = ['green', 'red', 'yellow', 'blue'];
const WIN_LVL  = 20;

const MODE_SPEEDS = {
  classic: { base: 900, minDelay: 350, dec: 30, litMs: 380 },
  speed:   { base: 550, minDelay: 200, dec: 15, litMs: 220 },
  chaos:   { base: 700, minDelay: 200, dec: 20, litMs: 300 },
};

// ─── State ───────────────────────────────────────────────────────────────
let sequence    = [];
let playerInput = [];
let level       = 0;
let score       = 0;
let highScore   = 0;
let gamesPlayed = 0;
let combo       = 0;
let maxCombo    = 0;
let isPlaying   = false;
let locked      = true;
let showing     = false;
let mode        = 'classic';
let strictOn    = false;
let soundOn     = true;

// ─── DOM ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const screens = {
  title:  $('screen-title'),
  game:   $('screen-game'),
  lb:     $('screen-lb'),
};

// Title
const titleBest   = $('title-best');
const titleGames  = $('title-games');
const modeCards   = document.querySelectorAll('.mode-card');
const strictToggle= $('strictToggle');
const soundToggle = $('soundToggle');
const btnPlay     = $('btnPlay');
const btnLB       = $('btnLeaderboard');

// Game
const hudMode   = $('hudMode');
const hudStrict = $('hudStrict');
const hudLevel  = $('hudLevel');
const hudScore  = $('hudScore');
const hudBest   = $('hudBest');
const seqFill   = $('seqFill');
const statusText= $('statusText');
const comboWrap = $('comboWrap');
const comboCount= $('comboCount');
const boardEl   = $('board');
const boardGlow = $('boardGlow');
const hubSub    = $('hubSub');
const btnBack   = $('btnBack');

// Leaderboard
const btnLbBack = $('btnLbBack');
const lbList    = $('lbList');
const lbTabs    = document.querySelectorAll('.lb-ftab');
const btnClearLb= $('btnClearLb');

// Modal
const modalBackdrop = $('modalBackdrop');
const modalIcon     = $('modalIcon');
const modalTitle    = $('modalTitle');
const modalSub      = $('modalSub');
const mScore        = $('mScore');
const mLevel        = $('mLevel');
const mCombo        = $('mCombo');
const newBest       = $('newBest');
const initialsInput = $('initialsInput');
const btnSave       = $('btnSave');
const btnSkip       = $('btnSkip');

// Countdown
const countdownBackdrop = $('countdownBackdrop');
const countdownNum      = $('countdownNum');

// ─── Screen Nav ──────────────────────────────────────────────────────────
function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => {
    if (k === name) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
}

// ─── Storage ─────────────────────────────────────────────────────────────
function loadStorage() {
  highScore   = parseInt(localStorage.getItem('sg_best')  || '0', 10);
  gamesPlayed = parseInt(localStorage.getItem('sg_games') || '0', 10);
  titleBest.textContent  = highScore;
  titleGames.textContent = gamesPlayed;
  hudBest.textContent    = highScore;
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('sg_best', highScore);
    hudBest.textContent    = highScore;
    titleBest.textContent  = highScore;
    return true;
  }
  return false;
}

function incGames() {
  gamesPlayed++;
  localStorage.setItem('sg_games', gamesPlayed);
  titleGames.textContent = gamesPlayed;
}

// Leaderboard
function loadLB() {
  try { return JSON.parse(localStorage.getItem('sg_lb') || '[]'); }
  catch (e) { return []; }
}
function saveLB(arr) { localStorage.setItem('sg_lb', JSON.stringify(arr)); }
function addLBEntry(initials, sc, lv, mc, md) {
  const entries = loadLB();
  entries.push({ initials: (initials || '???').toUpperCase().slice(0,3), score: sc, level: lv, maxCombo: mc, mode: md, date: Date.now() });
  entries.sort((a,b) => b.score - a.score);
  saveLB(entries.slice(0, 50));
  renderLB();
}

let lbFilter = 'all';
function renderLB() {
  const all = loadLB().filter(e => lbFilter === 'all' || e.mode === lbFilter);
  if (all.length === 0) {
    lbList.innerHTML = '<div class="lb-empty">No scores yet for this mode</div>';
    return;
  }
  lbList.innerHTML = all.slice(0,20).map((e, i) => `
    <div class="lb-entry" style="animation-delay:${i*0.04}s">
      <span class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1}</span>
      <span class="lb-initials">${e.initials}</span>
      <span class="lb-mode-badge">${(e.mode||'classic').toUpperCase()}</span>
      <span class="lb-score">${e.score}</span>
      <span class="lb-level">Lv ${e.level}</span>
    </div>
  `).join('');
}

// ─── Countdown ───────────────────────────────────────────────────────────
function runCountdown(cb) {
  countdownBackdrop.classList.remove('hidden');
  let n = 3;
  countdownNum.textContent = n;
  const tick = () => {
    n--;
    if (n <= 0) {
      countdownBackdrop.classList.add('hidden');
      cb();
      return;
    }
    countdownNum.style.animation = 'none';
    countdownNum.offsetHeight;
    countdownNum.style.animation = 'count-pop .8s ease';
    countdownNum.textContent = n;
    setTimeout(tick, 800);
  };
  setTimeout(tick, 800);
}

// ─── Game Core ────────────────────────────────────────────────────────────
function startGame() {
  sequence    = [];
  playerInput = [];
  level       = 0;
  score       = 0;
  combo       = 0;
  maxCombo    = 0;
  isPlaying   = true;
  locked      = true;

  hudMode.textContent   = mode.toUpperCase();
  hudStrict.textContent = strictOn ? '⚡ STRICT' : '';
  hudScore.textContent  = 0;
  hudLevel.textContent  = 0;
  hudBest.textContent   = highScore;
  seqFill.style.width   = '0%';
  comboWrap.classList.remove('visible');
  setStatus('Watch the sequence…');

  showScreen('game');
  runCountdown(() => nextRound());
}

function nextRound() {
  playerInput = [];
  level++;
  hudLevel.textContent = level;
  hubSub.textContent   = `LV ${level}`;

  // Add new color (chaos mode adds 1-2)
  if (mode === 'chaos' && level > 3 && Math.random() < .3) {
    sequence.push(COLORS[Math.floor(Math.random()*4)]);
  }
  sequence.push(COLORS[Math.floor(Math.random()*4)]);

  seqFill.style.width = '0%';
  setStatus(`Level ${level} — Watch!`);
  setTimeout(() => showSequence(), 500);
}

function getSpeed() {
  const cfg = MODE_SPEEDS[mode] || MODE_SPEEDS.classic;
  const base = cfg.base;
  let speed = base - (level - 1) * cfg.dec;
  if (mode === 'chaos') speed += (Math.random() - 0.5) * 200;
  return Math.max(cfg.minDelay, Math.round(speed));
}

function showSequence() {
  showing = true;
  locked  = true;
  let i = 0;
  const cfg = MODE_SPEEDS[mode] || MODE_SPEEDS.classic;

  function step() {
    if (i >= sequence.length) {
      showing = false;
      locked  = false;
      seqFill.style.width = '0%';
      setStatus(`Your turn! (${sequence.length} step${sequence.length > 1 ? 's' : ''})`);
      return;
    }
    const color = sequence[i];
    litButton(color, cfg.litMs);
    playTone(color, cfg.litMs - 40);
    boardGlow.className = 'board-glow ' + color;
    setTimeout(() => boardGlow.className = 'board-glow', cfg.litMs + 80);
    seqFill.style.width = `${((i + 1) / sequence.length) * 100}%`;
    i++;
    setTimeout(step, getSpeed());
  }
  step();
}

function litButton(color, ms) {
  const btn = document.getElementById('btn' + color.charAt(0).toUpperCase() + color.slice(1));
  if (!btn) return;
  btn.classList.add('lit');
  setTimeout(() => btn.classList.remove('lit'), ms);
}

function rippleButton(color) {
  const btn = document.getElementById('btn' + color.charAt(0).toUpperCase() + color.slice(1));
  if (!btn) return;
  btn.classList.remove('rippling');
  void btn.offsetWidth;
  btn.classList.add('rippling');
  setTimeout(() => btn.classList.remove('rippling'), 400);
}

function handleInput(color) {
  if (!isPlaying || locked || showing) return;
  playTone(color, 180);
  litButton(color, 160);
  rippleButton(color);

  boardGlow.className = 'board-glow ' + color;
  setTimeout(() => boardGlow.className = 'board-glow', 250);

  // Update input indicators
  const idx = playerInput.length;
  const dot = document.getElementById('ind-' + (idx % 5));
  if (dot) { dot.className = 'ind-dot ' + color; setTimeout(() => dot.className = 'ind-dot', 600); }

  const expected = sequence[playerInput.length];
  playerInput.push(color);

  if (color !== expected) {
    onMistake();
    return;
  }

  // Correct step
  combo++;
  if (combo > maxCombo) maxCombo = combo;
  const pts = 10 + (combo > 2 ? (combo - 2) * 5 : 0);
  score += pts;
  hudScore.textContent = score;
  spawnScoreFloat(pts);

  if (combo >= 3) {
    comboWrap.classList.add('visible');
    comboCount.textContent = combo;
    playComboSound(combo);
  }

  // Update progress
  const pct = (playerInput.length / sequence.length) * 100;
  seqFill.style.width = pct + '%';

  if (playerInput.length === sequence.length) {
    if (level === WIN_LEVEL) { onWin(); return; }
    setStatus('✓ Correct!');
    saveHighScore();
    setTimeout(() => nextRound(), 900);
  }
}

function onMistake() {
  locked = true;
  combo  = 0;
  comboWrap.classList.remove('visible');

  boardEl.classList.add('error');
  setTimeout(() => boardEl.classList.remove('error'), 500);
  boardGlow.className = 'board-glow red';
  setTimeout(() => boardGlow.className = 'board-glow', 600);
  playError();

  if (strictOn) {
    setStatus('✗ Wrong! Game over.', 'error');
    setTimeout(() => endGame(false), 900);
  } else {
    setStatus('✗ Wrong! Replaying…', 'error');
    playerInput = [];
    setTimeout(() => showSequence(), 1200);
  }
}

function onWin() {
  isPlaying = false;
  locked    = true;
  playWin();
  boardEl.classList.add('win');
  setTimeout(() => boardEl.classList.remove('win'), 2500);
  saveHighScore();
  incGames();
  openModal(true);
}

function endGame(won = false) {
  isPlaying = false;
  locked    = true;
  const isNew = saveHighScore();
  incGames();
  openModal(won, isNew);
}

function setStatus(msg, type = '') {
  statusText.textContent = msg;
  statusText.style.color = type === 'error' ? 'var(--c-red)' : 'var(--cyan)';
  statusText.style.textShadow = type === 'error'
    ? '0 0 12px var(--c-red)'
    : '0 0 12px var(--cyan)';
}

// ─── Score Float ─────────────────────────────────────────────────────────
function spawnScoreFloat(pts) {
  const board = document.getElementById('board');
  const rect  = board.getBoundingClientRect();
  const el    = document.createElement('div');
  el.className = 'score-float';
  el.textContent = '+' + pts;
  el.style.left = (rect.left + rect.width/2 - 20) + 'px';
  el.style.top  = (rect.top + rect.height/2) + 'px';
  if (pts > 15) { el.style.color = 'var(--c-yellow)'; el.style.fontSize = '1.3rem'; }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// ─── Modal ────────────────────────────────────────────────────────────────
function openModal(won, isNewBest = false) {
  modalIcon.textContent  = won ? '🏆' : '💀';
  modalTitle.textContent = won ? 'YOU WIN!' : 'GAME OVER';
  modalSub.textContent   = won
    ? `Completed all ${WIN_LEVEL} levels!`
    : `You reached level ${level}`;
  mScore.textContent = score;
  mLevel.textContent = level;
  mCombo.textContent = maxCombo;
  newBest.hidden = !isNewBest;
  initialsInput.value = '';
  modalBackdrop.classList.remove('hidden');
  setTimeout(() => initialsInput.focus(), 300);
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
}

// ─── Event Listeners ─────────────────────────────────────────────────────

// Title
modeCards.forEach(card => {
  card.addEventListener('click', () => {
    modeCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    mode = card.dataset.mode;
  });
});
strictToggle.addEventListener('change', () => strictOn = strictToggle.checked);
soundToggle.addEventListener('change', () => soundOn  = soundToggle.checked);
btnPlay.addEventListener('click', startGame);
btnLB.addEventListener('click', () => { renderLB(); showScreen('lb'); });

// Game HUD
btnBack.addEventListener('click', () => {
  isPlaying = false;
  locked    = true;
  boardGlow.className = 'board-glow';
  showScreen('title');
  loadStorage();
});

// Simon buttons
COLORS.forEach(color => {
  const id  = 'btn' + color.charAt(0).toUpperCase() + color.slice(1);
  const btn = document.getElementById(id);
  btn.addEventListener('click',      () => handleInput(color));
  btn.addEventListener('touchstart', e  => { e.preventDefault(); handleInput(color); }, { passive: false });
  btn.addEventListener('mousedown',  () => btn.classList.add('pressed'));
  btn.addEventListener('mouseup',    () => btn.classList.remove('pressed'));
  btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'));
});

// Keyboard
const keyMap = { g: 'green', r: 'red', y: 'yellow', b: 'blue' };
document.addEventListener('keydown', e => {
  const c = keyMap[e.key.toLowerCase()];
  if (c) handleInput(c);
  if (e.key === 'Enter' && !isPlaying) startGame();
  if (e.key === 'Escape') {
    if (isPlaying) { isPlaying = false; locked = true; showScreen('title'); loadStorage(); }
    else closeModal();
  }
});

// Leaderboard
btnLbBack.addEventListener('click', () => showScreen('title'));
lbTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    lbTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    lbFilter = tab.dataset.filter;
    renderLB();
  });
});
btnClearLb.addEventListener('click', () => {
  if (confirm('Clear all leaderboard scores?')) {
    localStorage.removeItem('sg_lb');
    renderLB();
  }
});

// Modal
btnSave.addEventListener('click', () => {
  const initials = initialsInput.value.trim() || '???';
  addLBEntry(initials, score, level, maxCombo, mode);
  closeModal();
  showScreen('title');
  loadStorage();
});
btnSkip.addEventListener('click', () => {
  closeModal();
  showScreen('title');
  loadStorage();
});

// ─── Init ─────────────────────────────────────────────────────────────────
loadStorage();
showScreen('title');