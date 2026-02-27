"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Text, Sphere, Box, Cylinder, Line } from "@react-three/drei"
import * as THREE from "three"
import IframeWithFallback from "./vr/iframe-wrapper"
import { Differentiation } from "./math/differentiation"
import { Integration } from "./math/integration"
import { Vectors3D } from "./math/vectors-3d"
import { Probability } from "./math/probability"
import { FunctionInput } from "./math/function-input"
import AnatomyExplorer from "@/components/experiments/vr/anatomy-explorer"
import { CellBiology } from "@/components/experiments/vr/cell-biology"
import { ChemistryLab } from "@/components/experiments/vr/chemistry-lab"
import PhysicsLab from "@/components/experiments/vr/physics-lab"
import SpaceExploration from "@/components/experiments/vr/space-exploration"
import EnvironmentalScience from "@/components/experiments/vr/environmental-science"
import HistoricalLandmarks from "@/components/experiments/vr/historical-site"
import { RoboticsSimulator } from "@/components/experiments/vr/robotics-simulator"
import ProgrammingVisualizer from "@/components/experiments/vr/programming-visualizer"
import NetworkSimulation from "@/components/experiments/vr/network-simulation"
import AimlVisualizer from "@/components/experiments/vr/ai-ml-visualizer"

interface ExperimentViewerProps {
  experiment: {
    id: string
    title: string
    subject: string
    parameters: any[]
  }
}

// shared iframe wrapper imported from ./vr/iframe-wrapper

// Pendulum Component
function Pendulum({
  length = 1,
  mass = 0.5,
  angle = 15,
  gravity = 9.81,
  isRunning = false,
  damping = 0.002,
}: {
  length?: number
  mass?: number
  angle?: number
  gravity?: number
  isRunning?: boolean
  damping?: number
}) {
  const pendulumRef = useRef<THREE.Group>(null)
  const keRef = useRef<THREE.Mesh>(null)
  const peRef = useRef<THREE.Mesh>(null)
  const [currentAngle, setCurrentAngle] = useState((angle * Math.PI) / 180)
  const [angularVelocity, setAngularVelocity] = useState(0)

  useFrame((_, delta) => {
    if (!pendulumRef.current || !isRunning) return
    const angularAcceleration = -(gravity / length) * Math.sin(currentAngle) - damping * angularVelocity
    const newVel = angularVelocity + angularAcceleration * delta
    const newAngle = currentAngle + newVel * delta
    setAngularVelocity(newVel)
    setCurrentAngle(newAngle)
    pendulumRef.current.rotation.z = newAngle

    // energy bars (scaled visualization)
    const h = length * (1 - Math.cos(newAngle))
    const pe = Math.max(0, mass * gravity * h)
    const ke = Math.max(0, 0.5 * mass * Math.pow(length * newVel, 2))
    const scale = 0.15
    if (peRef.current) {
      const y = pe * scale
      peRef.current.scale.y = Math.max(0.001, y)
      peRef.current.position.y = -0.5 + y / 2
    }
    if (keRef.current) {
      const y = ke * scale
      keRef.current.scale.y = Math.max(0.001, y)
      keRef.current.position.y = -0.5 + y / 2
    }
  })

  useEffect(() => {
    setCurrentAngle((angle * Math.PI) / 180)
    setAngularVelocity(0)
  }, [angle])

  return (
    <group>
      <Sphere args={[0.08]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#666" />
      </Sphere>
      <group ref={pendulumRef} position={[0, 2, 0]}>
        <Cylinder args={[0.03, 0.03, length]} position={[0, -length / 2, 0]}>
          <meshStandardMaterial color="#333" />
        </Cylinder>
        <Sphere args={[Math.sqrt(mass) * 0.35]} position={[0, -length, 0]}>
          <meshStandardMaterial color="#e74c3c" />
        </Sphere>
      </group>

      {/* energy bars */}
      <group position={[-1.6, 0, 0]}>
        <Box ref={peRef} args={[0.28, 0.001, 0.28]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#60a5fa" />
        </Box>
        <Text position={[0, -0.8, 0]} fontSize={0.08} color="white" anchorX="center">
          {"PE"}
        </Text>
        {/* numeric PE display */}
        <Text position={[0, -0.25, 0]} fontSize={0.06} color="white" anchorX="center">
          {(() => {
            const h = length * (1 - Math.cos(currentAngle))
            const pe = Math.max(0, mass * gravity * h)
            return `PE ${pe.toFixed(2)} J`
          })()}
        </Text>
      </group>
      <group position={[-1.1, 0, 0]}>
        <Box ref={keRef} args={[0.28, 0.001, 0.28]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#f59e0b" />
        </Box>
        <Text position={[0, -0.8, 0]} fontSize={0.08} color="white" anchorX="center">
          {"KE"}
        </Text>
        <Text position={[0, -0.25, 0]} fontSize={0.06} color="white" anchorX="center">
          {(() => {
            const ke = Math.max(0, 0.5 * mass * Math.pow(length * angularVelocity, 2))
            return `KE ${ke.toFixed(2)} J`
          })()}
        </Text>
      </group>

      <Box args={[4, 0.1, 1]} position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#95a5a6" />
      </Box>
    </group>
  )
}

// Projectile Motion Component
function ProjectileMotion({
  v0 = 10,
  angle = 45,
  g = 9.81,
}: {
  v0?: number
  angle?: number
  g?: number
}) {
  const projRef = useRef<THREE.Mesh>(null)
  const tRef = useRef(0)
  const [points, setPoints] = useState<[number, number, number][]>([[0, 0, 0]])

  const rad = useMemo(() => (angle * Math.PI) / 180, [angle])
  const range = useMemo(() => (v0 * v0 * Math.sin(2 * rad)) / g, [v0, rad, g])
  const hMax = useMemo(() => (v0 * v0 * Math.sin(rad) * Math.sin(rad)) / (2 * g), [v0, rad, g])

  useEffect(() => {
    tRef.current = 0
    setPoints([[0, 0, 0]])
    if (projRef.current) projRef.current.position.set(0, 0, 0)
  }, [v0, angle, g])

  useFrame((_, delta) => {
    if (!projRef.current) return
    tRef.current += delta
    const vx = v0 * Math.cos(rad)
    const vy0 = v0 * Math.sin(rad)
    const x = vx * tRef.current
    const y = vy0 * tRef.current - 0.5 * g * tRef.current * tRef.current

    if (y < 0) {
      tRef.current = 0
      setPoints([[0, 0, 0]])
      projRef.current.position.set(0, 0, 0)
      return
    }

    projRef.current.position.set(x, y, 0)
    setPoints((prev) => {
      const next = [...prev, [x, y, 0]]
      return next.length > 240 ? next.slice(next.length - 240) : next
    })
  })

  return (
    <group>
      {/* ground */}
      <Box args={[Math.max(50, range + 10), 0.08, 2]} position={[Math.max(25, (range + 10) / 2), -0.04, 0]}>
        <meshStandardMaterial color="#9ca3af" />
      </Box>

      {/* launcher */}
      <Box args={[0.4, 0.4, 0.4]} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#334155" />
      </Box>

      {/* projectile */}
      <Sphere ref={projRef} args={[0.15]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#f59e0b" />
      </Sphere>

      {/* trajectory line */}
      <Line points={points} color="#f59e0b" lineWidth={2} dashed={false} transparent opacity={0.9} />

      {/* analytical markers */}
      <group>
        {/* range marker */}
        <Line
          points={[
            [range, 0, 0],
            [range, 0.8, 0],
          ]}
          color="#10b981"
          lineWidth={2}
        />
        <Text position={[range, 1.0, 0]} fontSize={0.1} color="white" anchorX="center">
          {`Range ≈ ${range.toFixed(1)} m`}
        </Text>
        {/* max height marker (at x = v0^2*sin(2θ)/(2g)? Actually x at peak is v0^2 * sin(2θ)/(2g) */}
        <Line
          points={[
            [range / 2, 0, 0],
            [range / 2, hMax, 0],
          ]}
          color="#3b82f6"
          lineWidth={2}
        />
        <Text position={[range / 2, hMax + 0.2, 0]} fontSize={0.1} color="white" anchorX="center">
          {`Hmax ≈ ${hMax.toFixed(1)} m`}
        </Text>
      </group>

      <Text position={[0, 1.2, 0]} fontSize={0.12} color="white" anchorX="center">
        {"Projectile Motion"}
      </Text>
    </group>
  )
}

// Molecular Structure Component
function MolecularStructure({
  molecule = "Water",
  visualization = "Ball & Stick",
  autoRotate = false,
  labels = true,
}: any) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  const molecules = {
    Water: {
      atoms: [
        { element: "O", position: [0, 0, 0], color: "#ff0000", size: 0.18 },
        { element: "H", position: [0.76, 0.59, 0], color: "#ffffff", size: 0.12 },
        { element: "H", position: [-0.76, 0.59, 0], color: "#ffffff", size: 0.12 },
      ],
      bonds: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
      ],
    },
    Methane: {
      atoms: [
        { element: "C", position: [0, 0, 0], color: "#222222", size: 0.2 },
        { element: "H", position: [1, 1, 1], color: "#ffffff", size: 0.12 },
        { element: "H", position: [-1, -1, 1], color: "#ffffff", size: 0.12 },
        { element: "H", position: [-1, 1, -1], color: "#ffffff", size: 0.12 },
        { element: "H", position: [1, -1, -1], color: "#ffffff", size: 0.12 },
      ],
      bonds: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 0, to: 3 },
        { from: 0, to: 4 },
      ],
    },
    Benzene: (() => {
      const r = 1.2
      const atoms = Array.from({ length: 6 }).map((_, i) => {
        const t = (i / 6) * Math.PI * 2
        return { element: "C", position: [r * Math.cos(t), 0, r * Math.sin(t)], color: "#222222", size: 0.18 }
      })
      const bonds = Array.from({ length: 6 }).map((_, i) => ({ from: i, to: (i + 1) % 6 }))
      return { atoms, bonds }
    })(),
  }

  const atomicNumbers: Record<string, number> = { H: 1, C: 6, O: 8 }

  const current = molecules[molecule as keyof typeof molecules] || molecules.Water

  return (
    <group ref={groupRef}>
      {current.atoms.map((atom, index) => (
        <group key={index}>
          <Sphere args={[atom.size * 1.4]} position={atom.position}>
            <meshStandardMaterial color={atom.color} />
          </Sphere>
          {labels && (
            <Text
              position={[atom.position[0], atom.position[1] + 0.35, atom.position[2]]}
              fontSize={0.085}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {`${atom.element}${atomicNumbers[atom.element] ? ' ' + atomicNumbers[atom.element] : ''}`}
            </Text>
          )}
        </group>
      ))}

      {visualization === "Ball & Stick" &&
        current.bonds.map((bond, idx) => {
          const from = current.atoms[bond.from].position as [number, number, number]
          const to = current.atoms[bond.to].position as [number, number, number]
          return <CylinderBetweenPoints key={idx} from={from} to={to} radius={0.06} />
        })}
    </group>
  )
}

// Cell Structure Component
function CellStructure({ zoom = 1, showOrganelles = true }: any) {
  // Render a Sketchfab iframe for the cell structure. This component
  // purposely returns DOM markup (not Three.js objects) and must be
  // rendered outside of any react-three-fiber <Canvas>.
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-4xl h-[80vh] mx-auto p-4">
        <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl">
          <IframeWithFallback src="https://sketchfab.com/models/cdabc716a88d41908d926109ede7aa4d/embed" title="Célula humana_human cell free download" />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-300">
            <a
              href="https://sketchfab.com/3d-models/celula-humana-human-cell-free-download-cdabc716a88d41908d926109ede7aa4d?utm_medium=embed&utm_campaign=share-popup&utm_content=cdabc716a88d41908d926109ede7aa4d"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Célula humana_human cell free download
            </a>
            {" by "}
            <a
              href="https://sketchfab.com/oscarjimenez?utm_medium=embed&utm_campaign=share-popup&utm_content=cdabc716a88d41908d926109ede7aa4d"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              oscarjimenez
            </a>
            {" on "}
            <a
              href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=cdabc716a88d41908d926109ede7aa4d"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Sketchfab
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
function DNAHelix() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-4xl h-[80vh] mx-auto p-4">
        <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl">
          <IframeWithFallback src="https://sketchfab.com/models/4d57784b0d4841d0ab3d43d526df1c3f/embed" title="Deoxyribonucleic acid (DNA)" />
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-300">
            <a 
              href="https://sketchfab.com/3d-models/deoxyribonucleic-acid-dna-4d57784b0d4841d0ab3d43d526df1c3f?utm_medium=embed&utm_campaign=share-popup&utm_content=4d57784b0d4841d0ab3d43d526df1c3f" 
              target="_blank" 
              rel="nofollow noopener noreferrer"
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Deoxyribonucleic acid (DNA)
            </a>
            {" by "}
            <a 
              href="https://sketchfab.com/arloopa?utm_medium=embed&utm_campaign=share-popup&utm_content=4d57784b0d4841d0ab3d43d526df1c3f" 
              target="_blank" 
              rel="nofollow noopener noreferrer"
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
          
            </a>
            {" on "}
            <a 
              href="https://sketchfab.com?utm_medium=embed&utm_campaign=share-popup&utm_content=4d57784b0d4841d0ab3d43d526df1c3f" 
              target="_blank" 
              rel="nofollow noopener noreferrer"
              className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
          
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper to draw bonds accurately between two points
function CylinderBetweenPoints({
from,
to,
radius = 0.02,
color = "#666",
}: {
from: [number, number, number]
to: [number, number, number]
radius?: number
color?: string
}) {
const start = useMemo(() => new THREE.Vector3(...from), [from])
const end = useMemo(() => new THREE.Vector3(...to), [to])
const dir = useMemo(() => end.clone().sub(start), [start, end])
const length = useMemo(() => dir.length(), [dir])
const mid = useMemo(() => start.clone().addScaledVector(dir, 0.5), [start, dir])
const quat = useMemo(() => {
const up = new THREE.Vector3(0, 1, 0)
const q = new THREE.Quaternion()
q.setFromUnitVectors(up, dir.clone().normalize())
return q
}, [dir])

return (
<group position={mid.toArray() as [number, number, number]} quaternion={quat}>
<Cylinder args={[radius, radius, length, 16]}>
<meshStandardMaterial color={color} />
</Cylinder>
</group>
)
}
// Chemical Reactions VR experiment with simple stochastic A -> B and 3D concentration bars
function ChemicalReactions({
  temperature = 298,
  k = 0.5,
  showGraph = true,
}: {
  temperature?: number
  k?: number
  showGraph?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const N = 150 // total "molecules"
  const [states] = useState<number[]>(() => Array.from({ length: N }).map(() => 0)) // 0: A, 1: B
  const [positions] = useState<[number, number, number][]>(() =>
    Array.from({ length: N }).map(() => [
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 4,
    ]),
  )

  const concARef = useRef(N)
  const concBRef = useRef(0)
  const [concA, setConcA] = useState(N)
  const [concB, setConcB] = useState(0)

  useFrame((_, delta) => {
    // temperature boosts effective rate
    const kEff = k * Math.exp((temperature - 298) / 500)
    const p = 1 - Math.exp(-kEff * delta)
    for (let i = 0; i < N; i++) {
      if (states[i] === 0 && Math.random() < p) {
        states[i] = 1
        concARef.current -= 1
        concBRef.current += 1
      }
    }
    // subtle motion
    positions.forEach((pos, i) => {
      pos[0] += (Math.random() - 0.5) * 0.01
      pos[1] += (Math.random() - 0.5) * 0.01
      pos[2] += (Math.random() - 0.5) * 0.01
      // bounce within container
      pos[0] = Math.max(-2, Math.min(2, pos[0]))
      pos[1] = Math.max(-1, Math.min(1, pos[1]))
      pos[2] = Math.max(-2, Math.min(2, pos[2]))
    })
  })

  // keep numeric labels in sync (updates state periodically)
  useFrame(() => {
    if (concARef.current !== concA) setConcA(concARef.current)
    if (concBRef.current !== concB) setConcB(concBRef.current)
  })

  const barHeightA = useMemo(() => () => (concARef.current / N) * 2.0, [N])
  const barHeightB = useMemo(() => () => (concBRef.current / N) * 2.0, [N])

  return (
    <group ref={groupRef}>
      {/* container */}
      <Box args={[5, 2.5, 5]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#111827" transparent opacity={0.1} />
      </Box>

      {/* molecules */}
      {positions.map((p, i) => (
        <Sphere key={i} args={[0.06]} position={p}>
          <meshStandardMaterial color={states[i] === 0 ? "#3b82f6" : "#ef4444"} />
        </Sphere>
      ))}

      <Text position={[0, -1.5, 0]} fontSize={0.12} color="white" anchorX="center">
        {"Chemical Reaction: A → B"}
      </Text>

      {/* simple 3D bar chart for concentrations */}
      {showGraph && (
        <group position={[2.6, 0, 0]}>
          <Box args={[0.4, barHeightA(), 0.4]} position={[0, barHeightA() / 2 - 1, 0]}>
            <meshStandardMaterial color="#3b82f6" />
          </Box>
          <Text position={[0, 0.8, 0]} fontSize={0.08} color="white" anchorX="center">
            {"[A]"}
          </Text>
          <Text position={[0, barHeightA() / 2 - 0.6, 0]} fontSize={0.07} color="white" anchorX="center">
            {`${concA} (${((concA / N) * 100).toFixed(1)}%)`}
          </Text>

          <Box args={[0.4, barHeightB(), 0.4]} position={[0.8, barHeightB() / 2 - 1, 0]}>
            <meshStandardMaterial color="#ef4444" />
          </Box>
          <Text position={[0.8, 0.8, 0]} fontSize={0.08} color="white" anchorX="center">
            {"[B]"}
          </Text>
          <Text position={[0.8, barHeightB() / 2 - 0.6, 0]} fontSize={0.07} color="white" anchorX="center">
            {`${concB} (${((concB / N) * 100).toFixed(1)}%)`}
          </Text>
        </group>
      )}
    </group>
  )
}

export function ExperimentViewer({ experiment }: ExperimentViewerProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [isRunning, setIsRunning] = useState(false)

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

  // Return sensible camera positions and controls tuning per experiment
  const getCameraFor = (id: string) => {
    switch (id) {
      case "pendulum-motion":
        return { position: [6, 4, 8], fov: 55 }
      case "projectile-motion":
        return { position: [20, 8, 6], fov: 50 }
      case "molecular-structure":
        return { position: [0, 2.5, 6], fov: 45 }
      case "dna-structure":
        return { position: [0, 2.5, 8], fov: 50 }
      case "cell-structure":
        return { position: [0, 3.5, 8], fov: 50 }
      case "chemical-reactions":
        return { position: [6, 4, 8], fov: 50 }
      default:
        return { position: [4, 3, 6], fov: 60 }
    }
  }

  const camera = getCameraFor(experiment.id)

  const renderExperiment = () => {
    switch (experiment.id) {
      case "pendulum-motion":
        return (
          <Pendulum
            length={parameters.length || 1}
            mass={parameters.mass || 0.5}
            angle={parameters.angle || 15}
            gravity={parameters.gravity ?? 9.81}
            isRunning={true}
          />
        )
      case "projectile-motion":
        return (
          <ProjectileMotion v0={parameters.v0 || 12} angle={parameters.angle || 45} g={parameters.gravity ?? 9.81} />
        )
      case "molecular-structure":
        return (
          <MolecularStructure
            molecule={parameters.molecule || "Water"}
            visualization={parameters.visualization || "Ball & Stick"}
            autoRotate={!!parameters.rotation}
            labels={parameters.labels !== false}
          />
        )
      case "chemical-reactions":
        return (
          <ChemicalReactions
            temperature={parameters.temperature ?? 298}
            k={parameters.k ?? 0.5}
            showGraph={parameters.showGraph !== false}
          />
        )
      case "cell-structure":
        // DOM-based (Sketchfab iframe) — render outside Canvas
        return null
      case "dna-structure":
        // DNAHelix contains a regular DOM <iframe> and must be rendered
        // outside of the react-three-fiber <Canvas> to avoid R3F trying
        // to map HTML elements to Three.js objects.
        return null
      case "anatomy-explorer":
        // DOM-based UI — render outside Canvas
        return null
      case "cell-biology":
        // DOM-based (iframe) UI — render outside Canvas
        return null
      case "vr-chemistry-lab":
        // Chemistry lab is a full React UI (DOM + its own <canvas>).
        // Render it outside the main R3F <Canvas> to avoid R3F
        // interpreting HTML elements (like <h1>, <div>) as Three objects.
        return null
      case "physics-lab":
        return <PhysicsLab parameters={parameters} />
      case "space-exploration":
        // DOM-based UI — render outside Canvas
        return null
      case "environmental-science":
        // EnvironmentalScience returns a full DOM UI (iframes, headings).
        // Do not render it inside the react-three-fiber <Canvas>.
        return null
      case "historical-site":
        // Historical site is a DOM-based UI; render it outside the R3F Canvas.
        return null
      case "robotics-simulator":
        return <RoboticsSimulator parameters={parameters} />
      case "vr-programming-environment":
        // handled outside the Canvas because it is a full DOM/SVG UI
        return null
      case "virtual-network-simulation":
        // handled outside the Canvas
        return null
      case "ai-ml-visualizer":
        // handled outside the Canvas
        return null
      default:
        return (
          <group>
            <Text position={[0, 0, 0]} fontSize={0.5} color="gray" anchorX="center">
              {"Experiment Loading..."}
            </Text>
          </group>
        )
    }
  }

  // Math experiments (self-contained Canvas inside each component)
  // Wrapper for the simple `function-input` experiment so it receives
  // the `value` and `onChange` props it expects when rendered via
  // `<ExperimentComponent {...experiment} />`.
  function FunctionInputWrapper({ title, parameters }: { title?: string; parameters?: any[] }) {
    const [value, setValue] = useState(() => {
      try {
        return (parameters && parameters[0] && parameters[0].default) || ""
      } catch {
        return ""
      }
    })

    return <FunctionInput label={title ?? "f(x)"} value={value} onChange={setValue} />
  }
  const experimentComponents = {
    differentiation: Differentiation,
    integration: Integration,
    "vectors-3d": Vectors3D,
    probability: Probability,
  } as const

  const ExperimentComponent = (experimentComponents as any)[experiment.id]

  if (ExperimentComponent) {
    return <ExperimentComponent {...experiment} />
  }

  // `function-input` is a DOM-based UI (not a react-three-fiber scene).
  // Render it outside the <Canvas> so R3F doesn't try to interpret
  // DOM elements as Three objects which causes a blank screen.
  if (experiment.id === "function-input") {
    return <FunctionInputWrapper title={experiment.title} parameters={experiment.parameters} />
  }

  // `historical-site` is a full DOM UI (rich markup). Render outside Canvas.
  if (experiment.id === "historical-site") {
    return <HistoricalLandmarks parameters={parameters} />
  }

  // `space-exploration` is a DOM UI (full page UI / iframe). Render outside Canvas.
  if (experiment.id === "space-exploration") {
    return <SpaceExploration parameters={parameters} />
  }

  // `cell-biology` uses an iframe wrapper and is a DOM UI. Render outside Canvas.
  if (experiment.id === "cell-biology") {
    return <CellBiology parameters={parameters} />
  }

  // Some experiments are full React UIs (not react-three-fiber scenes).
  // Render those outside the <Canvas> to avoid R3F trying to interpret
  // regular DOM/SVG elements as Three objects (which causes errors like
  // "H1 is not part of the THREE namespace").
  if (experiment.id === "ai-ml-visualizer") {
    return <AimlVisualizer parameters={parameters} />
  }

  if (experiment.id === "virtual-network-simulation") {
    return <NetworkSimulation />
  }

  // Programming visualizer is a full React UI (DOM + SVG). Render it
  // outside of the R3F <Canvas> so react-three-fiber doesn't try to map
  // DOM elements (like <h1>, <div>, <svg>) to Three.js objects.
  if (experiment.id === "vr-programming-environment") {
    return <ProgrammingVisualizer parameters={parameters} />
  }

  // PhysicsLab contains regular DOM controls and its own <Canvas>.
  // Render it outside the main R3F <Canvas> to avoid R3F interpreting
  // HTML elements (like <h3>) as Three objects.
  if (experiment.id === "physics-lab") {
    return <PhysicsLab />
  }

  // Some VR experiment components embed regular DOM (e.g., an <iframe>).
  // Render those outside the main R3F <Canvas> so react-three-fiber
  // doesn't try to interpret HTML elements as Three.js objects.
  if (experiment.id === "cell-biology") {
    return <CellBiology parameters={parameters} />
  }

  // AnatomyExplorer is a full DOM UI (iframes, buttons). Render it outside Canvas.
  if (experiment.id === "anatomy-explorer") {
    return <AnatomyExplorer parameters={parameters} />
  }

  // DNA structure is implemented as an embedded Sketchfab iframe (DOM).
  // Render it outside the R3F <Canvas> to avoid the "Iframe is not part
  // of the THREE namespace" runtime error.
  if (experiment.id === "dna-structure") {
    return <DNAHelix />
  }

  // Cell structure is served via Sketchfab iframe (DOM). Render it
  // outside the react-three-fiber <Canvas> so R3F doesn't try to map
  // the <iframe> to a Three object.
  if (experiment.id === "cell-structure") {
    return <CellStructure />
  }

  // EnvironmentalScience is a full DOM UI (iframes, headings, controls).
  // Render it outside the main R3F <Canvas> to avoid R3F mapping DOM
  // elements (like <h1>) into Three objects which causes the
  // "H1 is not part of the THREE namespace" runtime error.
  if (experiment.id === "environmental-science") {
    return <EnvironmentalScience parameters={parameters} />
  }

  // VR Chemistry Lab is a full React UI (it renders DOM and its own canvas).
  // Render it outside the main R3F <Canvas> to avoid R3F mapping HTML nodes
  // (like <h1>, <div>) to Three.js objects which causes the "H1 is not
  // part of the THREE namespace" error.
  if (experiment.id === "vr-chemistry-lab") {
    return <ChemistryLab parameters={parameters} />
  }

  return (
    <div className="h-full">
      <Canvas camera={camera} shadows dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 8]} intensity={1.0} castShadow />
        <pointLight position={[5, 5, 5]} intensity={0.6} />
        <Environment preset="city" />
        <OrbitControls enableDamping makeDefault minDistance={1} maxDistance={50} />
        {/* subtle grid */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <planeGeometry args={[50, 50, 40, 40]} />
          <meshBasicMaterial color="#ffffff" wireframe opacity={0.08} transparent />
        </mesh>
        {renderExperiment()}
      </Canvas>
    </div>
  )
}
