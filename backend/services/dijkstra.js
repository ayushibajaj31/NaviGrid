class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert(item) {
        this.heap.push(item);
        this.bubbleUp();
    }

    extractMin() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown();
        return min;
    }

    bubbleUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].dist <= this.heap[index].dist) break;
            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }

    bubbleDown() {
        let index = 0;
        const length = this.heap.length;

        while (true) {
            let left = 2 * index + 1;
            let right = 2 * index + 2;
            let smallest = index;

            if (left < length && this.heap[left].dist < this.heap[smallest].dist) {
                smallest = left;
            }
            if (right < length && this.heap[right].dist < this.heap[smallest].dist) {
                smallest = right;
            }
            if (smallest === index) break;

            [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
            index = smallest;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

function dijkstra(graph, start, end) {
    const dist = {};
    const prev = {};
    const visited = new Set();
    const pq = new MinHeap();

    for (let node in graph) {
        dist[node] = Infinity;
    }

    dist[start] = 0;
    pq.insert({ node: start, dist: 0 });

    while (!pq.isEmpty()) {
        const { node: current } = pq.extractMin();

        if (visited.has(current)) continue;
        visited.add(current);

        for (let edge of graph[current] || []) {
            const alt = dist[current] + edge.weight;
            if (alt < dist[edge.to]) {
                dist[edge.to] = alt;
                prev[edge.to] = current;
                pq.insert({ node: edge.to, dist: alt });
            }
        }
    }

    if (!prev[end] && start !== end) return { path: [], time: 0 };

    const path = [];
    let at = end;
    while (at) {
        path.unshift(at);
        at = prev[at];
    }

    return { path, time: dist[end] };
}

module.exports = dijkstra;