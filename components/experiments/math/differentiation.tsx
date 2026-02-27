"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Line, Html } from "@react-three/drei"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FunctionInput, useParsedFunction } from "./inputs/function-input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

type FnKey = "x2" | "sin" | "exp" | "custom"

function useFunction(fn: FnKey) {
  const f = useMemo(() => {
    if (fn === "x2") return (x: number) => x * x
    if (fn === "sin") return (x: number) => Math.sin(x)
    return (x: number) => Math.exp(0.3 * x) // milder growth for viewport
  }, [fn])
  return f
}

export function Differentiation() {
  const [fnKey, setFnKey] = useState<FnKey>("x2")
  const [customExpr, setCustomExpr] = useState("sin(x) + 0.3*x^2")
  const parsed = useParsedFunction(customExpr)

  const [x0, setX0] = useState(0)
  const [h, setH] = useState(0.5) // secant/tangent step
  const [auto, setAuto] = useState(false)
  const raf = useRef<number>()
  const [hover, setHover] = useState<"point" | "secA" | "secB" | null>(null)

  const f = useFunction(fnKey === "custom" && !parsed.error ? "sin" : (fnKey as any))
  const fCustom = (x: number) => (fnKey === "custom" && !parsed.error ? parsed.fn(x) : f(x))

  const fUse = fCustom

  useEffect(() => {
    if (!auto) return
    let dir = 1
    function tick() {
      setX0((prev) => {
        const next = prev + 0.02 * dir
        if (next > 5) dir = -1
        if (next < -5) dir = 1
        return Math.max(-5, Math.min(5, next))
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => raf.current && cancelAnimationFrame(raf.current)
  }, [auto])

  const domain: [number, number] = [-6, 6]
  const samples = 360

  const curvePoints = useMemo(() => {
    const [a, b] = domain
    const step = (b - a) / samples
    const pts: [number, number, number][] = []
    for (let i = 0; i <= samples; i++) {
      const x = a + i * step
      pts.push([x, fUse(x), 0])
    }
    return pts
  }, [domain, samples, fUse])

  const y0 = fUse(x0)
  const eps = Math.max(1e-4, h * 0.05)
  const slope = (fUse(x0 + eps) - fUse(x0 - eps)) / (2 * eps)

  const tangentPoints = useMemo(() => {
    const L = 2.2
    const xs = [x0 - L, x0 + L]
    return xs.map((x) => [x, y0 + slope * (x - x0), 0]) as [number, number, number][]
  }, [x0, y0, slope])

  const [xA, xB] = [x0 - h, x0 + h]
  const yA = fUse(xA)
  const yB = fUse(xB)
  const secantSlope = (yB - yA) / (2 * h || 1e-6)
  const secantPoints: [number, number, number][] = [
    [xA, yA, 0.001],
    [xB, yB, 0.001],
  ]

  const derivativeOverlay = useMemo(() => {
    const [a, b] = domain
    const step = (b - a) / samples
    const pts: [number, number, number][] = []
    for (let i = 0; i <= samples; i++) {
      const x = a + i * step
      const s = (fUse(x + eps) - fUse(x - eps)) / (2 * eps)
      pts.push([x, s, 0.001])
    }
    return pts
  }, [domain, samples, fUse, eps])

  const slopeColor = slope > 0.001 ? "#16a34a" : slope < -0.001 ? "#dc2626" : "#6b7280"

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="md:col-span-3 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Differentiation — Tangent, Secant, and Slope</CardTitle>
          <CardDescription>Custom f(x), adjustable step h, and autoplay along x</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[460px]">
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
              <ambientLight intensity={0.65} />
              <directionalLight position={[3, 3, 5]} intensity={0.7} />
              <gridHelper args={[16, 16, "#94a3b8", "#e2e8f0"]} />
              <axesHelper args={[8]} />
              <Line points={curvePoints} color="#0ea5e9" lineWidth={2} />
              <Line points={derivativeOverlay} color="#6366f1" lineWidth={1} />
              <Line points={tangentPoints} color={slopeColor} lineWidth={3} />
              <Line points={secantPoints} color="#f59e0b" lineWidth={2} />
              {/* main point */}
              <mesh
                position={[x0, y0, 0.02]}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHover("point")
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHover((h) => (h === "point" ? null : h))
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  setHover("point")
                }}
              >
                <sphereGeometry args={[0.09, 24, 24]} />
                <meshStandardMaterial color={slopeColor} />
                {hover === "point" ? (
                  <Html position={[0, 0.3, 0]} transform distanceFactor={8} style={{ pointerEvents: "none" }}>
                    <div className="rounded-md border bg-background/90 p-2 text-xs shadow-sm">
                      <div>
                        <b>x0</b> = {x0.toFixed(3)}, <b>f(x0)</b> = {y0.toFixed(3)}
                      </div>
                      <div>
                        <b>f'(x0)</b> ≈ {slope.toFixed(4)}
                      </div>
                      <div>
                        <b>h</b> = {h.toFixed(3)}
                      </div>
                    </div>
                  </Html>
                ) : null}
              </mesh>

              {/* secant endpoints */}
              <mesh
                position={[xA, yA, 0.02]}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHover("secA")
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHover((h) => (h === "secA" ? null : h))
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  setHover("secA")
                }}
              >
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial color="#f59e0b" />
                {hover === "secA" ? (
                  <Html position={[0, 0.25, 0]} transform distanceFactor={8} style={{ pointerEvents: "none" }}>
                    <div className="rounded-md border bg-background/90 p-2 text-xs shadow-sm">
                      <div>
                        <b>xA</b> = {xA.toFixed(3)}, <b>f(xA)</b> = {yA.toFixed(3)}
                      </div>
                      <div>
                        <b>secant slope</b> ≈ {secantSlope.toFixed(4)}
                      </div>
                    </div>
                  </Html>
                ) : null}
              </mesh>

              <mesh
                position={[xB, yB, 0.02]}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  setHover("secB")
                }}
                onPointerOut={(e) => {
                  e.stopPropagation()
                  setHover((h) => (h === "secB" ? null : h))
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  setHover("secB")
                }}
              >
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial color="#f59e0b" />
                {hover === "secB" ? (
                  <Html position={[0, 0.25, 0]} transform distanceFactor={8} style={{ pointerEvents: "none" }}>
                    <div className="rounded-md border bg-background/90 p-2 text-xs shadow-sm">
                      <div>
                        <b>xB</b> = {xB.toFixed(3)}, <b>f(xB)</b> = {yB.toFixed(3)}
                      </div>
                      <div>
                        <b>secant slope</b> ≈ {secantSlope.toFixed(4)}
                      </div>
                    </div>
                  </Html>
                ) : null}
              </mesh>
              <OrbitControls enablePan enableZoom />
            </Canvas>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Controls</CardTitle>
          <CardDescription>Pick or enter f(x)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fn">Function</Label>
            <Select value={fnKey} onValueChange={(v) => setFnKey(v as any)}>
              <SelectTrigger id="fn" className="w-full">
                <SelectValue placeholder="Select function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x2">f(x) = x^2</SelectItem>
                <SelectItem value="sin">f(x) = sin(x)</SelectItem>
                <SelectItem value="exp">f(x) = exp(0.3x)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {fnKey === "custom" ? <FunctionInput value={customExpr} onChange={setCustomExpr} /> : null}

          <div className="space-y-2">
            <Label htmlFor="x0">x-position</Label>
            <Slider id="x0" value={[x0]} min={-5} max={5} step={0.05} onValueChange={(v) => setX0(v[0] ?? 0)} />
            <div className="text-sm text-muted-foreground">x0 = {x0.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="h">Secant/Tangent step h</Label>
            <Slider id="h" value={[h]} min={0.05} max={2} step={0.05} onValueChange={(v) => setH(v[0] ?? 0.5)} />
            <div className="text-sm text-muted-foreground">h = {h.toFixed(2)}</div>
          </div>

          <div className="rounded-md border p-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Tangent slope</div>
              <div className="text-xl font-semibold" style={{ color: slopeColor }}>
                m = {slope.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Secant slope</div>
              <div className="text-xl font-semibold text-amber-600 dark:text-amber-400">{secantSlope.toFixed(3)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={auto} onCheckedChange={setAuto} id="auto" />
              <Label htmlFor="auto">Autoplay</Label>
            </div>
            <Button variant="secondary" onClick={() => setX0(0)}>
              Reset x0
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
