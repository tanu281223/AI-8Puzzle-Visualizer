/**
 * AI 8-Puzzle Visualizer - Visualizer Engine & DOM Controller
 * Handles interactive animations, step-by-step playback, real-time metrics,
 * successor previews, and timeline scrubber.
 */

class VisualizerEngine {
    constructor() {
        this.initialState = [...Puzzle.DEFAULT_INITIAL];
        this.goalState = [...Puzzle.STANDARD_GOAL];
        this.currentState = [...Puzzle.DEFAULT_INITIAL];
        this.algorithm = 'GBFS';
        this.heuristic = 'manhattan';
        this.depthLimit = 10;
        this.maxDepthLimit = 25;

        // Playback state
        this.isRunning = false;
        this.isPaused = false;
        this.stepDelay = 250; // ms
        this.timer = null;

        // Generator and History
        this.generator = null;
        this.searchHistory = [];
        this.currentStepIdx = -1;
        this.solutionPath = [];
        this.solutionActions = [];
        this.solutionSummary = null;
        this.mode = 'IDLE'; // 'SEARCHING', 'SOLUTION', 'IDLE'

        this.init();
    }

    init() {
        this.renderAllBoards();
        this.updateSolvabilityBadge();
    }

    // =========================================================================
    // BOARD RENDERING
    // =========================================================================

    /**
     * Render the main 3x3 puzzle board
     */
    renderBoard(containerId, state, previousState = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        const movedTile = this.getMovedTile(previousState, state);

        for (let i = 0; i < 9; i++) {
            const val = state[i];
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile' + (val === 0 ? ' tile-blank' : '');
            if (val !== 0 && val === movedTile) {
                tile.classList.add('tile-moved');
            }
            tile.textContent = val === 0 ? '' : val;
            tile.dataset.value = val;
            tile.dataset.index = i;
            container.appendChild(tile);
        }
    }

    /**
     * Render a compact 3x3 mini board
     */
    renderMiniBoard(containerId, state) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const val = state[i];
            const tile = document.createElement('div');
            tile.className = 'mini-tile' + (val === 0 ? ' mini-blank' : '');
            tile.textContent = val === 0 ? '' : val;
            container.appendChild(tile);
        }
    }

    getMovedTile(prevState, currState) {
        if (!prevState || !currState) return null;
        const prevBlank = prevState.indexOf(0);
        const currBlank = currState.indexOf(0);
        if (prevBlank === -1 || currBlank === -1 || prevBlank === currBlank) return null;
        return prevState[currBlank]; // The tile that moved into the old blank spot
    }

    renderAllBoards() {
        this.renderBoard('mainBoard', this.currentState);
        this.renderMiniBoard('initialMiniBoard', this.initialState);
        this.renderMiniBoard('goalMiniBoard', this.goalState);
        this.renderMiniBoard('currentExpandedMiniBoard', this.currentState);
    }

    updateSolvabilityBadge() {
        const badge = document.getElementById('solvabilityBadge');
        const reasonEl = document.getElementById('solvabilityReason');
        const info = Puzzle.checkSolvability(this.initialState, this.goalState);

        if (badge) {
            badge.className = 'px-3 py-1 rounded-full text-xs font-semibold ' +
                (info.solvable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40');
            badge.innerHTML = info.solvable
                ? '<i class="fas fa-check-circle mr-1"></i> Solvable'
                : '<i class="fas fa-times-circle mr-1"></i> Unsolvable';
        }

        if (reasonEl) {
            reasonEl.textContent = info.reason;
        }
    }

    // =========================================================================
    // CONTROLS & PLAYBACK
    // =========================================================================

    startSolve() {
        const info = Puzzle.checkSolvability(this.initialState, this.goalState);
        if (!info.solvable) {
            alert("This puzzle configuration is UNSOLVABLE!\n" + info.reason + "\n\nPlease pick a solvable preset or click 'Generate Random Puzzle'.");
            return;
        }

        this.reset(false);
        this.isRunning = true;
        this.isPaused = false;
        this.mode = 'SEARCHING';

        this.updateControlButtons();
        document.getElementById('searchStatusText').textContent = 'Search in progress...';
        document.getElementById('searchStatusBadge').className = 'px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
        document.getElementById('searchStatusBadge').textContent = 'RUNNING';

        const options = {
            heuristic: this.heuristic,
            depthLimit: this.depthLimit,
            maxDepth: this.maxDepthLimit
        };

        this.generator = SearchAlgorithms.getStepGenerator(this.algorithm, this.initialState, this.goalState, options);
        this.runLoop();
    }

    runLoop() {
        if (!this.isRunning || this.isPaused) return;

        const hasNext = this.stepForward();
        if (hasNext && this.isRunning && !this.isPaused) {
            this.timer = setTimeout(() => this.runLoop(), this.stepDelay);
        }
    }

    pause() {
        if (!this.isRunning) return;
        this.isPaused = true;
        if (this.timer) clearTimeout(this.timer);
        this.updateControlButtons();
        document.getElementById('searchStatusBadge').textContent = 'PAUSED';
        document.getElementById('searchStatusBadge').className = 'px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30';
    }

    resume() {
        if (!this.isRunning) return;
        this.isPaused = false;
        this.updateControlButtons();
        document.getElementById('searchStatusBadge').textContent = 'RUNNING';
        document.getElementById('searchStatusBadge').className = 'px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
        this.runLoop();
    }

    stepForward() {
        // If we are browsing backward in history, advance in history
        if (this.currentStepIdx < this.searchHistory.length - 1) {
            this.currentStepIdx++;
            this.renderHistoryStep(this.currentStepIdx);
            return true;
        }

        // Otherwise, ask generator for the next step
        if (!this.generator) {
            this.generator = SearchAlgorithms.getStepGenerator(this.algorithm, this.initialState, this.goalState, {
                heuristic: this.heuristic,
                depthLimit: this.depthLimit,
                maxDepth: this.maxDepthLimit
            });
            this.isRunning = true;
            this.mode = 'SEARCHING';
        }

        const next = this.generator.next();
        if (next.done) {
            this.onSearchComplete(null);
            return false;
        }

        const stepData = next.value;

        if (stepData.type === 'SUCCESS') {
            this.searchHistory.push(stepData);
            this.currentStepIdx = this.searchHistory.length - 1;
            this.onSearchSuccess(stepData);
            return false;
        } else if (stepData.type === 'FAILURE') {
            this.searchHistory.push(stepData);
            this.currentStepIdx = this.searchHistory.length - 1;
            this.onSearchFailure(stepData);
            return false;
        } else if (stepData.type === 'STEP') {
            this.searchHistory.push(stepData);
            this.currentStepIdx = this.searchHistory.length - 1;
            this.applyStepData(stepData);
            return true;
        }

        return true;
    }

    stepBackward() {
        if (this.currentStepIdx > 0) {
            this.pause();
            this.currentStepIdx--;
            this.renderHistoryStep(this.currentStepIdx);
        }
    }

    renderHistoryStep(idx) {
        if (idx < 0 || idx >= this.searchHistory.length) return;
        const step = this.searchHistory[idx];
        if (step.type === 'STEP') {
            this.applyStepData(step);
        } else if (step.type === 'SUCCESS') {
            this.applySuccessStep(step);
        }
        this.updateScrubber();
    }

    applyStepData(step) {
        const prev = this.currentState;
        this.currentState = [...step.currentNode.state];
        this.renderBoard('mainBoard', this.currentState, prev);
        this.renderMiniBoard('currentExpandedMiniBoard', this.currentState);

        // Update real-time metric panel
        document.getElementById('metricNodesExpanded').textContent = step.nodesExpanded;
        document.getElementById('metricNodesGenerated').textContent = step.nodesGenerated;
        document.getElementById('metricFrontierSize').textContent = step.frontierSize;
        document.getElementById('metricExploredSize').textContent = step.exploredSize;
        document.getElementById('metricCurrentDepth').textContent = step.currentDepth;
        document.getElementById('metricMaxDepth').textContent = step.maxDepth;

        // Path cost & heuristics
        document.getElementById('metricG').textContent = step.currentNode.g !== undefined ? step.currentNode.g : '-';
        document.getElementById('metricH').textContent = step.currentNode.h !== undefined ? step.currentNode.h : '-';
        document.getElementById('metricF').textContent = step.currentNode.f !== undefined ? step.currentNode.f : '-';

        // Action and parent
        document.getElementById('metricActionTaken').textContent = step.currentNode.action || 'ROOT';
        document.getElementById('metricParentNode').textContent = step.currentNode.parent ? Puzzle.toKey(step.currentNode.parent.state) : 'None';

        // Render Frontier preview
        this.renderFrontierList(step.frontierPreview || []);

        // Render Successors
        this.renderSuccessors(step.successors || []);

        this.updateScrubber();
    }

    applySuccessStep(step) {
        this.currentState = [...step.node.state];
        this.renderBoard('mainBoard', this.currentState);
        this.renderMiniBoard('currentExpandedMiniBoard', this.currentState);
        this.updateScrubber();
    }

    renderFrontierList(items) {
        const container = document.getElementById('frontierList');
        if (!container) return;
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<div class="text-xs text-slate-500 italic p-2">Frontier is empty</div>';
            return;
        }

        items.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'frontier-item';
            const action = item.action || 'ROOT';
            const fVal = item.f !== undefined ? `f:${item.f}` : `d:${item.depth}`;
            el.innerHTML = `
                <span class="font-mono text-xs text-slate-300">#${i + 1} [${action}]</span>
                <span class="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">${fVal}</span>
            `;
            container.appendChild(el);
        });
    }

    renderSuccessors(successors) {
        const container = document.getElementById('successorsContainer');
        if (!container) return;
        container.innerHTML = '';

        if (successors.length === 0) {
            container.innerHTML = '<div class="text-xs text-slate-500 italic p-2 col-span-full">No successors generated for this node.</div>';
            return;
        }

        successors.forEach(succ => {
            const card = document.createElement('div');
            card.className = 'p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex flex-col items-center gap-2 text-center';

            const miniDiv = document.createElement('div');
            miniDiv.className = 'mini-board';
            for (let i = 0; i < 9; i++) {
                const val = succ.state[i];
                const t = document.createElement('div');
                t.className = 'mini-tile' + (val === 0 ? ' mini-blank' : '');
                t.textContent = val === 0 ? '' : val;
                miniDiv.appendChild(t);
            }

            const isPruned = succ.isVisited || (succ.isBetter === false) || succ.isCycle;
            const badgeClass = isPruned ? 'bg-slate-700 text-slate-400' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
            const badgeText = isPruned ? 'Pruned/Visited' : 'Added to Frontier';

            card.innerHTML = `
                <div class="flex items-center justify-between w-full text-xs px-1">
                    <span class="font-bold text-blue-400">${succ.action}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded ${badgeClass}">${badgeText}</span>
                </div>
            `;
            card.appendChild(miniDiv);

            const scores = document.createElement('div');
            scores.className = 'flex justify-between w-full text-[10px] text-slate-400 font-mono mt-1 px-1';
            scores.innerHTML = `<span>g:${succ.g}</span><span>h:${succ.h}</span><span class="text-blue-300 font-bold">f:${succ.f}</span>`;
            card.appendChild(scores);

            container.appendChild(card);
        });
    }

    onSearchSuccess(result) {
        this.isRunning = false;
        this.isPaused = false;
        this.solutionPath = result.path;
        this.solutionActions = result.actions;
        this.solutionSummary = result;

        this.updateControlButtons();
        document.getElementById('searchStatusBadge').textContent = 'SOLVED';
        document.getElementById('searchStatusBadge').className = 'px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        document.getElementById('searchStatusText').textContent = `Goal reached in ${result.pathCost} moves!`;

        // Display Solution Summary Cards (Requirement 6)
        document.getElementById('summaryStatusBadge').textContent = 'Solution Found';
        document.getElementById('summaryStatusBadge').className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        document.getElementById('summaryMoves').textContent = result.pathCost;
        document.getElementById('summaryGenerated').textContent = result.nodesGenerated;
        document.getElementById('summaryExpanded').textContent = result.nodesExpanded;
        document.getElementById('summaryMaxDepth').textContent = result.maxDepth;
        document.getElementById('summaryTime').textContent = result.executionTimeMs + ' ms';
        document.getElementById('summaryCost').textContent = result.pathCost;
        document.getElementById('summaryMemory').textContent = result.memoryKB + ' KB';

        // Render Solution Path Breadcrumbs
        this.renderSolutionPath(result.path, result.actions);

        // Open solution summary card
        const summaryCard = document.getElementById('solutionSummaryCard');
        if (summaryCard) summaryCard.classList.remove('hidden');
    }

    onSearchFailure(result) {
        this.isRunning = false;
        this.isPaused = false;
        this.updateControlButtons();

        document.getElementById('searchStatusBadge').textContent = 'NOT FOUND';
        document.getElementById('searchStatusBadge').className = 'px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30';
        document.getElementById('searchStatusText').textContent = result.reason || 'Search exhausted without reaching goal.';

        document.getElementById('summaryStatusBadge').textContent = 'Solution Not Found';
        document.getElementById('summaryStatusBadge').className = 'px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40';
        document.getElementById('summaryMoves').textContent = '-';
        document.getElementById('summaryGenerated').textContent = result.nodesGenerated;
        document.getElementById('summaryExpanded').textContent = result.nodesExpanded;
        document.getElementById('summaryMaxDepth').textContent = result.maxDepth;
        document.getElementById('summaryTime').textContent = result.executionTimeMs ? (result.executionTimeMs + ' ms') : '-';
        document.getElementById('summaryCost').textContent = '-';
        document.getElementById('summaryMemory').textContent = result.memoryKB ? (result.memoryKB + ' KB') : '-';

        const summaryCard = document.getElementById('solutionSummaryCard');
        if (summaryCard) summaryCard.classList.remove('hidden');
    }

    renderSolutionPath(path, actions) {
        const container = document.getElementById('solutionPathSteps');
        if (!container) return;
        container.innerHTML = '';

        path.forEach((state, idx) => {
            const stepItem = document.createElement('button');
            stepItem.className = 'flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-blue-500 transition-all text-left flex-shrink-0 cursor-pointer';

            const miniDiv = document.createElement('div');
            miniDiv.className = 'mini-board scale-90';
            for (let i = 0; i < 9; i++) {
                const val = state[i];
                const t = document.createElement('div');
                t.className = 'mini-tile' + (val === 0 ? ' mini-blank' : '');
                t.textContent = val === 0 ? '' : val;
                miniDiv.appendChild(t);
            }

            const stepInfo = document.createElement('div');
            stepInfo.className = 'flex flex-col text-xs pr-2';
            const actionLabel = idx === 0 ? 'Start' : actions[idx - 1];
            stepInfo.innerHTML = `
                <span class="font-bold text-slate-200">Step ${idx}</span>
                <span class="text-[10px] text-blue-400 font-mono">${actionLabel}</span>
            `;

            stepItem.appendChild(miniDiv);
            stepItem.appendChild(stepInfo);

            stepItem.addEventListener('click', () => {
                this.currentState = [...state];
                this.renderBoard('mainBoard', this.currentState);
            });

            container.appendChild(stepItem);

            if (idx < path.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'text-slate-500 text-sm flex items-center justify-center';
                arrow.innerHTML = '<i class="fas fa-arrow-right"></i>';
                container.appendChild(arrow);
            }
        });
    }

    playSolutionPath() {
        if (!this.solutionPath || this.solutionPath.length === 0) return;
        let stepIdx = 0;
        const total = this.solutionPath.length;

        const step = () => {
            if (stepIdx >= total) return;
            const prev = this.currentState;
            this.currentState = [...this.solutionPath[stepIdx]];
            this.renderBoard('mainBoard', this.currentState, prev);
            stepIdx++;
            if (stepIdx < total) {
                setTimeout(step, Math.max(200, this.stepDelay));
            }
        };
        step();
    }

    reset(fullReset = true) {
        if (this.timer) clearTimeout(this.timer);
        this.isRunning = false;
        this.isPaused = false;
        this.generator = null;
        this.searchHistory = [];
        this.currentStepIdx = -1;
        this.solutionPath = [];
        this.solutionActions = [];
        this.solutionSummary = null;
        this.mode = 'IDLE';

        this.currentState = [...this.initialState];
        this.renderAllBoards();
        this.updateControlButtons();
        this.updateScrubber();

        document.getElementById('searchStatusBadge').textContent = 'IDLE';
        document.getElementById('searchStatusBadge').className = 'px-2 py-0.5 rounded text-xs font-bold bg-slate-700 text-slate-300';
        document.getElementById('searchStatusText').textContent = 'Ready to solve';

        document.getElementById('metricNodesExpanded').textContent = '0';
        document.getElementById('metricNodesGenerated').textContent = '0';
        document.getElementById('metricFrontierSize').textContent = '0';
        document.getElementById('metricExploredSize').textContent = '0';
        document.getElementById('metricCurrentDepth').textContent = '0';
        document.getElementById('metricMaxDepth').textContent = '0';
        document.getElementById('metricG').textContent = '0';
        document.getElementById('metricH').textContent = '0';
        document.getElementById('metricF').textContent = '0';
        document.getElementById('metricActionTaken').textContent = '-';
        document.getElementById('metricParentNode').textContent = '-';

        document.getElementById('frontierList').innerHTML = '<div class="text-xs text-slate-500 italic p-2">Frontier is empty</div>';
        document.getElementById('successorsContainer').innerHTML = '<div class="text-xs text-slate-500 italic p-2 col-span-full">No successors yet</div>';

        const summaryCard = document.getElementById('solutionSummaryCard');
        if (summaryCard) summaryCard.classList.add('hidden');
        const pathContainer = document.getElementById('solutionPathSteps');
        if (pathContainer) pathContainer.innerHTML = '';
    }

    setSpeed(delayMs) {
        this.stepDelay = delayMs;
        const speedLabel = document.getElementById('speedLabel');
        if (speedLabel) speedLabel.textContent = `${delayMs}ms / step`;
    }

    updateControlButtons() {
        const btnRun = document.getElementById('btnRun');
        const btnPause = document.getElementById('btnPause');
        const btnResume = document.getElementById('btnResume');
        const btnNext = document.getElementById('btnNext');
        const btnPrev = document.getElementById('btnPrev');

        if (!btnRun) return;

        if (this.isRunning && !this.isPaused) {
            btnRun.classList.add('hidden');
            btnPause.classList.remove('hidden');
            btnResume.classList.add('hidden');
        } else if (this.isRunning && this.isPaused) {
            btnRun.classList.add('hidden');
            btnPause.classList.add('hidden');
            btnResume.classList.remove('hidden');
        } else {
            btnRun.classList.remove('hidden');
            btnPause.classList.add('hidden');
            btnResume.classList.add('hidden');
        }

        btnPrev.disabled = this.currentStepIdx <= 0;
        btnNext.disabled = false;
    }

    updateScrubber() {
        const scrubber = document.getElementById('stepScrubber');
        const scrubberLabel = document.getElementById('scrubberLabel');
        if (!scrubber) return;

        scrubber.max = Math.max(0, this.searchHistory.length - 1);
        scrubber.value = Math.max(0, this.currentStepIdx);

        if (scrubberLabel) {
            scrubberLabel.textContent = `Step: ${this.currentStepIdx + 1} / ${this.searchHistory.length}`;
        }
    }

    jumpToStep(stepIndex) {
        if (this.isRunning) this.pause();
        const idx = parseInt(stepIndex, 10);
        if (!isNaN(idx) && idx >= 0 && idx < this.searchHistory.length) {
            this.currentStepIdx = idx;
            this.renderHistoryStep(idx);
        }
    }
}

// Instantiate engine globally
window.visualizer = null;
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new VisualizerEngine();
});
