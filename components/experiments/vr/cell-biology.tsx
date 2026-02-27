"use client"
/*
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, Box, Text } from "@react-three/drei"
import type * as THREE from "three"

export function CellBiology({
  parameters = {},
}: {
  parameters?: { zoom?: number; showOrganelles?: boolean; autoRotate?: boolean }
}) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (groupRef.current && parameters.autoRotate) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
    }
  })
  const zoom = parameters.zoom ?? 1

  return (
    <group ref={groupRef} scale={zoom}>
      <Sphere args={[2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8e44ad" transparent opacity={0.25} />
      </Sphere>

      {parameters.showOrganelles !== false && (
        <>
          <Sphere args={[0.6]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#3498db" />
          </Sphere>
          <Text position={[0, -0.8, 0]} fontSize={0.1} color="white" anchorX="center">
            {"Nucleus"}
          </Text>

          <Box args={[0.3, 0.15, 0.6]} position={[1, 0.5, 0.5]}>
            <meshStandardMaterial color="#e74c3c" />
          </Box>
          <Text position={[1, 0.2, 0.5]} fontSize={0.08} color="white" anchorX="center">
            {"Mitochondria"}
          </Text>

          <Box args={[0.8, 0.05, 0.4]} position={[-0.8, 0, 0.8]}>
            <meshStandardMaterial color="#f39c12" />
          </Box>
          <Text position={[-0.8, -0.2, 0.8]} fontSize={0.08} color="white" anchorX="center">
            {"ER"}
          </Text>
        </>
      )}
    </group>
  )
}
*/


import IframeWithFallback from '@/components/experiments/vr/iframe-wrapper'

export function CellBiology({
  parameters = {},
}: {
  parameters?: { zoom?: number; showOrganelles?: boolean; autoRotate?: boolean }
}) {
  const autoRotateParam = parameters.autoRotate ? "&autostart=1&autospin=0.2" : "&autostart=0"
  const src = `https://sketchfab.com/models/d8d0207a54b443f68c24deb7673d5f55/embed?preload=1${autoRotateParam}`
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <IframeWithFallback src={src} title="Bacterial Cell Model" />
    </div>
  )
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <CellBiology parameters={{ autoRotate: true }} />
    </div>
  )
}