/**
 * AI 8-Puzzle Visualizer - Puzzle Model and State Operations
 * Handles 3x3 board representation, inversions, solvability, successor generation, and presets.
 */

const Puzzle = {
    // Default Goal States
    STANDARD_GOAL: [1, 2, 3, 8, 0, 4, 7, 6, 5],      // From assignment problem statement
    CLASSIC_GOAL: [1, 2, 3, 4, 5, 6, 7, 8, 0],       // Conventional reading order goal
    DEFAULT_INITIAL: [2, 8, 3, 1, 6, 4, 7, 0, 5],    // Assignment example initial state

    PRESETS: [
        {
            name: "Assignment Example (5 Moves)",
            initial: [2, 8, 3, 1, 6, 4, 7, 0, 5],
            goal: [1, 2, 3, 8, 0, 4, 7, 6, 5],
            difficulty: "Easy"
        },
        {
            name: "Easy (3 Moves)",
            initial: [1, 2, 3, 8, 4, 0, 7, 6, 5],
            goal: [1, 2, 3, 8, 0, 4, 7, 6, 5],
            difficulty: "Very Easy"
        },
        {
            name: "Medium (8 Moves)",
            initial: [2, 1, 3, 8, 0, 4, 7, 6, 5],
            goal: [1, 2, 3, 8, 0, 4, 7, 6, 5],
            difficulty: "Medium"
        },
        {
            name: "Challenging (14 Moves)",
            initial: [2, 8, 1, 0, 4, 3, 7, 6, 5],
            goal: [1, 2, 3, 8, 0, 4, 7, 6, 5],
            difficulty: "Hard"
        },
        {
            name: "Classic Goal (6 Moves)",
            initial: [1, 2, 3, 4, 0, 5, 7, 8, 6],
            goal: [1, 2, 3, 4, 5, 6, 7, 8, 0],
            difficulty: "Easy"
        },
        {
            name: "Classic Medium (12 Moves)",
            initial: [1, 2, 3, 5, 0, 6, 4, 7, 8],
            goal: [1, 2, 3, 4, 5, 6, 7, 8, 0],
            difficulty: "Medium"
        },
        {
            name: "Classic Hard (20 Moves)",
            initial: [8, 6, 7, 2, 5, 4, 3, 0, 1],
            goal: [1, 2, 3, 4, 5, 6, 7, 8, 0],
            difficulty: "Hard"
        },
        {
            name: "Unsolvable Demonstration",
            initial: [1, 2, 3, 8, 0, 4, 7, 5, 6],
            goal: [1, 2, 3, 8, 0, 4, 7, 6, 5],
            difficulty: "Unsolvable"
        }
    ],

    countInversions(state) {
        let inversions = 0;
        const nonZeroTiles = state.filter(x => x !== 0);
        for (let i = 0; i < nonZeroTiles.length - 1; i++) {
            for (let j = i + 1; j < nonZeroTiles.length; j++) {
                if (nonZeroTiles[i] > nonZeroTiles[j]) {
                    inversions++;
                }
            }
        }
        return inversions;
    },

    checkSolvability(initial, goal) {
        const initInv = this.countInversions(initial);
        const goalInv = this.countInversions(goal);
        const isSolvable = (initInv % 2) === (goalInv % 2);

        return {
            solvable: isSolvable,
            initialInversions: initInv,
            goalInversions: goalInv,
            reason: isSolvable
                ? ("Solvable: Initial state inversions (" + initInv + ") and Goal state inversions (" + goalInv + ") have the same parity (" + (initInv % 2 === 0 ? "even" : "odd") + ").")
                : ("Unsolvable: Initial state inversions (" + initInv + ", " + (initInv % 2 === 0 ? "even" : "odd") + ") and Goal state inversions (" + goalInv + ", " + (goalInv % 2 === 0 ? "even" : "odd") + ") have different parities. No sequence of legal moves can bridge this parity gap.")
        };
    },

    validateState(state) {
        if (!Array.isArray(state) || state.length !== 9) {
            return { valid: false, error: "Board must contain exactly 9 values." };
        }
        const counts = new Array(9).fill(0);
        for (const num of state) {
            if (!Number.isInteger(num) || num < 0 || num > 8) {
                return { valid: false, error: "Invalid tile value: " + num + ". Must be between 0 and 8." };
            }
            counts[num]++;
        }
        for (let i = 0; i < 9; i++) {
            if (counts[i] !== 1) {
                return { valid: false, error: "Tile " + i + " appears " + counts[i] + " times. Each tile (0-8) must appear once." };
            }
        }
        return { valid: true };
    },

    getBlankIndex(state) {
        return state.indexOf(0);
    },

    getSuccessors(state) {
        const blankIdx = this.getBlankIndex(state);
        const row = Math.floor(blankIdx / 3);
        const col = blankIdx % 3;
        const successors = [];

        // Move blank UP (tile above slides DOWN)
        if (row > 0) {
            const targetIdx = blankIdx - 3;
            const nextState = [...state];
            nextState[blankIdx] = nextState[targetIdx];
            nextState[targetIdx] = 0;
            successors.push({ action: 'UP', state: nextState, tileMoved: state[targetIdx] });
        }

        // Move blank DOWN (tile below slides UP)
        if (row < 2) {
            const targetIdx = blankIdx + 3;
            const nextState = [...state];
            nextState[blankIdx] = nextState[targetIdx];
            nextState[targetIdx] = 0;
            successors.push({ action: 'DOWN', state: nextState, tileMoved: state[targetIdx] });
        }

        // Move blank LEFT (tile to left slides RIGHT)
        if (col > 0) {
            const targetIdx = blankIdx - 1;
            const nextState = [...state];
            nextState[blankIdx] = nextState[targetIdx];
            nextState[targetIdx] = 0;
            successors.push({ action: 'LEFT', state: nextState, tileMoved: state[targetIdx] });
        }

        // Move blank RIGHT (tile to right slides LEFT)
        if (col < 2) {
            const targetIdx = blankIdx + 1;
            const nextState = [...state];
            nextState[blankIdx] = nextState[targetIdx];
            nextState[targetIdx] = 0;
            successors.push({ action: 'RIGHT', state: nextState, tileMoved: state[targetIdx] });
        }

        return successors;
    },

    generateRandomSolvable(goalState, numMoves = 25) {
        let current = [...goalState];
        let lastAction = null;
        const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

        for (let i = 0; i < numMoves; i++) {
            const successors = this.getSuccessors(current);
            const filtered = successors.filter(s => s.action !== opposite[lastAction]);
            const choices = filtered.length > 0 ? filtered : successors;
            const pick = choices[Math.floor(Math.random() * choices.length)];
            current = pick.state;
            lastAction = pick.action;
        }

        if (this.areEqual(current, goalState)) {
            const succ = this.getSuccessors(current);
            current = succ[0].state;
        }

        return current;
    },

    areEqual(a, b) {
        for (let i = 0; i < 9; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    },

    toKey(state) {
        return state.join('');
    },

    parseStateString(text) {
        const cleaned = text.replace(/_/g, '0').replace(/[^0-9]/g, ' ').trim().split(/\s+/);
        if (cleaned.length !== 9) return null;
        const nums = cleaned.map(Number);
        const check = this.validateState(nums);
        return check.valid ? nums : null;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Puzzle;
}
