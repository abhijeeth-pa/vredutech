"use client"

// import { useRef } from "react"
// import { useFrame } from "@react-three/fiber"
// import { Sphere, Text } from "@react-three/drei"
// import type * as THREE from "three"

// export function SpaceExploration({
//   parameters = {},
// }: {
//   parameters?: { sunSize?: number; earthDistance?: number; moonDistance?: number; timeSpeed?: number }
// }) {
//   const sunRef = useRef<THREE.Mesh>(null)
//   const earthRef = useRef<THREE.Mesh>(null)
//   const moonRef = useRef<THREE.Mesh>(null)

//   useFrame((state) => {
//     const t = state.clock.elapsedTime * (parameters.timeSpeed ?? 1)
//     if (earthRef.current) {
//       const d = parameters.earthDistance ?? 5
//       earthRef.current.position.x = Math.cos(t * 0.5) * d
//       earthRef.current.position.z = Math.sin(t * 0.5) * d
//     }
//     if (moonRef.current && earthRef.current) {
//       const md = parameters.moonDistance ?? 1.5
//       moonRef.current.position.x = earthRef.current.position.x + Math.cos(t * 2) * md
//       moonRef.current.position.z = earthRef.current.position.z + Math.sin(t * 2) * md
//     }
//     if (sunRef.current) sunRef.current.rotation.y = t * 0.05
//   })

//   return (
//     <group>
//       <Sphere ref={sunRef} args={[parameters.sunSize ?? 1]}>
//         <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.6} />
//       </Sphere>
//       <Sphere ref={earthRef} args={[0.35]} position={[5, 0, 0]}>
//         <meshStandardMaterial color="#60a5fa" />
//       </Sphere>
//       <Sphere ref={moonRef} args={[0.12]} position={[6.5, 0, 0]}>
//         <meshStandardMaterial color="#cbd5e1" />
//       </Sphere>
//       <Text position={[0, -1.6, 0]} fontSize={0.12} color="white" anchorX="center">
//         {"Space Exploration"}
//       </Text>
//     </group>
//   )
// }
import { useState } from 'react';

export default function SpaceExplorer() {
  const [selectedObject, setSelectedObject] = useState('solar-system');
  
  const spaceObjects = {
    'solar-system': {
      name: 'Solar System',
      embedUrl: 'https://sketchfab.com/models/b7c69a6b655b47c99f871d5ec5aee854/embed?autostart=1',
      description: 'An animated view of our solar system showing all planets orbiting the Sun. Watch as Earth, Mars, Jupiter, and other planets move in their celestial dance.',
      color: 'bg-orange-600',
      icon: '🌌'
    },
    'hubble': {
      name: 'Hubble Telescope',
      embedUrl: 'https://sketchfab.com/models/6546d1989bcd4e8aa135f0d659c53c9c/embed',
      description: 'The Hubble Space Telescope, one of humanity\'s greatest scientific instruments, orbiting Earth and capturing breathtaking images of the cosmos.',
      color: 'bg-blue-600',
      icon: '🔭'
    },
    'earth-day': {
      name: 'Earth (Day)',
      embedUrl: 'https://sketchfab.com/models/41fc80d85dfd480281f21b74b2de2faa/embed',
      description: 'Our beautiful home planet Earth during daylight hours, showing continents, oceans, and cloud formations in stunning detail.',
      color: 'bg-blue-500',
      icon: '🌍'
    },
    'earth-night': {
      name: 'Earth (Night)',
      embedUrl: 'https://sketchfab.com/models/c2e4294c32ea4d8b850e152fc26aeeb4/embed',
      description: 'Earth as seen from space during nighttime, with city lights twinkling across the continents like a constellation on the surface.',
      color: 'bg-indigo-900',
      icon: '🌏'
    },
    'space-scene': {
      name: 'Space Scene',
      embedUrl: 'https://sketchfab.com/models/d6521362b37b48e3a82bce4911409303/embed',
      description: 'An artistic representation of deep space, complete with celestial objects, asteroids, and the vast emptiness of the cosmos.',
      color: 'bg-purple-700',
      icon: '🚀'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-indigo-950 to-purple-950 text-white overflow-hidden">
      {/* Animated stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(2px 2px at 20% 30%, white, transparent),
                           radial-gradient(2px 2px at 60% 70%, white, transparent),
                           radial-gradient(1px 1px at 50% 50%, white, transparent),
                           radial-gradient(1px 1px at 80% 10%, white, transparent),
                           radial-gradient(2px 2px at 90% 60%, white, transparent),
                           radial-gradient(1px 1px at 33% 85%, white, transparent),
                           radial-gradient(1px 1px at 75% 40%, white, transparent)`,
          backgroundSize: '200% 200%',
          animation: 'twinkle 8s ease-in-out infinite'
        }}></div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-[float_6s_ease-in-out_infinite]">
          <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            🌟 Space Explorer 🌟
          </h1>
          <p className="text-slate-300 text-xl">
            Journey through the cosmos with interactive 3D models
          </p>
        </div>

        {/* Object Selection */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {Object.entries(spaceObjects).map(([key, obj]) => (
            <button
              key={key}
              onClick={() => setSelectedObject(key)}
              className={`px-5 py-3 rounded-xl font-semibold text-base transition-all transform hover:scale-110 hover:shadow-2xl ${
                selectedObject === key
                  ? `${obj.color} shadow-xl ring-2 ring-white/50`
                  : 'bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-sm'
              }`}
            >
              <span className="mr-2">{obj.icon}</span>
              {obj.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 3D Model Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-purple-500/30 hover:border-purple-400/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <span className="text-4xl">{spaceObjects[selectedObject].icon}</span>
                  {spaceObjects[selectedObject].name}
                </h2>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${spaceObjects[selectedObject].color}`}>
                  LIVE 3D
                </div>
              </div>
              
              <div className="relative w-full bg-black/50 rounded-2xl overflow-hidden" style={{ paddingBottom: '75%' }}>
                <iframe
                  title={spaceObjects[selectedObject].name}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  src={spaceObjects[selectedObject].embedUrl}
                />
              </div>
              
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/20">
                <p className="text-slate-300 text-sm flex items-start gap-2">
                  <span className="text-yellow-400 text-lg">💡</span>
                  <span><strong>Controls:</strong> Click and drag to rotate • Scroll to zoom • Right-click to pan • Double-click to reset view</span>
                </p>
              </div>
            </div>
          </div>

          {/* Information Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-purple-500/30 sticky top-8">
              <h3 className="text-2xl font-bold mb-4 border-b border-purple-500/30 pb-3 flex items-center gap-2">
                <span className="text-2xl">📖</span>
                About This Object
              </h3>
              
              <p className="text-slate-300 leading-relaxed mb-6">
                {spaceObjects[selectedObject].description}
              </p>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-4 border border-purple-500/20">
                  <h4 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                    <span>⭐</span> Key Facts
                  </h4>
                  <ul className="text-sm text-slate-300 space-y-2">
                    {selectedObject === 'solar-system' && (
                      <>
                        <li>• Contains 8 planets and 1 star</li>
                        <li>• Jupiter is the largest planet</li>
                        <li>• Formed 4.6 billion years ago</li>
                        <li>• Extends to the Oort Cloud</li>
                      </>
                    )}
                    {selectedObject === 'hubble' && (
                      <>
                        <li>• Launched April 24, 1990</li>
                        <li>• Orbits at 547 km altitude</li>
                        <li>• Made 1.5+ million observations</li>
                        <li>• Size of a school bus</li>
                      </>
                    )}
                    {selectedObject === 'earth-day' && (
                      <>
                        <li>• 71% covered by water</li>
                        <li>• 8.7 million species</li>
                        <li>• Atmosphere is 78% nitrogen</li>
                        <li>• Only known planet with life</li>
                      </>
                    )}
                    {selectedObject === 'earth-night' && (
                      <>
                        <li>• City lights visible from space</li>
                        <li>• Shows human civilization</li>
                        <li>• Aurora visible near poles</li>
                        <li>• Lightning storms appear as flashes</li>
                      </>
                    )}
                    {selectedObject === 'space-scene' && (
                      <>
                        <li>• Space is a near-perfect vacuum</li>
                        <li>• Contains billions of galaxies</li>
                        <li>• Temperatures near absolute zero</li>
                        <li>• No sound can travel in space</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-xl p-4 border border-blue-500/20">
                  <h4 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                    <span>🔬</span> Did You Know?
                  </h4>
                  <ul className="text-sm text-slate-300 space-y-2">
                    {selectedObject === 'solar-system' && (
                      <>
                        <li>• Light takes 8 min from Sun to Earth</li>
                        <li>• Venus spins backwards</li>
                        <li>• Saturn would float in water</li>
                      </>
                    )}
                    {selectedObject === 'hubble' && (
                      <>
                        <li>• Named after Edwin Hubble</li>
                        <li>• Travels at 27,000 km/h</li>
                        <li>• Has been serviced 5 times</li>
                      </>
                    )}
                    {selectedObject === 'earth-day' && (
                      <>
                        <li>• Rotates at 1,670 km/h</li>
                        <li>• Year is 365.25 days</li>
                        <li>• One moon orbits Earth</li>
                      </>
                    )}
                    {selectedObject === 'earth-night' && (
                      <>
                        <li>• Millions of lights shine below</li>
                        <li>• Shows electric grids patterns</li>
                        <li>• Fishing boats visible at sea</li>
                      </>
                    )}
                    {selectedObject === 'space-scene' && (
                      <>
                        <li>• Space smells like seared steak</li>
                        <li>• Footprints on moon last forever</li>
                        <li>• Neutron stars spin 600x/sec</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl p-4 border border-pink-500/20 text-center">
                  <p className="text-xs text-slate-400 italic">
                    "The universe is under no obligation to make sense to you." <br/>
                    <span className="text-purple-400">- Neil deGrasse Tyson</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-black/40 backdrop-blur-md rounded-full px-6 py-3 border border-purple-500/30">
            <p className="text-slate-400 text-sm">
              🌠 3D models powered by Sketchfab • Explore the wonders of space
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}