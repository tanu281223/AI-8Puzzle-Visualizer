/**
 * AI 8-Puzzle Visualizer - Search Algorithms
 * Implements BFS, DFS, DLS, IDDLS, GBFS, and A* from scratch.
 * Provides both instant synchronous solving (for benchmarking) and generators (for step-by-step UI animation).
 */

const SearchAlgorithms = {
    reconstructPath(node) {
        const path = [];
        const actions = [];
        let curr = node;
        while (curr) {
            path.unshift(curr.state);
            if (curr.action) actions.unshift(curr.action);
            curr = curr.parent;
        }
        return { path, actions };
    },

    estimateMemoryKB(nodesGenerated, exploredSize) {
        const bytes = (nodesGenerated * 120) + (exploredSize * 64);
        return Math.max(4, Math.round(bytes / 1024));
    },

    
    solveUCS(initialState, goalState) {
        const startTime = performance.now();
        const initialKey = Puzzle.toKey(initialState);
        const goalKey = Puzzle.toKey(goalState);

        const pq = new PriorityQueue((a, b) => a.g - b.g);
        pq.enqueue({ state: initialState, parent: null, action: null, depth: 0, g: 0, h: 0, f: 0 });

        const bestG = new Map();
        bestG.set(initialKey, 0);

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!pq.isEmpty()) {
            const current = pq.dequeue();
            const currKey = Puzzle.toKey(current.state);

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                return {
                    success: true, path, actions, nodesGenerated, nodesExpanded, maxDepth, pathCost: actions.length,
                    executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(nodesGenerated, bestG.size)
                };
            }

            if (bestG.has(currKey) && current.g > bestG.get(currKey)) continue;

            nodesExpanded++;
            if (current.depth > maxDepth) maxDepth = current.depth;

            const successors = Puzzle.getSuccessors(current.state);
            for (const succ of successors) {
                const succKey = Puzzle.toKey(succ.state);
                const nextG = current.g + 1;
                nodesGenerated++;

                if (!bestG.has(succKey) || nextG < bestG.get(succKey)) {
                    bestG.set(succKey, nextG);
                    pq.enqueue({
                        state: succ.state, parent: current, action: succ.action,
                        depth: current.depth + 1, g: nextG, h: 0, f: nextG
                    });
                }
            }
        }

        return {
            success: false, path: [], actions: [], nodesGenerated, nodesExpanded, maxDepth, pathCost: 0,
            executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
            memoryKB: this.estimateMemoryKB(nodesGenerated, bestG.size)
        };
    },

    solveBFS(initialState, goalState) {
        const startTime = performance.now();
        const initialKey = Puzzle.toKey(initialState);
        const goalKey = Puzzle.toKey(goalState);

        if (initialKey === goalKey) {
            return {
                success: true, path: [initialState], actions: [],
                nodesGenerated: 1, nodesExpanded: 0, maxDepth: 0, pathCost: 0,
                executionTimeMs: Number((performance.now() - startTime).toFixed(2)), memoryKB: 4
            };
        }

        const queue = new FastQueue();
        const visited = new Set();
        queue.enqueue({ state: initialState, parent: null, action: null, depth: 0 });
        visited.add(initialKey);

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!queue.isEmpty()) {
            const current = queue.dequeue();
            nodesExpanded++;
            if (current.depth > maxDepth) maxDepth = current.depth;

            const successors = Puzzle.getSuccessors(current.state);
            for (const succ of successors) {
                const succKey = Puzzle.toKey(succ.state);
                nodesGenerated++;

                if (succKey === goalKey) {
                    const goalNode = { state: succ.state, parent: current, action: succ.action, depth: current.depth + 1 };
                    const { path, actions } = this.reconstructPath(goalNode);
                    return {
                        success: true, path, actions, nodesGenerated, nodesExpanded,
                        maxDepth: Math.max(maxDepth, goalNode.depth), pathCost: actions.length,
                        executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                        memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size)
                    };
                }

                if (!visited.has(succKey)) {
                    visited.add(succKey);
                    queue.enqueue({ state: succ.state, parent: current, action: succ.action, depth: current.depth + 1 });
                }
            }
        }

        return {
            success: false, path: [], actions: [], nodesGenerated, nodesExpanded, maxDepth, pathCost: 0,
            executionTimeMs: Number((performance.now() - startTime).toFixed(2)), memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size)
        };
    },

    solveDFS(initialState, goalState, depthLimit = 40) {
        const startTime = performance.now();
        const initialKey = Puzzle.toKey(initialState);
        const goalKey = Puzzle.toKey(goalState);

        if (initialKey === goalKey) {
            return {
                success: true, path: [initialState], actions: [],
                nodesGenerated: 1, nodesExpanded: 0, maxDepth: 0, pathCost: 0,
                executionTimeMs: Number((performance.now() - startTime).toFixed(2)), memoryKB: 4
            };
        }

        const stack = new Stack();
        const visited = new Map();
        stack.push({ state: initialState, parent: null, action: null, depth: 0 });
        visited.set(initialKey, 0);

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!stack.isEmpty()) {
            const current = stack.pop();
            const currKey = Puzzle.toKey(current.state);

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                return {
                    success: true, path, actions, nodesGenerated, nodesExpanded, maxDepth, pathCost: actions.length,
                    executionTimeMs: Number((performance.now() - startTime).toFixed(2)), memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size)
                };
            }

            nodesExpanded++;
            if (current.depth > maxDepth) maxDepth = current.depth;

            if (current.depth < depthLimit) {
                const successors = Puzzle.getSuccessors(current.state);
                for (let i = successors.length - 1; i >= 0; i--) {
                    const succ = successors[i];
                    const succKey = Puzzle.toKey(succ.state);
                    nodesGenerated++;
                    const nextDepth = current.depth + 1;
                    if (!visited.has(succKey) || visited.get(succKey) > nextDepth) {
                        visited.set(succKey, nextDepth);
                        stack.push({ state: succ.state, parent: current, action: succ.action, depth: nextDepth });
                    }
                }
            }
        }

        return {
            success: false, path: [], actions: [], nodesGenerated, nodesExpanded, maxDepth, pathCost: 0,
            executionTimeMs: Number((performance.now() - startTime).toFixed(2)), memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size),
            reason: "No solution found within depth limit " + depthLimit
        };
    },

    solveDLS(initialState, goalState, depthLimit = 10) {
        const startTime = performance.now();
        const goalKey = Puzzle.toKey(goalState);

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0, cutoffOccurred = false;
        const visitedPath = new Set();

        function recursiveDLS(node) {
            const currKey = Puzzle.toKey(node.state);
            if (node.depth > maxDepth) maxDepth = node.depth;

            if (currKey === goalKey) return { result: 'FOUND', node };
            if (node.depth >= depthLimit) {
                cutoffOccurred = true;
                return { result: 'CUTOFF' };
            }

            nodesExpanded++;
            visitedPath.add(currKey);

            let anyCutoff = false;
            const successors = Puzzle.getSuccessors(node.state);
            for (const succ of successors) {
                const succKey = Puzzle.toKey(succ.state);
                nodesGenerated++;
                if (!visitedPath.has(succKey)) {
                    const child = { state: succ.state, parent: node, action: succ.action, depth: node.depth + 1 };
                    const res = recursiveDLS(child);
                    if (res.result === 'FOUND') return res;
                    if (res.result === 'CUTOFF') anyCutoff = true;
                }
            }
            visitedPath.delete(currKey);
            return anyCutoff ? { result: 'CUTOFF' } : { result: 'FAILURE' };
        }

        const res = recursiveDLS({ state: initialState, parent: null, action: null, depth: 0 });
        if (res.result === 'FOUND') {
            const { path, actions } = this.reconstructPath(res.node);
            return {
                success: true, path, actions, nodesGenerated, nodesExpanded, maxDepth, pathCost: actions.length,
                executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                memoryKB: this.estimateMemoryKB(nodesGenerated, maxDepth + 10), cutoff: false
            };
        }

        return {
            success: false, path: [], actions: [], nodesGenerated, nodesExpanded, maxDepth, pathCost: 0,
            executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
            memoryKB: this.estimateMemoryKB(nodesGenerated, maxDepth + 10),
            cutoff: cutoffOccurred, reason: cutoffOccurred ? ("Cutoff at limit " + depthLimit) : "Search space exhausted"
        };
    },

    solveIDDLS(initialState, goalState, maxAllowedDepth = 25) {
        const startTime = performance.now();
        let totalNodesExpanded = 0, totalNodesGenerated = 0, globalMaxDepth = 0;

        for (let limit = 0; limit <= maxAllowedDepth; limit++) {
            const dlsResult = this.solveDLS(initialState, goalState, limit);
            totalNodesExpanded += dlsResult.nodesExpanded;
            totalNodesGenerated += dlsResult.nodesGenerated;
            if (dlsResult.maxDepth > globalMaxDepth) globalMaxDepth = dlsResult.maxDepth;

            if (dlsResult.success) {
                return {
                    success: true, path: dlsResult.path, actions: dlsResult.actions,
                    nodesGenerated: totalNodesGenerated, nodesExpanded: totalNodesExpanded,
                    maxDepth: globalMaxDepth, pathCost: dlsResult.actions.length,
                    executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(totalNodesGenerated, globalMaxDepth + 10),
                    depthFound: limit
                };
            }
            if (!dlsResult.cutoff) break;
        }

        return {
            success: false, path: [], actions: [], nodesGenerated: totalNodesGenerated, nodesExpanded: totalNodesExpanded,
            maxDepth: globalMaxDepth, pathCost: 0, executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
            memoryKB: this.estimateMemoryKB(totalNodesGenerated, globalMaxDepth + 10),
            reason: "Exceeded max depth " + maxAllowedDepth
        };
    },

    solveGBFS(initialState, goalState, heuristicType = 'manhattan') {
        const startTime = performance.now();
        const goalKey = Puzzle.toKey(goalState);
        const h0 = Heuristics.calculate(heuristicType, initialState, goalState);

        const pq = new PriorityQueue((a, b) => (a.f !== b.f ? a.f - b.f : a.h - b.h));
        pq.enqueue({ state: initialState, parent: null, action: null, depth: 0, g: 0, h: h0, f: h0 });

        const visited = new Set();
        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!pq.isEmpty()) {
            const current = pq.dequeue();
            const currKey = Puzzle.toKey(current.state);

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                return {
                    success: true, path, actions, nodesGenerated, nodesExpanded, maxDepth, pathCost: actions.length,
                    executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size), heuristic: heuristicType
                };
            }

            if (visited.has(currKey)) continue;
            visited.add(currKey);

            nodesExpanded++;
            if (current.depth > maxDepth) maxDepth = current.depth;

            const successors = Puzzle.getSuccessors(current.state);
            for (const succ of successors) {
                const succKey = Puzzle.toKey(succ.state);
                nodesGenerated++;

                if (!visited.has(succKey)) {
                    const h = Heuristics.calculate(heuristicType, succ.state, goalState);
                    pq.enqueue({
                        state: succ.state, parent: current, action: succ.action,
                        depth: current.depth + 1, g: current.g + 1, h, f: h
                    });
                }
            }
        }

        return {
            success: false, path: [], actions: [], nodesGenerated, nodesExpanded, maxDepth, pathCost: 0,
            executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
            memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size), heuristic: heuristicType
        };
    },

    solveAStar(initialState, goalState, heuristicType = 'manhattan') {
        const startTime = performance.now();
        const initialKey = Puzzle.toKey(initialState);
        const goalKey = Puzzle.toKey(goalState);
        const h0 = Heuristics.calculate(heuristicType, initialState, goalState);

        const pq = new PriorityQueue((a, b) => (a.f !== b.f ? a.f - b.f : a.h - b.h));
        pq.enqueue({ state: initialState, parent: null, action: null, depth: 0, g: 0, h: h0, f: h0 });

        const bestG = new Map();
        bestG.set(initialKey, 0);

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!pq.isEmpty()) {
            const current = pq.dequeue();
            const currKey = Puzzle.toKey(current.state);

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                return {
                    success: true, path, actions, nodesGenerated, nodesExpanded, maxDepth, pathCost: actions.length,
                    executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(nodesGenerated, bestG.size), heuristic: heuristicType
                };
            }

            if (bestG.has(currKey) && current.g > bestG.get(currKey)) continue;

            nodesExpanded++;
            if (current.depth > maxDepth) maxDepth = current.depth;

            const successors = Puzzle.getSuccessors(current.state);
            for (const succ of successors) {
                const succKey = Puzzle.toKey(succ.state);
                const nextG = current.g + 1;
                nodesGenerated++;

                if (!bestG.has(succKey) || nextG < bestG.get(succKey)) {
                    bestG.set(succKey, nextG);
                    const h = Heuristics.calculate(heuristicType, succ.state, goalState);
                    pq.enqueue({
                        state: succ.state, parent: current, action: succ.action,
                        depth: current.depth + 1, g: nextG, h, f: nextG + h
                    });
                }
            }
        }

        return {
            success: false, path: [], actions: [], nodesGenerated, nodesExpanded, maxDepth, pathCost: 0,
            executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
            memoryKB: this.estimateMemoryKB(nodesGenerated, bestG.size), heuristic: heuristicType
        };
    },

    solve(algorithm, initialState, goalState, options = {}) {
        switch (algorithm) {
            case 'UCS': return this.solveUCS(initialState, goalState);
            case 'BFS': return this.solveBFS(initialState, goalState);
            case 'DFS': return this.solveDFS(initialState, goalState, options.depthLimit || 40);
            case 'DLS': return this.solveDLS(initialState, goalState, options.depthLimit || 10);
            case 'IDDLS': return this.solveIDDLS(initialState, goalState, options.maxDepth || 25);
            case 'GBFS': return this.solveGBFS(initialState, goalState, options.heuristic || 'manhattan');
            case 'A*':
            case 'ASTAR': return this.solveAStar(initialState, goalState, options.heuristic || 'manhattan');
            default: throw new Error('Unknown algorithm: ' + algorithm);
        }
    },

    *stepBFS(initialState, goalState) {
        const startTime = performance.now();
        const initialKey = Puzzle.toKey(initialState);
        const goalKey = Puzzle.toKey(goalState);

        const queue = new FastQueue();
        const visited = new Set();
        queue.enqueue({ state: initialState, parent: null, action: null, depth: 0, g: 0, h: 0, f: 0 });
        visited.add(initialKey);

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!queue.isEmpty()) {
            const current = queue.dequeue();
            const currKey = Puzzle.toKey(current.state);
            if (current.depth > maxDepth) maxDepth = current.depth;

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                yield {
                    type: 'SUCCESS', node: current, path, actions, nodesGenerated, nodesExpanded, maxDepth,
                    pathCost: actions.length, executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size)
                };
                return;
            }

            nodesExpanded++;
            const successors = Puzzle.getSuccessors(current.state);
            const enriched = [];

            for (const succ of successors) {
                const succKey = Puzzle.toKey(succ.state);
                nodesGenerated++;
                const isVisited = visited.has(succKey);
                enriched.push({ state: succ.state, action: succ.action, tileMoved: succ.tileMoved, g: current.g + 1, h: 0, f: current.g + 1, isVisited });

                if (!isVisited) {
                    visited.add(succKey);
                    queue.enqueue({ state: succ.state, parent: current, action: succ.action, depth: current.depth + 1, g: current.g + 1, h: 0, f: current.g + 1 });
                }
            }

            yield {
                type: 'STEP', currentNode: current, nodesGenerated, nodesExpanded,
                frontierSize: queue.size(), frontierPreview: queue.toArray().slice(0, 8),
                exploredSize: visited.size, currentDepth: current.depth, maxDepth, successors: enriched
            };
        }

        yield { type: 'FAILURE', nodesGenerated, nodesExpanded, maxDepth, reason: 'Frontier is empty.' };
    },

    *stepAStar(initialState, goalState, heuristicType = 'manhattan') {
        const startTime = performance.now();
        const initialKey = Puzzle.toKey(initialState);
        const goalKey = Puzzle.toKey(goalState);
        const h0 = Heuristics.calculate(heuristicType, initialState, goalState);

        const pq = new PriorityQueue((a, b) => (a.f !== b.f ? a.f - b.f : a.h - b.h));
        pq.enqueue({ state: initialState, parent: null, action: null, depth: 0, g: 0, h: h0, f: h0 });

        const bestG = new Map();
        bestG.set(initialKey, 0);

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!pq.isEmpty()) {
            const current = pq.dequeue();
            const currKey = Puzzle.toKey(current.state);
            if (current.depth > maxDepth) maxDepth = current.depth;

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                yield {
                    type: 'SUCCESS', node: current, path, actions, nodesGenerated, nodesExpanded, maxDepth,
                    pathCost: actions.length, executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(nodesGenerated, bestG.size)
                };
                return;
            }

            if (bestG.has(currKey) && current.g > bestG.get(currKey)) continue;

            nodesExpanded++;
            const successors = Puzzle.getSuccessors(current.state);
            const enriched = [];

            for (const succ of successors) {
                const succKey = Puzzle.toKey(succ.state);
                const nextG = current.g + 1;
                nodesGenerated++;
                const h = Heuristics.calculate(heuristicType, succ.state, goalState);
                const f = nextG + h;
                const isBetter = !bestG.has(succKey) || nextG < bestG.get(succKey);

                enriched.push({ state: succ.state, action: succ.action, tileMoved: succ.tileMoved, g: nextG, h, f, isBetter });

                if (isBetter) {
                    bestG.set(succKey, nextG);
                    pq.enqueue({ state: succ.state, parent: current, action: succ.action, depth: current.depth + 1, g: nextG, h, f });
                }
            }

            yield {
                type: 'STEP', currentNode: current, nodesGenerated, nodesExpanded,
                frontierSize: pq.size(), frontierPreview: pq.toArray().slice(0, 8),
                exploredSize: bestG.size, currentDepth: current.depth, maxDepth, successors: enriched
            };
        }

        yield { type: 'FAILURE', nodesGenerated, nodesExpanded, maxDepth, reason: 'Frontier is empty.' };
    },

    *stepGBFS(initialState, goalState, heuristicType = 'manhattan') {
        const startTime = performance.now();
        const goalKey = Puzzle.toKey(goalState);
        const h0 = Heuristics.calculate(heuristicType, initialState, goalState);

        const pq = new PriorityQueue((a, b) => (a.f !== b.f ? a.f - b.f : a.h - b.h));
        pq.enqueue({ state: initialState, parent: null, action: null, depth: 0, g: 0, h: h0, f: h0 });

        const visited = new Set();
        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!pq.isEmpty()) {
            const current = pq.dequeue();
            const currKey = Puzzle.toKey(current.state);
            if (current.depth > maxDepth) maxDepth = current.depth;

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                yield {
                    type: 'SUCCESS', node: current, path, actions, nodesGenerated, nodesExpanded, maxDepth,
                    pathCost: actions.length, executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size)
                };
                return;
            }

            if (visited.has(currKey)) continue;
            visited.add(currKey);

            nodesExpanded++;
            const successors = Puzzle.getSuccessors(current.state);
            const enriched = [];

            for (const succ of successors) {
                const succKey = Puzzle.toKey(succ.state);
                nodesGenerated++;
                const h = Heuristics.calculate(heuristicType, succ.state, goalState);
                const isVisited = visited.has(succKey);
                enriched.push({ state: succ.state, action: succ.action, tileMoved: succ.tileMoved, g: current.g + 1, h, f: h, isVisited });

                if (!isVisited) {
                    pq.enqueue({ state: succ.state, parent: current, action: succ.action, depth: current.depth + 1, g: current.g + 1, h, f: h });
                }
            }

            yield {
                type: 'STEP', currentNode: current, nodesGenerated, nodesExpanded,
                frontierSize: pq.size(), frontierPreview: pq.toArray().slice(0, 8),
                exploredSize: visited.size, currentDepth: current.depth, maxDepth, successors: enriched
            };
        }

        yield { type: 'FAILURE', nodesGenerated, nodesExpanded, maxDepth, reason: 'Frontier is empty.' };
    },

    *stepDFS(initialState, goalState, depthLimit = 40) {
        const startTime = performance.now();
        const goalKey = Puzzle.toKey(goalState);
        const stack = new Stack();
        const visited = new Map();
        stack.push({ state: initialState, parent: null, action: null, depth: 0, g: 0, h: 0, f: 0 });
        visited.set(Puzzle.toKey(initialState), 0);

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0;

        while (!stack.isEmpty()) {
            const current = stack.pop();
            const currKey = Puzzle.toKey(current.state);
            if (current.depth > maxDepth) maxDepth = current.depth;

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                yield {
                    type: 'SUCCESS', node: current, path, actions, nodesGenerated, nodesExpanded, maxDepth,
                    pathCost: actions.length, executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(nodesGenerated, visited.size)
                };
                return;
            }

            nodesExpanded++;
            const successors = Puzzle.getSuccessors(current.state);
            const enriched = [];

            if (current.depth < depthLimit) {
                for (let i = successors.length - 1; i >= 0; i--) {
                    const succ = successors[i];
                    const succKey = Puzzle.toKey(succ.state);
                    nodesGenerated++;
                    const nextDepth = current.depth + 1;
                    const willPush = !visited.has(succKey) || visited.get(succKey) > nextDepth;

                    enriched.push({ state: succ.state, action: succ.action, tileMoved: succ.tileMoved, g: nextDepth, h: 0, f: nextDepth, willPush });
                    if (willPush) {
                        visited.set(succKey, nextDepth);
                        stack.push({ state: succ.state, parent: current, action: succ.action, depth: nextDepth, g: nextDepth, h: 0, f: nextDepth });
                    }
                }
            }

            yield {
                type: 'STEP', currentNode: current, nodesGenerated, nodesExpanded,
                frontierSize: stack.size(), frontierPreview: stack.toArray().slice(-8).reverse(),
                exploredSize: visited.size, currentDepth: current.depth, maxDepth, successors: enriched
            };
        }

        yield { type: 'FAILURE', nodesGenerated, nodesExpanded, maxDepth, reason: 'Stack exhausted. Depth limit: ' + depthLimit };
    },

    *stepDLS(initialState, goalState, depthLimit = 10) {
        const startTime = performance.now();
        const goalKey = Puzzle.toKey(goalState);
        const stack = new Stack();
        stack.push({ state: initialState, parent: null, action: null, depth: 0, g: 0, h: 0, f: 0 });

        let nodesExpanded = 0, nodesGenerated = 1, maxDepth = 0, cutoff = false;

        while (!stack.isEmpty()) {
            const current = stack.pop();
            const currKey = Puzzle.toKey(current.state);
            if (current.depth > maxDepth) maxDepth = current.depth;

            if (currKey === goalKey) {
                const { path, actions } = this.reconstructPath(current);
                yield {
                    type: 'SUCCESS', node: current, path, actions, nodesGenerated, nodesExpanded, maxDepth,
                    pathCost: actions.length, executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
                    memoryKB: this.estimateMemoryKB(nodesGenerated, maxDepth + 10)
                };
                return;
            }

            if (current.depth >= depthLimit) {
                cutoff = true;
                yield {
                    type: 'STEP', currentNode: current, nodesGenerated, nodesExpanded,
                    frontierSize: stack.size(), frontierPreview: stack.toArray().slice(-8).reverse(),
                    exploredSize: nodesExpanded, currentDepth: current.depth, maxDepth, successors: [],
                    note: 'Cutoff at limit ' + depthLimit
                };
                continue;
            }

            nodesExpanded++;
            const successors = Puzzle.getSuccessors(current.state);
            const enriched = [];

            for (let i = successors.length - 1; i >= 0; i--) {
                const succ = successors[i];
                const succKey = Puzzle.toKey(succ.state);
                nodesGenerated++;

                let isCycle = false;
                let p = current;
                while (p) {
                    if (Puzzle.toKey(p.state) === succKey) { isCycle = true; break; }
                    p = p.parent;
                }

                enriched.push({ state: succ.state, action: succ.action, tileMoved: succ.tileMoved, g: current.g + 1, h: 0, f: current.g + 1, isCycle });
                if (!isCycle) {
                    stack.push({ state: succ.state, parent: current, action: succ.action, depth: current.depth + 1, g: current.g + 1, h: 0, f: current.g + 1 });
                }
            }

            yield {
                type: 'STEP', currentNode: current, nodesGenerated, nodesExpanded,
                frontierSize: stack.size(), frontierPreview: stack.toArray().slice(-8).reverse(),
                exploredSize: nodesExpanded, currentDepth: current.depth, maxDepth, successors: enriched
            };
        }

        yield { type: 'FAILURE', nodesGenerated, nodesExpanded, maxDepth, cutoff, reason: cutoff ? 'Cutoff at depth ' + depthLimit : 'Search exhausted.' };
    },

    *stepIDDLS(initialState, goalState, maxAllowedDepth = 25) {
        const startTime = performance.now();
        let totalNodesExpanded = 0, totalNodesGenerated = 0, globalMaxDepth = 0;

        for (let limit = 0; limit <= maxAllowedDepth; limit++) {
            const dlsGen = this.stepDLS(initialState, goalState, limit);
            let lastResult = null;

            for (const step of dlsGen) {
                if (step.type === 'STEP') {
                    yield {
                        ...step,
                        iddlsLimit: limit,
                        totalNodesGenerated: totalNodesGenerated + step.nodesGenerated,
                        totalNodesExpanded: totalNodesExpanded + step.nodesExpanded
                    };
                } else {
                    lastResult = step;
                }
            }

            if (lastResult) {
                totalNodesExpanded += lastResult.nodesExpanded;
                totalNodesGenerated += lastResult.nodesGenerated;
                if (lastResult.maxDepth > globalMaxDepth) globalMaxDepth = lastResult.maxDepth;

                if (lastResult.type === 'SUCCESS') {
                    yield {
                        ...lastResult,
                        nodesGenerated: totalNodesGenerated,
                        nodesExpanded: totalNodesExpanded,
                        maxDepth: globalMaxDepth,
                        depthFound: limit,
                        executionTimeMs: Number((performance.now() - startTime).toFixed(2))
                    };
                    return;
                }
                if (!lastResult.cutoff) break;
            }
        }

        yield { type: 'FAILURE', nodesGenerated: totalNodesGenerated, nodesExpanded: totalNodesExpanded, maxDepth: globalMaxDepth, reason: 'Exceeded max limit ' + maxAllowedDepth };
    },

    getStepGenerator(algorithm, initialState, goalState, options = {}) {
        switch (algorithm) {
            case 'BFS': return this.stepBFS(initialState, goalState);
            case 'DFS': return this.stepDFS(initialState, goalState, options.depthLimit || 40);
            case 'DLS': return this.stepDLS(initialState, goalState, options.depthLimit || 10);
            case 'IDDLS': return this.stepIDDLS(initialState, goalState, options.maxDepth || 25);
            case 'GBFS': return this.stepGBFS(initialState, goalState, options.heuristic || 'manhattan');
            case 'A*':
            case 'ASTAR': return this.stepAStar(initialState, goalState, options.heuristic || 'manhattan');
            default: throw new Error('Unknown algorithm: ' + algorithm);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchAlgorithms;
}
