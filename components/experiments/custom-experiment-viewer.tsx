"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Text, Sphere, Box } from "@react-three/drei"
import * as THREE from "three"

interface CustomExperimentViewerProps {
  experiment: {
    id: string
    title: string
    code: string
    parameters: Array<{
      name: string
      label: string
      type: string
      min?: number
      max?: number
      default: any
      options?: string[]
    }>
  }
}

function SolarSystemExperiment({ parameters }: { parameters: Record<string, any> }) {
  const sunRef = useRef<THREE.Mesh>(null)
  const earthRef = useRef<THREE.Mesh>(null)
  const moonRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const time = state.clock.elapsedTime * (parameters.timeSpeed || 1)

    // Earth orbit around Sun
    if (earthRef.current) {
      const earthDistance = parameters.earthDistance || 5
      earthRef.current.position.x = Math.cos(time * 0.5) * earthDistance
      earthRef.current.position.z = Math.sin(time * 0.5) * earthDistance
      earthRef.current.rotation.y = time * 2 // Earth rotation
    }

    // Moon orbit around Earth
    if (moonRef.current && earthRef.current) {
      const moonDistance = parameters.moonDistance || 2
      moonRef.current.position.x = earthRef.current.position.x + Math.cos(time * 2) * moonDistance
      moonRef.current.position.z = earthRef.current.position.z + Math.sin(time * 2) * moonDistance
    }

    // Sun rotation
    if (sunRef.current) {
      sunRef.current.rotation.y = time * 0.1
    }
  })

  return (
    <group>
      {/* Sun with glow effect */}
      <Sphere ref={sunRef} args={[parameters.sunSize || 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#FDB813" emissive="#FDB813" emissiveIntensity={0.5} />
      </Sphere>
      <Text position={[0, -1.5, 0]} fontSize={0.3} color="white" anchorX="center">
        Sun
      </Text>

      {/* Earth with texture-like appearance */}
      <Sphere ref={earthRef} args={[parameters.earthSize || 0.3]} position={[5, 0, 0]}>
        <meshStandardMaterial color="#6B93D6" roughness={0.8} />
      </Sphere>

      {/* Moon */}
      <Sphere ref={moonRef} args={[parameters.moonSize || 0.1]} position={[7, 0, 0]}>
        <meshStandardMaterial color="#C0C0C0" roughness={0.9} />
      </Sphere>

      {/* Orbital paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[parameters.earthDistance || 5, (parameters.earthDistance || 5) + 0.02, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.2} />
      </mesh>

      {/* Moon orbital path around Earth */}
      {earthRef.current && (
        <mesh position={[earthRef.current.position.x, 0, earthRef.current.position.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[parameters.moonDistance || 2, (parameters.moonDistance || 2) + 0.01, 32]} />
          <meshBasicMaterial color="gray" transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  )
}

function PendulumExperiment({ parameters }: { parameters: Record<string, any> }) {
  const pendulumRef = useRef<THREE.Group>(null)
  const ballRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (pendulumRef.current) {
      const time = state.clock.elapsedTime
      const length = parameters.length || 3
      const gravity = parameters.gravity || 9.81
      const angle = (parameters.amplitude || 0.5) * Math.sin(Math.sqrt(gravity / length) * time)

      pendulumRef.current.rotation.z = angle
    }
  })

  return (
    <group>
      {/* Pendulum pivot */}
      <Box args={[0.2, 0.2, 0.2]} position={[0, 4, 0]}>
        <meshStandardMaterial color="#8B4513" />
      </Box>

      {/* Pendulum arm and ball */}
      <group ref={pendulumRef} position={[0, 4, 0]}>
        {/* String/Rod */}
        <Box args={[0.02, parameters.length || 3, 0.02]} position={[0, -(parameters.length || 3) / 2, 0]}>
          <meshStandardMaterial color="#654321" />
        </Box>

        {/* Pendulum ball */}
        <Sphere ref={ballRef} args={[parameters.ballSize || 0.2]} position={[0, -(parameters.length || 3), 0]}>
          <meshStandardMaterial color="#FF6B6B" />
        </Sphere>
      </group>

      <Text position={[0, -1, 0]} fontSize={0.3} color="white" anchorX="center">
        Pendulum Physics
      </Text>
    </group>
  )
}

function DNAHelixExperiment({ parameters }: { parameters: Record<string, any> }) {
  const helixRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (helixRef.current) {
      helixRef.current.rotation.y = state.clock.elapsedTime * (parameters.rotationSpeed || 0.5)
    }
  })

  const helixPoints = []
  const turns = parameters.turns || 3
  const height = parameters.height || 6
  const radius = parameters.radius || 1

  for (let i = 0; i < 100; i++) {
    const t = (i / 100) * turns * Math.PI * 2
    const y = (i / 100) * height - height / 2

    // First strand
    helixPoints.push({
      position: [Math.cos(t) * radius, y, Math.sin(t) * radius],
      color: "#FF6B6B",
    })

    // Second strand (opposite)
    helixPoints.push({
      position: [Math.cos(t + Math.PI) * radius, y, Math.sin(t + Math.PI) * radius],
      color: "#4ECDC4",
    })
  }

  return (
    <group ref={helixRef}>
      {helixPoints.map((point, index) => (
        <Sphere key={index} args={[0.05]} position={point.position as [number, number, number]}>
          <meshStandardMaterial color={point.color} />
        </Sphere>
      ))}

      <Text position={[0, -4, 0]} fontSize={0.3} color="white" anchorX="center">
        DNA Double Helix
      </Text>
    </group>
  )
}

function WaveInterferenceExperiment({ parameters }: { parameters: Record<string, any> }) {
  const waveRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (waveRef.current) {
      const time = state.clock.elapsedTime
      const children = waveRef.current.children

      children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          const x = (index % 20) - 10
          const z = Math.floor(index / 20) - 10
          const distance1 = Math.sqrt((x - 2) ** 2 + z ** 2)
          const distance2 = Math.sqrt((x + 2) ** 2 + z ** 2)

          const wave1 = Math.sin(distance1 * (parameters.frequency || 1) - time * (parameters.speed || 2))
          const wave2 = Math.sin(distance2 * (parameters.frequency || 1) - time * (parameters.speed || 2))
          const amplitude = parameters.amplitude || 0.5

          child.position.y = (wave1 + wave2) * amplitude
        }
      })
    }
  })

  const wavePoints = []
  for (let x = 0; x < 20; x++) {
    for (let z = 0; z < 20; z++) {
      wavePoints.push([x - 10, 0, z - 10])
    }
  }

  return (
    <group ref={waveRef}>
      {wavePoints.map((point, index) => (
        <Sphere key={index} args={[0.05]} position={point as [number, number, number]}>
          <meshStandardMaterial color="#3498DB" />
        </Sphere>
      ))}

      <Text position={[0, -2, 0]} fontSize={0.3} color="white" anchorX="center">
        Wave Interference
      </Text>
    </group>
  )
}

export function CustomExperimentViewer({ experiment }: CustomExperimentViewerProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({})

  useEffect(() => {
    // Initialize parameters with default values
    const defaultParams: Record<string, any> = {}
    experiment.parameters.forEach((param) => {
      defaultParams[param.name] = param.default
    })
    setParameters(defaultParams)
  }, [experiment])

  // Listen for parameter changes from controls
  useEffect(() => {
    const handleParameterChange = (event: CustomEvent) => {
      setParameters((prev) => ({
        ...prev,
        [event.detail.name]: event.detail.value,
      }))
    }

    window.addEventListener("parameterChange", handleParameterChange as EventListener)
    return () => window.removeEventListener("parameterChange", handleParameterChange as EventListener)
  }, [])

  const renderExperiment = () => {
    const title = experiment.title.toLowerCase()
    const description = experiment.code.toLowerCase()

    // Detect experiment type from title and code content
    if (title.includes("solar") || title.includes("planet") || description.includes("solar")) {
      return <SolarSystemExperiment parameters={parameters} />
    } else if (title.includes("pendulum") || description.includes("pendulum")) {
      return <PendulumExperiment parameters={parameters} />
    } else if (title.includes("dna") || title.includes("helix") || description.includes("dna")) {
      return <DNAHelixExperiment parameters={parameters} />
    } else if (title.includes("wave") || title.includes("interference") || description.includes("wave")) {
      return <WaveInterferenceExperiment parameters={parameters} />
    }

    // Enhanced fallback experiment
    return <SolarSystemExperiment parameters={parameters} />
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 5, 10], fov: 75 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.6} color="#ffffff" />
        <pointLight position={[-5, 0, 5]} intensity={0.3} color="#4ECDC4" />

        <Environment preset="night" />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={3} maxDistance={20} />

        {renderExperiment()}

        {/* Grid floor for reference */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#1a1a2e" transparent opacity={0.3} wireframe />
        </mesh>
      </Canvas>

      {/* AI Generated Badge */}
      <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
        <span>🤖</span>
        AI Generated
      </div>

      {/* Enhanced Info Panel */}
      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-lg p-4 max-w-xs border border-white/20">
        <h3 className="font-semibold text-white mb-2">{experiment.title}</h3>
        <p className="text-sm text-gray-200 mb-3">Interactive VR experiment generated by AI</p>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span>🎛️</span>
          {experiment.parameters.length} parameters
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <p className="mb-1">🖱️ Drag to rotate • 🔍 Scroll to zoom</p>
        <p>🎛️ Use controls panel to adjust parameters</p>
      </div>
    </div>
  )
}
