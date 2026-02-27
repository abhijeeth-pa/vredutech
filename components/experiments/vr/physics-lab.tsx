"use client"
import { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Box, Sphere, Text, Line, Cylinder } from "@react-three/drei"
import * as THREE from "three"

function PhysicsScene({
  parameters = {},
}: {
  parameters?: { length?: number; gravity?: number; v0?: number; angle?: number }
}) {
  const pivot = useRef<THREE.Group>(null)
  const proj = useRef<THREE.Mesh>(null)
  
  const pendulumAngle = useRef(0.5)
  const pendulumVelocity = useRef(0)
  
  const tRef = useRef(0)
  const projectileActive = useRef(true)
  const [trajectoryPoints, setTrajectoryPoints] = useState<[number, number, number][]>([[1, 0.5, 0]])

  useFrame((_, dt) => {
    const L = parameters.length ?? 1.5
    const g = parameters.gravity ?? 9.81
    
    if (pivot.current) {
      const angularAccel = -(g / L) * Math.sin(pendulumAngle.current)
      pendulumVelocity.current += angularAccel * dt
      pendulumAngle.current += pendulumVelocity.current * dt
      pendulumVelocity.current *= 0.999
      pivot.current.rotation.z = pendulumAngle.current
    }

    if (proj.current && projectileActive.current) {
      tRef.current += dt
      const rad = ((parameters.angle ?? 35) * Math.PI) / 180
      const v0 = parameters.v0 ?? 8
      const vx = v0 * Math.cos(rad)
      const vy0 = v0 * Math.sin(rad)
      
      const x = 1 + vx * tRef.current
      const y = 0.5 + vy0 * tRef.current - 0.5 * g * tRef.current * tRef.current
      
      if (y <= 0.12) {
        projectileActive.current = false
        setTimeout(() => {
          tRef.current = 0
          projectileActive.current = true
          setTrajectoryPoints([[1, 0.5, 0]])
        }, 500)
      } else {
        proj.current.position.set(x, y, 0)
        setTrajectoryPoints(prev => [...prev, [x, y, 0]].slice(-180))
      }
    }
  })

  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-3, 3, 2]} intensity={0.6} color="#ffeedd" />
      
      <group position={[-2.5, 2.2, 0]}>
        <Sphere args={[0.08]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
        </Sphere>
        
        <group ref={pivot}>
          <Cylinder args={[0.015, 0.015, parameters.length ?? 1.5]} position={[0, -(parameters.length ?? 1.5) / 2, 0]}>
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
          </Cylinder>
          <Sphere args={[0.18]} position={[0, -(parameters.length ?? 1.5), 0]}>
            <meshStandardMaterial 
              color="#dc2626" 
              metalness={0.3} 
              roughness={0.4}
              emissive="#7f1d1d"
              emissiveIntensity={0.2}
            />
          </Sphere>
        </group>
      </group>

      <group position={[1, 0, 0]}>
        <Box args={[0.4, 0.5, 0.3]} position={[0, 0.25, 0]}>
          <meshStandardMaterial color="#1e40af" metalness={0.4} roughness={0.6} />
        </Box>
        <Sphere ref={proj} args={[0.12]} position={[0, 0.5, 0]}>
          <meshStandardMaterial 
            color="#f59e0b" 
            metalness={0.2} 
            roughness={0.3}
            emissive="#b45309"
            emissiveIntensity={0.3}
          />
        </Sphere>
      </group>

      {trajectoryPoints.length > 1 && (
        <Line 
          points={trajectoryPoints} 
          color="#fb923c" 
          lineWidth={2.5}
          opacity={0.8}
          transparent
        />
      )}

      <Box args={[12, 0.08, 5]} position={[0, 0.04, 0]} receiveShadow>
        <meshStandardMaterial 
          color="#64748b" 
          metalness={0.1} 
          roughness={0.8}
        />
      </Box>
      
      {Array.from({ length: 13 }).map((_, i) => (
        <Line
          key={`grid-x-${i}`}
          points={[[-6 + i, 0.09, -2.5], [-6 + i, 0.09, 2.5]]}
          color="#94a3b8"
          lineWidth={0.5}
          opacity={0.3}
          transparent
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <Line
          key={`grid-z-${i}`}
          points={[[-6, 0.09, -2.5 + i], [6, 0.09, -2.5 + i]]}
          color="#94a3b8"
          lineWidth={0.5}
          opacity={0.3}
          transparent
        />
      ))}

      <Box args={[12, 4, 0.1]} position={[0, 2, -2.5]}>
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </Box>

      <Text 
        position={[0, 3.5, -2.4]} 
        fontSize={0.18} 
        color="#f8fafc" 
        anchorX="center"
        fontWeight="bold"
      >
        Physics Simulation Lab
      </Text>
      
      <Text 
        position={[-2.5, 3, -2.4]} 
        fontSize={0.08} 
        color="#cbd5e1" 
        anchorX="center"
      >
        {`Pendulum L=${(parameters.length ?? 1.5).toFixed(1)}m`}
      </Text>
      <Text 
        position={[1, 3, -2.4]} 
        fontSize={0.08} 
        color="#cbd5e1" 
        anchorX="center"
      >
        {`Projectile v₀=${parameters.v0 ?? 8}m/s θ=${parameters.angle ?? 35}°`}
      </Text>
    </group>
  )
}

export default function PhysicsLab() {
  const [params, setParams] = useState({
    length: 1.5,
    gravity: 9.81,
    v0: 8,
    angle: 35
  })
  return (
    <div style={{ width: '100%', maxWidth: '100%', background: '#0f172a', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Controls panel */}
        <div style={{
          minWidth: 260,
          background: 'rgba(15, 23, 42, 0.95)',
          padding: 20,
          borderRadius: 12,
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          zIndex: 10,
          border: '1px solid rgba(255,255,255,0.06)',
          margin: 20,
          alignSelf: 'flex-start'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Controls</h3>

          <label style={{ display: 'block', marginBottom: 10, fontSize: 13 }}>
            Pendulum Length: {params.length.toFixed(1)}m
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={params.length}
              onChange={(e) => setParams({ ...params, length: parseFloat(e.target.value) })}
              style={{ display: 'block', width: '100%', marginTop: 8 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 10, fontSize: 13 }}>
            Initial Velocity: {params.v0}m/s
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={params.v0}
              onChange={(e) => setParams({ ...params, v0: parseInt(e.target.value) })}
              style={{ display: 'block', width: '100%', marginTop: 8 }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 10, fontSize: 13 }}>
            Launch Angle: {params.angle}°
            <input
              type="range"
              min="15"
              max="75"
              step="5"
              value={params.angle}
              onChange={(e) => setParams({ ...params, angle: parseInt(e.target.value) })}
              style={{ display: 'block', width: '100%', marginTop: 8 }}
            />
          </label>

          <label style={{ display: 'block', fontSize: 13 }}>
            Gravity: {params.gravity.toFixed(2)}m/s²
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={params.gravity}
              onChange={(e) => setParams({ ...params, gravity: parseFloat(e.target.value) })}
              style={{ display: 'block', width: '100%', marginTop: 8 }}
            />
          </label>

          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
            Drag to rotate • Scroll to zoom
          </p>
        </div>

        {/* Scene container */}
        <div style={{ flex: 1, height: 600, position: 'relative', margin: 20, borderRadius: 8, overflow: 'hidden', background: '#071020' }}>
          <Canvas style={{ width: '100%', height: '100%', display: 'block' }} camera={{ position: [0, 2, 8], fov: 50 }} shadows gl={{ antialias: true }}>
            <PhysicsScene parameters={params} />
            <OrbitControls 
              enableDamping 
              dampingFactor={0.05}
              minDistance={3}
              maxDistance={15}
            />
          </Canvas>
        </div>
      </div>
    </div>
  )
}