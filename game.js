/* The Falling Grid */

const GRID_SIZE = 8;
const INITIAL_TIME = 300;
const PLACE_TIME_COST = 3;
const LINE_TIME_REWARD = 8;
const GRAVITY_ROTATION_CYCLE = 30;
const PIECES_PER_TRAY = 3;
const SCORE_PER_LEVEL = 1000;

const CHROMA_COLORS = ['coral', 'sky', 'amber', 'violet', 'mint'];

const COLOR_HEX = {
    coral: '#ff6b6b',
    sky: '#5ac8fa',
    amber: '#ffd60a',
    violet: '#bf5af2',
    mint: '#63e6a8'
};

const BLOCK_TEMPLATES = {
    dot: { matrix: [[1]] },
    i2: { matrix: [[1, 1]] },
    i3: { matrix: [[1, 1, 1]] },
    i4: { matrix: [[1, 1, 1, 1]] },
    l_sm: { matrix: [[1, 0], [1, 1]] },
    l_lg: { matrix: [[1, 0], [1, 0], [1, 1]] },
    o_sq: { matrix: [[1, 1], [1, 1]] },
    t_sh: { matrix: [[0, 1, 0], [1, 1, 1]] },
    z_sh: { matrix: [[1, 1, 0], [0, 1, 1]] },
    corner3: { matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
    t_lg: { matrix: [[0, 1, 0], [0, 1, 0], [1, 1, 1]] }
};

let board = createEmptyBoard();
let score = 0;
let highScore = parseInt(
    localStorage.getItem('fallinggrid_best') || localStorage.getItem('chromablast_best') || '0',
    10
);
let timeRemaining = INITIAL_TIME;
let gravityCountdown = GRAVITY_ROTATION_CYCLE;
let nextRotationDirection = 'CW';

let shelfPieces = [null, null, null];
let activeDragPiece = null;
let activeDragIndex = -1;
let dragOffset = { x: 0, y: 0 };
let floatingDragEl = null;
let dragMoved = false;

let isSoundEnabled = true;
let isGameOver = false;
let isPaused = false;
let isBoardRotating = false;
let isCascadeRunning = false;
let gameInterval = null;
let hasGameStarted = false;

let playerLevel = 1;
let holdPiece = null;
let canHold = true;
let undoStack = [];
let timeFreezeActive = false;

let maxComboThisRun = 1;
let chromaClearsThisRun = 0;
let activeComboCount = 0;
let clearStreak = 0;
let maxStreakThisRun = 0;

let audioCtx = null;
let canvas = null;
let ctx = null;
let particles = [];
let isEventPopupOpen = false;
let popupQueue = [];
let popupContinueCallback = null;
let popupAutoDismissTimer = null;
let popupAutoDismissInterval = null;

/** Auto-close delays (ms). Prevents the game staying frozen if Continue is not pressed. */
const POPUP_AUTO_MS = {
    match: 2000,
    combo: 2200,
    chroma: 2800,
    level: 3200,
    shift: 9000
};
let wasPausedBeforeHelp = false;
let runStartHighScore = 0;
let beatHighScoreThisRun = false;
let lastScoreDisplayed = 0;

const DRAG_UPWARD_OFFSET = 48;
const SHELF_CELL = 15;
const DRAG_CELL = 32;

function createEmptyBoard() {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
}

function haptic(ms = 8) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

function loadPreferences() {
    isSoundEnabled = localStorage.getItem('fallinggrid_sound') !== 'off';
}

function saveSoundPreference() {
    localStorage.setItem('fallinggrid_sound', isSoundEnabled ? 'on' : 'off');
}

function updateModalScrollLock() {
    const locked = ['modal-intro', 'modal-paused', 'modal-gameover'].some(
        id => document.getElementById(id).classList.contains('active')
    );
    document.body.classList.toggle('modal-open', locked);
}

function pulseScoreBlock(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('score-block--pulse');
    void el.offsetWidth;
    el.classList.add('score-block--pulse');
    setTimeout(() => el.classList.remove('score-block--pulse'), 480);
}

// ——— Audio ———

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(type, f0, f1, dur, vol = 0.1) {
    if (!isSoundEnabled) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, audioCtx.currentTime);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), audioCtx.currentTime + dur);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

function playSoundPlace() { playTone('triangle', 200, 100, 0.07, 0.1); }
function playSoundClear(chroma) { playTone('sine', chroma ? 523 : 440, chroma ? 262 : 330, chroma ? 0.3 : 0.18, 0.1); }
function playSoundRotate() { playTone('sine', 300, 450, 0.15, 0.07); }
function playSoundTick() { playTone('sine', 900, 900, 0.02, 0.04); }
function playSoundGameOver() {
    if (!isSoundEnabled) return;
    [392, 330, 262, 196].forEach((f, i) => setTimeout(() => playTone('sine', f, f * 0.9, 0.18, 0.08), i * 100));
}

function playSoundLevelUp() {
    playTone('sine', 440, 660, 0.12, 0.08);
    setTimeout(() => playTone('sine', 554, 880, 0.14, 0.07), 80);
}

// ——— Event popups (brief pause; auto-continue if ignored) ———

function clearPopupAutoTimer() {
    if (popupAutoDismissTimer) {
        clearTimeout(popupAutoDismissTimer);
        popupAutoDismissTimer = null;
    }
    if (popupAutoDismissInterval) {
        clearInterval(popupAutoDismissInterval);
        popupAutoDismissInterval = null;
    }
}

function getPopupButtonLabel(type) {
    return type === 'shift' ? 'Start shift' : 'Continue';
}

function schedulePopupAutoDismiss(type) {
    clearPopupAutoTimer();
    const ms = POPUP_AUTO_MS[type];
    if (!ms) return;

    const btn = document.getElementById('event-popup-continue');
    const baseLabel = getPopupButtonLabel(type);
    const deadline = Date.now() + ms;

    const updateCountdown = () => {
        if (!isEventPopupOpen) return;
        const secs = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        btn.textContent = secs > 0 ? `${baseLabel} (${secs})` : baseLabel;
    };

    updateCountdown();
    popupAutoDismissInterval = setInterval(updateCountdown, 250);
    popupAutoDismissTimer = setTimeout(() => {
        if (isEventPopupOpen) dismissEventPopup();
    }, ms);
}

function showEventPopup(type, title, message, bonus = '', onContinue = null) {
    popupQueue.push({ type, title, message, bonus, onContinue });
    if (!isEventPopupOpen) displayNextEventPopup();
}

function displayNextEventPopup() {
    if (popupQueue.length === 0) {
        isEventPopupOpen = false;
        return;
    }

    const { type, title, message, bonus, onContinue } = popupQueue.shift();
    const popup = document.getElementById('event-popup');
    const icons = { shift: '↻', match: '✦', chroma: '★', combo: '◆', level: '↑' };

    isEventPopupOpen = true;
    popupContinueCallback = onContinue || null;

    popup.className = `event-popup event-popup--${type} visible`;
    popup.hidden = false;
    document.getElementById('event-popup-icon').textContent = icons[type] || '✦';
    document.getElementById('event-popup-title').textContent = title;
    document.getElementById('event-popup-msg').textContent = message;
    const bonusEl = document.getElementById('event-popup-bonus');
    bonusEl.textContent = bonus;
    bonusEl.classList.toggle('hidden', !bonus);

    document.getElementById('event-popup-continue').textContent = getPopupButtonLabel(type);
    schedulePopupAutoDismiss(type);
}

function dismissEventPopup() {
    if (!isEventPopupOpen) return;

    clearPopupAutoTimer();

    const popup = document.getElementById('event-popup');
    popup.classList.remove('visible');
    setTimeout(() => {
        popup.hidden = true;
        popup.className = 'event-popup';
    }, 280);

    isEventPopupOpen = false;
    const cb = popupContinueCallback;
    popupContinueCallback = null;

    if (cb) cb();

    if (popupQueue.length > 0) {
        displayNextEventPopup();
    } else {
        document.getElementById('event-popup-continue').textContent = 'Continue';
    }
}

function getScoreMultiplier() {
    return 1 + (playerLevel - 1) * 0.15;
}

function getTimeDrainPerTick() {
    return 0.1 * (1 + (playerLevel - 1) * 0.06);
}

function updateLevelDisplay() {
    const start = (playerLevel - 1) * SCORE_PER_LEVEL;
    const end = playerLevel * SCORE_PER_LEVEL;
    const intoLevel = score - start;
    const need = end - start;
    const pct = Math.min(100, Math.max(0, (intoLevel / need) * 100));

    document.getElementById('player-level').textContent = playerLevel;
    document.getElementById('level-progress-bar').style.width = `${pct}%`;
    document.getElementById('level-xp-text').textContent = `${Math.round(pct)}%`;
    document.getElementById('level-bonus-text').textContent =
        `+${Math.round((playerLevel - 1) * 15)}% score · time +${Math.round((playerLevel - 1) * 6)}% drain`;
}

function checkLevelUp() {
    let leveled = false;
    while (score >= playerLevel * SCORE_PER_LEVEL) {
        playerLevel++;
        leveled = true;
        const bonusPct = Math.round((playerLevel - 1) * 15);
        const drainPct = Math.round((playerLevel - 1) * 6);
        showEventPopup(
            'level',
            `Level ${playerLevel}`,
            'Higher level raises your points per move.',
            `+${bonusPct}% score · clock runs ${drainPct}% faster`,
            null
        );
    }
    if (leveled) {
        playSoundLevelUp();
        haptic([12, 40, 12]);
        updateLevelDisplay();
    }
}

// ——— Particles ———

function initParticles() {
    canvas = document.getElementById('particle-canvas');
    ctx = canvas.getContext('2d');
    const resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);
}

function spawnParticles(x, y, colorName) {
    const color = COLOR_HEX[colorName] || '#fff';
    for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 3;
        particles.push({
            x, y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s - 1,
            color,
            alpha: 1,
            size: 2 + Math.random() * 2.5,
            decay: 0.02 + Math.random() * 0.015
        });
    }
}

function updateParticlesLoop() {
    if (!ctx) {
        requestAnimationFrame(updateParticlesLoop);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rect = canvas.getBoundingClientRect();
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.1;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - rect.left, p.y - rect.top, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(updateParticlesLoop);
}

// ——— Grid & gravity ———

function createGrid() {
    const el = document.getElementById('board');
    el.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            el.appendChild(cell);
        }
    }
}

function clearHoverEffects() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('hover-valid', 'hover-invalid');
    });
}

function updateBoardView() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.getElementById(`cell-${r}-${c}`);
            const color = board[r][c];
            if (color) {
                cell.className = 'cell block-element';
                cell.dataset.color = color;
            } else {
                cell.className = 'cell';
                delete cell.dataset.color;
            }
        }
    }
}

/** Every block in each column falls to the lowest available row. */
function applyColumnGravity() {
    for (let c = 0; c < GRID_SIZE; c++) {
        const column = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            if (board[r][c] !== null) column.push(board[r][c]);
        }
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
            const idx = GRID_SIZE - 1 - r;
            board[r][c] = idx < column.length ? column[column.length - 1 - idx] : null;
        }
    }
}

function applyGravityAnimated(callback) {
    applyColumnGravity();
    updateBoardView();
    document.querySelectorAll('.block-element').forEach(el => el.classList.add('falling'));
    setTimeout(() => {
        document.querySelectorAll('.block-element.falling').forEach(el => el.classList.remove('falling'));
        if (callback) callback();
    }, 260);
}

// ——— Pieces ———

function randomPiece() {
    const keys = Object.keys(BLOCK_TEMPLATES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const color = CHROMA_COLORS[Math.floor(Math.random() * CHROMA_COLORS.length)];
    return {
        matrix: BLOCK_TEMPLATES[key].matrix.map(row => [...row]),
        color,
        shapeName: key
    };
}

function buildPieceGrid(piece, cellSize) {
    const grid = document.createElement('div');
    grid.className = 'piece-grid';
    const rows = piece.matrix.length;
    const cols = piece.matrix[0].length;
    grid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const sub = document.createElement('div');
            sub.style.width = `${cellSize}px`;
            sub.style.height = `${cellSize}px`;
            if (piece.matrix[r][c] === 1) sub.className = `cell block-element color-${piece.color}`;
            grid.appendChild(sub);
        }
    }
    return grid;
}

function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const out = Array(cols).fill(null).map(() => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = matrix[r][c];
    }
    return out;
}

function spawnShelfPieces() {
    const shelf = document.getElementById('pieces-shelf');
    shelf.innerHTML = '';

    for (let i = 0; i < PIECES_PER_TRAY; i++) {
        if (!shelfPieces[i]) shelfPieces[i] = randomPiece();
    }

    for (let i = 0; i < PIECES_PER_TRAY; i++) {
        const piece = shelfPieces[i];
        const box = document.createElement('div');
        box.className = 'draggable-piece-container';
        box.dataset.index = i;
        if (!piece) {
            box.classList.add('empty-slot');
        } else {
            box.appendChild(buildPieceGrid(piece, SHELF_CELL));
            box.addEventListener('pointerdown', handleDragStart);
            box.addEventListener('pointerup', (e) => handlePieceTapRotate(e, i));
        }
        shelf.appendChild(box);
    }
    updatePowerupButtons();
    checkStuckState();
}

function handlePieceTapRotate(e, index) {
    if (dragMoved || isGameOver || isPaused || isBoardRotating || isCascadeRunning || isEventPopupOpen) return;
    if (!shelfPieces[index]) return;
    shelfPieces[index].matrix = rotateMatrix(shelfPieces[index].matrix);
    playSoundRotate();
    if (navigator.vibrate) navigator.vibrate(6);
    spawnShelfPieces();
}

function renderHoldPiece() {
    const slot = document.getElementById('hold-slot');
    slot.innerHTML = '';
    if (holdPiece) slot.appendChild(buildPieceGrid(holdPiece, SHELF_CELL));
}

// ——— Drag ———

function handleDragStart(e) {
    if (isGameOver || isPaused || isBoardRotating || isCascadeRunning || isEventPopupOpen) return;
    e.preventDefault();
    initAudio();
    const box = e.currentTarget;
    const index = parseInt(box.dataset.index, 10);
    if (!shelfPieces[index]) return;

    activeDragIndex = index;
    activeDragPiece = shelfPieces[index];
    dragMoved = false;
    box.classList.add('is-dragging');
    try { box.setPointerCapture(e.pointerId); } catch { /* unsupported */ }

    floatingDragEl = document.createElement('div');
    floatingDragEl.className = 'floating-drag-piece';
    floatingDragEl.appendChild(buildPieceGrid(activeDragPiece, DRAG_CELL));
    document.body.appendChild(floatingDragEl);

    const cols = activeDragPiece.matrix[0].length;
    const rows = activeDragPiece.matrix.length;
    dragOffset.x = (cols * DRAG_CELL) / 2;
    dragOffset.y = (rows * DRAG_CELL) / 2;
    updateFloatingPos(e.clientX, e.clientY);

    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd);
}

function updateFloatingPos(x, y) {
    if (!floatingDragEl) return;
    floatingDragEl.style.left = `${x - dragOffset.x}px`;
    floatingDragEl.style.top = `${y - dragOffset.y - DRAG_UPWARD_OFFSET}px`;
}

function getSnap(clientX, clientY) {
    const bounds = document.getElementById('board').getBoundingClientRect();
    const cell = bounds.width / GRID_SIZE;
    const left = clientX - dragOffset.x;
    const top = clientY - dragOffset.y - DRAG_UPWARD_OFFSET;
    return {
        col: Math.round((left - bounds.left) / cell),
        row: Math.round((top - bounds.top) / cell)
    };
}

function handleDragMove(e) {
    if (!activeDragPiece) return;
    dragMoved = true;
    updateFloatingPos(e.clientX, e.clientY);
    const { row, col } = getSnap(e.clientX, e.clientY);
    clearHoverEffects();
    highlightPreview(row, col, activeDragPiece.matrix, checkPlacementValid(row, col, activeDragPiece.matrix));
}

function highlightPreview(startRow, startCol, matrix, valid) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[0].length; c++) {
            if (matrix[r][c] !== 1) continue;
            const tr = startRow + r;
            const tc = startCol + c;
            if (tr < 0 || tr >= GRID_SIZE || tc < 0 || tc >= GRID_SIZE) continue;
            document.getElementById(`cell-${tr}-${tc}`).classList.add(valid ? 'hover-valid' : 'hover-invalid');
        }
    }
}

function handleDragEnd(e) {
    if (!activeDragPiece) return;
    const { row, col } = getSnap(e.clientX, e.clientY);
    const success = placePiece(col, row);

    if (floatingDragEl) { floatingDragEl.remove(); floatingDragEl = null; }
    clearHoverEffects();

    const box = document.querySelector(`.draggable-piece-container[data-index="${activeDragIndex}"]`);
    if (success) {
        if (box) box.classList.add('placed');
        shelfPieces[activeDragIndex] = null;
        playSoundPlace();
        haptic(10);
        deductPlacementTimeCost();

        applyGravityAnimated(() => {
            resolveBoardAfterGravity(() => {
                if (shelfPieces.every(p => p === null)) {
                    setTimeout(spawnShelfPieces, 150);
                } else {
                    spawnShelfPieces();
                }
                checkStuckState();
            });
        });
    } else if (box) {
        haptic([6, 30, 6]);
    }

    if (box) {
        box.classList.remove('is-dragging');
        try { box.releasePointerCapture(e.pointerId); } catch { /* unsupported */ }
    }

    activeDragPiece = null;
    activeDragIndex = -1;
    dragMoved = false;
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', handleDragEnd);
}

// ——— Placement ———

function checkPlacementValid(startRow, startCol, matrix) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[0].length; c++) {
            if (matrix[r][c] !== 1) continue;
            const tr = startRow + r;
            const tc = startCol + c;
            if (tr < 0 || tr >= GRID_SIZE || tc < 0 || tc >= GRID_SIZE) return false;
            if (board[tr][tc] !== null) return false;
        }
    }
    return true;
}

function canPlaceAnyPiece() {
    const pieces = shelfPieces.filter(Boolean);
    if (holdPiece) pieces.push(holdPiece);
    for (const piece of pieces) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (checkPlacementValid(r, c, piece.matrix)) return true;
            }
        }
    }
    return false;
}

function checkStuckState() {
    if (isGameOver || isPaused || isBoardRotating || isCascadeRunning) return;
    const el = document.getElementById('time-status-text');
    if (canPlaceAnyPiece()) {
        el.textContent = 'Time';
        el.style.color = '';
    } else {
        el.textContent = 'No moves';
        el.style.color = 'var(--warning)';
    }
}

function placePiece(col, row) {
    if (!activeDragPiece || !checkPlacementValid(row, col, activeDragPiece.matrix)) return false;

    undoStack.push({
        board: JSON.parse(JSON.stringify(board)),
        score, timeRemaining, playerLevel, clearStreak,
        shelfPieces: shelfPieces.map(p => p ? { ...p, matrix: p.matrix.map(r => [...r]) } : null),
        holdPiece: holdPiece ? { ...holdPiece, matrix: holdPiece.matrix.map(r => [...r]) } : null,
        canHold
    });
    if (undoStack.length > 5) undoStack.shift();

    const matrix = activeDragPiece.matrix;
    let blocks = 0;
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[0].length; c++) {
            if (matrix[r][c] === 1) {
                board[row + r][col + c] = activeDragPiece.color;
                blocks++;
            }
        }
    }

    score += Math.floor(blocks * 10 * getScoreMultiplier());
    checkLevelUp();

    canHold = true;
    updateScoreView();
    updatePowerupButtons();
    return true;
}

function resolveBoardAfterGravity(onComplete) {
    checkLinesAndTriggerCascades(onComplete);
}

function deductPlacementTimeCost() {
    timeRemaining = Math.max(0, timeRemaining - PLACE_TIME_COST);
    updateTimersView();
    if (timeRemaining <= 0) triggerGameOver('Time ran out.');
}

function spawnParticlesFromCell(r, c, color) {
    const b = document.getElementById('board').getBoundingClientRect();
    const w = b.width / GRID_SIZE;
    spawnParticles(b.left + c * w + w / 2, b.top + r * w + w / 2, color);
}

// ——— Line clears ———

function checkLinesAndTriggerCascades(onComplete) {
    isCascadeRunning = true;
    activeComboCount = 0;

    const step = () => {
        const lines = findFullLines();
        if (lines.rows.length === 0 && lines.cols.length === 0) {
            isCascadeRunning = false;
            if (activeComboCount === 0) clearStreak = 0;
            updateStreakDisplay();
            if (onComplete) onComplete();
            return;
        }
        executeClears(lines);
        setTimeout(() => {
            applyGravityAnimated(() => {
                updateBoardView();
                setTimeout(step, 200);
            });
        }, 180);
    };
    step();
}

function findFullLines() {
    const rows = [];
    const cols = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        if (board[r].every(c => c !== null)) rows.push(r);
    }
    for (let c = 0; c < GRID_SIZE; c++) {
        let full = true;
        for (let r = 0; r < GRID_SIZE; r++) {
            if (board[r][c] === null) { full = false; break; }
        }
        if (full) cols.push(c);
    }
    return { rows, cols };
}

function isMonochromeLine(getColor) {
    const colors = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        const c = getColor(i);
        if (c) colors.push(c);
    }
    return colors.length > 0 && new Set(colors).size === 1;
}

function executeClears(lines) {
    activeComboCount++;
    maxComboThisRun = Math.max(maxComboThisRun, activeComboCount);
    clearStreak++;
    maxStreakThisRun = Math.max(maxStreakThisRun, clearStreak);
    updateStreakDisplay();

    let chromaMatch = false;
    lines.rows.forEach(r => { if (isMonochromeLine(c => board[r][c])) { chromaMatch = true; chromaClearsThisRun++; } });
    lines.cols.forEach(c => { if (isMonochromeLine(i => board[i][c])) { chromaMatch = true; chromaClearsThisRun++; } });

    const cleared = [];
    lines.rows.forEach(r => {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c]) cleared.push({ r, c, color: board[r][c] });
            board[r][c] = null;
        }
    });
    lines.cols.forEach(c => {
        for (let r = 0; r < GRID_SIZE; r++) {
            if (board[r][c]) cleared.push({ r, c, color: board[r][c] });
            board[r][c] = null;
        }
    });

    playSoundClear(chromaMatch);
    cleared.forEach(({ r, c, color }) => spawnParticlesFromCell(r, c, color));

    const lineCount = lines.rows.length + lines.cols.length;
    let points = lineCount * 100;
    if (chromaMatch) points *= 2;
    if (activeComboCount > 1) points *= activeComboCount;
    const streakBonus = 1 + Math.min(clearStreak, 10) * 0.1;
    points = Math.floor(points * streakBonus * getScoreMultiplier());
    checkLevelUp();

    score += points;
    timeRemaining = Math.min(INITIAL_TIME, timeRemaining + lineCount * LINE_TIME_REWARD * activeComboCount);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('fallinggrid_best', String(highScore));
        pulseScoreBlock('score-block-best');
        document.getElementById('score-block-best').classList.add('score-block--highlight');
    }
    if (score > runStartHighScore) beatHighScoreThisRun = true;

    updateScoreView();
    if (chromaMatch || lineCount > 0) haptic(chromaMatch ? [20, 50, 20] : 14);
    updateTimersView();
    updateBoardView();

    if (chromaMatch) {
        showEventPopup('chroma', 'Chroma Match!', 'You cleared a line in a single color.', `+${points} points · 2× bonus`);
    } else if (activeComboCount > 1) {
        showEventPopup('combo', 'Combo!', `${activeComboCount} clears in a row.`, `+${points} points`);
    } else {
        showEventPopup('match', 'Nice clear!', lineCount > 1 ? `${lineCount} lines removed.` : 'Line cleared.', `+${points} points`);
    }
}

// ——— Board rotation ———

function triggerGravityShift() {
    if (isGameOver || isPaused || isBoardRotating || isEventPopupOpen) return;

    const dir = nextRotationDirection;
    const dirLabel = dir === 'CW' ? 'clockwise' : 'counter-clockwise';
    showEventPopup(
        'shift',
        'Gravity Shift!',
        `The board will rotate ${dirLabel}. Blocks will fall when it stops.`,
        'Timer paused until you continue.',
        () => performGravityShiftAnimation(dir)
    );
}

function performGravityShiftAnimation(dir) {
    isBoardRotating = true;
    isCascadeRunning = true;
    const grid = document.getElementById('board');
    const frame = document.getElementById('board-frame-container');

    playSoundRotate();
    nextRotationDirection = Math.random() > 0.5 ? 'CW' : 'CCW';
    grid.className = `board-grid rotate-${dir === 'CW' ? 'cw' : 'ccw'}`;
    frame.classList.add('shift-warning');

    setTimeout(() => {
        rotateBoardMatrix(dir);
        applyColumnGravity();
        grid.style.transition = 'none';
        grid.className = 'board-grid';
        updateBoardView();
        frame.classList.remove('shift-warning');
        void grid.offsetWidth;
        grid.style.transition = '';
        isBoardRotating = false;
        setNextRotationArrow();

        applyGravityAnimated(() => {
            resolveBoardAfterGravity(() => {
                checkStuckState();
                if (!canPlaceAnyPiece() && !isGameOver) {
                    triggerGameOver('No moves left on the board.');
                }
            });
        });
    }, 560);
}

function rotateBoardMatrix(direction) {
    const rotated = createEmptyBoard();
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (direction === 'CW') rotated[c][GRID_SIZE - 1 - r] = board[r][c];
            else rotated[GRID_SIZE - 1 - c][r] = board[r][c];
        }
    }
    board = rotated;
}

function setNextRotationArrow() {
    const cw = document.querySelector('.rotate-arrow.clockwise');
    const ccw = document.querySelector('.rotate-arrow.counter-clockwise');
    if (nextRotationDirection === 'CW') {
        cw.classList.remove('hidden');
        ccw.classList.add('hidden');
    } else {
        cw.classList.add('hidden');
        ccw.classList.remove('hidden');
    }
}

// ——— Timers ———

function gameTick() {
    if (isGameOver || isPaused || isBoardRotating || isCascadeRunning || timeFreezeActive || isEventPopupOpen) return;

    timeRemaining = Math.max(0, timeRemaining - getTimeDrainPerTick());
    gravityCountdown -= 0.1;

    if (gravityCountdown <= 5) {
        document.getElementById('board-frame-container').classList.add('shift-warning');
    } else {
        document.getElementById('board-frame-container').classList.remove('shift-warning');
    }

    if (gravityCountdown <= 0 && !isEventPopupOpen) {
        gravityCountdown = GRAVITY_ROTATION_CYCLE;
        triggerGravityShift();
    }

    const bar = document.getElementById('game-timer-bar');
    if (timeRemaining < 30 && Math.floor(timeRemaining * 10) % 10 === 0) {
        playSoundTick();
        bar.classList.add('shake-animation');
    } else {
        bar.classList.remove('shake-animation');
    }

    updateTimersView();
    if (timeRemaining <= 0) triggerGameOver('Time ran out.');
}

function updateTimersView() {
    document.getElementById('time-remaining-text').textContent = `${Math.ceil(timeRemaining)}s`;
    const pct = Math.min(100, (timeRemaining / INITIAL_TIME) * 100);
    const bar = document.getElementById('game-timer-bar');
    bar.style.width = `${pct}%`;
    bar.style.background =
        timeRemaining <= 30 ? 'var(--danger)' : timeRemaining <= 90 ? 'var(--warning)' : 'var(--text)';

    document.getElementById('gravity-countdown').textContent = `${Math.ceil(gravityCountdown)}s`;

    document.querySelector('.metric--hero')?.classList.toggle('metric--urgent', timeRemaining <= 30);
    document.getElementById('shift-metric')?.classList.toggle(
        'metric--urgent',
        gravityCountdown <= 5 && !isEventPopupOpen && hasGameStarted
    );
}

function updateScoreView() {
    const prev = lastScoreDisplayed;
    document.getElementById('current-score').textContent = score.toLocaleString();
    if (score > prev) pulseScoreBlock('score-block-current');
    lastScoreDisplayed = score;
    if (score > runStartHighScore) beatHighScoreThisRun = true;

    document.getElementById('high-score').textContent = highScore.toLocaleString();
    updateLevelDisplay();
}

function updateStreakDisplay() {
    document.getElementById('streak-count').textContent = clearStreak;
}

function updatePowerupButtons() {
    document.getElementById('btn-undo').disabled = undoStack.length === 0 || score < 500;
    document.getElementById('btn-freeze').disabled = score < 1000 || timeFreezeActive;
    document.getElementById('btn-hold').disabled = !canHold || !shelfPieces.some(Boolean);
}

// ——— Game flow ———

function startNewGame() {
    runStartHighScore = highScore;
    beatHighScoreThisRun = false;
    lastScoreDisplayed = 0;
    document.getElementById('new-best-badge').classList.add('hidden');
    document.querySelectorAll('.result-card').forEach(el => el.classList.remove('result-card--best'));
    document.getElementById('score-block-best').classList.remove('score-block--highlight');

    board = createEmptyBoard();
    score = 0;
    timeRemaining = INITIAL_TIME;
    gravityCountdown = GRAVITY_ROTATION_CYCLE;
    playerLevel = 1;
    holdPiece = null;
    canHold = true;
    undoStack = [];
    timeFreezeActive = false;
    shelfPieces = [null, null, null];
    maxComboThisRun = 1;
    chromaClearsThisRun = 0;
    clearStreak = 0;
    maxStreakThisRun = 0;
    isGameOver = false;
    isPaused = false;
    isBoardRotating = false;
    isCascadeRunning = false;
    hasGameStarted = true;
    isEventPopupOpen = false;
    popupQueue = [];
    popupContinueCallback = null;
    clearPopupAutoTimer();
    const eventPopup = document.getElementById('event-popup');
    eventPopup.classList.remove('visible');
    eventPopup.hidden = true;
    eventPopup.className = 'event-popup';

    document.getElementById('board-frame-container').classList.remove('freeze-active', 'shift-warning');
    updateLevelDisplay();

    createGrid();
    updateBoardView();
    spawnShelfPieces();
    renderHoldPiece();
    updateScoreView();
    updateStreakDisplay();
    updateTimersView();
    updatePowerupButtons();

    nextRotationDirection = 'CW';
    setNextRotationArrow();

    ['modal-intro', 'modal-gameover', 'modal-paused'].forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    updateModalScrollLock();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameTick, 100);
    initAudio();
    haptic(12);
}

function pauseGame() {
    if (isGameOver || isPaused || isBoardRotating || isCascadeRunning) return;
    isPaused = true;
    document.getElementById('modal-paused').classList.add('active');
    updateModalScrollLock();
}

function resumeGame() {
    if (!isPaused) return;
    isPaused = false;
    document.getElementById('modal-paused').classList.remove('active');
    updateModalScrollLock();
}

function triggerGameOver(reason) {
    if (isGameOver) return;
    isGameOver = true;
    clearInterval(gameInterval);
    playSoundGameOver();
    haptic([30, 60, 30]);

    document.getElementById('final-score').textContent = score.toLocaleString();
    document.getElementById('final-level').textContent = playerLevel;
    document.getElementById('final-chromas').textContent = chromaClearsThisRun;
    document.getElementById('gameover-reason').textContent = reason;
    document.getElementById('new-best-badge').classList.toggle('hidden', !beatHighScoreThisRun);
    document.querySelector('.result-card')?.classList.toggle('result-card--best', beatHighScoreThisRun);
    document.getElementById('modal-gameover').classList.add('active');
    updateModalScrollLock();
}

function bindUI() {
    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');

    document.getElementById('btn-sound').addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        iconOn.classList.toggle('hidden', !isSoundEnabled);
        iconOff.classList.toggle('hidden', isSoundEnabled);
        const btn = document.getElementById('btn-sound');
        btn.setAttribute('aria-label', isSoundEnabled ? 'Sound on' : 'Sound off');
        btn.setAttribute('aria-pressed', String(!isSoundEnabled));
        saveSoundPreference();
        initAudio();
    });

    document.getElementById('btn-pause').addEventListener('click', () => { initAudio(); pauseGame(); });
    document.getElementById('btn-resume').addEventListener('click', resumeGame);
    document.getElementById('btn-info').addEventListener('click', () => {
        wasPausedBeforeHelp = isPaused;
        if (!isGameOver && !isPaused) isPaused = true;
        document.getElementById('modal-paused').classList.remove('active');
        document.getElementById('modal-intro').classList.add('active');
        document.getElementById('btn-start').textContent =
            hasGameStarted && !isGameOver ? 'Back to game' : 'Start playing';
        updateModalScrollLock();
    });

    document.getElementById('btn-hold').addEventListener('click', () => {
        if (!canHold || isGameOver || isPaused || isBoardRotating || isCascadeRunning) return;
        const idx = shelfPieces.findIndex(p => p !== null);
        if (idx === -1) return;
        const current = shelfPieces[idx];
        if (!holdPiece) {
            holdPiece = current;
            shelfPieces[idx] = null;
        } else {
            const stored = holdPiece;
            holdPiece = current;
            shelfPieces[idx] = stored;
        }
        canHold = false;
        spawnShelfPieces();
        renderHoldPiece();
        updatePowerupButtons();
    });

    document.getElementById('btn-undo').addEventListener('click', () => {
        if (isGameOver || isPaused || isBoardRotating || isCascadeRunning || undoStack.length === 0 || score < 500) return;
        score -= 500;
        const s = undoStack.pop();
        board = s.board;
        timeRemaining = s.timeRemaining;
        playerLevel = s.playerLevel;
        clearStreak = s.clearStreak;
        shelfPieces = s.shelfPieces;
        holdPiece = s.holdPiece;
        canHold = s.canHold;
        updateLevelDisplay();
        updateBoardView();
        updateScoreView();
        updateStreakDisplay();
        updateTimersView();
        spawnShelfPieces();
        renderHoldPiece();
        updatePowerupButtons();
    });

    document.getElementById('btn-freeze').addEventListener('click', () => {
        if (isGameOver || isPaused || timeFreezeActive || score < 1000) return;
        score -= 1000;
        updateScoreView();
        timeFreezeActive = true;
        document.getElementById('board-frame-container').classList.add('freeze-active');
        showEventPopup('match', 'Time Frozen', 'Clock paused for 10 seconds.', '−1000 score');
        setTimeout(() => {
            timeFreezeActive = false;
            document.getElementById('board-frame-container').classList.remove('freeze-active');
            updatePowerupButtons();
        }, 10000);
        updatePowerupButtons();
    });

    document.getElementById('btn-start').addEventListener('click', () => {
        document.getElementById('modal-intro').classList.remove('active');
        if (hasGameStarted && !isGameOver) {
            isPaused = wasPausedBeforeHelp;
            document.getElementById('btn-start').textContent = 'Start playing';
        } else {
            startNewGame();
        }
        updateModalScrollLock();
    });

    document.getElementById('btn-restart').addEventListener('click', startNewGame);

    document.addEventListener('keydown', (e) => {
        if (isEventPopupOpen && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            dismissEventPopup();
            return;
        }
        if (e.key === 'Escape' && hasGameStarted && !isGameOver) {
            if (isEventPopupOpen) {
                dismissEventPopup();
            } else {
                isPaused ? resumeGame() : pauseGame();
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    bindUI();
    createGrid();
    initParticles();
    requestAnimationFrame(updateParticlesLoop);
    document.getElementById('high-score').textContent = highScore.toLocaleString();

    const soundOn = document.getElementById('sound-icon-on');
    const soundOff = document.getElementById('sound-icon-off');
    soundOn.classList.toggle('hidden', !isSoundEnabled);
    soundOff.classList.toggle('hidden', isSoundEnabled);
    document.getElementById('btn-sound').setAttribute('aria-pressed', String(!isSoundEnabled));

    updateModalScrollLock();

    document.getElementById('event-popup-continue').addEventListener('click', dismissEventPopup);
    document.getElementById('event-popup').addEventListener('click', (e) => {
        if (e.target.id === 'event-popup') dismissEventPopup();
    });
});
