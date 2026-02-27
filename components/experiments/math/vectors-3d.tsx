"use client"

import { useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as THREE from "three"

function Arrow({
  from = [0, 0, 0],
  to = [1, 1, 0],
  color = "#0ea5e9",
}: { from?: [number, number, number]; to?: [number, number, number]; color?: string }) {
  const [pos, quat, len] = useMemo(() => {
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const dz = to[2] - from[2]
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001
    // direction from y+
    const dir = [dx / length, dy / length, dz / length] as [number, number, number]
    // compute quaternion aligning [0,1,0] to dir
    const vFrom = { x: 0, y: 1, z: 0 }
    const vTo = { x: dir[0], y: dir[1], z: dir[2] }
    const cross = {
      x: vFrom.y * vTo.z - vFrom.z * vTo.y,
      y: vFrom.z * vTo.x - vFrom.x * vTo.z,
      z: vFrom.x * vTo.y - vFrom.y * vTo.x,
    }
    const dot = vFrom.y * vTo.y + vFrom.x * vTo.x + vFrom.z * vTo.z
    const s = Math.sqrt((1 + dot) * 2) || 0.0001
    const q = { x: cross.x / s, y: cross.y / s, z: cross.z / s, w: s / 2 }
    // middle position
    const mid = [from[0] + dx / 2, from[1] + dy / 2, from[2] + dz / 2] as [number, number, number]
    return [mid, [q.x, q.y, q.z, q.w] as [number, number, number, number], length]
  }, [from, to])

  const shaftLen = Math.max(0.001, len - 0.25)

  return (
    <group position={pos as any} rotation={undefined} quaternion={quat as any}>
      <mesh position={[0, -len / 2 + shaftLen / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, shaftLen, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, len / 2 - 0.12, 0]}>
        <coneGeometry args={[0.08, 0.24, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

function colorAt(i: number) {
  const palette = ["#0ea5e9", "#22c55e", "#ef4444", "#f59e0b", "#14b8a6", "#6366f1", "#84cc16", "#06b6d4"]
  return palette[i % palette.length]
}

export function Vectors3D() {
  const [vecs, setVecs] = useState<[number, number, number][]>([
    [2, 1, 0],
    [1, 2, 1],
  ])
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [hoverR, setHoverR] = useState(false)
  const [hoverPlane, setHoverPlane] = useState(false)

  const R: [number, number, number] = vecs.reduce<[number, number, number]>(
    (acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]],
    [0, 0, 0],
  )
  const magR = Math.hypot(...R)
  const anglesToR = vecs.map((v) => {
    const dot = v[0] * R[0] + v[1] * R[1] + v[2] * R[2]
    const m = Math.hypot(...v) * (magR || 1)
    const c = Math.min(1, Math.max(-1, m ? dot / m : 1))
    return (Math.acos(c) * 180) / Math.PI
  })

  const azimuth = (Math.atan2(R[1], R[0]) * 180) / Math.PI
  const elevation = (Math.atan2(R[2], Math.hypot(R[0], R[1])) * 180) / Math.PI

  const planeGeom = useMemo(() => {
    if (vecs.length < 2) return null
    const a = vecs[0]
    const b = vecs[1]
    const vertices = new Float32Array([
      0,
      0,
      0,
      a[0],
      a[1],
      a[2],
      b[0],
      b[1],
      b[2],
      a[0],
      a[1],
      a[2],
      a[0] + b[0],
      a[1] + b[1],
      a[2] + b[2],
      b[0],
      b[1],
      b[2],
    ])
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
    g.computeVertexNormals()
    return g
  }, [vecs])

  const planeCentroid = useMemo<[number, number, number] | null>(() => {
    if (vecs.length < 2) return null
    const a = vecs[0]
    const b = vecs[1]
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  }, [vecs])

  const planeArea = useMemo(() => {
    if (vecs.length < 2) return 0
    const a = vecs[0]
    const b = vecs[1]
    const cx = a[1] * b[2] - a[2] * b[1]
    const cy = a[2] * b[0] - a[0] * b[2]
    const cz = a[0] * b[1] - a[1] * b[0]
    return Math.hypot(cx, cy, cz)
  }, [vecs])

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="md:col-span-3 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>3D Geometry & Vectors</CardTitle>
          <CardDescription>Resultant of N vectors, angles to resultant, and spanned plane (first two)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[460px]">
            <Canvas camera={{ position: [4, 4, 8], fov: 60 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 5, 5]} intensity={0.7} />
              <gridHelper args={[12, 12, "#94a3b8", "#e2e8f0"]} />
              <axesHelper args={[5]} />
              {planeGeom && (
                <mesh
                  geometry={planeGeom as any}
                  onPointerOver={(e) => {
                    e.stopPropagation()
                    setHoverPlane(true)
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation()
                    setHoverPlane(false)
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setHoverPlane(true)
                  }}
                >
                  <meshStandardMaterial color="#93c5fd" transparent opacity={0.2} side={THREE.DoubleSide} />
                  {hoverPlane && planeCentroid ? (
                    <Html
                      position={[planeCentroid[0], planeCentroid[1], planeCentroid[2]]}
                      transform
                      distanceFactor={8}
                      style={{ pointerEvents: "none" }}
                    >
                      <div className="rounded-md border bg-background/90 p-2 text-xs shadow-sm">
                        <div>
                          <b>Span(v1, v2)</b>
                        </div>
                        <div>Area = {planeArea.toFixed(3)}</div>
                      </div>
                    </Html>
                  ) : null}
                </mesh>
              )}
              {vecs.map((v, i) => {
                const dx = v[0] - 0,
                  dy = v[1] - 0,
                  dz = v[2] - 0
                const len = Math.max(0.0001, Math.hypot(dx, dy, dz))
                const dir = [dx / len, dy / len, dz / len] as [number, number, number]
                const vFrom = { x: 0, y: 1, z: 0 }
                const vTo = { x: dir[0], y: dir[1], z: dir[2] }
                const cross = {
                  x: vFrom.y * vTo.z - vFrom.z * vTo.y,
                  y: vFrom.z * vTo.x - vFrom.x * vTo.z,
                  z: vFrom.x * vTo.y - vFrom.y * vTo.x,
                }
                const dot = vFrom.y * vTo.y + vFrom.x * vTo.x + vFrom.z * vTo.z
                const s = Math.sqrt((1 + dot) * 2) || 0.0001
                const quat: [number, number, number, number] = [cross.x / s, cross.y / s, cross.z / s, s / 2]
                const mid: [number, number, number] = [dx / 2, dy / 2, dz / 2]

                const magnitude = Math.hypot(...v)
                return (
                  <group key={i}>
                    <Arrow from={[0, 0, 0]} to={v} color={colorAt(i)} />
                    <mesh
                      position={mid as any}
                      quaternion={quat as any}
                      onPointerOver={(e) => {
                        e.stopPropagation()
                        setHoverIdx(i)
                      }}
                      onPointerOut={(e) => {
                        e.stopPropagation()
                        setHoverIdx((cur) => (cur === i ? null : cur))
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        setHoverIdx(i)
                      }}
                    >
                      <cylinderGeometry args={[0.14, 0.14, len, 8]} />
                      <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
                      {hoverIdx === i ? (
                        <Html position={[0, 0, 0]} transform distanceFactor={8} style={{ pointerEvents: "none" }}>
                          <div className="rounded-md border bg-background/90 p-2 text-xs shadow-sm">
                            <div>
                              <b>v{i + 1}</b> = [{v.map((c) => c.toFixed(2)).join(", ")}]
                            </div>
                            <div>|v| = {magnitude.toFixed(3)}</div>
                            <div>∠(v, R) = {isFinite(anglesToR[i]) ? anglesToR[i].toFixed(2) : "—"}°</div>
                          </div>
                        </Html>
                      ) : null}
                    </mesh>
                    <mesh
                      onPointerOver={(e) => {
                        e.stopPropagation()
                        setHoverIdx(i)
                      }}
                      onPointerOut={(e) => {
                        e.stopPropagation()
                        setHoverIdx((cur) => (cur === i ? null : cur))
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        setHoverIdx(i)
                      }}
                      position={[v[0], v[1], v[2]]}
                    >
                      <sphereGeometry args={[0.06, 16, 16]} />
                      <meshStandardMaterial color={colorAt(i)} />
                    </mesh>
                  </group>
                )
              })}
              <Arrow from={[0, 0, 0]} to={R} color="#ef4444" />
              {(() => {
                const dx = R[0],
                  dy = R[1],
                  dz = R[2]
                const len = Math.max(0.0001, Math.hypot(dx, dy, dz))
                const dir = [dx / len, dy / len, dz / len] as [number, number, number]
                const vFrom = { x: 0, y: 1, z: 0 }
                const vTo = { x: dir[0], y: dir[1], z: dir[2] }
                const cross = {
                  x: vFrom.y * vTo.z - vFrom.z * vTo.y,
                  y: vFrom.z * vTo.x - vFrom.x * vTo.z,
                  z: vFrom.x * vTo.y - vFrom.y * vTo.x,
                }
                const dot = vFrom.y * vTo.y + vFrom.x * vTo.x + vFrom.z * vTo.z
                const s = Math.sqrt((1 + dot) * 2) || 0.0001
                const quat: [number, number, number, number] = [cross.x / s, cross.y / s, cross.z / s, s / 2]
                const mid: [number, number, number] = [dx / 2, dy / 2, dz / 2]
                return (
                  <mesh
                    position={mid as any}
                    quaternion={quat as any}
                    onPointerOver={(e) => {
                      e.stopPropagation()
                      setHoverR(true)
                    }}
                    onPointerOut={(e) => {
                      e.stopPropagation()
                      setHoverR(false)
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      setHoverR(true)
                    }}
                  >
                    <cylinderGeometry args={[0.16, 0.16, len, 8]} />
                    <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
                    {hoverR ? (
                      <Html position={[0, 0, 0]} transform distanceFactor={8} style={{ pointerEvents: "none" }}>
                        <div className="rounded-md border bg-background/90 p-2 text-xs shadow-sm">
                          <div>
                            <b>R</b> = [{R.map((c) => c.toFixed(2)).join(", ")}]
                          </div>
                          <div>|R| = {magR.toFixed(3)}</div>
                          <div>azimuth = {isFinite(azimuth) ? azimuth.toFixed(2) : "—"}°</div>
                          <div>elevation = {isFinite(elevation) ? elevation.toFixed(2) : "—"}°</div>
                        </div>
                      </Html>
                    ) : null}
                  </mesh>
                )
              })()}
              <mesh
                position={[R[0], R[1], R[2]]}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHoverR(true)
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHoverR(false)
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  setHoverR(true)
                }}
              >
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial color="#ef4444" />
              </mesh>
              <OrbitControls enablePan enableZoom />
            </Canvas>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Controls</CardTitle>
          <CardDescription>Add or edit vectors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {vecs.map((v, i) => (
            <div key={i} className="rounded-md border p-3 space-y-2">
              <div className="text-xs">Vector v{i + 1}</div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={v[0]}
                  onChange={(e) => {
                    const arr = [...vecs]
                    arr[i] = [+e.target.value, v[1], v[2]]
                    setVecs(arr as any)
                  }}
                />
                <Input
                  type="number"
                  value={v[1]}
                  onChange={(e) => {
                    const arr = [...vecs]
                    arr[i] = [v[0], +e.target.value, v[2]]
                    setVecs(arr as any)
                  }}
                />
                <Input
                  type="number"
                  value={v[2]}
                  onChange={(e) => {
                    const arr = [...vecs]
                    arr[i] = [v[0], v[1], +e.target.value]
                    setVecs(arr as any)
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const r = () => +(Math.random() * 6 - 3).toFixed(1)
                    const arr = [...vecs]
                    arr[i] = [r(), r(), r()]
                    setVecs(arr as any)
                  }}
                >
                  Randomize
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setVecs((arr) => (arr.length > 1 ? (arr.filter((_, j) => j !== i) as any) : arr))
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button onClick={() => setVecs((arr) => [...arr, [1, 0, 0]] as any)} className="w-full">
            Add Vector
          </Button>

          <div className="rounded-md border p-3 space-y-1">
            <div className="text-sm">Resultant R</div>
            <div className="text-lg font-semibold">[{R.map((c) => c.toFixed(2)).join(", ")}]</div>
            <div className="text-xs text-muted-foreground">|R| = {magR.toFixed(3)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
