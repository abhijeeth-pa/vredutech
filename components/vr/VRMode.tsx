"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Text, PerspectiveCamera, OrbitControls } from "@react-three/drei"
import { XR, createXRStore } from "@react-three/xr"
import { useLocalParticipant, useParticipants, useRoomContext, useTracks } from "@livekit/components-react"
import { Track, type Participant } from "livekit-client"
import * as THREE from "three"
import { useMeetStore } from "@/store/meetStore"

const xrStore = createXRStore()

type Vec3 = [number, number, number]

function useTrackVideoTexture(participant: Participant, source: Track.Source) {
  const tracks = useTracks([{ source, withPlaceholder: false }], { onlySubscribed: false }).filter(
    (t) => t.participant.identity === participant.identity,
  )
  const active = tracks[0]
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null)

  useEffect(() => {
    const track = active?.publication?.track
    if (!track?.mediaStreamTrack) {
      setTexture(null)
      return
    }

    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.srcObject = new MediaStream([track.mediaStreamTrack])
    void video.play().catch(() => {})

    const tex = new THREE.VideoTexture(video)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.generateMipmaps = false
    setTexture(tex)

    return () => {
      video.pause()
      video.srcObject = null
      tex.dispose()
      setTexture(null)
    }
  }, [active?.publication?.trackSid])

  return texture
}

function VRCharacter({
  participant,
  position,
  isTeacher,
  isLocal,
}: {
  participant: Participant
  position: Vec3
  isTeacher: boolean
  isLocal: boolean
}) {
  const faceTexture = useTrackVideoTexture(participant, Track.Source.Camera)
  const { participants: storeParticipants } = useMeetStore()
  const storeP = storeParticipants.get(participant.identity)
  const isHandRaised = storeP?.isHandRaised ?? false
  const isMuted = participant.isMicrophoneEnabled === false
  const name = participant.name || participant.identity

  const bodyColor = isTeacher ? "#7c3aed" : isLocal ? "#16a34a" : "#2563eb"

  return (
    <group position={position}>
      <mesh position={[0, 1.08, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.45} metalness={0.08} />
      </mesh>

      <mesh position={[-0.14, 1.07, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.26, 8, 12]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.14, 1.07, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.26, 8, 12]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      <mesh position={[-0.08, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.35, 8, 12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.08, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.35, 8, 12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      <group position={[0, 1.46, 0.01]}>
        <mesh castShadow>
          <sphereGeometry args={[0.17, 24, 24]} />
          <meshStandardMaterial color="#f1d6bf" roughness={0.55} />
        </mesh>

        <mesh position={[0, 0, 0.14]}>
          <circleGeometry args={[0.125, 24]} />
          {faceTexture ? (
            <meshBasicMaterial map={faceTexture} toneMapped={false} />
          ) : (
            <meshStandardMaterial color="#374151" />
          )}
        </mesh>
      </group>

      <Text
        position={[0, 0.22, 0]}
        fontSize={0.065}
        color="#111827"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
      >
        {name.slice(0, 16)}{isLocal ? " (You)" : ""}
      </Text>

      {isTeacher && (
        <Text position={[0, 1.83, 0]} fontSize={0.06} color="#f59e0b" anchorX="center" anchorY="middle">
          Teacher
        </Text>
      )}

      {isHandRaised && (
        <Text position={[0.34, 1.72, 0]} fontSize={0.09} color="#f59e0b" anchorX="center" anchorY="middle">
          ✋
        </Text>
      )}

      {isMuted && (
        <Text position={[-0.34, 1.72, 0]} fontSize={0.08} color="#ef4444" anchorX="center" anchorY="middle">
          🔇
        </Text>
      )}
    </group>
  )
}

function ClassroomDesk({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.06, 0.62]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
      </mesh>
      {[[-0.38, -0.25], [0.38, -0.25], [-0.38, 0.25], [0.38, 0.25]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.39, z]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.78, 0.08]} />
          <meshStandardMaterial color="#5b381a" />
        </mesh>
      ))}
      <mesh position={[0, 0.57, -0.38]} castShadow receiveShadow>
        <boxGeometry args={[0.58, 0.52, 0.08]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.43, -0.36]} castShadow receiveShadow>
        <boxGeometry args={[0.58, 0.05, 0.42]} />
        <meshStandardMaterial color="#2f2f2f" />
      </mesh>
    </group>
  )
}

function TeacherPodium({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.82, 0.72]} />
        <meshStandardMaterial color="#6d4421" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.34, 0.33]} castShadow>
        <boxGeometry args={[1.25, 0.12, 0.08]} />
        <meshStandardMaterial color="#4b2f18" />
      </mesh>
    </group>
  )
}

function Whiteboard({
  position,
  boardText,
  projectionTexture,
}: {
  position: Vec3
  boardText: string
  projectionTexture: THREE.VideoTexture | null
}) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 2.1, 0.1]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>
      <mesh position={[0, 1.5, 0.06]} receiveShadow>
        <planeGeometry args={[3.45, 1.95]} />
        <meshStandardMaterial color="#f7f7f5" />
      </mesh>

      {projectionTexture ? (
        <mesh position={[-0.8, 1.54, 0.08]}>
          <planeGeometry args={[1.7, 1.05]} />
          <meshBasicMaterial map={projectionTexture} toneMapped={false} />
        </mesh>
      ) : (
        <Text
          position={[-0.8, 1.56, 0.08]}
          fontSize={0.08}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
        >
          Share screen to project
        </Text>
      )}

      <Text
        position={[0.72, 2.1, 0.08]}
        fontSize={0.07}
        color="#111827"
        anchorX="left"
        anchorY="top"
        maxWidth={1.55}
        lineHeight={1.25}
      >
        {boardText.trim() || "Teacher notes appear here."}
      </Text>
    </group>
  )
}

function WallProjector({ position, rotationY, texture }: { position: Vec3; rotationY: number; texture: THREE.VideoTexture | null }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.2, 2, 0.1]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[3.04, 1.84]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshStandardMaterial color="#0f172a" emissive="#0f172a" emissiveIntensity={0.4} />
        )}
      </mesh>
    </group>
  )
}

function Floor() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#ceb182"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#a58257"
    ctx.lineWidth = 7
    const cell = 64
    for (let i = 0; i < canvas.width; i += cell) {
      for (let j = 0; j < canvas.height; j += cell) {
        ctx.strokeRect(i + 4, j + 4, cell - 8, cell - 8)
      }
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 1)
    tex.needsUpdate = true
    return tex
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 11]} />
      <meshStandardMaterial color="#ceb182" roughness={0.84} map={texture} />
    </mesh>
  )
}

function VRScene() {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const {
    participants: storeParticipants,
    roomName,
    localIdentity,
    isHost: localIsHost,
    whiteboardText,
  } = useMeetStore()

  const allParticipants = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant.identity),
  ]

  const teacherParticipant =
    allParticipants.find((p) => storeParticipants.get(p.identity)?.isHost) ||
    (localIsHost ? localParticipant : allParticipants[0] || null)

  const studentParticipants = allParticipants.filter((p) => p.identity !== teacherParticipant?.identity)

  const desksPerRow = Math.max(1, Math.ceil(studentParticipants.length / 3))
  const studentDeskPositions: Vec3[] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < desksPerRow; col++) {
      if (studentDeskPositions.length >= studentParticipants.length) break
      const x = (col - (desksPerRow - 1) / 2) * 1.7
      const z = -1.4 - row * 2.05
      studentDeskPositions.push([x, 0.75, z])
    }
  }

  const screenTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }], {
    onlySubscribed: false,
  })
  const [projectionTexture, setProjectionTexture] = useState<THREE.VideoTexture | null>(null)

  useEffect(() => {
    const active = screenTracks.find((t) => t.publication?.isSubscribed && t.publication?.track?.mediaStreamTrack)
    if (!active) {
      setProjectionTexture(null)
      return
    }

    const track = active.publication!.track!
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.srcObject = new MediaStream([track.mediaStreamTrack!])
    void video.play().catch(() => {})

    const tex = new THREE.VideoTexture(video)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.generateMipmaps = false
    setProjectionTexture(tex)

    return () => {
      video.pause()
      video.srcObject = null
      tex.dispose()
      setProjectionTexture(null)
    }
  }, [screenTracks.map((t) => t.publication?.trackSid).join(",")])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.6, 5.5]} fov={72} />
      <OrbitControls enableZoom enablePan={false} minDistance={2.5} maxDistance={12} target={[0, 1.4, -2.2]} />

      <ambientLight intensity={0.55} color="#ffffff" />
      <pointLight position={[-2.2, 3.5, 2.1]} intensity={1.05} color="#ffffff" castShadow />
      <pointLight position={[2.2, 3.5, 2.1]} intensity={1.05} color="#ffffff" castShadow />
      <pointLight position={[-2.2, 3.5, -3.2]} intensity={1.05} color="#ffffff" castShadow />
      <pointLight position={[2.2, 3.5, -3.2]} intensity={1.05} color="#ffffff" castShadow />
      <directionalLight position={[0, 4.5, 3]} intensity={0.8} color="#ffe3bd" castShadow />

      <Floor />

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.8, 0]} receiveShadow>
        <planeGeometry args={[14, 11]} />
        <meshStandardMaterial color="#f4f2ee" />
      </mesh>

      <mesh position={[0, 1.9, -5.5]} receiveShadow>
        <planeGeometry args={[14, 3.8]} />
        <meshStandardMaterial color="#eadfce" />
      </mesh>
      <mesh position={[0, 1.9, 5.5]} receiveShadow>
        <planeGeometry args={[14, 3.8]} />
        <meshStandardMaterial color="#d4c8b5" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-7, 1.9, 0]} receiveShadow>
        <planeGeometry args={[11, 3.8]} />
        <meshStandardMaterial color="#d8ccba" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[7, 1.9, 0]} receiveShadow>
        <planeGeometry args={[11, 3.8]} />
        <meshStandardMaterial color="#d8ccba" />
      </mesh>

      <Whiteboard position={[0, 1.8, -5.45]} boardText={whiteboardText} projectionTexture={projectionTexture} />
      <WallProjector position={[6.92, 2.1, -0.8]} rotationY={-Math.PI / 2} texture={projectionTexture} />

      {studentDeskPositions.map((pos, i) => (
        <ClassroomDesk key={i} position={pos} />
      ))}

      <TeacherPodium position={[0, 0.41, -4.25]} />

      {teacherParticipant && (
        <VRCharacter
          key={teacherParticipant.identity}
          participant={teacherParticipant}
          position={[0, 0.78, -3.65]}
          isTeacher
          isLocal={teacherParticipant.identity === localIdentity}
        />
      )}

      {studentParticipants.map((p, i) => {
        const desk = studentDeskPositions[i] || [0, 0.75, -1.2]
        return (
          <VRCharacter
            key={p.identity}
            participant={p}
            position={[desk[0], 0.78, desk[2] + 0.08]}
            isTeacher={false}
            isLocal={p.identity === localIdentity}
          />
        )
      })}

      <Text
        position={[0, 3.45, -5.3]}
        fontSize={0.21}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        {roomName || "Classroom"}
      </Text>
    </>
  )
}

function VRControlBar() {
  const room = useRoomContext()
  const {
    isMicOn,
    isCamOn,
    isHandRaised,
    isHost,
    whiteboardText,
    toggleMic,
    toggleCam,
    toggleHandRaise,
    toggleVRMode,
    setWhiteboardText,
  } = useMeetStore()
  const { localParticipant } = useLocalParticipant()

  const [boardOpen, setBoardOpen] = useState(false)
  const [draft, setDraft] = useState(whiteboardText)

  useEffect(() => {
    setDraft(whiteboardText)
  }, [whiteboardText])

  const pushBoardUpdate = useCallback(
    async (text: string) => {
      setWhiteboardText(text)
      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: "board_update",
          text: text.slice(0, 800),
        }),
      )
      await room.localParticipant.publishData(payload, { reliable: true })
    },
    [room, setWhiteboardText],
  )

  const handleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicOn)
    toggleMic()
  }

  const handleCam = async () => {
    await localParticipant.setCameraEnabled(!isCamOn)
    toggleCam()
  }

  return (
    <>
      {isHost && boardOpen && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[34rem] max-w-[95vw] bg-black/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 z-30">
          <div className="text-sm text-white font-semibold mb-2">Teacher Board</div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 800))}
            placeholder="Write notes, equations, instructions..."
            className="w-full h-32 resize-none rounded-xl bg-gray-900/90 border border-gray-700 text-gray-100 text-sm p-3 outline-none focus:border-blue-500"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setDraft("")
                pushBoardUpdate("").catch(() => {})
              }}
              className="px-3 py-2 rounded-lg text-xs bg-gray-700 hover:bg-gray-600 text-white"
            >
              Clear Board
            </button>
            <button
              onClick={() => pushBoardUpdate(draft).catch(() => {})}
              className="px-3 py-2 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white"
            >
              Publish Board
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-700 z-20">
        <button
          onClick={handleMic}
          title={isMicOn ? "Mute" : "Unmute"}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition text-xs font-medium ${
            isMicOn ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-red-600 text-white hover:bg-red-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isMicOn ? (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </>
            ) : (
              <>
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </>
            )}
          </svg>
          <span>{isMicOn ? "Mute" : "Unmute"}</span>
        </button>

        <button
          onClick={handleCam}
          title={isCamOn ? "Stop Video" : "Start Video"}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition text-xs font-medium ${
            isCamOn ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-red-600 text-white hover:bg-red-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            {!isCamOn && <line x1="2" y1="2" x2="22" y2="22" />}
          </svg>
          <span>{isCamOn ? "Stop Video" : "Start Video"}</span>
        </button>

        <button
          onClick={toggleHandRaise}
          title={isHandRaised ? "Lower hand" : "Raise hand"}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition text-xs font-medium ${
            isHandRaised ? "bg-amber-500 text-white hover:bg-amber-400" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          <span className="text-base leading-none">✋</span>
          <span>{isHandRaised ? "Lower" : "Raise"}</span>
        </button>

        {isHost && (
          <button
            onClick={() => setBoardOpen((v) => !v)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition text-xs font-medium ${
              boardOpen ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
            <span>Board</span>
          </button>
        )}

        <button
          onClick={() =>
            xrStore
              .enterVR()
              .catch(() => alert("WebXR not available. Use a VR headset browser or Chrome with WebXR extension."))
          }
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition text-xs font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Enter VR</span>
        </button>

        <button
          onClick={toggleVRMode}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition text-xs font-medium border border-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Exit VR</span>
        </button>
      </div>
    </>
  )
}

export default function VRMode() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-700">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-sm text-white font-medium">VR Classroom</span>
        </div>
        <div className="text-xs text-gray-400 bg-black/50 px-3 py-1.5 rounded-lg border border-gray-800">
          Teacher board sync + wall projector active
        </div>
      </div>

      <Canvas gl={{ antialias: true, alpha: false }} style={{ width: "100%", height: "100%" }} shadows>
        <XR store={xrStore}>
          <Suspense fallback={null}>
            <VRScene />
          </Suspense>
        </XR>
      </Canvas>

      <VRControlBar />
    </div>
  )
}