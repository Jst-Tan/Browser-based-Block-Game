# The Falling Grid

**The Falling Grid** is a browser-based block puzzle game built for the **A3 Web Design Competition** (Web Game track). It starts with the familiar *Block Blast* loop—drag polyomino pieces onto an 8×8 grid and clear full rows or columns—but layers on **column gravity**, **timed board rotation**, a **countdown clock**, and **color-matching bonuses** so every session feels tense and unpredictable.

No install, no build step, no dependencies: open `index.html` in any modern browser and play.

---

## About the project

The Falling Grid is a **browser-based web game** (HTML, CSS, JavaScript only) designed to load instantly on any browsers. The goal was to combine a mechanic everyone understands in seconds with systems that stay interesting for a full five-minute run.

**Stack:** HTML5 · CSS3 (Grid, Flexbox, custom properties, `dvh`, safe-area insets) · Vanilla JavaScript · Web Audio API · Canvas 2D · `localStorage` for high scores.

---

## What makes The Falling Grid special

Most block puzzles treat the grid as static until a line clears. The Falling Grid is built around **motion, time pressure, and color strategy**:

| Hook | What it does |
|------|----------------|
| **Living gravity** | After every placement and every clear, blocks **fall to the bottom of their column**. Nothing floats in mid-air—cascade clears are a core skill. |
| **Gravity Shift** | Every **30 seconds** the entire board **rotates 90°** (clockwise or counter-clockwise). Blocks tumble, new lines can form, and you must replan on the fly. |
| **Chrono budget** | You start with **300 seconds**. Each placement costs **3 seconds**; line clears **restore time** (+8 per line, scaled by combo). The run is a race, not an endless sandbox. |
| **Chroma Match** | Five block colors. Clear a row or column made of **one color only** for a **2× score bonus** and a dedicated celebration popup. |
| **Escalating levels** | Every **1,000 score** you level up: **+15% points** on placements and clears, but the clock drains **~6% faster** per level—higher reward, higher risk. |
| **Tactical tools** | **Hold**, **Undo**, and **Stasis** let you recover from mistakes—paid for with score, so they are real decisions. |
| **Fair warnings** | Event popups (especially Gravity Shift) **pause the timer** until you press **Continue**—you are never surprised mid-thought. |

Together, these systems feel familiar in ten seconds but stay surprising over a full session: easy to learn, hard to master, with a memorable **“Gravity Shift”** moment judges and players remember.

---

## Features

### Core puzzle loop

- **8×8 grid** with **3 pieces** in the tray at all times (Block Blast style).
- **11 piece shapes** (dots, lines, L-shapes, squares, T, Z, corners, and more).
- **Drag and drop** placement with live **valid / invalid** preview on the board.
- **Tap to rotate** a tray piece 90° before placing.
- New tray of three pieces when all current pieces are placed.
- **Game over** when time runs out, or when no piece can fit and no shift can save you.

### Gravity & cascades

- **Column gravity** after every placement and every clear.
- **Cascade clears**: falling blocks can complete new rows/columns in one chain.
- **Combo popups** when multiple clear steps happen in one resolution chain.
- **Clear streak** multiplier on score (resonance streak shown in the HUD).

### Gravity Shift (signature mechanic)

- **30-second countdown** to the next rotation (direction preview in the HUD).
- Warning border on the arena when a shift is imminent.
- Modal explains the rotation; timer **paused** until you confirm.
- Board animates **90° CW or CCW**; blocks then fall and clears can trigger.

### Scoring & progression

- Points for **blocks placed** and **lines cleared** (scaled by level).
- **Chroma Match**: monochrome full line → **2× points**.
- **Combo multiplier** on chained clears in one cascade.
- **Streak bonus** on consecutive clear steps (up to +100% at streak 10).
- **Level-up** every 1,000 score with popup explaining new bonuses and faster drain.
- **High score** saved in `localStorage` between visits.

### Power-ups (score cost)

| Action | Cost | Effect |
|--------|------|--------|
| **Hold** | Free (once per placement) | Store or swap a tray piece in the hold slot |
| **Undo** | −500 score | Rewind the last placement (up to 5 states kept) |
| **Stasis** | −1000 score | Freeze the game timer for **10 seconds** |

### Session & UI

- **5-minute** starting clock with visual bar (warns red under 30s, ticks audibly).
- **Pause**, **resume**, and **help** (?) screens.
- **Sound toggle** (procedural Web Audio: place, clear, rotate, tick, game over).
- **Particle effects** on cleared cells (canvas overlay).
- **Event popups** for clears, chroma, combos, level-ups, and gravity shifts.
- **Keyboard**: `Escape` pause/dismiss, `Enter` / `Space` continue popups.
- **Mobile-first**: touch drag, safe-area padding, larger tap targets, optional haptic on rotate.
- **Accessibility**: ARIA labels on the board and controls; `prefers-reduced-motion` respected.

### Design polish

- Cinematic background with subtle **breathing** gradient and **film grain**.
- Cohesive **five-color chroma** palette (coral, sky, amber, violet, mint).
- Modal overlays with blur and staged card animations.
- Responsive layout for phone, tablet, desktop, and landscape.

---

## How to play

1. Open **`index.html`** in Chrome, Safari, Firefox, or Edge.
2. Tap **Begin** on the welcome screen.
3. **Drag** pieces from the tray onto the board; **tap** a piece to rotate it first.
4. Clear **full rows or columns** to score and gain time back.
5. Watch the **Shift** countdown—when Gravity Shift fires, read the popup and press **Start shift**.
6. Aim for **single-color lines** for Chroma Matches and push your **high score**.

---

## Controls reference

| Control | Action |
|---------|--------|
| Drag | Place piece on board |
| Tap piece | Rotate 90° |
| Hold | Store / swap active tray piece |
| Undo | Rewind last move (−500 score) |
| Stasis | Pause timer 10s (−1000 score) |
| ‖ | Pause |
| ? | How-to / intro screen |
| ♪ | Toggle sound |
| Escape | Pause or dismiss popup |
| Enter / Space | Continue on event popup |

---

## Project structure

```
├── index.html    # Game shell, HUD, modals
├── style.css     # Theme, layout, animations, responsive rules
├── game.js       # Rules, input, gravity, scoring, audio, particles
└── README.md     # This file
```

---

## Tips for a quick demo

1. Place one piece and watch blocks **drop** into gaps below.
2. Clear a line—note the **popup**, **particles**, and **time refund**.
3. Wait for **Gravity Shift**—confirm the popup, then watch the board spin.
4. Try to clear a line using **only one color** for a **Chroma Match**.

---

## License & credits

Built by Jst Tan, initially for A3 Web Design Competition. 

**Play now:** open `index.html` and start your session.
