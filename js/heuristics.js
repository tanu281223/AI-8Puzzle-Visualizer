/**
 * AI 8-Puzzle Visualizer - Heuristic Functions
 * Implements Misplaced Tiles (Hamming), Manhattan Distance (Taxicab), and Linear Conflict.
 */

const Heuristics = {
    /**
     * Cache coordinate mappings for goal state to allow O(1) coordinate lookups.
     */
    _goalCoordCache: new Map(),

    getGoalCoords(goalState) {
        const key = goalState.join(',');
        if (this._goalCoordCache.has(key)) {
            return this._goalCoordCache.get(key);
        }

        const coords = new Array(9);
        for (let i = 0; i < 9; i++) {
            const tile = goalState[i];
            coords[tile] = { row: Math.floor(i / 3), col: i % 3 };
        }
        this._goalCoordCache.set(key, coords);
        return coords;
    },

    /**
     * Misplaced Tiles (Hamming Distance)
     * Counts how many non-blank tiles (1-8) are not in their goal position.
     * @param {number[]} state - 9-element array
     * @param {number[]} goalState - 9-element array
     * @returns {number}
     */
    misplacedTiles(state, goalState) {
        let count = 0;
        for (let i = 0; i < 9; i++) {
            const val = state[i];
            if (val !== 0 && val !== goalState[i]) {
                count++;
            }
        }
        return count;
    },

    /**
     * Manhattan Distance (Taxicab Metric)
     * Sum of vertical and horizontal distances of each tile from its goal position.
     * @param {number[]} state - 9-element array
     * @param {number[]} goalState - 9-element array
     * @returns {number}
     */
    manhattanDistance(state, goalState) {
        const goalCoords = this.getGoalCoords(goalState);
        let distance = 0;

        for (let i = 0; i < 9; i++) {
            const val = state[i];
            if (val !== 0) {
                const curRow = Math.floor(i / 3);
                const curCol = i % 3;
                const target = goalCoords[val];
                distance += Math.abs(curRow - target.row) + Math.abs(curCol - target.col);
            }
        }
        return distance;
    },

    /**
     * Linear Conflict Heuristic (Enhanced Manhattan)
     * Adds 2 moves for every pair of tiles that are in their goal row or column,
     * but are in inverted order relative to each other (necessitating one to move out of the way).
     * Strictly admissible and dominates standard Manhattan.
     * @param {number[]} state - 9-element array
     * @param {number[]} goalState - 9-element array
     * @returns {number}
     */
    linearConflict(state, goalState) {
        let manhattan = this.manhattanDistance(state, goalState);
        const goalCoords = this.getGoalCoords(goalState);
        let conflicts = 0;

        // Check row conflicts
        for (let row = 0; row < 3; row++) {
            for (let c1 = 0; c1 < 2; c1++) {
                const idx1 = row * 3 + c1;
                const t1 = state[idx1];
                if (t1 === 0) continue;
                const target1 = goalCoords[t1];
                if (target1.row !== row) continue;

                for (let c2 = c1 + 1; c2 < 3; c2++) {
                    const idx2 = row * 3 + c2;
                    const t2 = state[idx2];
                    if (t2 === 0) continue;
                    const target2 = goalCoords[t2];
                    if (target2.row !== row) continue;

                    // If t1 is to the left of t2, but t1's goal is to the right of t2's goal
                    if (target1.col > target2.col) {
                        conflicts += 2;
                    }
                }
            }
        }

        // Check column conflicts
        for (let col = 0; col < 3; col++) {
            for (let r1 = 0; r1 < 2; r1++) {
                const idx1 = r1 * 3 + col;
                const t1 = state[idx1];
                if (t1 === 0) continue;
                const target1 = goalCoords[t1];
                if (target1.col !== col) continue;

                for (let r2 = r1 + 1; r2 < 3; r2++) {
                    const idx2 = r2 * 3 + col;
                    const t2 = state[idx2];
                    if (t2 === 0) continue;
                    const target2 = goalCoords[t2];
                    if (target2.col !== col) continue;

                    // If t1 is above t2, but t1's goal is below t2's goal
                    if (target1.row > target2.row) {
                        conflicts += 2;
                    }
                }
            }
        }

        return manhattan + conflicts;
    },

    /**
     * Compute heuristic based on key
     * @param {string} heuristicKey - 'manhattan', 'misplaced', or 'linear_conflict'
     * @param {number[]} state
     * @param {number[]} goalState
     * @returns {number}
     */
    calculate(heuristicKey, state, goalState) {
        switch (heuristicKey) {
            case 'misplaced':
                return this.misplacedTiles(state, goalState);
            case 'linear_conflict':
                return this.linearConflict(state, goalState);
            case 'manhattan':
            default:
                return this.manhattanDistance(state, goalState);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Heuristics;
}
