const fs = require('fs');
const dijkstra = require('../services/dijkstra');

let trafficSnapshots = [];
let snapshotIndex = 0;

// Loading all traffic files 
for (let i = 1; i <= 5; i++) {
    const data = fs.readFileSync(`./data/traffic${i}.txt`, 'utf-8').trim();
    const lines = data.split('\n');
    const graph = {};

    lines.forEach(line => {
        const [from, to, weight] = line.trim().split(/\s+/);
        const w = parseInt(weight);
        if (!graph[from]) graph[from] = [];
        if (!graph[to]) graph[to] = [];

        graph[from].push({ from, to, weight: w });
        graph[to].push({ from: to, to: from, weight: w });
    });

    trafficSnapshots.push(graph);
}

const coordinates = require('../data/coordinates.json');

function parseGraphFile(filename) {
    const content = fs.readFileSync(filename, 'utf-8').trim();
    const lines = content.split('\n');
    const graph = {};

    lines.forEach(line => {
        const [from, to, weight] = line.trim().split(/\s+/);
        const w = parseInt(weight);
        if (!graph[from]) graph[from] = [];
        if (!graph[to]) graph[to] = [];

        graph[from].push({ from, to, weight: w });
        graph[to].push({ from: to, to: from, weight: w });
    });

    return graph;
}

function findCarpools(start, destination, passengers) {
    return passengers.filter(p => p.start === start && p.destination !== start);
}

function loadPassengers() {
    const data = fs.readFileSync('./data/passengers.txt', 'utf-8').trim();
    return data.split('\n').map(line => {
        const [name, start, destination] = line.trim().split(/\s+/);
        return { name, start, destination };
    });
}

exports.getInitialData = (req, res) => {
    const { name, start, destination } = req.body;

    const graph = parseGraphFile('./data/base_map.txt');
    const pathData = dijkstra(graph, start, destination);
    const path = pathData.path;
    const time = pathData.time;

    const route = path.map(node => coordinates[node]);
    const passengers = loadPassengers();
    const carpoolMatches = findCarpools(start, destination, passengers);

    res.json({
        path,
        time,
        route,
        carpoolMatches,
        success: true
    });
};

exports.updateRoute = (req, res) => {
  const { current, destination } = req.body;

  const baseGraph = parseGraphFile('./data/base_map.txt');
  const trafficGraph = trafficSnapshots[snapshotIndex];
  snapshotIndex = (snapshotIndex + 1) % trafficSnapshots.length;

  const baseResult = dijkstra(baseGraph, current, destination);
  const trafficResult = dijkstra(trafficGraph, current, destination);

  if (!trafficResult.path.length) {
      return res.json({ success: false });
  }

  const message = (JSON.stringify(baseResult.path) === JSON.stringify(trafficResult.path))
      ? '✅ Continue on current route.'
      : '⚠️ Traffic ahead. New route suggested.';

  const route = trafficResult.path.map(node => coordinates[node]);

  res.json({
      success: true,
      route,
      time: trafficResult.time,
      message,
      path: trafficResult.path 
  });

};
