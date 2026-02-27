"use client"
/*
import { useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Text } from "@react-three/drei"

export function ProgrammingVisualizer({
  parameters = {},
}: {
  parameters?: { count?: number; speed?: number }
}) {
  const count = Math.max(5, Math.min(40, Math.floor(parameters.count ?? 20)))
  const speed = parameters.speed ?? 1
  const [arr, setArr] = useState(() => Array.from({ length: count }, () => Math.random()))
  const iRef = useRef(0)
  const jRef = useRef(0)

  useFrame((_, dt) => {
    // simple bubble sort step
    const i = iRef.current
    const j = jRef.current
    if (i < count) {
      if (j < count - i - 1) {
        if (arr[j] > arr[j + 1]) {
          const next = arr.slice()
          const tmp = next[j]
          next[j] = next[j + 1]
          next[j + 1] = tmp
          setArr(next)
        }
        jRef.current += Math.max(1, Math.floor(speed))
      } else {
        iRef.current += 1
        jRef.current = 0
      }
    }
  })

  const positions = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => -5 + (i / count) * 10)
  }, [count])

  return (
    <group>
      {arr.map((v, idx) => (
        <Box key={idx} args={[0.18, Math.max(0.05, v) * 2, 0.18]} position={[positions[idx], Math.max(0.05, v), 0]}>
          <meshStandardMaterial color="#3b82f6" />
        </Box>
      ))}
      <Text position={[0, 1.6, 0]} fontSize={0.12} color="white" anchorX="center">
        {"Programming Visualizer: Bubble Sort"}
      </Text>
    </group>
  )
}
*/
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const ALGORITHMS = {
  bubbleSort: { name: 'Bubble Sort', color: '#3b82f6' },
  quickSort: { name: 'Quick Sort', color: '#8b5cf6' },
  mergeSort: { name: 'Merge Sort', color: '#ec4899' },
  binarySearch: { name: 'Binary Search', color: '#10b981' },
  linkedList: { name: 'Linked List', color: '#f59e0b' },
  stack: { name: 'Stack Operations', color: '#ef4444' },
  queue: { name: 'Queue Operations', color: '#06b6d4' },
  bfs: { name: 'BFS Traversal', color: '#8b5cf6' },
  dfs: { name: 'DFS Traversal', color: '#ec4899' },
};

export default function ProgrammingVisualizer() {
  const [algorithm, setAlgorithm] = useState('bubbleSort');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [arraySize, setArraySize] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useState([]);
  const [highlightIndices, setHighlightIndices] = useState([]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [pivotIndex, setPivotIndex] = useState(-1);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const animationRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    resetVisualization();
  }, [algorithm, arraySize]);

  useEffect(() => {
    if (isPlaying) {
      runAlgorithm();
    } else {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, speed]);

  const generateArray = () => {
    return Array.from({ length: arraySize }, () => Math.floor(Math.random() * 100) + 1);
  };

  const generateGraph = () => {
    const nodes = Array.from({ length: Math.min(12, arraySize) }, (_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 100) + 1,
      x: (i % 4) * 25,
      y: Math.floor(i / 4) * 25,
      visited: false,
      connections: []
    }));
    
    nodes.forEach((node, i) => {
      if (i % 4 !== 3) node.connections.push(i + 1);
      if (i < nodes.length - 4) node.connections.push(i + 4);
      if (i % 4 !== 0 && i > 0) node.connections.push(i - 1);
    });
    
    return nodes;
  };

  const resetVisualization = () => {
    setIsPlaying(false);
    setHighlightIndices([]);
    setSortedIndices([]);
    setPivotIndex(-1);
    setComparisons(0);
    setSwaps(0);
    
    if (['bfs', 'dfs'].includes(algorithm)) {
      setData(generateGraph());
      stateRef.current = { queue: [0], visited: new Set() };
    } else if (algorithm === 'linkedList') {
      const arr = generateArray().slice(0, 10);
      setData(arr.map((val, i) => ({ value: val, next: i < arr.length - 1 ? i + 1 : null })));
      stateRef.current = { currentIndex: 0, operation: 'traverse' };
    } else if (algorithm === 'stack') {
      setData([]);
      stateRef.current = { operations: generateStackOps(), step: 0 };
    } else if (algorithm === 'queue') {
      setData([]);
      stateRef.current = { operations: generateQueueOps(), step: 0 };
    } else {
      setData(generateArray());
      stateRef.current = {};
    }
  };

  const generateStackOps = () => {
    const ops = [];
    for (let i = 0; i < 15; i++) {
      ops.push(Math.random() > 0.3 ? 'push' : 'pop');
    }
    return ops;
  };

  const generateQueueOps = () => {
    const ops = [];
    for (let i = 0; i < 15; i++) {
      ops.push(Math.random() > 0.3 ? 'enqueue' : 'dequeue');
    }
    return ops;
  };

  const sleep = (ms) => {
    return new Promise(resolve => {
      animationRef.current = setTimeout(resolve, ms);
    });
  };

  const runAlgorithm = async () => {
    const delay = 1000 - speed * 9;
    
    try {
      switch (algorithm) {
        case 'bubbleSort':
          await bubbleSort(delay);
          break;
        case 'quickSort':
          await quickSort(delay);
          break;
        case 'mergeSort':
          await mergeSort(delay);
          break;
        case 'binarySearch':
          await binarySearch(delay);
          break;
        case 'linkedList':
          await linkedListDemo(delay);
          break;
        case 'stack':
          await stackDemo(delay);
          break;
        case 'queue':
          await queueDemo(delay);
          break;
        case 'bfs':
          await bfsTraversal(delay);
          break;
        case 'dfs':
          await dfsTraversal(delay);
          break;
      }
    } catch (e) {
      // Animation interrupted
    }
    
    setIsPlaying(false);
  };

  const bubbleSort = async (delay) => {
    const arr = [...data];
    const n = arr.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setHighlightIndices([j, j + 1]);
        setComparisons(prev => prev + 1);
        await sleep(delay);
        
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setData([...arr]);
          setSwaps(prev => prev + 1);
          await sleep(delay);
        }
      }
      setSortedIndices(prev => [...prev, n - i - 1]);
    }
    
    setHighlightIndices([]);
    setSortedIndices(Array.from({ length: n }, (_, i) => i));
  };

  const quickSort = async (delay) => {
    const arr = [...data];
    await quickSortHelper(arr, 0, arr.length - 1, delay);
    setSortedIndices(Array.from({ length: arr.length }, (_, i) => i));
    setHighlightIndices([]);
    setPivotIndex(-1);
  };

  const quickSortHelper = async (arr, low, high, delay) => {
    if (low < high) {
      const pi = await partition(arr, low, high, delay);
      await quickSortHelper(arr, low, pi - 1, delay);
      await quickSortHelper(arr, pi + 1, high, delay);
    }
  };

  const partition = async (arr, low, high, delay) => {
    const pivot = arr[high];
    setPivotIndex(high);
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
      setHighlightIndices([j, high]);
      setComparisons(prev => prev + 1);
      await sleep(delay);
      
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        setData([...arr]);
        setSwaps(prev => prev + 1);
        await sleep(delay);
      }
    }
    
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    setData([...arr]);
    setSwaps(prev => prev + 1);
    await sleep(delay);
    
    return i + 1;
  };

  const mergeSort = async (delay) => {
    const arr = [...data];
    await mergeSortHelper(arr, 0, arr.length - 1, delay);
    setSortedIndices(Array.from({ length: arr.length }, (_, i) => i));
    setHighlightIndices([]);
  };

  const mergeSortHelper = async (arr, left, right, delay) => {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      await mergeSortHelper(arr, left, mid, delay);
      await mergeSortHelper(arr, mid + 1, right, delay);
      await merge(arr, left, mid, right, delay);
    }
  };

  const merge = async (arr, left, mid, right, delay) => {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
      setHighlightIndices([k]);
      setComparisons(prev => prev + 1);
      await sleep(delay);
      
      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      setData([...arr]);
      k++;
    }
    
    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      setData([...arr]);
      i++;
      k++;
      await sleep(delay);
    }
    
    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      setData([...arr]);
      j++;
      k++;
      await sleep(delay);
    }
  };

  const binarySearch = async (delay) => {
    const arr = [...data].sort((a, b) => a - b);
    setData(arr);
    await sleep(delay * 2);
    
    const target = arr[Math.floor(Math.random() * arr.length)];
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      setHighlightIndices([left, mid, right]);
      setComparisons(prev => prev + 1);
      await sleep(delay);
      
      if (arr[mid] === target) {
        setSortedIndices([mid]);
        setHighlightIndices([]);
        break;
      } else if (arr[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  };

  const linkedListDemo = async (delay) => {
    const nodes = [...data];
    
    for (let i = 0; i < nodes.length; i++) {
      setHighlightIndices([i]);
      await sleep(delay);
    }
    
    if (nodes.length > 3) {
      const insertPos = Math.floor(nodes.length / 2);
      const newNode = { value: Math.floor(Math.random() * 100) + 1, next: nodes[insertPos].next };
      nodes[insertPos].next = nodes.length;
      nodes.push(newNode);
      setData([...nodes]);
      setHighlightIndices([insertPos, nodes.length - 1]);
      await sleep(delay * 2);
    }
    
    setHighlightIndices([]);
  };

  const stackDemo = async (delay) => {
    const { operations } = stateRef.current;
    const stack = [];
    
    for (const op of operations) {
      if (op === 'push' && stack.length < 10) {
        const val = Math.floor(Math.random() * 100) + 1;
        stack.push(val);
        setData([...stack]);
        setHighlightIndices([stack.length - 1]);
      } else if (op === 'pop' && stack.length > 0) {
        setHighlightIndices([stack.length - 1]);
        await sleep(delay);
        stack.pop();
        setData([...stack]);
      }
      await sleep(delay);
    }
    
    setHighlightIndices([]);
  };

  const queueDemo = async (delay) => {
    const { operations } = stateRef.current;
    const queue = [];
    
    for (const op of operations) {
      if (op === 'enqueue' && queue.length < 10) {
        const val = Math.floor(Math.random() * 100) + 1;
        queue.push(val);
        setData([...queue]);
        setHighlightIndices([queue.length - 1]);
      } else if (op === 'dequeue' && queue.length > 0) {
        setHighlightIndices([0]);
        await sleep(delay);
        queue.shift();
        setData([...queue]);
      }
      await sleep(delay);
    }
    
    setHighlightIndices([]);
  };

  const bfsTraversal = async (delay) => {
    const nodes = data.map(n => ({ ...n, visited: false }));
    const queue = [0];
    const visited = new Set([0]);
    
    while (queue.length > 0) {
      const nodeId = queue.shift();
      nodes[nodeId].visited = true;
      setData([...nodes]);
      setHighlightIndices([nodeId]);
      await sleep(delay);
      
      for (const neighbor of nodes[nodeId].connections) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    setHighlightIndices([]);
  };

  const dfsTraversal = async (delay) => {
    const nodes = data.map(n => ({ ...n, visited: false }));
    const visited = new Set();
    
    const dfs = async (nodeId) => {
      visited.add(nodeId);
      nodes[nodeId].visited = true;
      setData([...nodes]);
      setHighlightIndices([nodeId]);
      await sleep(delay);
      
      for (const neighbor of nodes[nodeId].connections) {
        if (!visited.has(neighbor)) {
          await dfs(neighbor);
        }
      }
    };
    
    await dfs(0);
    setHighlightIndices([]);
  };

  const renderVisualization = () => {
    if (!data || data.length === 0) {
      return <div className="text-gray-400 text-center">Initializing...</div>;
    }

    if (['bfs', 'dfs'].includes(algorithm)) {
      return (
        <svg className="w-full h-full" viewBox="0 0 100 75">
          {data.flatMap((node) =>
            Array.isArray(node.connections)
              ? node.connections.map((conn) => (
                  <line
                    key={`${node.id}-${conn}`}
                    x1={node.x + 12.5}
                    y1={node.y + 12.5}
                    x2={data[conn] ? data[conn].x + 12.5 : 0}
                    y2={data[conn] ? data[conn].y + 12.5 : 0}
                    stroke="#374151"
                    strokeWidth="0.5"
                  />
                ))
              : []
          )}
          {data.map((node, i) => (
            <g key={`node-${i}`}>
              <circle
                cx={node.x + 12.5}
                cy={node.y + 12.5}
                r="6"
                fill={node.visited ? ALGORITHMS[algorithm].color : highlightIndices.includes(i) ? '#fbbf24' : '#1f2937'}
                stroke={highlightIndices.includes(i) ? '#fbbf24' : '#4b5563'}
                strokeWidth="1"
                className="transition-all duration-300"
              />
              <text
                x={node.x + 12.5}
                y={node.y + 12.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="4"
                fontWeight="bold"
              >
                {node.value}
              </text>
            </g>
          ))}
        </svg>
      );
    }

    if (algorithm === 'linkedList') {
      return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {data.map((node, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                  highlightIndices.includes(i)
                    ? 'bg-yellow-500 border-yellow-600 scale-110'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <div className="text-white font-bold text-lg">{node.value}</div>
              </div>
              {node.next !== null && (
                <div className="text-gray-400 text-2xl">→</div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (algorithm === 'stack') {
      return (
        <div className="flex flex-col-reverse items-center gap-1">
          {data.map((val, i) => (
            <div
              key={i}
              className={`w-32 px-4 py-3 rounded border-2 transition-all duration-300 ${
                highlightIndices.includes(i)
                  ? 'bg-yellow-500 border-yellow-600'
                  : 'bg-gray-800 border-gray-600'
              }`}
            >
              <div className="text-white font-bold text-center">{val}</div>
            </div>
          ))}
          <div className="w-32 h-1 bg-gray-600 mt-2"></div>
          <div className="text-gray-400 text-sm mt-1">STACK (LIFO)</div>
        </div>
      );
    }

    if (algorithm === 'queue') {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="text-gray-400 text-sm">QUEUE (FIFO)</div>
          <div className="flex items-center gap-1">
            <div className="text-gray-400">Front →</div>
            {data.map((val, i) => (
              <div
                key={i}
                className={`w-16 px-3 py-3 rounded border-2 transition-all duration-300 ${
                  highlightIndices.includes(i)
                    ? 'bg-yellow-500 border-yellow-600'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <div className="text-white font-bold text-center text-sm">{val}</div>
              </div>
            ))}
            <div className="text-gray-400">← Rear</div>
          </div>
        </div>
      );
    }

    const displayData = data.map((item) => (typeof item === 'object' && item !== null ? (item.value ?? 0) : item));

    const maxVal = Math.max(...displayData, 1);

    return (
      <div className="flex items-end justify-center gap-1 h-64">
        {displayData.map((val, i) => {
          const height = (val / maxVal) * 100;
          const isHighlighted = highlightIndices.includes(i);
          const isSorted = sortedIndices.includes(i);
          const isPivot = pivotIndex === i;
          
          let bgColor = ALGORITHMS[algorithm].color;
          if (isPivot) bgColor = '#fbbf24';
          else if (isHighlighted) bgColor = '#ef4444';
          else if (isSorted) bgColor = '#10b981';
          
          return (
            <div
              key={i}
              className="flex-1 max-w-8 rounded-t transition-all duration-300"
              style={{
                height: `${height}%`,
                backgroundColor: bgColor,
                minHeight: '8px',
              }}
            >
              <div className="text-white text-xs text-center pt-1 font-semibold">
                {val}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Programming Concepts Visualizer
          </h1>
          <p className="text-gray-400">Interactive visualization of algorithms and data structures</p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(ALGORITHMS).map(([key, { name, color }]) => (
              <button
                key={key}
                onClick={() => setAlgorithm(key)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  algorithm === key
                    ? 'scale-105 shadow-lg'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                style={{
                  backgroundColor: algorithm === key ? color : undefined,
                }}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="bg-gray-900 rounded-lg p-6 mb-6 min-h-80 flex items-center justify-center">
            {renderVisualization()}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button
                onClick={resetVisualization}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
              >
                <RotateCcw size={20} />
                Reset
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
              >
                <Settings size={20} />
                Settings
              </button>
            </div>

            <div className="flex gap-6 text-sm">
              <div className="bg-gray-700 px-4 py-2 rounded-lg">
                <span className="text-gray-400">Comparisons:</span>
                <span className="ml-2 font-bold">{comparisons}</span>
              </div>
              <div className="bg-gray-700 px-4 py-2 rounded-lg">
                <span className="text-gray-400">Swaps:</span>
                <span className="ml-2 font-bold">{swaps}</span>
              </div>
            </div>
          </div>

          {showSettings && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Speed: {speed}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Array Size: {arraySize}
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={arraySize}
                  onChange={(e) => setArraySize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-3">About {ALGORITHMS[algorithm].name}</h3>
          <p className="text-gray-300 leading-relaxed">
            {algorithm === 'bubbleSort' && 'Bubble Sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. Time Complexity: O(n²)'}
            {algorithm === 'quickSort' && 'Quick Sort is a divide-and-conquer algorithm that picks a pivot element and partitions the array around it. Time Complexity: O(n log n) average, O(n²) worst case'}
            {algorithm === 'mergeSort' && 'Merge Sort divides the array into two halves, recursively sorts them, and then merges the sorted halves. Time Complexity: O(n log n)'}
            {algorithm === 'binarySearch' && 'Binary Search finds the position of a target value within a sorted array by repeatedly dividing the search interval in half. Time Complexity: O(log n)'}
            {algorithm === 'linkedList' && 'A Linked List is a linear data structure where elements are stored in nodes, each pointing to the next node. Efficient for insertions and deletions.'}
            {algorithm === 'stack' && 'A Stack is a Last-In-First-Out (LIFO) data structure. Elements are added and removed from the top. Common operations: push, pop, peek.'}
            {algorithm === 'queue' && 'A Queue is a First-In-First-Out (FIFO) data structure. Elements are added at the rear and removed from the front. Common operations: enqueue, dequeue.'}
            {algorithm === 'bfs' && 'Breadth-First Search explores all neighbors at the current depth before moving to nodes at the next depth level. Uses a queue data structure.'}
            {algorithm === 'dfs' && 'Depth-First Search explores as far as possible along each branch before backtracking. Uses a stack (or recursion) data structure.'}
          </p>
        </div>
      </div>
    </div>
  );
}