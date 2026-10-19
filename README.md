# AI-8Puzzle-Visualizer: Interactive 8-Puzzle Game & AI Solver

An interactive, responsive **8-Puzzle Game & AI State-Space Search Visualizer** built with vanilla HTML5, CSS3, Tailwind CSS, and ES6 JavaScript.

Features a full playable **Game Mode**, **Human vs AI Race Mode**, **Web Audio Synthesized Sound Effects**, **AI Hint Assistant**, and complete academic implementations of **BFS, DFS, DLS, IDDLS, GBFS, and A\*** search algorithms.

---

## 👨‍🎓 Student Details
- **Course Name:** Artificial Intelligence (CS401)
- **Assignment Title:** Interactive 8-Puzzle Problem Solver using AI Search Algorithms
- **Student Name:** Tanu
- **Assigned Algorithm:** Algorithm 6 - Greedy Best First Search / GBFS (Informed Search)
- **Registration Number:** 24BCB0061
- **GitHub Repository:** `https://github.com/tanu281223/AI-8Puzzle-Visualizer`
- **Live Demo (GitHub Pages):** `https://tanu281223.github.io/AI-8Puzzle-Visualizer`

---

## 🎮 Game & Aesthetic Features

1. **🎨 Aesthetic Color Themes & Ambient Aurora:**
   - Animated ambient aurora glowing mesh orbs floating smoothly in the background.
   - One-click Theme Switcher with 4 aesthetic palettes:
     - 🔮 **Cosmic Aurora** (Electric indigo, cyan & fuchsia)
     - 🍬 **Pastel Candy** (Playful bubblegum, lilac & pastel sky)
     - 🌿 **Emerald Forest** (Lush mint, forest green & warm gold)
     - 🌅 **Sunset Glow** (Vivid coral, rose & electric purple)
   - Tactile 3D tiles with click physics, glowing borders, and glossy highlights.

2. **⭐ In-Place Tile Stars & Live Progress:**
   - Tiles that land in their target goal slot glow emerald with a shiny golden star badge (`★`).
   - Real-time animated **Goal Progress Bar** showing percentage of tiles solved ($0\%$ to $100\%$).
   - Sweet high chime sound effect whenever a tile locks into place!

3. **🔥 Combo Streaks & Personal Records:**
   - Rapid moves trigger dynamic combo multipliers: `🔥 COMBO x2!`, `⚡ COMBO x3!`, `🌟 MEGA COMBO!`.
   - **Personal Best Tracker**: Automatically stores your fastest completion time and fewest moves per difficulty in `localStorage`.
   - Celebrates new personal records on the victory modal with confetti!

4. **🎯 Interactive Distance Badges (Heatmap Mode):**
   - Toggleable Manhattan distance badges on each tile ($h_i = 0$ checkmark, $1$ step, $2+$ steps) to intuitively teach heuristic distance.

5. **⚔️ Human vs GBFS AI Race Mode:**
   - Compete side-by-side against Tanu's assigned Greedy Best-First Search agent in real time.

6. **💡 Intelligent GBFS AI Hint Assistant:**
   - Press **"Get AI Hint"** (or press key `H`): computes the best greedy move using GBFS and highlights the recommended tile with a pulsing amber beacon.
   - **"AI Auto-Solve"**: The GBFS agent executes the greedy solution from your current state.

7. **🔊 Synthesized Web Audio Effects:**
   - Built-in sound effects generated using the browser's native `AudioContext` (zero audio asset downloads):
     - Crisp tile slide clicks.
     - Pleasant tile-lock chime.
     - Ascending combo streak arpeggios.
     - Victory fanfare.
     - Melodic chime for AI hints.
     - Multi-note victory fanfare.
     - Mute/unmute toggle.
5. **🏆 Victory Celebration:**
   - Dynamic HTML5 Canvas confetti explosion on solving.
   - 3-Star Rating based on player moves relative to optimal par score.

---

## 🤖 AI Search Algorithms Implemented

All algorithms are implemented from scratch in `js/algorithms.js` with both synchronous (benchmark) and generator (step-by-step animation) modes:

### Uninformed Search Algorithms:
- **Breadth-First Search (BFS):** FIFO Queue (`FastQueue`). Complete and optimal under uniform step cost ($O(b^d)$ time & space).
- **Depth-First Search (DFS):** LIFO Stack with cycle detection. Linear space $O(bm)$.
- **Depth-Limited Search (DLS):** Depth-bounded DFS with configurable limit $L$. Returns cutoff if depth limit is reached.
- **Iterative Deepening DFS (IDDLS):** Combines BFS optimality/completeness with DFS linear space $O(bd)$.

### Informed (Heuristic) Search Algorithms:
- **Greedy Best-First Search (GBFS):** Evaluates nodes using $f(n) = h(n)$ via Binary Min-Heap `PriorityQueue`.
- **A* Search (A\*):** Evaluates nodes using $f(n) = g(n) + h(n)$ via Binary Min-Heap `PriorityQueue`. Guaranteed optimal with admissible heuristics.

---

## 📐 Heuristics Used
1. **Misplaced Tiles ($h_1$):** Hamming distance metric. Admissible.
2. **Manhattan Distance ($h_2$):** Taxicab distance summation. Strictly dominates $h_1$. Admissible.
3. **Manhattan + Linear Conflict ($h_3$):** Adds penalty moves for tiles in their target row/col with inverted order. Strictly admissible.

---

## 🚀 How to Run the Project

### Option 1: Direct File Open (Zero Install)
Open `index.html` directly in any web browser.

### Option 2: Local HTTP Server
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

### Option 3: Deploy to GitHub Pages
1. Push this folder to a GitHub repository named `AI-8Puzzle-Visualizer`.
2. Go to **Settings** > **Pages** > select branch `main` > `/(root)` > Save.
3. The live game will be published at `https://<username>.github.io/AI-8Puzzle-Visualizer/`.

---

## 📂 Repository Structure

```
AI-8Puzzle-Visualizer/
├── index.html              # Main application with Game, Visualizer, Comparison, and Docs tabs
├── css/
│   └── style.css           # 3D tile animations, hint glow, confetti canvas, glassmorphism
├── js/
│   ├── sound.js            # Synthesized Web Audio API sound effects
│   ├── game.js             # Interactive Game engine, Human vs AI race, hints, confetti
│   ├── dataStructures.js   # PriorityQueue (min-heap), FastQueue, Stack
│   ├── heuristics.js       # Misplaced Tiles, Manhattan, Linear Conflict
│   ├── puzzle.js           # 3x3 board representation, solvability, presets
│   ├── algorithms.js       # BFS, DFS, DLS, IDDLS, GBFS, A* solvers & generators
│   ├── visualizer.js       # Search tree animation controller, metrics, timeline scrubber
│   ├── comparison.js       # Multi-algorithm benchmark runner & Canvas charts
│   └── app.js              # Application lifecycle, navigation, event bindings
├── assets/                 # Icons and media
├── images/                 # Screenshots and diagrams
├── docs/
│   ├── algorithm_analysis.md # Formal mathematical and theoretical analysis
│   └── project_report.md     # Full project report and rubric checklist
└── README.md               # Project documentation
```

---

## 📚 References
1. Russell, S. J., & Norvig, P. (2020). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.
2. Korf, R. E. (1985). "Depth-first iterative-deepening: An optimal admissible tree search." *Artificial Intelligence*, 27(1), 97-109.
3. Reinefeld, A. (1993). "Complete Solution of the Eight-Puzzle and the Benefit of Node Ordering in IDA*." *IJCAI*.
4. Hansson, O., Mayer, A., & Yung, M. (1992). "Criticizing Solutions to Relaxation Problems: Linear Conflict Heuristic." *Heuristics and Artificial Intelligence*.
