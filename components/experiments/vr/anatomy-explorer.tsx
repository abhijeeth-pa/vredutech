"use client";

// import { useRef } from "react"
// import { useFrame } from "@react-three/fiber"
// import { Sphere, Box, Text } from "@react-three/drei"
// import type * as THREE from "three"

// export type AnatomyExplorerProps = {
//   parameters?: {
//     autoRotate?: boolean
//     organScale?: number
//     showLabels?: boolean
//   }
// }

// export function AnatomyExplorer({ parameters = {} }: AnatomyExplorerProps) {
//   const groupRef = useRef<THREE.Group>(null)
//   useFrame((state) => {
//     if (groupRef.current && parameters.autoRotate) {
//       groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
//     }
//   })

//   const s = parameters.organScale ?? 1

//   return (
//     <group ref={groupRef}>
//       {/* Torso */}
//       <Box args={[1.2 * s, 1.6 * s, 0.6 * s]} position={[0, 1.1 * s, 0]}>
//         <meshStandardMaterial color="#64748b" metalness={0.1} roughness={0.8} />
//       </Box>

//       {/* Heart */}
//       <Sphere args={[0.18 * s, 32, 32]} position={[0.1 * s, 1.2 * s, 0.15 * s]}>
//         <meshStandardMaterial color="#ef4444" />
//       </Sphere>
//       {parameters.showLabels && (
//         <Text position={[0.1 * s, 1.5 * s, 0.15 * s]} fontSize={0.08 * s} color="white" anchorX="center">
//           {"Heart"}
//         </Text>
//       )}

//       {/* Lungs */}
//       <Sphere args={[0.25 * s]} position={[-0.25 * s, 1.25 * s, 0.05 * s]}>
//         <meshStandardMaterial color="#60a5fa" opacity={0.8} transparent />
//       </Sphere>
//       <Sphere args={[0.25 * s]} position={[0.35 * s, 1.25 * s, 0.05 * s]}>
//         <meshStandardMaterial color="#60a5fa" opacity={0.8} transparent />
//       </Sphere>
//       {parameters.showLabels && (
//         <>
//           <Text position={[-0.25 * s, 1.55 * s, 0.05 * s]} fontSize={0.08 * s} color="white" anchorX="center">
//             {"Left Lung"}
//           </Text>
//           <Text position={[0.35 * s, 1.55 * s, 0.05 * s]} fontSize={0.08 * s} color="white" anchorX="center">
//             {"Right Lung"}
//           </Text>
//         </>
//       )}

//       {/* Liver */}
//       <Sphere args={[0.28 * s]} position={[0.2 * s, 0.8 * s, 0.1 * s]}>
//         <meshStandardMaterial color="#b45309" />
//       </Sphere>
//       {parameters.showLabels && (
//         <Text position={[0.2 * s, 1.1 * s, 0.1 * s]} fontSize={0.08 * s} color="white" anchorX="center">
//           {"Liver"}
//         </Text>
//       )}
//     </group>
//   )
// }
import { useState } from 'react';
import IframeWithFallback from '@/components/experiments/vr/iframe-wrapper'

export default function AnatomyExplorer() {
  const [selectedOrgan, setSelectedOrgan] = useState('heart');
  
  const organs = {
    heart: {
      name: 'Heart',
      embedUrl: 'https://sketchfab.com/models/e48637d3399a4e5184bdf169929dc36e/embed',
      description: 'The heart is a muscular organ that pumps blood throughout the body, delivering oxygen and nutrients to tissues.',
      color: 'bg-red-600'
    },
    liver: {
      name: 'Liver',
      embedUrl: 'https://sketchfab.com/models/d0bce1a8e16a4b69b5b235e4248b2d19/embed',
      description: 'The liver is a vital organ that processes nutrients, filters blood, and produces bile for digestion.',
      color: 'bg-amber-700'
    },
    kidney: {
      name: 'Kidney',
      embedUrl: 'https://sketchfab.com/models/3aef2741ea754fb486451292b87e159a/embed',
      description: 'Kidneys filter waste from the blood, regulate fluid balance, and produce urine.',
      color: 'bg-rose-800'
    },
    brain: {
      name: 'Brain',
      embedUrl: 'https://sketchfab.com/models/720038f031074c1fa150ea364deb2b59/embed',
      description: 'The brain is the control center of the nervous system, responsible for thoughts, memory, and body coordination.',
      color: 'bg-pink-600'
    },
    skeleton: {
      name: 'Skeleton',
      embedUrl: 'https://caskanatomy.info/open3dviewer/?model=overview-skeleton&export=on',
      description: 'The skeletal system provides structure, protects organs, produces blood cells, and enables movement.',
      color: 'bg-slate-400'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            3D Anatomy Explorer
          </h1>
          <p className="text-slate-300 text-lg">
            Interactive exploration of human organs in 3D
          </p>
        </div>

        {/* Organ Selection Buttons */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {Object.entries(organs).map(([key, organ]) => (
            <button
              key={key}
              onClick={() => setSelectedOrgan(key)}
              className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 ${
                selectedOrgan === key
                  ? `${organ.color} shadow-lg shadow-${organ.color}/50`
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {organ.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 3D Model Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${organs[selectedOrgan].color}`}></div>
                {organs[selectedOrgan].name}
              </h2>
              
              <div className="aspect-video w-full">
                <IframeWithFallback src={organs[selectedOrgan].embedUrl} title={organs[selectedOrgan].name} />
              </div>
              
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-300 text-sm">
                  💡 <strong>Tip:</strong> Click and drag to rotate • Scroll to zoom • Right-click and drag to pan
                </p>
              </div>
            </div>
          </div>

          {/* Information Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-slate-700 sticky top-8">
              <h3 className="text-xl font-bold mb-4 border-b border-slate-600 pb-3">
                About This Organ
              </h3>
              
              <p className="text-slate-300 leading-relaxed mb-6">
                {organs[selectedOrgan].description}
              </p>

              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h4 className="font-semibold text-cyan-400 mb-2">Key Functions</h4>
                  <ul className="text-sm text-slate-300 space-y-2">
                    {selectedOrgan === 'heart' && (
                      <>
                        <li>• Pumps blood throughout body</li>
                        <li>• Delivers oxygen to tissues</li>
                        <li>• Removes carbon dioxide</li>
                        <li>• Beats ~100,000 times daily</li>
                      </>
                    )}
                    {selectedOrgan === 'liver' && (
                      <>
                        <li>• Detoxifies harmful substances</li>
                        <li>• Produces bile for digestion</li>
                        <li>• Stores vitamins and minerals</li>
                        <li>• Regulates blood sugar levels</li>
                      </>
                    )}
                    {selectedOrgan === 'kidney' && (
                      <>
                        <li>• Filters blood and removes waste</li>
                        <li>• Regulates blood pressure</li>
                        <li>• Maintains fluid balance</li>
                        <li>• Produces red blood cells</li>
                      </>
                    )}
                    {selectedOrgan === 'brain' && (
                      <>
                        <li>• Processes sensory information</li>
                        <li>• Controls voluntary movement</li>
                        <li>• Regulates emotions and memory</li>
                        <li>• Maintains consciousness</li>
                      </>
                    )}
                    {selectedOrgan === 'skeleton' && (
                      <>
                        <li>• Provides structural support</li>
                        <li>• Protects vital organs</li>
                        <li>• Produces blood cells</li>
                        <li>• Stores minerals (calcium)</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h4 className="font-semibold text-cyan-400 mb-2">Quick Facts</h4>
                  <ul className="text-sm text-slate-300 space-y-2">
                    {selectedOrgan === 'heart' && (
                      <>
                        <li>• Size of a closed fist</li>
                        <li>• Has 4 chambers</li>
                        <li>• Pumps 5 liters per minute</li>
                      </>
                    )}
                    {selectedOrgan === 'liver' && (
                      <>
                        <li>• Largest internal organ</li>
                        <li>• Can regenerate itself</li>
                        <li>• Weighs about 3 pounds</li>
                      </>
                    )}
                    {selectedOrgan === 'kidney' && (
                      <>
                        <li>• You have two kidneys</li>
                        <li>• Each is about fist-sized</li>
                        <li>• Filters 200 liters daily</li>
                      </>
                    )}
                    {selectedOrgan === 'brain' && (
                      <>
                        <li>• Contains ~86 billion neurons</li>
                        <li>• Uses 20% of body's energy</li>
                        <li>• Weighs about 3 pounds</li>
                      </>
                    )}
                    {selectedOrgan === 'skeleton' && (
                      <>
                        <li>• 206 bones in adult body</li>
                        <li>• Babies have ~270 bones</li>
                        <li>• Bones constantly renew</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p>3D models powered by Sketchfab • Rotate, zoom, and explore each organ in detail</p>
        </div>
      </div>
    </div>
  );
}