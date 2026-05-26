# 🎮 Simon Game — Interactive Memory Challenge

A fully responsive, retro-arcade Simon memory game built with pure HTML, CSS, and JavaScript.

## Features

- 🎵 **Web Audio API** — sounds generated in the browser, no audio files needed
- 🏆 **High Score** — persisted in localStorage
- 📋 **Leaderboard** — save initials + score after each game
- ⚡ **Strict Mode** — one wrong move ends the game
- ⌨️ **Keyboard Controls** — `G`, `R`, `Y`, `B` keys to play; `Enter` to start; `Esc` to reset
- 📱 **Touch Support** — works on mobile
- 🎨 **Retro Arcade UI** — scanlines, glow effects, Orbitron font

## How to Play

1. Press **START** (or `Enter`)
2. Watch the sequence of colored flashes
3. Repeat the sequence by clicking the buttons (in order)
4. Each round adds one more step — reach **Level 20** to win!

## Controls

| Key | Action |
|-----|--------|
| `G` | Green button |
| `R` | Red button |
| `Y` | Yellow button |
| `B` | Blue button |
| `Enter` | Start game |
| `Esc` | Reset |

## Tech Stack

- HTML5
- CSS3 (custom properties, animations, grid)
- JavaScript (ES6+)
- Web Audio API
- LocalStorage API

## Run Locally

Just open `index.html` in any modern browser — no build step or server needed.

```bash
# Optional: serve with VS Code Live Server
# Or just double-click index.html
```

## Project Structure

```
simon-game/
├── index.html    # Game layout and markup
├── style.css     # Retro arcade styles
├── script.js     # Game logic, audio, storage
└── README.md
```
