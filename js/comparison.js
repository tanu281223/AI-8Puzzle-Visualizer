/**
 * AI 8-Puzzle Visualizer - Comparison & Benchmark Module
 * Runs all six algorithms on the active puzzle and renders interactive comparison tables and HTML5 Canvas charts.
 */

const ComparisonModule = {
    results: [],

    benchmarkConfigs: [
        { id: 'GBFS_MANHATTAN', name: 'GBFS (Manhattan) [Tanu - Assigned]', algo: 'GBFS', heuristic: 'manhattan', optimal: 'No (Greedy)' },
        { id: 'GBFS_MISPLACED', name: 'GBFS (Misplaced Tiles)', algo: 'GBFS', heuristic: 'misplaced', optimal: 'No (Greedy)' },
        { id: 'ASTAR_MANHATTAN', name: 'A* (Manhattan Distance)', algo: 'A*', heuristic: 'manhattan', optimal: 'Yes (Optimal)' },
        { id: 'ASTAR_MISPLACED', name: 'A* (Misplaced Tiles)', algo: 'A*', heuristic: 'misplaced', optimal: 'Yes (Optimal)' },
        { id: 'ASTAR_LINEAR', name: 'A* (Linear Conflict)', algo: 'A*', heuristic: 'linear_conflict', optimal: 'Yes (Optimal)' },
        { id: 'BFS', name: 'BFS (Breadth-First)', algo: 'BFS', heuristic: null, optimal: 'Yes' },
        { id: 'UCS', name: 'UCS (Uniform Cost Search)', algo: 'UCS', heuristic: null, optimal: 'Yes' },
        { id: 'DFS', name: 'DFS (Depth-First)', algo: 'DFS', heuristic: null, optimal: 'No' },
        { id: 'DLS', name: 'DLS (Depth-Limited: 10)', algo: 'DLS', heuristic: null, depthLimit: 10, optimal: 'No' },
        { id: 'IDDLS', name: 'IDDLS (Iterative Deepening)', algo: 'IDDLS', heuristic: null, maxDepth: 20, optimal: 'Yes' },
        { id: 'GBFS_MANHATTAN', name: 'GBFS (Manhattan)', algo: 'GBFS', heuristic: 'manhattan', optimal: 'No' },
        { id: 'GBFS_MISPLACED', name: 'GBFS (Misplaced Tiles)', algo: 'GBFS', heuristic: 'misplaced', optimal: 'No' },

    ],

    getMemoryCategory(kb) {
        if (kb < 50) return { label: 'Low', class: 'text-emerald-400 bg-emerald-500/10' };
        if (kb < 500) return { label: 'Medium', class: 'text-amber-400 bg-amber-500/10' };
        return { label: 'High', class: 'text-rose-400 bg-rose-500/10' };
    },

    async runBenchmark(initialState, goalState) {
        const check = Puzzle.checkSolvability(initialState, goalState);
        if (!check.solvable) {
            alert("Cannot benchmark an unsolvable puzzle!\n" + check.reason);
            return;
        }

        const tableBody = document.getElementById('comparisonTableBody');
        const progressEl = document.getElementById('benchmarkProgress');
        const runBtn = document.getElementById('btnRunBenchmark');

        if (runBtn) runBtn.disabled = true;
        if (progressEl) {
            progressEl.classList.remove('hidden');
            progressEl.textContent = 'Running benchmarks...';
        }

        this.results = [];
        if (tableBody) tableBody.innerHTML = '';

        for (let i = 0; i < this.benchmarkConfigs.length; i++) {
            const config = this.benchmarkConfigs[i];
            if (progressEl) progressEl.textContent = `Evaluating ${config.name} (${i + 1}/${this.benchmarkConfigs.length})...`;

            // Allow UI to repaint
            await new Promise(r => setTimeout(r, 20));

            try {
                const options = {
                    heuristic: config.heuristic,
                    depthLimit: config.depthLimit || 12,
                    maxDepth: config.maxDepth || 22
                };

                const res = SearchAlgorithms.solve(config.algo, initialState, goalState, options);
                const memInfo = this.getMemoryCategory(res.memoryKB || 4);

                const item = {
                    config,
                    success: res.success,
                    nodesExpanded: res.nodesExpanded,
                    nodesGenerated: res.nodesGenerated,
                    moves: res.success ? res.pathCost : '-',
                    timeMs: res.executionTimeMs,
                    memoryKB: res.memoryKB || 4,
                    memoryCategory: memInfo.label,
                    memoryClass: memInfo.class,
                    optimal: config.optimal
                };

                this.results.push(item);
                this.appendTableRow(tableBody, item);
            } catch (err) {
                console.error("Error running " + config.name, err);
            }
        }

        if (progressEl) {
            progressEl.textContent = 'Benchmark completed successfully!';
            setTimeout(() => progressEl.classList.add('hidden'), 3000);
        }
        if (runBtn) runBtn.disabled = false;

        this.renderCharts();
    },

    appendTableRow(tbody, item) {
        if (!tbody) return;
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors text-sm';

        const statusBadge = item.success
            ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Yes</span>'
            : '<span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">No</span>';

        tr.innerHTML = `
            <td class="py-3 px-4 font-semibold text-slate-200">${item.config.name}</td>
            <td class="py-3 px-4 text-center">${statusBadge}</td>
            <td class="py-3 px-4 text-right font-mono text-blue-300 font-bold">${item.nodesExpanded.toLocaleString()}</td>
            <td class="py-3 px-4 text-right font-mono text-slate-400">${item.nodesGenerated.toLocaleString()}</td>
            <td class="py-3 px-4 text-right font-mono text-purple-300 font-bold">${item.moves}</td>
            <td class="py-3 px-4 text-right font-mono text-amber-300">${item.timeMs} ms</td>
            <td class="py-3 px-4 text-center">
                <span class="px-2 py-0.5 rounded text-xs font-mono ${item.memoryClass}">
                    ${item.memoryCategory} (${item.memoryKB} KB)
                </span>
            </td>
            <td class="py-3 px-4 text-center text-xs font-medium text-slate-300">${item.optimal}</td>
        `;
        tbody.appendChild(tr);
    },

    // =========================================================================
    // CANVAS CHART RENDERING (Zero-dependency modern charts)
    // =========================================================================

    renderCharts() {
        if (this.results.length === 0) return;

        // Chart 1: Nodes Expanded
        this.drawBarChart('chartNodesExpanded', {
            title: 'Search Efficiency: Nodes Expanded (Lower is Better)',
            labels: this.results.map(r => r.config.name.split(' ')[0] + (r.config.heuristic ? ` (${r.config.heuristic[0].toUpperCase()})` : '')),
            values: this.results.map(r => r.nodesExpanded),
            color: '#3b82f6',
            unit: ' nodes'
        });

        // Chart 2: Execution Time (ms)
        this.drawBarChart('chartExecutionTime', {
            title: 'Execution Time in Milliseconds (Lower is Better)',
            labels: this.results.map(r => r.config.name.split(' ')[0] + (r.config.heuristic ? ` (${r.config.heuristic[0].toUpperCase()})` : '')),
            values: this.results.map(r => r.timeMs),
            color: '#f59e0b',
            unit: ' ms'
        });

        // Chart 3: Solution Moves
        this.drawBarChart('chartSolutionMoves', {
            title: 'Solution Path Length: Number of Moves (Shortest is Optimal)',
            labels: this.results.map(r => r.config.name.split(' ')[0] + (r.config.heuristic ? ` (${r.config.heuristic[0].toUpperCase()})` : '')),
            values: this.results.map(r => (typeof r.moves === 'number' ? r.moves : 0)),
            color: '#8b5cf6',
            unit: ' moves'
        });
    },

    drawBarChart(canvasId, options) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Resize canvas for sharp rendering on retina/high-DPI screens
        const rect = canvas.getBoundingClientRect();
        const width = rect.width || 500;
        const height = 240;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 35, right: 25, bottom: 45, left: 55 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const maxVal = Math.max(1, ...options.values);
        const barCount = options.values.length;
        const barWidth = Math.max(12, Math.min(36, (chartWidth / barCount) * 0.65));
        const gap = (chartWidth - (barWidth * barCount)) / (barCount + 1);

        // Background gridlines
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';

        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const yVal = Math.round((maxVal / gridSteps) * i);
            const y = padding.top + chartHeight - ((yVal / maxVal) * chartHeight);

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();

            ctx.fillText(yVal.toLocaleString(), padding.left - 8, y + 3);
        }

        // Title
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.fillText(options.title, padding.left, 20);

        // Draw bars
        for (let i = 0; i < barCount; i++) {
            const val = options.values[i];
            const barH = (val / maxVal) * chartHeight;
            const x = padding.left + gap + i * (barWidth + gap);
            const y = padding.top + chartHeight - barH;

            // Bar gradient
            const grad = ctx.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, options.color);
            grad.addColorStop(1, options.color + '44');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
            ctx.fill();

            // Value label on top of bar
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            if (barH > 15) {
                ctx.fillText(val, x + barWidth / 2, y - 4);
            }

            // X-axis label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Inter, system-ui, sans-serif';
            ctx.save();
            ctx.translate(x + barWidth / 2, padding.top + chartHeight + 14);
            ctx.rotate(-Math.PI / 8);
            ctx.fillText(options.labels[i], 0, 0);
            ctx.restore();
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComparisonModule;
}
