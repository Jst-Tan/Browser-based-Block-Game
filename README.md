# ChromaBlast: Gravity Shift

**A browser-based block puzzle game for the Web Game hackathon track.**

ChromaBlast takes the familiar *Block Blast* formula—place polyomino pieces on an 8×8 grid and clear full rows or columns—and pushes it further with **real column gravity**, a **rotating board**, **chrono pressure**, and **chroma matching**. No install required: open `index.html` in any modern browser and play.

---

## Quick start

1. Open **`index.html`** in Chrome, Safari, Firefox, or Edge (desktop or mobile).
2. Read the welcome screen, then tap **Play**.
3. **Drag** pieces from the tray onto the board. **Tap** a piece to rotate it before placing.
4. Press **Continue** on event popups (timer pauses until you dismiss them).

No build step, no server, and no dependencies—pure HTML, CSS, and JavaScript.

---

## What makes ChromaBlast special

Most block puzzles treat the grid as static: pieces stay exactly where you put them until a line clears. ChromaBlast is built around **motion and risk**:

| Idea | Why it matters |
|------|----------------|
| **Living gravity** | After every placement and every clear, blocks **fall to the lowest empty cell** in their column—like real weight. Gaps below a block are never left hanging. |
| **Gravity Shift** | Every **30 seconds** the entire board **rotates 90°**. Blocks tumble, new lines can form, and you must adapt mid-run. |
| **Chrono budget** | You start with **300 seconds**. Each placement costs **3 seconds**; line clears **restore time**. The session is a race, not an endless sandbox. |
| **Chroma Match** | Five distinct block colors. Clear a row or column made of **only one color** for **double points**. |
| **Escalating levels** | Every **1,000 score** you level up: **+15% points** per move, but the clock drains **~6% faster**—rewarding skill with higher stakes. |
| **Tactical tools** | **Hold**, **Undo**, and **Stasis (freeze)** let you recover from mistakes—at a score cost. |

Together, these systems create a game that **feels familiar in 10 seconds** but **stays surprising over a full session**—a strong fit for **Creativity**, **Category Fit (web game)**, and **Functionality** rubrics.

---

## Core gameplay

### The tray (Block Blast style)

- You always have **3 pieces** available.
- Place a piece anywhere it fits on the **8×8** grid.
- When all three are used, a **new set** of three appears.
- If **no piece** can legally fit, you must wait for the next **Gravity Shift** (or the run ends when time hits zero).

### Gravity (column fall)

Whenever blocks are placed or lines are cleared, **column gravity** runs: each column stacks downward so nothing floats in mid-air. This enables **cascade clears**—one line clear can cause blocks to fall and complete another line.

### Line clears

- A **full row** or **full column** clears.
- Clears add **score**, **restore time**, and can **chain** (combo) if gravity triggers more clears.
- **Clear streak**: consecutive clear steps build a **resonance streak** shown in the HUD (bonus multiplier on score).

### Gravity Shift (signature mechanic)

- A countdown shows time until the next shift.
- A popup warns you; **the timer pauses** until you press **Continue** (or **Start shift**).
- The board rotates **clockwise or counter-clockwise**, then gravity runs again.
- Clears after a shift are common—part of the intended skill curve.

### Chroma Match

Blocks use five colors: **coral, sky, amber, violet, mint**.

If a cleared line contains blocks of **only one color** (no mix), you earn a **Chroma Match**—**2× points** for that clear, with a dedicated celebration popup.

### Level system

| Level | How you get it | Effect |
|-------|----------------|--------|
| Start at **Lv 1** | — | Base scoring and timer |
| **+1 level** | Every **1,000** total score | **+15%** score from placements and clears (cumulative per level) |
| Trade-off | Higher level | Timer drains **~6% faster** per level |

Progress toward the next level is shown on the **Level** meter (XP bar).

---

## Power-ups & controls

| Control | Action |
|---------|--------|
| **Drag** | Place a piece from the tray |
| **Tap piece** | Rotate 90° before dragging |
| **Hold / Swap** | Store the active tray piece; swap once per placement cycle |
| **Undo** | Rewind one placement (**−500** score) |
| **Stasis** | Freeze the timer for **10 seconds** (**−1000** score) |
| **Pause** | Pause the session |
| **?** | Reopen the how-to-play screen |
| **Sound** | Toggle Web Audio effects |
| **Escape** | Pause / dismiss popups |
| **Enter / Space** | Continue on event popups |

**High score** is saved in `localStorage` and persists between visits.

---

## Event popups

Important moments use a **modal popup** that:

1. **Pauses** the game timer and gravity countdown  
2. Explains what happened (line clear, chroma, combo, level up, gravity shift)  
3. Waits for you to press **Continue** before play resumes  

Gravity Shift specifically waits for **Start shift** before the board animation runs—so you never get caught off guard.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Markup | Semantic HTML5 |
| Style | CSS3 (custom properties, Grid, Flexbox, `dvh`, safe-area insets) |
| Logic | Vanilla JavaScript (no frameworks) |
| Audio | Web Audio API (procedural tones) |
| FX | Canvas 2D particle bursts on clears |
| Storage | `localStorage` for best score |

**Why vanilla?** Fast load, zero build pipeline, easy for judges to inspect source, and reliable performance on school laptops and phones alike.

---

## Project structure

```
├── index.html    # Game shell, HUD, modals
├── style.css     # Layout, theme, responsive rules
├── game.js       # Rules, input, gravity, scoring
└── README.md     # This file
```

---

## Responsive design

ChromaBlast is built **mobile-first** and scales to:

- **Phones** (portrait & landscape)  
- **Tablets**  
- **Desktop** browsers (centered play column, comfortable max width)  
- **Notched devices** (`safe-area-inset` padding)  

The board uses **aspect-ratio** so it stays square at any width; touch targets and drag offsets are tuned for fingers.

---

## Judging rubric alignment

| Criterion | How ChromaBlast delivers |
|-----------|---------------------------|
| **Creativity / Originality** | Block Blast + column gravity + timed rotation + chroma lines + level risk/reward |
| **Execution / Design** | Clean HUD, particles, popups, cohesive dark UI, readable meters |
| **Functionality** | Full loop: play → clear → shift → level → game over → restart; hold/undo/freeze |
| **Category Fit** | Runs entirely in the browser; pointer/touch input; no plugins |
| **Overall Impression** | Easy to learn, tense to master, memorable “Gravity Shift” hook |

---

## Tips for judges (30-second demo)

1. Place one piece and watch blocks **drop** into gaps.  
2. Clear a line—note the **popup** and **time refund**.  
3. Wait for **Gravity Shift**—read the popup, hit Continue, watch the board spin.  
4. Try to clear a line using **one color only** for a **Chroma Match**.  

---

## Future ideas (not required to play today)

- Online leaderboards  
- Daily seed challenges  
- Additional special cells (bombs, wildcards)  
- PWA install for offline play  

---

## License & credits

Built for the **A3 Web Design Competition** — Web Game track.  
All code in this repository is submitted as an original hackathon project.

**Play now:** open `index.html` and start your session.
