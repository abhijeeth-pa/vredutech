"use client"

import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Text, Box, Sphere, Plane, PerspectiveCamera } from "@react-three/drei"
import type * as THREE from "three"
import { Vector3, Quaternion, Euler } from "three"
import type { RemoteParticipant } from "@/lib/vr-networking"

interface Participant extends RemoteParticipant {
  // Extends RemoteParticipant with all networked fields
}

/**
 * Helper: Convert quaternion [x,y,z,w] to Euler angles [x,y,z] in radians
 */
function quatToEuler(q: [number, number, number, number]): [number, number, number] {
  const quat = new Quaternion(q[0], q[1], q[2], q[3])
  const euler = new Euler().setFromQuaternion(quat, "XYZ")
  return [euler.x, euler.y, euler.z]
}

interface VRClassroomProps {
  participants: Participant[]
  isVRMode: boolean
  showWhiteboard: boolean
  roomId: string
}

// Avatar Component - Renders networked participant with head, hands, and name tag
function Avatar({ participant, isCurrentUser }: { participant: Participant; isCurrentUser: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Group>(null)
  const leftHandRef = useRef<THREE.Group>(null)
  const rightHandRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!isCurrentUser) {
      // Animate head position/rotation from networked transform
      if (headRef.current && participant.head) {
        const headPos = participant.head.pos
        const headRot = participant.head.rot
        headRef.current.position.set(headPos[0], headPos[1], headPos[2])
        headRef.current.quaternion.set(headRot[0], headRot[1], headRot[2], headRot[3])
      }

      // Animate left hand from networked transform
      if (leftHandRef.current && participant.leftHand) {
        const handPos = participant.leftHand.pos
        const handRot = participant.leftHand.rot
        leftHandRef.current.position.set(handPos[0], handPos[1], handPos[2])
        leftHandRef.current.quaternion.set(handRot[0], handRot[1], handRot[2], handRot[3])
      }

      // Animate right hand from networked transform
      if (rightHandRef.current && participant.rightHand) {
        const handPos = participant.rightHand.pos
        const handRot = participant.rightHand.rot
        rightHandRef.current.position.set(handPos[0], handPos[1], handPos[2])
        rightHandRef.current.quaternion.set(handRot[0], handRot[1], handRot[2], handRot[3])
      }
    }
  })

  // Avatar color based on role
  const avatarColor = participant.role === "teacher" ? "#3b82f6" : "#10b981"
  const bodyColor = participant.role === "teacher" ? "#1e40af" : "#059669"

  return (
    <group position={[0, 0, 0]}>
      {/* Head (networked position/rotation) */}
      <group ref={headRef} position={participant.head?.pos || [0, 1.6, 0]}>
        <Sphere args={[0.2, 16, 16]}>
          <meshStandardMaterial color={avatarColor} />
        </Sphere>

        {/* Eyes for visual feedback */}
        <Sphere args={[0.05, 8, 8]} position={[0.08, 0.05, 0.18]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        <Sphere args={[0.05, 8, 8]} position={[-0.08, 0.05, 0.18]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>

        {/* Name tag (always face camera) */}
        <Text
          position={[0, 0.35, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          billboard
          outlineWidth={0.02}
          outlineColor="black"
        >
          {participant.name}
          {participant.role === "teacher" && " (Teacher)"}
        </Text>

        {/* Mute indicator (red sphere at ear) */}
        {participant.isMuted && (
          <Sphere args={[0.08]} position={[0.2, 0, -0.1]}>
            <meshStandardMaterial color="#ef4444" />
          </Sphere>
        )}

        {/* Spotlight highlight (bright glow) */}
        {participant.isSpotlighted && (
          <Sphere args={[0.25, 16, 16]}>
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
          </Sphere>
        )}
      </group>

      {/* Body */}
      <Box args={[0.4, 1, 0.25]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color={bodyColor} />
      </Box>

      {/* Left Hand (networked position/rotation) */}
      <group ref={leftHandRef} position={participant.leftHand?.pos || [-0.3, 1, 0]}>
        <Sphere args={[0.08, 12, 12]}>
          <meshStandardMaterial color={avatarColor} />
        </Sphere>
      </group>

      {/* Right Hand (networked position/rotation) */}
      <group ref={rightHandRef} position={participant.rightHand?.pos || [0.3, 1, 0]}>
        <Sphere args={[0.08, 12, 12]}>
          <meshStandardMaterial color={avatarColor} />
        </Sphere>
      </group>
    </group>
  )
}

// Classroom Environment with floor, walls, and furniture
function ClassroomScene({ participants, showWhiteboard }: { participants: Participant[]; showWhiteboard: boolean }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow />
      <pointLight position={[0, 5, 0]} intensity={0.6} />

      {/* Environment HDRI for realistic lighting */}
      <Environment preset="city" />

      {/* Floor */}
      <Plane args={[30, 30]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#f3f4f6" />
      </Plane>

      {/* Walls */}
      <Plane args={[30, 10]} position={[0, 5, -15]} receiveShadow>
        <meshStandardMaterial color="#e5e7eb" />
      </Plane>

      <Plane args={[30, 10]} rotation={[0, Math.PI / 2, 0]} position={[-15, 5, 0]} receiveShadow>
        <meshStandardMaterial color="#e5e7eb" />
      </Plane>

      <Plane args={[30, 10]} rotation={[0, -Math.PI / 2, 0]} position={[15, 5, 0]} receiveShadow>
        <meshStandardMaterial color="#e5e7eb" />
      </Plane>

      {/* Ceiling */}
      <Plane args={[30, 30]} rotation={[Math.PI / 2, 0, 0]} position={[0, 10, 0]}>
        <meshStandardMaterial color="#f9fafb" />
      </Plane>

      {/* Remote Avatars (non-current users rendered from networked state) */}
      {participants.map((participant, index) => (
        <Avatar key={participant.id} participant={participant} isCurrentUser={index === 0} />
      ))}

      {/* Virtual Whiteboard */}
      {showWhiteboard && (
        <group position={[0, 2.5, -8]}>
          {/* Whiteboard Surface */}
          <Plane args={[5, 3.5]} rotation={[0, 0, 0]} receiveShadow>
            <meshStandardMaterial color="white" />
          </Plane>

          {/* Whiteboard Frame */}
          <Box args={[5.3, 3.8, 0.15]} position={[0, 0, -0.08]} castShadow>
            <meshStandardMaterial color="#374151" />
          </Box>

          {/* Placeholder text (will be replaced by canvas drawing sync) */}
          <Text
            position={[0, 1, 0.05]}
            fontSize={0.4}
            color="#1f2937"
            anchorX="center"
            anchorY="middle"
            maxWidth={4.5}
          >
            Collaborative Whiteboard
          </Text>

          <Text position={[0, 0.2, 0.05]} fontSize={0.2} color="#4b5563" anchorX="center" anchorY="middle" maxWidth={4.5}>
            Real-time collaborative drawing
          </Text>
        </group>
      )}

      {/* Classroom Furniture */}
      <group>
        {/* Teacher's Desk */}
        <Box args={[2.5, 0.8, 1.2]} position={[0, 0.4, -5]} castShadow>
          <meshStandardMaterial color="#8b5cf6" />
        </Box>

        {/* Student Desks arranged in a circle */}
        {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
          <Box key={i} args={[1.8, 0.7, 1]} position={[x, 0.35, 2.5]} castShadow>
            <meshStandardMaterial color="#6366f1" />
          </Box>
        ))}
      </group>
    </>
  )
}

// VR Controls Component - Handles XR session and input capture
function VRController() {
  const { gl, camera, scene } = useThree()
  const [xrSupported, setXrSupported] = useState(false)
  const sessionRef = useRef<XRSession | null>(null)

  useEffect(() => {
    const checkXRSupport = async () => {
      try {
        if ("xr" in navigator && (navigator as any).xr) {
          const supported = await (navigator as any).xr.isSessionSupported("immersive-vr")
          if (supported) {
            gl.xr.enabled = true
            setXrSupported(true)
            console.log("[VR] WebXR VR mode supported and enabled")
          } else {
            console.log("[VR] WebXR VR mode not supported on this device")
          }
        } else {
          console.log("[VR] WebXR not available in this browser")
        }
      } catch (error) {
        console.warn("[VR] XR support check failed:", error)
        setXrSupported(false)
      }
    }

    checkXRSupport()
  }, [gl])

  // Capture XR input frame (head pose + controller poses)
  useFrame(() => {
    if (!sessionRef.current) return

    const session = sessionRef.current
    const frame = session.inputSources?.[0]

    // TODO: Emit pose updates to networking client
    // This will be called from parent component's XR session
  })

  return null
}

export interface VRClassroomHandle {
  enterVR: () => Promise<void>
  exitVR: () => Promise<void>
  getXRInputPose: () => { head: any; leftHand: any; rightHand: any } | null
}


export const VRClassroom = forwardRef<VRClassroomHandle, VRClassroomProps>(
  ({ participants, isVRMode, showWhiteboard, roomId }, ref) => {
    const canvasRef = useRef<any>(null)
    const xrSessionRef = useRef<XRSession | null>(null)
    const xrFrameRef = useRef<XRFrame | null>(null)

    // Capture XR input poses every frame
    const captureXRPoses = (frame: XRFrame, session: XRSession) => {
      try {
        const pose = frame.getViewerPose(session.renderState.baseLayer!.space)
        if (!pose) return null

        // Head position and rotation from viewer pose
        const headTransform = pose.transform
        const headPos: [number, number, number] = [
          headTransform.position.x,
          headTransform.position.y,
          headTransform.position.z,
        ]
        const headQuat = headTransform.orientation
        const headRot: [number, number, number, number] = [headQuat.x, headQuat.y, headQuat.z, headQuat.w]

        // Hand poses (simplified - just track first input source)
        let leftHandPos: [number, number, number] = headPos
        let leftHandRot: [number, number, number, number] = headRot
        let rightHandPos: [number, number, number] = headPos
        let rightHandRot: [number, number, number, number] = headRot

        session.inputSources.forEach((source) => {
          if (source.hand) {
            const handPose = frame.getPose(source.targetRaySpace, session.renderState.baseLayer!.space)
            if (handPose) {
              const transform = handPose.transform
              const pos: [number, number, number] = [transform.position.x, transform.position.y, transform.position.z]
              const quat = transform.orientation
              const rot: [number, number, number, number] = [quat.x, quat.y, quat.z, quat.w]

              if (source.hand.name === "left") {
                leftHandPos = pos
                leftHandRot = rot
              } else {
                rightHandPos = pos
                rightHandRot = rot
              }
            }
          }
        })

        return { head: { pos: headPos, rot: headRot }, leftHand: { pos: leftHandPos, rot: leftHandRot }, rightHand: { pos: rightHandPos, rot: rightHandRot } }
      } catch (error) {
        console.error("[VR] Failed to capture XR poses:", error)
        return null
      }
    }

    // --- Simulated XR pose for non-VR mode (mouse + keyboard) ---
    const [simHeadPos, setSimHeadPos] = useState<[number, number, number]>([0, 1.6, 0])
    const [simHeadEuler, setSimHeadEuler] = useState<[number, number, number]>([0, 0, 0]) // [pitch, yaw, roll]
    const [simLeftHandPos, setSimLeftHandPos] = useState<[number, number, number]>([-0.3, 1.0, 0])
    const [simLeftHandRot, setSimLeftHandRot] = useState<[number, number, number, number]>([0, 0, 0, 1])
    const [simRightHandPos, setSimRightHandPos] = useState<[number, number, number]>([0.3, 1.0, 0])
    const [simRightHandRot, setSimRightHandRot] = useState<[number, number, number, number]>([0, 0, 0, 1])

    // Simulation enabled toggle (auto-enable via ?simVR=true)
    const [simModeEnabled, setSimModeEnabled] = useState<boolean>(false)
    useEffect(() => {
      if (typeof window === "undefined") return
      try {
        const params = new URLSearchParams(window.location.search)
        if (params.get("simVR") === "true") setSimModeEnabled(true)
      } catch (e) {
        /* ignore */
      }
    }, [])

    useEffect(() => {
      if (!simModeEnabled) return
      // Mousemove -> rotate head (simple look-around)
      let isPointerDown = false
      const onPointerDown = () => (isPointerDown = true)
      const onPointerUp = () => (isPointerDown = false)

      const onPointerMove = (e: PointerEvent) => {
        if (!canvasRef.current) return
        if (!isPointerDown) return
        const rect = canvasRef.current.getBoundingClientRect()
        const nx = (e.clientX - rect.left) / rect.width // 0..1
        const ny = (e.clientY - rect.top) / rect.height
        const yaw = (nx - 0.5) * Math.PI * 0.6 // turn left/right
        const pitch = (0.5 - ny) * Math.PI * 0.3 // look up/down
        setSimHeadEuler([pitch, yaw, 0])
      }

      // Keyboard WASD -> move head position on X/Z
      const moveSpeed = 0.15
      const onKeyDown = (ev: KeyboardEvent) => {
        setSimHeadPos((prev) => {
          let [x, y, z] = prev
          if (ev.key === "w") z -= moveSpeed
          if (ev.key === "s") z += moveSpeed
          if (ev.key === "a") x -= moveSpeed
          if (ev.key === "d") x += moveSpeed
          if (ev.key === " ") y += moveSpeed // space up
          if (ev.key === "Shift") y -= moveSpeed
          return [x, y, z]
        })
      }

      window.addEventListener("pointerdown", onPointerDown)
      window.addEventListener("pointerup", onPointerUp)
      window.addEventListener("pointermove", onPointerMove)
      window.addEventListener("keydown", onKeyDown)

      return () => {
        window.removeEventListener("pointerdown", onPointerDown)
        window.removeEventListener("pointerup", onPointerUp)
        window.removeEventListener("pointermove", onPointerMove)
        window.removeEventListener("keydown", onKeyDown)
      }
    }, [simModeEnabled])

    // Convert Euler to quaternion for simulated head
    const getSimulatedPose = () => {
      const [pitch, yaw, roll] = simHeadEuler
      const q = new Quaternion().setFromEuler(new Euler(pitch, yaw, roll, "XYZ"))
      const headRot: [number, number, number, number] = [q.x, q.y, q.z, q.w]
      return {
        head: { pos: simHeadPos, rot: headRot },
        leftHand: { pos: simLeftHandPos, rot: simLeftHandRot },
        rightHand: { pos: simRightHandPos, rot: simRightHandRot },
      }
    }

    useImperativeHandle(ref, () => ({
      enterVR: async () => {
        try {
          if (!("xr" in navigator) || !(navigator as any).xr) {
            throw new Error("WebXR not supported in this browser")
          }

          const supported = await (navigator as any).xr.isSessionSupported("immersive-vr")
          if (!supported) {
            throw new Error("VR mode not supported on this device")
          }

          if (canvasRef.current) {
            const gl = canvasRef.current.getContext("webgl2") || canvasRef.current.getContext("webgl")
            if (gl && gl.xr) {
              const session = await (navigator as any).xr.requestSession("immersive-vr", {
                optionalFeatures: ["hand-tracking"],
              })
              await gl.xr.setSession(session)
              xrSessionRef.current = session
              console.log("[VR] VR session started successfully")
              return true
            }
          }
          throw new Error("WebGL XR context not available")
        } catch (error) {
          console.error("[VR] Failed to start VR session:", error)
          if (error instanceof DOMException && error.name === "SecurityError") {
            throw new Error("VR access blocked by browser permissions. Please enable XR features.")
          }
          throw error
        }
      },

      exitVR: async () => {
        try {
          if (xrSessionRef.current) {
            await xrSessionRef.current.end()
            xrSessionRef.current = null
            console.log("[VR] VR session ended successfully")
          }
        } catch (error) {
          console.error("[VR] Failed to exit VR session:", error)
        }
      },

      getXRInputPose: () => {
        // Prefer real XR session if available
        if (xrSessionRef.current && xrFrameRef.current) {
          return captureXRPoses(xrFrameRef.current, xrSessionRef.current)
        }
        // If simulation mode enabled, return simulated pose
        if (simModeEnabled) {
          try {
            return getSimulatedPose()
          } catch (error) {
            console.warn("[VR] getSimulatedPose failed:", error)
            return null
          }
        }
        return null
      },
    }))

    const [showSimHelp, setShowSimHelp] = useState(false)

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Canvas
          ref={canvasRef}
          camera={{ position: [0, 1.6, 5], fov: 75 }}
          style={{ width: "100%", height: "100%" }}
          onCreated={({ gl }) => {
            try {
              gl.xr.enabled = true
            } catch (error) {
              console.warn("[VR] Could not enable XR on WebGL context:", error)
            }
          }}
        >
          <VRController />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          <ClassroomScene participants={participants} showWhiteboard={showWhiteboard} />
        </Canvas>

        {/* Simulation overlay */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(30,30,30,0.85)",
            color: "#fff",
            padding: 10,
            borderRadius: 8,
            fontSize: 13,
            zIndex: 50,
            minWidth: 220,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Simulated VR</strong>
            <button
              onClick={() => setSimModeEnabled((s) => !s)}
              style={{ marginLeft: 8, padding: "4px 8px", cursor: "pointer" }}
            >
              {simModeEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={() => setShowSimHelp((s) => !s)} style={{ padding: "4px 8px", cursor: "pointer" }}>
              {showSimHelp ? "Hide Help" : "Help"}
            </button>
            <button
              onClick={() => {
                // reset simulated pose
                setSimHeadPos([0, 1.6, 0])
                setSimHeadEuler([0, 0, 0])
                setSimLeftHandPos([-0.3, 1.0, 0])
                setSimRightHandPos([0.3, 1.0, 0])
              }}
              style={{ padding: "4px 8px", cursor: "pointer" }}
            >
              Reset Pose
            </button>
          </div>

          {showSimHelp && (
            <div style={{ marginTop: 8, color: "#e5e7eb", lineHeight: 1.4 }}>
              <div>• Click and hold on the scene, then drag to look around.</div>
              <div>• Use W/A/S/D to move forward/left/back/right.</div>
              <div>• Space: move up; Shift: move down.</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>Tip: add <code>?simVR=true</code> to the URL to auto-enable.</div>
            </div>
          )}
        </div>
      </div>
    )
  },
)

VRClassroom.displayName = "VRClassroom"
