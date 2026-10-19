/**
 * AI 8-Puzzle Visualizer - Game Engine Powered by Greedy Best-First Search (GBFS)
 * Assigned to Tanu (Algorithm 6 - GBFS)
 * Features: Click/Arrow controls, stopwatch timer, move tracking, GBFS AI hints,
 * Human vs GBFS AI Race mode, difficulty levels, and Canvas victory confetti!
 */

class GameEngine {
    constructor() {
        this.goalState = [...Puzzle.STANDARD_GOAL];
        this.humanState = [...Puzzle.DEFAULT_INITIAL];
        this.initialState = [...Puzzle.DEFAULT_INITIAL];
        this.optimalMoves = 0;
        this.moveCount = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.isGameActive = false;
        this.isWon = false;
        this.currentLevel = 'intermediate';
        this.currentHeuristic = 'manhattan'; // GBFS default heuristic

        // Gamification & Engagement states
        this.showDistances = false;
        this.comboCount = 0;
        this.lastMoveTime = 0;
        this.comboTimeout = null;
        this.personalBests = JSON.parse(localStorage.getItem('puzzle_records') || '{}');

        // Race Mode state
        this.isRaceActive = false;
        this.aiState = [...Puzzle.DEFAULT_INITIAL];
        this.aiMoveCount = 0;
        this.aiPath = [];
        this.aiPathIdx = 0;
        this.aiTimer = null;
        this.aiSpeedMs = 300;

        this.init();
    }

    init() {
        this.bindEvents();
        this.startNewGame('intermediate');
    }

    bindEvents() {
        const board = document.getElementById('gameBoard');
        if (board) {
            board.addEventListener('click', (e) => {
                const tile = e.target.closest('.puzzle-tile');
                if (tile && !this.isWon) {
                    const idx = parseInt(tile.dataset.index, 10);
                    if (!isNaN(idx)) this.handleTileClick(idx);
                }
            });
        }

        const levelSelect = document.getElementById('gameDifficultySelect');
        if (levelSelect) {
            levelSelect.addEventListener('change', (e) => {
                this.startNewGame(e.target.value);
            });
        }

        const btnNewGame = document.getElementById('btnNewGame');
        if (btnNewGame) {
            btnNewGame.addEventListener('click', () => {
                const lvl = document.getElementById('gameDifficultySelect')?.value || 'intermediate';
                this.startNewGame(lvl);
            });
        }

        // GBFS AI Hint button
        const btnHint = document.getElementById('btnGameHint');
        if (btnHint) {
            btnHint.addEventListener('click', () => this.giveHint());
        }

        // GBFS Auto Solve button
        const btnAutoSolve = document.getElementById('btnGameAutoSolve');
        if (btnAutoSolve) {
            btnAutoSolve.addEventListener('click', () => this.autoSolve());
        }

        // Race Mode Toggle
        const btnRaceMode = document.getElementById('btnToggleRace');
        if (btnRaceMode) {
            btnRaceMode.addEventListener('click', () => this.toggleRaceMode());
        }

        // Distance Hints Toggle
        const btnDistance = document.getElementById('btnToggleDistances');
        if (btnDistance) {
            btnDistance.addEventListener('click', () => {
                this.showDistances = !this.showDistances;
                btnDistance.classList.toggle('bg-amber-600/30', this.showDistances);
                btnDistance.classList.toggle('border-amber-500/60', this.showDistances);
                this.renderGameBoard();
            });
        }

        // Sound Toggle
        const btnSound = document.getElementById('btnToggleSound');
        if (btnSound) {
            btnSound.addEventListener('click', () => SoundFX.toggleMute());
        }

        // Next Level Button in Modal
        const btnNextLevel = document.getElementById('btnNextLevelModal');
        if (btnNextLevel) {
            btnNextLevel.addEventListener('click', () => {
                document.getElementById('victoryModal').classList.add('hidden');
                this.startNewGame(this.currentLevel);
            });
        }
    }

    startNewGame(level = 'intermediate') {
        this.stopTimer();
        this.clearAiRace();
        this.currentLevel = level;
        this.moveCount = 0;
        this.elapsedSeconds = 0;
        this.isGameActive = false;
        this.isWon = false;

        let moves = 8;
        if (level === 'novice') moves = 4;
        else if (level === 'intermediate') moves = 9;
        else if (level === 'advanced') moves = 15;
        else if (level === 'master') moves = 22;

        this.initialState = Puzzle.generateRandomSolvable(this.goalState, moves);
        this.humanState = [...this.initialState];
        this.aiState = [...this.initialState];

        // Benchmark moves using Greedy Best-First Search (GBFS, f = h)
        const solution = SearchAlgorithms.solveGBFS(this.initialState, this.goalState, this.currentHeuristic);
        this.optimalMoves = solution.success ? solution.pathCost : moves;

        this.updateHUD();
        this.renderGameBoard();
        this.hideHintBanner();

        if (this.isRaceActive) {
            this.renderAiBoard();
        }
    }

    getCorrectTilesCount() {
        return this.humanState.reduce((acc, val, idx) => (val !== 0 && val === this.goalState[idx]) ? acc + 1 : acc, 0);
    }

    showComboBadge(count) {
        const badge = document.getElementById('gameComboBadge');
        if (!badge) return;
        badge.textContent = count >= 4 ? `⚡ MEGA COMBO x${count}! 🌟` : `🔥 COMBO x${count}!`;
        badge.classList.remove('hidden');
        badge.classList.remove('animate-bounce');
        void badge.offsetWidth; // trigger reflow
        badge.classList.add('animate-bounce');
        if (this.comboTimeout) clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            badge.classList.add('hidden');
        }, 2200);
    }

    renderGameBoard() {
        const board = document.getElementById('gameBoard');
        if (!board) return;
        board.innerHTML = '';

        const blankIdx = this.humanState.indexOf(0);
        const blankRow = Math.floor(blankIdx / 3);
        const blankCol = blankIdx % 3;

        for (let i = 0; i < 9; i++) {
            const val = this.humanState[i];
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile' + (val === 0 ? ' tile-blank' : ' interactive-tile');

            const row = Math.floor(i / 3);
            const col = i % 3;
            const isAdjacent = (Math.abs(row - blankRow) + Math.abs(col - blankCol)) === 1;

            if (val !== 0 && isAdjacent) {
                tile.classList.add('can-move');
            }

            // In-place correct tile check (renders glowing star badge)
            if (val !== 0 && val === this.goalState[i]) {
                tile.classList.add('tile-correct');
            }

            // Optional Distance Badge Mode
            if (this.showDistances && val !== 0) {
                const goalIdx = this.goalState.indexOf(val);
                const r1 = Math.floor(i / 3), c1 = i % 3;
                const r2 = Math.floor(goalIdx / 3), c2 = goalIdx % 3;
                const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
                const badge = document.createElement('span');
                badge.className = 'tile-distance-badge dist-' + Math.min(dist, 2);
                badge.textContent = dist === 0 ? '✓' : `${dist} step${dist > 1 ? 's' : ''}`;
                tile.appendChild(badge);
            }

            const numSpan = document.createElement('span');
            numSpan.textContent = val === 0 ? '' : val;
            tile.prepend(numSpan);

            tile.dataset.value = val;
            tile.dataset.index = i;
            board.appendChild(tile);
        }
    }

    renderAiBoard() {
        const board = document.getElementById('aiRaceBoard');
        if (!board) return;
        board.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            const val = this.aiState[i];
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile' + (val === 0 ? ' tile-blank' : '');
            if (val !== 0 && val === this.goalState[i]) {
                tile.classList.add('tile-correct');
            }
            tile.textContent = val === 0 ? '' : val;
            board.appendChild(tile);
        }
    }

    handleTileClick(tileIndex) {
        if (this.isWon) return;

        const blankIdx = this.humanState.indexOf(0);
        const row = Math.floor(tileIndex / 3);
        const col = tileIndex % 3;
        const blankRow = Math.floor(blankIdx / 3);
        const blankCol = blankIdx % 3;

        const isAdjacent = (Math.abs(row - blankRow) + Math.abs(col - blankCol)) === 1;

        if (!isAdjacent) {
            SoundFX.playError();
            this.shakeTile(tileIndex);
            return;
        }

        if (!this.isGameActive) {
            this.isGameActive = true;
            this.startTimer();
        }

        const prevCorrect = this.getCorrectTilesCount();

        this.humanState[blankIdx] = this.humanState[tileIndex];
        this.humanState[tileIndex] = 0;
        this.moveCount++;

        const newCorrect = this.getCorrectTilesCount();
        if (newCorrect > prevCorrect) {
            SoundFX.playTileLock();
        } else {
            SoundFX.playSlide();
        }

        // Combo Streak detection
        const now = Date.now();
        if (now - this.lastMoveTime < 2400) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastMoveTime = now;

        if (this.comboCount >= 2) {
            this.showComboBadge(this.comboCount);
            SoundFX.playCombo(this.comboCount);
        }

        this.hideHintBanner();
        this.updateHUD();
        this.renderGameBoard();

        if (Puzzle.areEqual(this.humanState, this.goalState)) {
            this.onVictory('Human');
        }
    }

    handleKeyMove(direction) {
        if (this.isWon) return;
        const blankIdx = this.humanState.indexOf(0);
        const row = Math.floor(blankIdx / 3);
        const col = blankIdx % 3;

        let targetIdx = -1;
        if (direction === 'UP' && row < 2) targetIdx = blankIdx + 3;
        else if (direction === 'DOWN' && row > 0) targetIdx = blankIdx - 3;
        else if (direction === 'LEFT' && col < 2) targetIdx = blankIdx + 1;
        else if (direction === 'RIGHT' && col > 0) targetIdx = blankIdx - 1;

        if (targetIdx !== -1) {
            this.handleTileClick(targetIdx);
        }
    }

    shakeTile(index) {
        const board = document.getElementById('gameBoard');
        if (!board) return;
        const tile = board.children[index];
        if (tile) {
            tile.classList.add('animate-shake');
            setTimeout(() => tile.classList.remove('animate-shake'), 300);
        }
    }

    startTimer() {
        this.startTime = Date.now() - (this.elapsedSeconds * 1000);
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
        const secs = (this.elapsedSeconds % 60).toString().padStart(2, '0');
        const el = document.getElementById('gameTimer');
        if (el) el.textContent = `${mins}:${secs}`;
    }

    updateHUD() {
        const moveEl = document.getElementById('gameMoveCount');
        const parEl = document.getElementById('gameParMoves');
        if (moveEl) moveEl.textContent = this.moveCount;
        if (parEl) parEl.textContent = this.optimalMoves;
        this.updateTimerDisplay();

        // Goal Match Progress Bar
        const correct = this.getCorrectTilesCount();
        const pct = Math.round((correct / 8) * 100);
        const progText = document.getElementById('gameProgressText');
        const progBar = document.getElementById('gameProgressBar');
        if (progText) progText.textContent = `${correct} / 8 Tiles (${pct}%)`;
        if (progBar) progBar.style.width = `${pct}%`;

        // Personal Best Display
        const pbEl = document.getElementById('gamePersonalBest');
        if (pbEl) {
            const rec = this.personalBests[this.currentLevel];
            pbEl.textContent = rec ? `${rec.moves} moves (${rec.time}s)` : '--';
        }
    }

    // =========================================================================
    // GBFS AI HINT & AUTO-SOLVE (f = h)
    // =========================================================================

    giveHint() {
        if (this.isWon) return;
        // Solve from human's current state using Greedy Best-First Search (GBFS, f = h)
        const solution = SearchAlgorithms.solveGBFS(this.humanState, this.goalState, this.currentHeuristic);
        if (!solution.success || solution.path.length < 2) return;

        const nextState = solution.path[1];
        const nextAction = solution.actions[0];
        const movedTile = Puzzle.getSuccessors(this.humanState).find(s => Puzzle.areEqual(s.state, nextState))?.tileMoved;

        SoundFX.playHint();

        const board = document.getElementById('gameBoard');
        if (board && movedTile) {
            const tileEl = Array.from(board.children).find(t => parseInt(t.dataset.value, 10) === movedTile);
            if (tileEl) {
                tileEl.classList.add('hint-tile');
                setTimeout(() => tileEl.classList.remove('hint-tile'), 1800);
            }
        }

        const banner = document.getElementById('hintBanner');
        if (banner && movedTile) {
            const hVal = Heuristics.calculate(this.currentHeuristic, nextState, this.goalState);
            banner.innerHTML = `<i class="fas fa-lightbulb text-amber-400 mr-1.5"></i> <strong>GBFS Recommendation (Tanu):</strong> Slide tile <strong class="text-blue-300 font-bold">${movedTile}</strong> [${nextAction}] towards blank &bull; Greedy score: <span class="font-mono text-amber-300 font-bold">h(n) = ${hVal}</span>`;
            banner.classList.remove('hidden');
        }
    }

    hideHintBanner() {
        const banner = document.getElementById('hintBanner');
        if (banner) banner.classList.add('hidden');
    }

    autoSolve() {
        if (this.isWon) return;
        // Auto-solve using Greedy Best-First Search (GBFS)
        const solution = SearchAlgorithms.solveGBFS(this.humanState, this.goalState, this.currentHeuristic);
        if (!solution.success) return;

        this.stopTimer();
        let step = 1;
        const totalSteps = solution.path.length;

        const stepNext = () => {
            if (step >= totalSteps) {
                this.onVictory('GBFS AI Assistant');
                return;
            }
            this.humanState = [...solution.path[step]];
            this.moveCount++;
            SoundFX.playSlide();
            this.updateHUD();
            this.renderGameBoard();
            step++;
            setTimeout(stepNext, 220);
        };
        stepNext();
    }

    // =========================================================================
    // HUMAN VS GBFS AI RACE MODE
    // =========================================================================

    toggleRaceMode() {
        this.isRaceActive = !this.isRaceActive;
        const raceContainer = document.getElementById('raceModeContainer');
        const standardContainer = document.getElementById('standardGameContainer');
        const btn = document.getElementById('btnToggleRace');

        if (this.isRaceActive) {
            if (raceContainer) raceContainer.classList.remove('hidden');
            if (standardContainer) standardContainer.classList.add('hidden');
            if (btn) btn.innerHTML = '<i class="fas fa-user mr-1"></i> Solo Mode';
            this.startRace();
        } else {
            if (raceContainer) raceContainer.classList.add('hidden');
            if (standardContainer) standardContainer.classList.remove('hidden');
            if (btn) btn.innerHTML = '<i class="fas fa-flag-checkered mr-1"></i> Race GBFS AI';
            this.clearAiRace();
            this.renderGameBoard();
        }
    }

    startRace() {
        this.clearAiRace();
        this.startNewGame(this.currentLevel);

        // Precompute AI path via Greedy Best-First Search (GBFS)
        const sol = SearchAlgorithms.solveGBFS(this.initialState, this.goalState, this.currentHeuristic);
        this.aiPath = sol.path || [];
        this.aiPathIdx = 0;
        this.aiMoveCount = 0;

        const raceStatus = document.getElementById('raceStatusText');
        if (raceStatus) raceStatus.textContent = 'Race Against GBFS Search Agent! Solve before the greedy AI finishes!';

        this.aiTimer = setInterval(() => {
            if (!this.isGameActive && this.moveCount === 0) return;

            if (this.aiPathIdx < this.aiPath.length - 1) {
                this.aiPathIdx++;
                this.aiState = [...this.aiPath[this.aiPathIdx]];
                this.aiMoveCount++;
                this.renderAiBoard();
                document.getElementById('aiMoveCountDisplay').textContent = this.aiMoveCount;

                if (Puzzle.areEqual(this.aiState, this.goalState)) {
                    this.clearAiRace();
                    this.onVictory('GBFS AI Agent');
                }
            }
        }, this.aiSpeedMs);
    }

    clearAiRace() {
        if (this.aiTimer) {
            clearInterval(this.aiTimer);
            this.aiTimer = null;
        }
    }

    // =========================================================================
    // VICTORY CELEBRATION & CONFETTI
    // =========================================================================

    onVictory(winner = 'Human') {
        this.isWon = true;
        this.stopTimer();
        this.clearAiRace();
        SoundFX.playWin();

        let stars = 1;
        if (this.moveCount <= this.optimalMoves) stars = 3;
        else if (this.moveCount <= Math.round(this.optimalMoves * 1.5)) stars = 2;

        const starContainer = document.getElementById('victoryStars');
        if (starContainer) {
            starContainer.innerHTML = '';
            for (let i = 1; i <= 3; i++) {
                const star = document.createElement('i');
                star.className = 'fas fa-star text-2xl ' + (i <= stars ? 'text-amber-400' : 'text-slate-700');
                starContainer.appendChild(star);
            }
        }

        let isNewRecord = false;
        if (winner === 'Human') {
            const currentRec = this.personalBests[this.currentLevel];
            if (!currentRec || this.moveCount < currentRec.moves || (this.moveCount === currentRec.moves && this.elapsedSeconds < currentRec.time)) {
                this.personalBests[this.currentLevel] = { moves: this.moveCount, time: this.elapsedSeconds };
                localStorage.setItem('puzzle_records', JSON.stringify(this.personalBests));
                isNewRecord = true;
                this.updateHUD();
            }
        }

        const titleEl = document.getElementById('modalWinnerTitle');
        if (titleEl) {
            if (winner === 'Human') {
                titleEl.textContent = isNewRecord ? '🏆 NEW PERSONAL RECORD! 🎉' : '🎉 Puzzle Solved!';
            } else {
                titleEl.textContent = `🤖 ${winner} Finished First!`;
            }
        }

        document.getElementById('modalTotalMoves').textContent = this.moveCount;
        document.getElementById('modalOptimalMoves').textContent = this.optimalMoves;
        document.getElementById('modalElapsedTime').textContent = `${this.elapsedSeconds}s`;

        this.launchConfetti();

        const modal = document.getElementById('victoryModal');
        if (modal) modal.classList.remove('hidden');
    }

    launchConfetti() {
        const canvas = document.getElementById('confettiCanvas');
        if (!canvas) return;
        canvas.classList.remove('hidden');

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

        for (let i = 0; i < 120; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.5) * 16 - 4,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                life: 1
            });
        }

        let animationFrame;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.35;
                p.rotation += p.rotSpeed;
                p.life -= 0.012;

                if (p.life > 0) {
                    alive++;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (alive > 0) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.classList.add('hidden');
                cancelAnimationFrame(animationFrame);
            }
        };
        animate();
    }
}

window.gameEngine = null;
document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
