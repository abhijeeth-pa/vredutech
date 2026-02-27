"use client"
import { useState, useEffect, useRef } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  load: number;
  packetsProcessed: number;
}

interface Packet {
  id: number;
  path: number[];
  currentSegment: number;
  progress: number;
  speed: number;
  color: string;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
  load: number;
}

export default function NetworkExperiment() {
  const [nodeCount, setNodeCount] = useState(8);
  const [packetRate, setPacketRate] = useState(2);
  const [routingMode, setRoutingMode] = useState('shortest');
  const [isRunning, setIsRunning] = useState(true);
  const [stats, setStats] = useState({ packets: 0, avgLatency: 0, throughput: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const packetIdRef = useRef(0);
  const lastPacketTimeRef = useRef(0);
  const statsTimeRef = useRef(0);

  // Initialize nodes in circular layout
  useEffect(() => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    const newNodes: Node[] = Array.from({ length: nodeCount }).map((_, i) => {
      const angle = (i / nodeCount) * Math.PI * 2;
      return {
        id: i,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        load: 0,
        packetsProcessed: 0,
      };
    });
    
    setNodes(newNodes);
    
    // Create edges (ring + shortcuts)
    const newEdges: Edge[] = [];
    for (let i = 0; i < nodeCount; i++) {
      newEdges.push({ from: i, to: (i + 1) % nodeCount, load: 0 });
      if (i < nodeCount - 2) {
        newEdges.push({ from: i, to: i + 2, load: 0 });
      }
    }
    setEdges(newEdges);
  }, [nodeCount]);

  const generatePath = (routingMode: string, nodeCount: number): number[] => {
    const start = Math.floor(Math.random() * nodeCount);
    let end = Math.floor(Math.random() * nodeCount);
    while (end === start) end = Math.floor(Math.random() * nodeCount);

    if (routingMode === 'shortest') {
      return [start, end];
    } else if (routingMode === 'random') {
      const path = [start];
      let current = start;
      const maxHops = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < maxHops && current !== end; i++) {
        const next = Math.floor(Math.random() * nodeCount);
        if (next !== current) {
          path.push(next);
          current = next;
        }
      }
      if (path[path.length - 1] !== end) path.push(end);
      return path;
    } else {
      const midpoint = Math.floor(Math.random() * nodeCount);
      return [start, midpoint, end];
    }
  };

  // Animation loop
  useEffect(() => {
    if (!isRunning || nodes.length === 0) return;

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - (lastPacketTimeRef.current || timestamp);
      lastPacketTimeRef.current = timestamp;

      // Generate new packets
      if (timestamp - statsTimeRef.current > 1000 / packetRate) {
        statsTimeRef.current = timestamp;
        const colors = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6'];
        const path = generatePath(routingMode, nodeCount);

        // Ensure the start node exists (nodeCount may have changed)
        const startNode = nodes[path[0]];
        if (startNode) {
          setPackets((prev) => {
            const newPackets = [...prev];
            if (newPackets.length < 50) {
              newPackets.push({
                id: packetIdRef.current++,
                path,
                currentSegment: 0,
                progress: 0,
                speed: 0.3 + Math.random() * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                x: startNode.x,
                y: startNode.y,
              });
            }
            return newPackets;
          });
        }
      }

      // Update packets
      setPackets(prev => {
        const newLoads = new Array(nodeCount).fill(0);
        
        const updated = prev
          .map((packet) => {
            const newProgress = packet.progress + packet.speed * (deltaTime / 1000);

            if (newProgress >= 1) {
              const nextSegment = packet.currentSegment + 1;
              if (nextSegment >= packet.path.length - 1) {
                return null; // Remove packet
              }

              const nextIdx = packet.path[nextSegment];
              const fromNode = nodes[nextIdx];
              if (!fromNode) return null; // invalid node index after node changes

              return {
                ...packet,
                currentSegment: nextSegment,
                progress: 0,
                x: fromNode.x,
                y: fromNode.y,
              };
            }

            const fromIdx = packet.path[packet.currentSegment];
            const toIdx = packet.path[packet.currentSegment + 1];

            const fromNode = nodes[fromIdx];
            const toNode = nodes[toIdx];
            if (!fromNode || !toNode) return null; // invalid indices

            // safety for loads array
            if (fromIdx >= 0 && fromIdx < newLoads.length) newLoads[fromIdx]++;
            if (toIdx >= 0 && toIdx < newLoads.length) newLoads[toIdx]++;

            const x = fromNode.x + (toNode.x - fromNode.x) * newProgress;
            const y = fromNode.y + (toNode.y - fromNode.y) * newProgress;

            return { ...packet, progress: newProgress, x, y };
          })
          .filter((p) => p !== null) as Packet[];
        
        // Update node loads
        setNodes(prevNodes => prevNodes.map((node, i) => ({
          ...node,
          load: newLoads[i] || 0,
        })));
        
        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, nodes, nodeCount, packetRate, routingMode]);

  // Update stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        packets: prev.packets + packets.length,
        avgLatency: 20 + Math.random() * 30,
        throughput: packetRate * 100 + Math.random() * 50,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [packetRate, packets.length]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes[edge.from];
      const toNode = nodes[edge.to];
      
      if (fromNode && toNode) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const load = node.load;
      const intensity = Math.min(load / 5, 1);
      const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#22c55e';
      const radius = 15 + intensity * 5;

      // Node glow
      if (intensity > 0) {
        const gradient = ctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, radius * 1.5);
        gradient.addColorStop(0, color + '80');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`N${i + 1}`, node.x, node.y);

      // Load indicator
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${load}`, node.x, node.y + radius + 15);
    });

    // Draw packets
    packets.forEach(packet => {
      // Packet glow
      const gradient = ctx.createRadialGradient(packet.x, packet.y, 4, packet.x, packet.y, 12);
      gradient.addColorStop(0, packet.color + 'ff');
      gradient.addColorStop(1, packet.color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Packet circle
      ctx.fillStyle = packet.color;
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [nodes, packets, edges]);

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col">
      {/* Control Panel */}
      <div className="bg-slate-800 p-4 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Real-Time Network Simulation</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Total Packets</div>
              <div className="text-2xl font-bold text-blue-400">{stats.packets}</div>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Avg Latency</div>
              <div className="text-2xl font-bold text-orange-400">{stats.avgLatency.toFixed(1)}ms</div>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Throughput</div>
              <div className="text-2xl font-bold text-green-400">{stats.throughput.toFixed(0)} pkt/s</div>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Active Packets</div>
              <div className="text-2xl font-bold text-purple-400">{packets.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nodes: {nodeCount}
              </label>
              <input
                type="range"
                min="4"
                max="12"
                value={nodeCount}
                onChange={(e) => setNodeCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Packet Rate: {packetRate}/s
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={packetRate}
                onChange={(e) => setPacketRate(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Routing Mode
              </label>
              <select
                value={routingMode}
                onChange={(e) => setRoutingMode(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="shortest">Shortest Path</option>
                <option value="random">Random Walk</option>
                <option value="multipath">Multi-Path</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={() => {
                setStats({ packets: 0, avgLatency: 0, throughput: 0 });
                setPackets([]);
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-slate-900 p-8">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-slate-700 rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}