"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Text, Sphere } from "@react-three/drei"
import type * as THREE from "three"

export function RoboticsSimulator({
  parameters = {},
}: {
  parameters?: { shoulder?: number; elbow?: number; wrist?: number }
}) {
  const base = useRef<THREE.Group>(null)
  const elbow = useRef<THREE.Group>(null)
  const wrist = useRef<THREE.Group>(null)

  useFrame(() => {
    if (base.current) base.current.rotation.z = ((parameters.shoulder ?? 20) * Math.PI) / 180
    if (elbow.current) elbow.current.rotation.z = ((parameters.elbow ?? 30) * Math.PI) / 180
    if (wrist.current) wrist.current.rotation.z = ((parameters.wrist ?? 15) * Math.PI) / 180
  })

  return (
    <group>
      {/* Base platform with metallic finish */}
      <Box args={[0.8, 0.2, 0.8]} position={[0, -0.1, 0]} castShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
      </Box>

      {/* Robot arm segments with improved materials */}
      <group ref={base} position={[0, 0, 0]}>
        {/* Shoulder joint */}
        <Sphere args={[0.15, 32, 32]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#3498db" roughness={0.2} metalness={0.9} />
        </Sphere>

        {/* Upper arm segment */}
        <Box args={[0.2, 1.2, 0.2]} position={[0, 0.6, 0]} castShadow>
          <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.7} />
        </Box>

        <group ref={elbow} position={[0, 1.2, 0]}>
          {/* Elbow joint */}
          <Sphere args={[0.12, 32, 32]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#e74c3c" roughness={0.2} metalness={0.9} />
          </Sphere>

          {/* Forearm segment */}
          <Box args={[0.2, 1.0, 0.2]} position={[0, 0.5, 0]} castShadow>
            <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.8} />
          </Box>

          <group ref={wrist} position={[0, 1.0, 0]}>
            {/* Wrist joint */}
            <Sphere args={[0.1, 32, 32]} position={[0, 0, 0]} castShadow>
              <meshStandardMaterial color="#f39c12" roughness={0.2} metalness={0.9} />
            </Sphere>

            {/* End effector */}
            <Box args={[0.2, 0.6, 0.2]} position={[0, 0.3, 0]} castShadow>
              <meshStandardMaterial color="#d1d5db" roughness={0.2} metalness={0.9} />
            </Box>

            {/* Gripper claws */}
            <Box args={[0.3, 0.05, 0.05]} position={[0, 0.62, 0.08]} castShadow>
              <meshStandardMaterial color="#2ecc71" roughness={0.3} metalness={0.8} />
            </Box>
            <Box args={[0.3, 0.05, 0.05]} position={[0, 0.62, -0.08]} castShadow>
              <meshStandardMaterial color="#2ecc71" roughness={0.3} metalness={0.8} />
            </Box>
          </group>
        </group>
      </group>

      {/* Status indicator light */}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#00ff88" distance={2} />

      <Text position={[0, 3.2, 0]} fontSize={0.12} color="#00ff88" anchorX="center">
        {"ROBOT ARM ONLINE"}
      </Text>
    </group>
  )
}
