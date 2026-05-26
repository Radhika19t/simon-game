# 🎮 Simon Game v2 — Memory Challenge

A complete, production-ready Simon Game with multiple modes, combo system, and full leaderboard.

## ✨ New Features in v2

| Feature | Details |
|---|---|
| **3 Game Modes** | Classic, Speed, Chaos |
| **Combo System** | Chain correct inputs for bonus points |
| **Countdown** | 3-2-1 start animation |
| **Score Floats** | +pts popups on correct input |
| **Leaderboard filters** | Filter board by mode |
| **Per-step progress** | Bar fills as sequence plays |
| **Board outer glow** | Color-matched glow per button |
| **Ripple effect** | Tap ripple on each button press |
| **Games counter** | Total games tracked |
| **Max combo tracking** | Saved per game to leaderboard |

## 🎮 Game Modes

- **Classic** — Standard speed, slows sequence reveals over time
- **Speed** — Fast sequences, minimal delays
- **Chaos** — Random tempo, occasionally adds extra steps

## Controls

| Key | Action |
|-----|--------|
| `G` | Green |
| `R` | Red |
| `Y` | Yellow |
| `B` | Blue |
| `Enter` | Start game |
| `Esc` | Back / close modal |

## Scoring

- +10 per correct step
- +5 bonus per step when combo ≥ 3
- Combos reset on any mistake

## Run Locally

```bash
# Just open index.html — no build step needed
open index.html
```

Or with VS Code Live Server: right-click `index.html` → Open with Live Server.

## Push to GitHub

```bash
git init
git add .
git commit -m "Simon Game v2"
git remote add origin https://github.com/Radhika19t/simon-game.git
git push -u origin main
```

## Tech Stack

- HTML5 · CSS3 · JavaScript (ES6+)
- Web Audio API (no audio files)
- LocalStorage (scores, leaderboard)

