"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Image, Zap } from 'lucide-react';

const DeepLearningVisualizer = () => {
  const [mode, setMode] = useState('cnn');
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [imageData, setImageData] = useState(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Sample 8x8 image for demonstration
  const sampleImage = [
    [0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0],
    [0,1,1,0,0,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0]
  ];

  // Convolution kernel (edge detection)
  const kernel = [
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ];

  // Neural network architecture
  const [network, setNetwork] = useState({
    input: Array(4).fill(0.5),
    hidden1: Array(6).fill(0),
    hidden2: Array(4).fill(0),
    output: Array(2).fill(0),
    weights: {
      ih1: Array(4).fill(0).map(() => Array(6).fill(0).map(() => Math.random() * 2 - 1)),
      h1h2: Array(6).fill(0).map(() => Array(4).fill(0).map(() => Math.random() * 2 - 1)),
      h2o: Array(4).fill(0).map(() => Array(2).fill(0).map(() => Math.random() * 2 - 1))
    },
    gradients: {
      ih1: Array(4).fill(0).map(() => Array(6).fill(0)),
      h1h2: Array(6).fill(0).map(() => Array(4).fill(0)),
      h2o: Array(4).fill(0).map(() => Array(2).fill(0))
    }
  });

  // Activation function
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  const relu = (x) => Math.max(0, x);

  // Convolution operation
  const convolve = (image, kernel) => {
    const result = [];
    const kSize = kernel.length;
    const offset = Math.floor(kSize / 2);
    
    for (let i = offset; i < image.length - offset; i++) {
      const row = [];
      for (let j = offset; j < image[0].length - offset; j++) {
        let sum = 0;
        for (let ki = 0; ki < kSize; ki++) {
          for (let kj = 0; kj < kSize; kj++) {
            sum += image[i - offset + ki][j - offset + kj] * kernel[ki][kj];
          }
        }
        row.push(Math.max(0, Math.min(1, sum)));
      }
      result.push(row);
    }
    return result;
  };

  // Feedforward propagation
  const feedforward = () => {
    const newNetwork = { ...network };
    
    // Input to Hidden1
    newNetwork.hidden1 = newNetwork.weights.ih1[0].map((_, j) => {
      let sum = 0;
      for (let i = 0; i < newNetwork.input.length; i++) {
        sum += newNetwork.input[i] * newNetwork.weights.ih1[i][j];
      }
      return relu(sum);
    });

    // Hidden1 to Hidden2
    newNetwork.hidden2 = newNetwork.weights.h1h2[0].map((_, j) => {
      let sum = 0;
      for (let i = 0; i < newNetwork.hidden1.length; i++) {
        sum += newNetwork.hidden1[i] * newNetwork.weights.h1h2[i][j];
      }
      return relu(sum);
    });

    // Hidden2 to Output
    newNetwork.output = newNetwork.weights.h2o[0].map((_, j) => {
      let sum = 0;
      for (let i = 0; i < newNetwork.hidden2.length; i++) {
        sum += newNetwork.hidden2[i] * newNetwork.weights.h2o[i][j];
      }
      return sigmoid(sum);
    });

    setNetwork(newNetwork);
    return newNetwork;
  };

  // Backpropagation
  const backpropagate = () => {
    const target = [1, 0];
    const lr = 0.1;
    const newNetwork = { ...network };

    const outputError = newNetwork.output.map((o, i) => o - target[i]);
    
    for (let i = 0; i < newNetwork.hidden2.length; i++) {
      for (let j = 0; j < newNetwork.output.length; j++) {
        const gradient = outputError[j] * newNetwork.hidden2[i];
        newNetwork.gradients.h2o[i][j] = gradient;
        newNetwork.weights.h2o[i][j] -= lr * gradient;
      }
    }

    const hidden2Error = newNetwork.hidden2.map((_, i) => {
      let error = 0;
      for (let j = 0; j < newNetwork.output.length; j++) {
        error += outputError[j] * newNetwork.weights.h2o[i][j];
      }
      return error * (newNetwork.hidden2[i] > 0 ? 1 : 0);
    });

    for (let i = 0; i < newNetwork.hidden1.length; i++) {
      for (let j = 0; j < newNetwork.hidden2.length; j++) {
        const gradient = hidden2Error[j] * newNetwork.hidden1[i];
        newNetwork.gradients.h1h2[i][j] = gradient;
        newNetwork.weights.h1h2[i][j] -= lr * gradient;
      }
    }

    setNetwork(newNetwork);
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setStep(prev => {
          if (mode === 'feedforward' && prev >= 3) return 0;
          if (mode === 'backprop' && prev >= 6) return 0;
          if (mode === 'cnn' && prev >= 4) return 0;
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(animationRef.current);
    }
    return () => clearInterval(animationRef.current);
  }, [isPlaying, mode]);

  // Execute steps based on mode
  useEffect(() => {
    if (mode === 'feedforward' && step > 0) {
      feedforward();
    } else if (mode === 'backprop' && step > 3) {
      backpropagate();
    } else if (mode === 'cnn' && step === 2) {
      const convolved = convolve(sampleImage, kernel);
      setImageData(convolved);
    }
  }, [step, mode]);

  // Draw canvas
  useEffect(() => {
    if (canvasRef.current && mode === 'cnn') {
      const ctx = canvasRef.current.getContext('2d');
      const cellSize = 30;
      
      ctx.clearRect(0, 0, 500, 300);
      
      ctx.fillStyle = '#374151';
      ctx.fillText('Input Image', 20, 15);
      sampleImage.forEach((row, i) => {
        row.forEach((val, j) => {
          ctx.fillStyle = val > 0.5 ? '#38bdf8' : '#1e293b';
          ctx.fillRect(20 + j * cellSize, 30 + i * cellSize, cellSize - 2, cellSize - 2);
        });
      });

      if (imageData && step >= 2) {
        ctx.fillStyle = '#374151';
        ctx.fillText('After Convolution', 290, 15);
        imageData.forEach((row, i) => {
          row.forEach((val, j) => {
            const intensity = Math.floor(val * 255);
            ctx.fillStyle = `rgb(56, ${intensity}, 248)`;
            ctx.fillRect(290 + j * cellSize, 30 + i * cellSize, cellSize - 2, cellSize - 2);
          });
        });
      }

      if (step >= 1) {
        ctx.fillStyle = '#374151';
        ctx.fillText('Kernel (3x3)', 20, 290);
        kernel.forEach((row, i) => {
          row.forEach((val, j) => {
            ctx.fillStyle = val > 0 ? '#10b981' : '#ef4444';
            ctx.fillRect(20 + j * 25, 300 + i * 25, 23, 23);
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            ctx.fillText(val.toString(), 26 + j * 25, 316 + i * 25);
          });
        });
      }
    }
  }, [imageData, step, mode]);

  const renderNeuralNetwork = () => {
    const layers = [
      { name: 'Input', neurons: network.input, color: '#3b82f6' },
      { name: 'Hidden 1', neurons: network.hidden1, color: '#8b5cf6' },
      { name: 'Hidden 2', neurons: network.hidden2, color: '#ec4899' },
      { name: 'Output', neurons: network.output, color: '#10b981' }
    ];

    const connections = [];
    
    layers.forEach((layer, layerIdx) => {
      if (layerIdx < layers.length - 1) {
        const x = 100 + layerIdx * 200;
        const nextLayer = layers[layerIdx + 1];
        const isActive = step > layerIdx || (mode === 'backprop' && step > 3);
        
        layer.neurons.forEach((activation, neuronIdx) => {
          const y = 80 + neuronIdx * (280 / layer.neurons.length);
          
          nextLayer.neurons.forEach((_, nextIdx) => {
            const nextY = 80 + nextIdx * (280 / nextLayer.neurons.length);
            const weight = layerIdx === 0 ? network.weights.ih1[neuronIdx]?.[nextIdx] :
                         layerIdx === 1 ? network.weights.h1h2[neuronIdx]?.[nextIdx] :
                         network.weights.h2o[neuronIdx]?.[nextIdx];
            const gradient = mode === 'backprop' && step > 3 ?
                           (layerIdx === 2 ? network.gradients.h2o[neuronIdx]?.[nextIdx] :
                            layerIdx === 1 ? network.gradients.h1h2[neuronIdx]?.[nextIdx] :
                            network.gradients.ih1[neuronIdx]?.[nextIdx]) : 0;
            
            const strokeColor = mode === 'backprop' && step > 3 ?
                              (gradient > 0 ? '#ef4444' : '#3b82f6') :
                              (weight > 0 ? '#3b82f6' : '#6b7280');
            const strokeWidth = Math.abs(weight || 0) * 2;
            
            if (isActive) {
              connections.push(
                <line
                  key={`${layerIdx}-${neuronIdx}-${nextIdx}`}
                  x1={x}
                  y1={y}
                  x2={x + 200}
                  y2={nextY}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={0.3}
                />
              );
            }
          });
        });
      }
    });

    return (
      <svg width="100%" height="400" className="mt-4">
        {connections}
        {layers.map((layer, layerIdx) => {
          const x = 100 + layerIdx * 200;
          return (
            <g key={layerIdx}>
              <text x={x} y="30" textAnchor="middle" fill="#9ca3af" fontSize="14">
                {layer.name}
              </text>
              {layer.neurons.map((activation, neuronIdx) => {
                const y = 80 + neuronIdx * (280 / layer.neurons.length);
                const isActive = step > layerIdx || (mode === 'backprop' && step > 3);
                const intensity = isActive ? activation : 0;
                
                return (
                  <g key={neuronIdx}>
                    <circle
                      cx={x}
                      cy={y}
                      r="20"
                      fill={layer.color}
                      opacity={0.2 + intensity * 0.8}
                      stroke={layer.color}
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={y + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                    >
                      {isActive ? intensity.toFixed(2) : '0.00'}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        
        {mode === 'backprop' && step > 3 && (
          <text x="400" y="380" textAnchor="middle" fill="#ef4444" fontSize="16">
            ← Backpropagation (Gradient Flow)
          </text>
        )}
      </svg>
    );
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Deep Learning Visualizer
        </h1>
        <p className="text-center text-gray-400 mb-6">Interactive demonstration of CNN, Feedforward & Backpropagation</p>

        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => { setMode('cnn'); setStep(0); setIsPlaying(false); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'cnn' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Image className="inline mr-2" size={20} />
            CNN
          </button>
          <button
            onClick={() => { setMode('feedforward'); setStep(0); setIsPlaying(false); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'feedforward' ? 'bg-purple-500 shadow-lg shadow-purple-500/50' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Zap className="inline mr-2" size={20} />
            Feedforward
          </button>
          <button
            onClick={() => { setMode('backprop'); setStep(0); setIsPlaying(false); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'backprop' ? 'bg-pink-500 shadow-lg shadow-pink-500/50' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <RotateCcw className="inline mr-2" size={20} />
            Backpropagation
          </button>
        </div>

        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-all"
          >
            {isPlaying ? <Pause size={20} className="inline mr-2" /> : <Play size={20} className="inline mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => { setStep(0); setIsPlaying(false); setImageData(null); }}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-all"
          >
            <RotateCcw size={20} className="inline mr-2" />
            Reset
          </button>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">
              Mode: <span className="text-blue-400">{mode.toUpperCase()}</span>
            </span>
            <span className="text-lg font-semibold">
              Step: <span className="text-green-400">{step}</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          {mode === 'cnn' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Convolutional Neural Network</h2>
              <div className="bg-slate-900 rounded-lg p-4">
                <canvas ref={canvasRef} width="500" height="400" />
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p><strong>Step {step}:</strong></p>
                {step === 0 && <p>Ready to process image through convolution</p>}
                {step === 1 && <p>Applying 3x3 edge detection kernel...</p>}
                {step === 2 && <p>Convolution complete! Features extracted.</p>}
                {step === 3 && <p>Ready for pooling and further processing</p>}
              </div>
            </div>
          )}

          {(mode === 'feedforward' || mode === 'backprop') && (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                {mode === 'feedforward' ? 'Feedforward Propagation' : 'Backpropagation'}
              </h2>
              {renderNeuralNetwork()}
              <div className="mt-4 text-sm text-gray-400 bg-slate-900 rounded-lg p-4">
                <p><strong>Step {step}:</strong></p>
                {mode === 'feedforward' && (
                  <>
                    {step === 0 && <p>Input layer ready with initial values</p>}
                    {step === 1 && <p>Computing Hidden Layer 1 activations (ReLU)</p>}
                    {step === 2 && <p>Computing Hidden Layer 2 activations (ReLU)</p>}
                    {step === 3 && <p>Computing Output layer (Sigmoid). Prediction complete!</p>}
                  </>
                )}
                {mode === 'backprop' && (
                  <>
                    {step <= 3 && <p>Forward pass in progress...</p>}
                    {step === 4 && <p>Computing output error and gradients</p>}
                    {step === 5 && <p>Backpropagating through hidden layers</p>}
                    {step === 6 && <p>Updating weights based on gradients. Learning complete!</p>}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-2">Legend</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="inline-block w-4 h-4 bg-blue-500 rounded mr-2"></span>
              Input Layer / Positive Weights
            </div>
            <div>
              <span className="inline-block w-4 h-4 bg-purple-500 rounded mr-2"></span>
              Hidden Layer 1
            </div>
            <div>
              <span className="inline-block w-4 h-4 bg-pink-500 rounded mr-2"></span>
              Hidden Layer 2
            </div>
            <div>
              <span className="inline-block w-4 h-4 bg-green-500 rounded mr-2"></span>
              Output Layer
            </div>
            {mode === 'backprop' && (
              <>
                <div>
                  <span className="inline-block w-4 h-4 bg-red-500 rounded mr-2"></span>
                  Positive Gradient Flow
                </div>
                <div>
                  <span className="inline-block w-4 h-4 bg-blue-500 rounded mr-2"></span>
                  Negative Gradient Flow
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AimlVisualizer = DeepLearningVisualizer;
export default DeepLearningVisualizer;