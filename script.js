/**
 * Simon Game — Full Game Logic
 * Features: sequences, strict mode, scoring, high-score, leaderboard, Web Audio
 */

// ─── Audio (Web Audio API — no files needed) ──────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

const COLOR_FREQ = { green: 391.995, red: 329.628, yellow: 261.626, blue: 220.000 };

function playTone(color, duration = 200) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = COLOR_FREQ[color] || 300;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) { /* silently fail if audio not available */ }
}

function playErrorSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = 80;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function playWinSound() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.3);
    } catch (e) {}
  });
}

// ─── Constants ───────────────────────────────────────────────────────────
const COLORS    = ['green', 'red', 'yellow', 'blue'];
const BASE_DELAY = 1000;  // ms between sequence steps
const WIN_LEVEL  = 20;    // win at this level

// ─── State ───────────────────────────────────────────────────────────────
let sequence       = [];
let playerInput    = [];
let level          = 0;
let score          = 0;
let highScore      = 0;
let isPlaying      = false;
let isShowingSeq   = false;
let strictMode     = false;
let inputLocked    = true;

// ─── DOM ─────────────────────────────────────────────────────────────────
const scoreEl    = document.getElementById('score');
const levelEl    = document.getElementById('level');
const highScoreEl= document.getElementById('high-score');
const statusEl   = document.getElementById('status');
const boardEl    = document.getElementById('board');
const startBtn   = document.getElementById('startBtn');
const resetBtn   = document.getElementById('resetBtn');
const strictCheck= document.getElementById('strictMode');
const lbToggle   = document.getElementById('lbToggle');
const lbEl       = document.getElementById('leaderboard');
const lbBody     = document.getElementById('lb-body');
const clearLbBtn = document.getElementById('clearLb');
const modalEl    = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMsg   = document.getElementById('modal-msg');
const modalLevel = document.getElementById('modal-level');
const modalScore = document.getElementById('modal-score');
const modalSave  = document.getElementById('modal-save');
const modalRetry = document.getElementById('modal-retry');
const initialsInput = document.getElementById('initials');

// ─── Local Storage ───────────────────────────────────────────────────────
function loadHighScore() {
  const h = localStorage.getItem('simonHighScore');
  if (h) { highScore = parseInt(h, 10); highScoreEl.textContent = highScore; }
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('simonHighScore', highScore);
    highScoreEl.textContent = highScore;
  }
}

function loadLeaderboard() {
  const data = localStorage.getItem('simonLeaderboard');
  return data ? JSON.parse(data) : [];
}

function saveLeaderboard(entries) {
  localStorage.setItem('simonLeaderboard', JSON.stringify(entries));
}

function renderLeaderboard() {
  const entries = loadLeaderboard();
  lbBody.innerHTML = '';
  if (entries.length === 0) {
    lbBody.innerHTML = `<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:14px;">No scores yet</td></tr>`;
    return;
  }
  entries
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .forEach((e, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${e.initials}</td><td>${e.score}</td>`;
      lbBody.appendChild(tr);
    });
}

function addLeaderboardEntry(initials, sc) {
  const entries = loadLeaderboard();
  entries.push({ initials: initials.toUpperCase().slice(0, 3) || '???', score: sc });
  saveLeaderboard(entries);
  renderLeaderboard();
}

// ─── Core Game Logic ─────────────────────────────────────────────────────
function startGame() {
  sequence   = [];
  playerInput= [];
  level      = 0;
  score      = 0;
  isPlaying  = true;
  inputLocked= true;
  updateScoreDisplay();
  startBtn.textContent = 'PLAYING';
  startBtn.disabled    = true;
  nextRound();
}

function nextRound() {
  playerInput = [];
  level++;
  levelEl.textContent = level;
  const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  sequence.push(newColor);
  setStatus(`Level ${level} — Watch!`);
  setTimeout(() => showSequence(), 600);
}

function showSequence() {
  isShowingSeq = true;
  inputLocked  = true;
  let i = 0;
  const speed = Math.max(200, BASE_DELAY - (level - 1) * 40);

  function step() {
    if (i >= sequence.length) {
      isShowingSeq = false;
      inputLocked  = false;
      setStatus(`Your turn! (${sequence.length} step${sequence.length > 1 ? 's' : ''})`);
      return;
    }
    const color = sequence[i];
    flashButton(color, 350);
    playTone(color, 300);
    i++;
    setTimeout(step, speed);
  }
  step();
}

function flashButton(color, duration = 400) {
  const btn = document.getElementById(color);
  if (!btn) return;
  btn.classList.add('active');
  setTimeout(() => btn.classList.remove('active'), duration);
}

function handlePlayerInput(color) {
  if (!isPlaying || inputLocked || isShowingSeq) return;
  playTone(color, 200);
  flashButton(color, 180);

  const expected = sequence[playerInput.length];
  playerInput.push(color);

  if (color !== expected) {
    onMistake();
    return;
  }

  score += 10;
  scoreEl.textContent = score;

  if (playerInput.length === sequence.length) {
    // Completed the sequence
    if (level === WIN_LEVEL) {
      onWin();
      return;
    }
    setStatus('✓ Correct! Next round…');
    saveHighScore();
    setTimeout(() => nextRound(), 1000);
  }
}

function onMistake() {
  inputLocked = true;
  boardEl.classList.add('shake');
  playErrorSound();
  setTimeout(() => boardEl.classList.remove('shake'), 500);

  if (strictMode) {
    setStatus('✗ Wrong! Game over in strict mode.');
    setTimeout(() => endGame(false), 900);
  } else {
    setStatus('✗ Wrong! Replaying sequence…');
    playerInput = [];
    setTimeout(() => showSequence(), 1200);
  }
}

function onWin() {
  isPlaying = false;
  inputLocked = true;
  playWinSound();
  boardEl.parentElement.classList.add('win');
  setTimeout(() => boardEl.parentElement.classList.remove('win'), 2000);
  saveHighScore();
  openModal(true);
}

function endGame(won = false) {
  isPlaying  = false;
  inputLocked= true;
  saveHighScore();
  openModal(won);
}

function resetGame() {
  sequence   = [];
  playerInput= [];
  level      = 0;
  score      = 0;
  isPlaying  = false;
  isShowingSeq = false;
  inputLocked  = true;
  updateScoreDisplay();
  setStatus('Press START to Play');
  startBtn.textContent = 'START';
  startBtn.disabled    = false;
  hideModal();
}

function updateScoreDisplay() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

// ─── Modal ───────────────────────────────────────────────────────────────
function openModal(won) {
  modalTitle.textContent = won ? '🎉 YOU WIN!' : 'GAME OVER';
  modalLevel.textContent = level;
  modalScore.textContent = score;
  modalMsg.innerHTML = won
    ? `You completed all ${WIN_LEVEL} levels!`
    : `You reached level <span id="modal-level">${level}</span>`;
  initialsInput.value = '';
  modalEl.hidden = false;
}

function hideModal() {
  modalEl.hidden = true;
}

// ─── Event Listeners ─────────────────────────────────────────────────────
// Simon buttons
COLORS.forEach(color => {
  const btn = document.getElementById(color);
  btn.addEventListener('click', () => handlePlayerInput(color));
  // Keyboard-style press feel
  btn.addEventListener('mousedown', () => {
    if (!isPlaying || inputLocked || isShowingSeq) return;
    btn.classList.add('active');
  });
  btn.addEventListener('mouseup', () => btn.classList.remove('active'));
  btn.addEventListener('mouseleave', () => btn.classList.remove('active'));
  // Touch support
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePlayerInput(color);
  }, { passive: false });
});

// Keyboard support (G R Y B)
const keyMap = { g: 'green', r: 'red', y: 'yellow', b: 'blue' };
document.addEventListener('keydown', (e) => {
  const color = keyMap[e.key.toLowerCase()];
  if (color) handlePlayerInput(color);
  if (e.key === 'Enter' && !isPlaying) startGame();
  if (e.key === 'Escape') resetGame();
});

startBtn.addEventListener('click', () => {
  if (!isPlaying) startGame();
});

resetBtn.addEventListener('click', resetGame);

strictCheck.addEventListener('change', () => {
  strictMode = strictCheck.checked;
});

lbToggle.addEventListener('click', () => {
  lbEl.hidden = !lbEl.hidden;
  if (!lbEl.hidden) renderLeaderboard();
});

clearLbBtn.addEventListener('click', () => {
  if (confirm('Clear all leaderboard scores?')) {
    localStorage.removeItem('simonLeaderboard');
    renderLeaderboard();
  }
});

modalSave.addEventListener('click', () => {
  const initials = initialsInput.value.trim() || '???';
  addLeaderboardEntry(initials, score);
  hideModal();
  resetGame();
  // Open leaderboard to show the new score
  lbEl.hidden = false;
  renderLeaderboard();
});

modalRetry.addEventListener('click', () => {
  hideModal();
  resetGame();
  setTimeout(() => startGame(), 200);
});

// ─── Init ─────────────────────────────────────────────────────────────────
loadHighScore();
renderLeaderboard();
setStatus('Press START to Play');