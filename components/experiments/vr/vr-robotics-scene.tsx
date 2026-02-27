"use client"

import { useState, useEffect, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { XR, Controllers, Hands, VRButton } from "@react-three/xr"
import { Environment, ContactShadows, Sky, Grid, PerspectiveCamera, OrbitControls, Text } from "@react-three/drei"
import { Suspense } from "react"
import * as THREE from "three"

// Simple test cube to verify render loop
function TestCube() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += 0.6 * delta
      ref.current.rotation.y += 0.4 * delta
    }
  })
  return (
    <mesh ref={ref} position={[0, 1.5, 0]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  )
}

// Robot Arm Component
function RobotArm({ parameters }: { parameters: { shoulder: number; elbow: number; wrist: number } }) {
  const baseRef = useRef<THREE.Group>(null)
  const shoulderRef = useRef<THREE.Group>(null)
  const elbowRef = useRef<THREE.Group>(null)
  const wristRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (shoulderRef.current) {
      shoulderRef.current.rotation.z = THREE.MathUtils.degToRad(parameters.shoulder)
    }
    if (elbowRef.current) {
      elbowRef.current.rotation.z = THREE.MathUtils.degToRad(parameters.elbow)
    }
    if (wristRef.current) {
      wristRef.current.rotation.z = THREE.MathUtils.degToRad(parameters.wrist)
    }
  })

  return (
    <group ref={baseRef}>
      {/* Base */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.2, 32]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Base details */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.02, 32]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.4} metalness={0.6} emissive="#e74c3c" emissiveIntensity={0.2} />
      </mesh>

      {/* Shoulder joint */}
      <group ref={shoulderRef} position={[0, 0.2, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial color="#34495e" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Upper arm */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.8, 16]} />
          <meshStandardMaterial color="#3498db" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Elbow joint */}
        <group ref={elbowRef} position={[0, 0.8, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial color="#34495e" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Forearm */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.7, 16]} />
            <meshStandardMaterial color="#9b59b6" roughness={0.4} metalness={0.6} />
          </mesh>

          {/* Wrist joint */}
          <group ref={wristRef} position={[0, 0.7, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.08, 32, 32]} />
              <meshStandardMaterial color="#34495e" roughness={0.3} metalness={0.7} />
            </mesh>

            {/* End effector */}
            <mesh position={[0, 0.15, 0]} castShadow>
              <boxGeometry args={[0.12, 0.3, 0.06]} />
              <meshStandardMaterial color="#f39c12" roughness={0.5} metalness={0.5} />
            </mesh>

            {/* Gripper fingers */}
            <mesh position={[-0.08, 0.25, 0]} castShadow>
              <boxGeometry args={[0.04, 0.15, 0.04]} />
              <meshStandardMaterial color="#2c3e50" roughness={0.6} metalness={0.8} />
            </mesh>
            <mesh position={[0.08, 0.25, 0]} castShadow>
              <boxGeometry args={[0.04, 0.15, 0.04]} />
              <meshStandardMaterial color="#2c3e50" roughness={0.6} metalness={0.8} />
            </mesh>

            {/* Tool indicator light */}
            <mesh position={[0, 0.3, 0.04]}>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshStandardMaterial 
                color="#00ff88" 
                emissive="#00ff88" 
                emissiveIntensity={2}
                toneMapped={false}
              />
              <pointLight intensity={0.5} distance={0.5} color="#00ff88" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#2c3e50" 
          roughness={0.3} 
          metalness={0.2}
          envMapIntensity={0.5}
        />
      </mesh>
      <Grid
        position={[0, -0.49, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={1}
        cellColor="#95a5a6"
        sectionSize={2}
        sectionThickness={1.5}
        sectionColor="#7f8c8d"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid={false}
      />
      
      {/* Safety markers */}
      {[-5, 5].map((x) => (
        [-5, 5].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.48, z]}>
            <cylinderGeometry args={[0.1, 0.1, 0.05]} />
            <meshStandardMaterial 
              color="#f39c12" 
              emissive="#f39c12"
              emissiveIntensity={0.5}
            />
          </mesh>
        ))
      ))}
    </>
  )
}

function WorkBench() {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Main table with realistic material */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.1, 2]} />
        <meshStandardMaterial 
          color="#34495e" 
          roughness={0.4} 
          metalness={0.6}
          envMapIntensity={1}
        />
      </mesh>

      {/* Table edge trim */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[3.05, 0.02, 2.05]} />
        <meshStandardMaterial 
          color="#2c3e50" 
          roughness={0.3} 
          metalness={0.7}
        />
      </mesh>

      {/* Table legs with better detail */}
      {[
        [-1.3, 0, -0.8],
        [1.3, 0, -0.8],
        [-1.3, 0, 0.8],
        [1.3, 0, 0.8],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1]} />
            <meshStandardMaterial 
              color="#2c3e50" 
              roughness={0.6} 
              metalness={0.8}
            />
          </mesh>
          {/* Foot base */}
          <mesh position={[0, -0.5, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial 
              color="#1a1a1a" 
              roughness={0.8} 
              metalness={0.9}
            />
          </mesh>
        </group>
      ))}

      {/* Tool holder on side */}
      <mesh position={[1.6, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.3]} />
        <meshStandardMaterial 
          color="#e74c3c" 
          roughness={0.5} 
          metalness={0.5}
        />
      </mesh>
    </group>
  )
}

function ControlPanel({
  parameters,
}: {
  parameters: { shoulder: number; elbow: number; wrist: number }
}) {
  return (
    <group position={[2.5, 1, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 1.2, 0.05]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.2} 
          metalness={0.8}
          emissive="#0a0a0a"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Glowing border effect */}
      <mesh position={[0, 0, -0.001]}>
        <boxGeometry args={[0.82, 1.22, 0.01]} />
        <meshStandardMaterial 
          color="#00ff88" 
          emissive="#00ff88"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      <Text position={[0, 0.5, 0.03]} fontSize={0.08} color="#00ff88" anchorX="center" anchorY="middle">
        ROBOT CONTROL
      </Text>

      <Text position={[-0.25, 0.25, 0.03]} fontSize={0.05} color="#ffffff" anchorX="left" anchorY="middle">
        {`Shoulder: ${parameters.shoulder}°`}
      </Text>

      <Text position={[-0.25, 0.05, 0.03]} fontSize={0.05} color="#ffffff" anchorX="left" anchorY="middle">
        {`Elbow: ${parameters.elbow}°`}
      </Text>

      <Text position={[-0.25, -0.15, 0.03]} fontSize={0.05} color="#ffffff" anchorX="left" anchorY="middle">
        {`Wrist: ${parameters.wrist}°`}
      </Text>

      {/* Status indicators */}
      <mesh position={[-0.3, -0.4, 0.03]}>
        <sphereGeometry args={[0.02]} />
        <meshStandardMaterial 
          color="#00ff88" 
          emissive="#00ff88"
          emissiveIntensity={2}
        />
      </mesh>
      
      <Text position={[-0.25, -0.4, 0.03]} fontSize={0.04} color="#00ff88" anchorX="left" anchorY="middle">
        ACTIVE
      </Text>
    </group>
  )
}

function Scene({
  parameters,
  xrEnabled = false,
}: {
  parameters: { shoulder: number; elbow: number; wrist: number }
  xrEnabled?: boolean
}) {
  return (
    <>
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 8, 20]} />

      {/* Enhanced lighting setup */}
      <ambientLight intensity={0.4} />
      
      {/* Main directional light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      
      {/* Accent lights for atmosphere */}
      <pointLight position={[-5, 3, -5]} intensity={0.6} color="#3498db" distance={10} />
      <pointLight position={[5, 3, 5]} intensity={0.6} color="#e74c3c" distance={10} />
      <pointLight position={[0, 2, 0]} intensity={0.4} color="#ffffff" distance={5} />
      
      {/* Rim light */}
      <spotLight
        position={[-3, 4, -3]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#9b59b6"
        castShadow
      />

      {/* Environment */}
      <Suspense fallback={null}>
        <Environment preset="warehouse" background={false} />
      </Suspense>

      {/* Scene elements */}
      <Floor />
      <WorkBench />

      {/* Robot on workbench */}
      <group position={[0, 0.55, 0]}>
        <RobotArm parameters={parameters} />
      </group>

      {/* Control panel */}
      <ControlPanel parameters={parameters} />

      {/* Contact shadows for enhanced realism */}
      <ContactShadows 
        position={[0, -0.49, 0]} 
        opacity={0.6} 
        scale={10} 
        blur={2.5} 
        far={4}
        resolution={512}
      />

      {/* Sky */}
      <Sky 
        distance={450000} 
        sunPosition={[0, 1, 0]} 
        inclination={0} 
        azimuth={0.25}
        turbidity={10}
        rayleigh={2}
      />

      {/* Camera setup - different for VR and desktop */}
      {!xrEnabled && (
        <>
          <PerspectiveCamera makeDefault position={[3, 2, 5]} fov={60} />
          <OrbitControls 
            target={[0, 1, 0]} 
            maxPolarAngle={Math.PI / 2 - 0.1} 
            minDistance={2} 
            maxDistance={12}
            enableDamping
            dampingFactor={0.05}
          />
        </>
      )}

      {/* VR-specific elements */}
      {xrEnabled && (
        <>
          <Controllers 
            rayMaterial={{ color: "#00ff88" }}
          />
          <Hands />
        </>
      )}
    </>
  )
}

export default function VRRoboticsScene() {
  const [parameters, setParameters] = useState({
    shoulder: 20,
    elbow: 30,
    wrist: 15,
  })

  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)
  const [xrSupported, setXrSupported] = useState<boolean>(false)
  const [vrSessionActive, setVrSessionActive] = useState<boolean>(false)
  const [r3fReady, setR3fReady] = useState(false)
  const [glInfo, setGlInfo] = useState<Record<string, any> | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    // WebGL support check
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl")
      setWebglSupported(!!gl)
    } catch (e) {
      setWebglSupported(false)
    }

    // Comprehensive XR device detection
    const checkXRSupport = async () => {
      try {
        if (!navigator.xr) {
          setXrSupported(false)
          return
        }

        // Check if immersive-vr is supported
        const isSupported = await navigator.xr.isSessionSupported("immersive-vr")
        setXrSupported(isSupported)
        
        if (isSupported) {
          console.log("VR device detected and ready")
        }
      } catch (e) {
        console.log("XR not available:", e)
        setXrSupported(false)
      }
    }

    checkXRSupport()

    return () => {
      mountedRef.current = false
    }
  }, [])

  if (webglSupported === false) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900 text-center p-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">WebGL not available</h2>
          <p className="text-sm text-gray-300">Your browser or environment does not support WebGL. The VR scene cannot be rendered.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen">
      {/* Only show VR button when VR is actually supported and available */}
      {xrSupported && (
        <VRButton 
          onSessionStart={() => setVrSessionActive(true)}
          onSessionEnd={() => setVrSessionActive(false)}
          className="!absolute !top-4 !right-4 !z-10 !bg-blue-600 hover:!bg-blue-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !transition-all !border-none" 
        />
      )}

      <Canvas
        className="w-full h-full"
        shadows
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        onCreated={(state) => {
          try {
            const { gl, camera, size } = state
            setGlInfo({ powerPreference: (gl as any).getContext ? (gl as any).getContext().powerPreference : undefined, width: size.width, height: size.height })
          } catch (e) {
            setGlInfo({ error: String(e) })
          }
          setR3fReady(true)
          console.log("r3f onCreated", state)
        }}
      >
        {xrSupported ? (
          <XR>
            <Suspense fallback={null}>
              <Scene parameters={parameters} xrEnabled={true} />
              <TestCube />
            </Suspense>
          </XR>
        ) : (
          <Suspense fallback={null}>
            <Scene parameters={parameters} xrEnabled={false} />
            <TestCube />
          </Suspense>
        )}
      </Canvas>

      {/* Diagnostics overlay */}
      <div className="absolute top-4 left-4 z-50 bg-black/60 text-xs text-white p-2 rounded"> 
        <div>webgl: {String(webglSupported)}</div>
        <div>xr: {String(xrSupported)}</div>
        <div>r3fReady: {String(r3fReady)}</div>
        <div>vrSession: {String(vrSessionActive)}</div>
        <div>gl: {glInfo ? JSON.stringify(glInfo) : "pending"}</div>
      </div>

      {/* Desktop controls - hidden when in VR session */}
      {!vrSessionActive && (
        <div className="absolute bottom-4 left-4 z-10 bg-black/80 backdrop-blur-sm p-6 rounded-lg border border-gray-700 max-w-sm">
          <h3 className="text-lg font-bold text-green-400 mb-4">Robot Controls</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Shoulder: {parameters.shoulder}°</label>
              <input
                type="range"
                min="-90"
                max="90"
                value={parameters.shoulder}
                onChange={(e) => setParameters({ ...parameters, shoulder: Number(e.target.value) })}
                className="w-full accent-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Elbow: {parameters.elbow}°</label>
              <input
                type="range"
                min="-90"
                max="90"
                value={parameters.elbow}
                onChange={(e) => setParameters({ ...parameters, elbow: Number(e.target.value) })}
                className="w-full accent-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Wrist: {parameters.wrist}°</label>
              <input
                type="range"
                min="-90"
                max="90"
                value={parameters.wrist}
                onChange={(e) => setParameters({ ...parameters, wrist: Number(e.target.value) })}
                className="w-full accent-green-500"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => setParameters({ shoulder: 0, elbow: 0, wrist: 0 })}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Reset Position
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            {xrSupported ? (
              <>
                <p>🥽 VR device detected - Click "Enter VR" above</p>
                <p>🖱️ Use mouse to orbit the scene</p>
              </>
            ) : (
              <>
                <p>🖱️ Use mouse to orbit and explore the scene</p>
                <p>🎮 Connect a VR headset for immersive control</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}