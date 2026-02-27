"use client"

import { useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Line, Html } from "@react-three/drei"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FunctionInput, useParsedFunction } from "./inputs/function-input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"

type FnKey = "x2" | "sin" | "linear" | "custom"
type Method = "left" | "right" | "midpoint" | "trapezoid" | "simpson"

function useFunction(fn: FnKey) {
  return useMemo(() => {
    if (fn === "x2") return (x: number) => x * x
    if (fn === "sin") return (x: number) => Math.sin(x) + 1 // shift up to keep blocks visible
    return (x: number) => 0.5 * x + 2
  }, [fn])
}

export function Integration() {
  const [fnKey, setFnKey] = useState<FnKey>("sin")
  const [customExpr, setCustomExpr] = useState("sin(x) + 1")
  const [a, setA] = useState(-3)
  const [b, setB] = useState(3)
  const [n, setN] = useState(32)
  const [method, setMethod] = useState<Method>("trapezoid")
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const parsed = useParsedFunction(customExpr)
  const fPreset = useFunction(fnKey)
  const fUse = fnKey === "custom" && parsed.fn ? parsed.fn : fPreset

  const curvePoints = useMemo(() => {
    const [da, db] = [-6, 6]
    const samples = 360
    const step = (db - da) / samples
    const pts: [number, number, number][] = []
    for (let i = 0; i <= samples; i++) {
      const x = da + i * step
      pts.push([x, fUse(x), 0])
    }
    return pts
  }, [fUse])

  const rects = useMemo(() => {
    const left = Math.min(a, b)
    const right = Math.max(a, b)
    const width = (right - left) / n
    const boxes: {
      x: number
      y: number
      w: number
      h: number
      s: number
      xL: number
      xR: number
      sampleX: number | null
      fVal: number | null
      area: number
    }[] = []
    for (let i = 0; i < n; i++) {
      const xL = left + i * width
      const xR = xL + width
      let height = 0
      let sampleX: number | null = null
      if (method === "left") {
        height = fUse(xL)
        sampleX = xL
      }
      if (method === "right") {
        height = fUse(xR)
        sampleX = xR
      }
      if (method === "midpoint") {
        const m = (xL + xR) / 2
        height = fUse(m)
        sampleX = m
      }
      if (method === "trapezoid") {
        height = 0.5 * (fUse(xL) + fUse(xR))
        sampleX = null
      }
      if (method === "simpson") {
        const m = (xL + xR) / 2
        height = (fUse(xL) + 4 * fUse(m) + fUse(xR)) / 6
        sampleX = null
      }
      const s = Math.sign(height) || 1
      const h = Math.abs(height)
      const area = height * width
      boxes.push({
        x: xL + width / 2,
        y: (s * h) / 2,
        w: width,
        h,
        s,
        xL,
        xR,
        sampleX,
        fVal: sampleX == null ? null : fUse(sampleX),
        area,
      })
    }
    return boxes
  }, [a, b, n, fUse, method])

  const approxArea = useMemo(() => {
    const left = Math.min(a, b)
    const right = Math.max(a, b)
    const width = (right - left) / n
    let sum = 0
    for (let i = 0; i < n; i++) {
      const xL = left + i * width
      const xR = xL + width
      if (method === "left") sum += fUse(xL) * width
      if (method === "right") sum += fUse(xR) * width
      if (method === "midpoint") sum += fUse((xL + xR) / 2) * width
      if (method === "trapezoid") sum += 0.5 * (fUse(xL) + fUse(xR)) * width
      if (method === "simpson") {
        const m = (xL + xR) / 2
        sum += (fUse(xL) + 4 * fUse(m) + fUse(xR)) * (width / 6)
      }
    }
    return sum
  }, [a, b, n, fUse, method])

  const refArea = useMemo(() => {
    const left = Math.min(a, b)
    const right = Math.max(a, b)
    const m = 400
    const h = (right - left) / m
    let sum = fUse(left) + fUse(right)
    for (let i = 1; i < m; i++) sum += (i % 2 === 0 ? 2 : 4) * fUse(left + i * h)
    return (h / 3) * sum
  }, [a, b, fUse])

  const error = approxArea - refArea

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="md:col-span-3 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Integration — Riemann Families</CardTitle>
          <CardDescription>Left/Right/Midpoint, Trapezoid, Simpson; custom f(x)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[460px]">
            <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[3, 3, 5]} intensity={0.7} />
              <gridHelper args={[16, 16, "#94a3b8", "#e2e8f0"]} />
              <axesHelper args={[8]} />
              {/* zero y-line for reference */}
              <Line
                points={[
                  [-6, 0, 0],
                  [6, 0, 0],
                ]}
                color="#64748b"
                lineWidth={1}
              />
              <Line points={curvePoints} color="#0ea5e9" lineWidth={2} />
              {rects.slice(0, 200).map((r, idx) => (
                <mesh
                  key={idx}
                  position={[r.x, r.y, 0.02]}
                  onPointerOver={(e) => {
                    e.stopPropagation()
                    setHoverIdx(idx)
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation()
                    setHoverIdx((cur) => (cur === idx ? null : cur))
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setHoverIdx(idx)
                  }}
                >
                  <boxGeometry args={[r.w * 0.98, Math.max(0.02, r.h), 0.02]} />
                  <meshStandardMaterial color={r.s >= 0 ? "#22c55e" : "#ef4444"} transparent opacity={0.35} />
                  {hoverIdx === idx ? (
                    <Html
                      position={[0, (r.s >= 0 ? r.h / 2 : -r.h / 2) + 0.15, 0]}
                      style={{ pointerEvents: "none" }}
                      transform
                      distanceFactor={8}
                    >
                      <div className="rounded-md border bg-background/90 p-2 text-xs shadow-sm">
                        <div>
                          <b>
                            [{r.xL.toFixed(2)}, {r.xR.toFixed(2)}]
                          </b>
                        </div>
                        {r.sampleX != null ? (
                          <div>
                            x* = {r.sampleX.toFixed(3)}, f(x*) = {r.fVal?.toFixed(3)}
                          </div>
                        ) : (
                          <div>avg height (method)</div>
                        )}
                        <div>area ≈ {r.area.toFixed(4)}</div>
                      </div>
                    </Html>
                  ) : null}
                </mesh>
              ))}
              <mesh position={[a, 0, 0]}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial color="#ef4444" />
              </mesh>
              <mesh position={[b, 0, 0]}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial color="#10b981" />
              </mesh>
              <OrbitControls enablePan enableZoom />
            </Canvas>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Controls</CardTitle>
          <CardDescription>Function, interval, and method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Function</Label>
            <Select value={fnKey} onValueChange={(v) => setFnKey(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sin">f(x) = sin(x) + 1</SelectItem>
                <SelectItem value="x2">f(x) = x^2</SelectItem>
                <SelectItem value="linear">f(x) = 0.5x + 2</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {fnKey === "custom" ? <FunctionInput value={customExpr} onChange={setCustomExpr} /> : null}

          <div className="space-y-2">
            <Label htmlFor="a">Start (a)</Label>
            <Slider id="a" value={[a]} min={-5} max={5} step={0.1} onValueChange={(v) => setA(v[0] ?? -3)} />
            <div className="text-sm text-muted-foreground">a = {a.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="b">End (b)</Label>
            <Slider id="b" value={[b]} min={-5} max={5} step={0.1} onValueChange={(v) => setB(v[0] ?? 3)} />
            <div className="text-sm text-muted-foreground">b = {b.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="n">Partitions (n)</Label>
            <Slider id="n" value={[n]} min={4} max={200} step={2} onValueChange={(v) => setN(v[0] ?? 32)} />
            <div className="text-sm text-muted-foreground">n = {n}</div>
          </div>

          <div className="space-y-2">
            <Label>Method</Label>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as Method)} className="grid grid-cols-2 gap-2">
              {(["left", "right", "midpoint", "trapezoid", "simpson"] as Method[]).map((m) => (
                <div key={m} className="flex items-center gap-2 rounded-md border p-2">
                  <RadioGroupItem id={m} value={m} />
                  <label htmlFor={m} className="text-sm capitalize">
                    {m}
                  </label>
                </div>
              ))}
            </RadioGroup>
            <div className="text-xs text-muted-foreground">
              Simpson works best with even n. Error shows vs. high-res composite Simpson reference.
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">Approximate Area</span>
              <Badge variant="secondary">{method}</Badge>
            </div>
            <div className="text-2xl font-semibold">{approxArea.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground">
              Reference ≈ {refArea.toFixed(4)} | Error = {error.toFixed(4)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
