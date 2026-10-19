/**
 * AI 8-Puzzle Visualizer - Data Structures
 * Efficient implementations of Min-Heap Priority Queue, FIFO Queue, LIFO Stack, and State Hashing.
 */

class PriorityQueue {
    /**
     * Min-Heap Priority Queue
     * @param {Function} comparator - Function (a, b) returning negative if a has higher priority (smaller f/h value)
     */
    constructor(comparator = (a, b) => a.priority - b.priority) {
        this.heap = [];
        this.comparator = comparator;
    }

    size() {
        return this.heap.length;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    peek() {
        return this.heap[0] || null;
    }

    enqueue(element, priority) {
        const item = priority !== undefined ? { element, priority } : element;
        this.heap.push(item);
        this._siftUp(this.heap.length - 1);
    }

    dequeue() {
        if (this.isEmpty()) return null;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = bottom;
            this._siftDown(0);
        }
        return top.element !== undefined ? top.element : top;
    }

    clear() {
        this.heap = [];
    }

    toArray() {
        return [...this.heap];
    }

    _siftUp(index) {
        let current = index;
        while (current > 0) {
            const parent = Math.floor((current - 1) / 2);
            if (this.comparator(this.heap[current], this.heap[parent]) < 0) {
                [this.heap[current], this.heap[parent]] = [this.heap[parent], this.heap[current]];
                current = parent;
            } else {
                break;
            }
        }
    }

    _siftDown(index) {
        let current = index;
        const length = this.heap.length;
        while (true) {
            let leftChild = 2 * current + 1;
            let rightChild = 2 * current + 2;
            let smallest = current;

            if (leftChild < length && this.comparator(this.heap[leftChild], this.heap[smallest]) < 0) {
                smallest = leftChild;
            }
            if (rightChild < length && this.comparator(this.heap[rightChild], this.heap[smallest]) < 0) {
                smallest = rightChild;
            }
            if (smallest !== current) {
                [this.heap[current], this.heap[smallest]] = [this.heap[smallest], this.heap[current]];
                current = smallest;
            } else {
                break;
            }
        }
    }
}

class FastQueue {
    /**
     * Memory-efficient FIFO Queue with pointer offset
     */
    constructor() {
        this.items = [];
        this.head = 0;
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        if (this.isEmpty()) return null;
        const item = this.items[this.head];
        this.head++;
        if (this.head > 500 && this.head > this.items.length / 2) {
            this.items = this.items.slice(this.head);
            this.head = 0;
        }
        return item;
    }

    peek() {
        if (this.isEmpty()) return null;
        return this.items[this.head];
    }

    size() {
        return this.items.length - this.head;
    }

    isEmpty() {
        return this.size() === 0;
    }

    clear() {
        this.items = [];
        this.head = 0;
    }

    toArray() {
        return this.items.slice(this.head);
    }
}

class Stack {
    /**
     * Standard LIFO Stack
     */
    constructor() {
        this.items = [];
    }

    push(item) {
        this.items.push(item);
    }

    pop() {
        return this.items.pop() || null;
    }

    peek() {
        return this.items[this.items.length - 1] || null;
    }

    size() {
        return this.items.length;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    clear() {
        this.items = [];
    }

    toArray() {
        return [...this.items];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PriorityQueue, FastQueue, Stack };
}
