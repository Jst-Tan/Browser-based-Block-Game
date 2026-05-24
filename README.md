# The Falling Grid

**The Falling Grid** is a polished browser puzzle game for the **A3 Web Design Competition** (Web Game track). Drag polyomino pieces onto an 8×8 grid, clear lines, survive a countdown clock, and adapt when the board **rotates every 30 seconds**.

**Play:** open [`index.html`](index.html) in any modern browser — no install, no build step, no dependencies.

---

## About

The Falling Grid takes the familiar *Block Blast* loop and adds **column gravity**, **Gravity Shift** (board rotation), **chrono pressure**, and **chroma line bonuses**. It is built as a single-page app with vanilla HTML, CSS, and JavaScript so it loads instantly on phones and laptops alike.

**Stack:** HTML5 · CSS3 · Vanilla JavaScript · Web Audio API · Canvas 2D · `localStorage`

---

## What makes it special

| Hook | What it does |
|------|----------------|
| **Living gravity** | Blocks fall to the bottom of their column after every move and clear. |
| **Gravity Shift** | Every **30s** the board rotates 90° — timer pauses until you confirm. |
| **Chrono budget** | **300s** to start; **−3s** per placement; line clears restore time. |
| **Chroma Match** | One-color full line → **2× points**. |
| **Level ups** | Every **1,000** score: +15% points, ~6% faster clock drain. |
| **Tactical tools** | **Hold**, **Undo** (−500), **Freeze** (−1000) — real trade-offs. |

---

## How to play

1. Tap **Start playing** on the welcome sheet.
2. **Drag** pieces from the tray; **tap** a piece to rotate it.
3. Clear **full rows or columns** to score and regain time.
4. Watch **Next shift** — when it hits zero, confirm the popup, then the board spins.
5. Clear **single-color lines** for Chroma Matches and chase your **Best** score.

---

## Controls

| Input | Action |
|-------|--------|
| Drag | Place a piece |
| Tap piece | Rotate 90° |
| Hold | Store / swap a tray piece (once per placement) |
| Undo | Rewind last move (−500 score) |
| Freeze | Pause the clock 10s (−1000 score) |
| Pause | Pause session |
| ? | Rules / help |
| Sound | Toggle audio (saved between visits) |
| `Escape` | Pause or dismiss popups |
| `Enter` / `Space` | Continue on event popups |

---

## Features

- 8×8 grid, 3-piece tray, 11 shapes, drag preview, cascade clears
- Procedural sound + optional haptic feedback on mobile
- Particle bursts on clears, score pulse animations, urgent timers under pressure
- High score persistence (`fallinggrid_best` in `localStorage`)
- Responsive layout, safe-area insets, `prefers-reduced-motion` support
- Product-style UI: system fonts, sheet modals, frosted overlays

---

## Project structure

```
├── index.html    # Shell, HUD, modals
├── style.css     # Design system & layout
├── game.js       # Game logic, audio, particles
└── README.md
```

---

## Tips for a quick demo

1. Place a piece — watch blocks **fall** into gaps.
2. Clear a line — note the popup, particles, and time refund.
3. Wait for **Gravity Shift** — confirm, then watch the board rotate.
4. Clear a **one-color line** for a Chroma Match.

---

## Credits

Built by **Jst Tan** for the A3 Web Design Competition.

**Play now:** open `index.html` and start your session.
