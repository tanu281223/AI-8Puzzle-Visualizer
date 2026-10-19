# Algorithmic Analysis: 8-Puzzle Problem Solver

**Student:** Tanu | **Registration Number:** 24BCB0061 | **Assigned Algorithm:** Algorithm 6 - Greedy Best-First Search (GBFS)  
**Course:** Artificial Intelligence (CS401)

---

## 1. Problem Formulation in AI Search

The 8-Puzzle is framed as a classical state-space search problem defined by the tuple $\langle S_0, A, T, G, c \rangle$:
- **State Space ($S$)**: All possible configurations of 8 numbered tiles $\{1, 2, \dots, 8\}$ and 1 blank space $\{0\}$ on a $3 \times 3$ grid. Total states = $9! / 2 = 181,440$ reachable states for any solvable partition.
- **Initial State ($S_0$)**: An arbitrary starting configuration.
- **Actions ($A$)**: Legal transitions corresponding to sliding the blank tile $\{\text{UP}, \text{DOWN}, \text{LEFT}, \text{RIGHT}\}$.
- **Transition Model ($T(s, a)$)**: Returns the resulting board state after moving tile into the blank slot.
- **Goal Test ($G(s)$)**: Verifies whether the current state matches the target configuration.
- **Step Cost ($c(s, a, s')$)**: Unit cost ($c = 1$) per slide move.

---

## 2. Inversion Parity & Solvability Theorem

### Theorem
An initial state $S_{init}$ can reach a goal state $S_{goal}$ in the 8-puzzle if and only if:
$$\text{Inversions}(S_{init}) \equiv \text{Inversions}(S_{goal}) \pmod 2$$

### Proof Sketch
1. A horizontal move slides a tile within the same row, leaving the row-major ordering unchanged. Hence, $\Delta \text{Inversions} = 0$.
2. A vertical move shifts a tile over two intervening tiles in the array representation. This changes the relative ordering of exactly two pairs of tiles.
3. The change in the number of inversions $\Delta \text{Inversions} \in \{-2, 0, +2\}$.
4. Therefore, the parity of the inversion count is invariant under any legal move. The state space is bifurcated into two mutually unreachable equivalence classes of $181,440$ states each.

---

## 3. Heuristic Functions

### 3.1 Misplaced Tiles ($h_1$) - Hamming Metric
$$h_1(n) = \sum_{i=1}^{8} [\text{current\_pos}(i) \neq \text{goal\_pos}(i)]$$
- **Admissibility**: Every misplaced tile must move at least once to reach its goal position. Hence $h_1(n) \le h^*(n)$.
- **Consistency**: Moving one tile can reduce $h_1$ by at most 1, so $h_1(n) \le c(n, a, n') + h_1(n')$.

### 3.2 Manhattan Distance ($h_2$) - Taxicab Metric
$$h_2(n) = \sum_{i=1}^{8} \left(|r_i - r_i^*| + |c_i - c_i^*|\right)$$
- **Admissibility**: Tiles can only move horizontally and vertically through empty slots. Ignoring collisions yields the minimum possible distance. Hence $h_2(n) \le h^*(n)$.
- **Dominance**: For all states $n$, $h_2(n) \ge h_1(n)$. Therefore, A* with $h_2$ will expand fewer or equal nodes compared to $h_1$.

### 3.3 Manhattan with Linear Conflict ($h_3$)
A linear conflict occurs when two tiles $t_j$ and $t_k$ are in the same row (or column) as their goal positions, but their relative order is reversed. To resolve the conflict, at least one tile must temporarily move out of that line, adding at least 2 moves:
$$h_3(n) = h_2(n) + 2 \times \text{LinearConflicts}(n)$$
- **Admissibility**: Strictly admissible; $h_3(n) \ge h_2(n) \ge h_1(n)$.

---

## 4. Search Algorithms Evaluation Matrix

| Algorithm | Type | Data Structure | Time Complexity | Space Complexity | Complete? | Optimal? |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **BFS** | Uninformed | FIFO Queue | $O(b^d)$ | $O(b^d)$ | Yes | Yes (unit cost) |
| **DFS** | Uninformed | LIFO Stack | $O(b^m)$ | $O(bm)$ | No (cycles/infinite) | No |
| **DLS** | Uninformed | LIFO Stack | $O(b^L)$ | $O(bL)$ | If $d \le L$ | No |
| **IDDLS** | Uninformed | Iterative Stack | $O(b^d)$ | $O(bd)$ | Yes | Yes (unit cost) |
| **GBFS** | Informed | Priority Queue ($f=h$) | $O(b^m)$ worst | $O(b^m)$ | No (in infinite) | No |
| **A\*** | Informed | Priority Queue ($f=g+h$) | $O(b^d)$ | $O(b^d)$ | Yes | Yes (admissible $h$) |

*Where $b$ is the effective branching factor ($b \approx 2.67$ for 8-puzzle), $d$ is the shallowest goal depth, $m$ is maximum search depth, and $L$ is depth limit.*
