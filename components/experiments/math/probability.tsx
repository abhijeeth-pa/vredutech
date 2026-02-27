"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Legend } from "recharts"

type Mode = "coin-sum" | "dice-sum" | "poisson" | "exponential" | "gamma"

export function Probability() {
  const [mode, setMode] = useState<Mode>("coin-sum")
  const [trials, setTrials] = useState(5000)
  const [scale, setScale] = useState<"count" | "prob">("count")

  // coins
  const [coins, setCoins] = useState(10)
  const [p, setP] = useState(0.5)

  // dice
  const [dice, setDice] = useState(3)
  const [sides, setSides] = useState(6)
  const [weightsStr, setWeightsStr] = useState("") // optional comma-separated

  // poisson
  const [lambda, setLambda] = useState(4)

  // exponential
  const [lambdaExp, setLambdaExp] = useState(1.2) // exponential rate

  // gamma
  const [gammaK, setGammaK] = useState(3) // integer shape k
  const [gammaLambda, setGammaLambda] = useState(1) // rate

  // bins for histogram
  const [bins, setBins] = useState(24)

  // results
  const [rows, setRows] = useState<{ label: string; count: number; prob?: number; expected?: number }[]>([])

  function simulate() {
    if (mode === "coin-sum") {
      const counts: number[] = Array(coins + 1).fill(0)
      for (let t = 0; t < trials; t++) {
        let sum = 0
        for (let i = 0; i < coins; i++) sum += Math.random() < p ? 1 : 0
        counts[sum]++
      }
      const total = counts.reduce((a, b) => a + b, 0)
      const expected = binomialPMFSeries(coins, p)
      setRows(
        counts.map((c, k) => ({
          label: String(k),
          count: c,
          prob: c / total,
          expected: expected[k],
        })),
      )
    } else if (mode === "dice-sum") {
      const w = weightsStr
        .split(",")
        .map((s) => +s.trim())
        .filter((n) => Number.isFinite(n) && n > 0)
      const useWeights = w.length === sides ? normalize(w) : Array(sides).fill(1 / sides)

      // range of sums: dice..dice*sides
      const minSum = dice
      const maxSum = dice * sides
      const counts: number[] = Array(maxSum - minSum + 1).fill(0)

      for (let t = 0; t < trials; t++) {
        let sum = 0
        for (let d = 0; d < dice; d++) {
          const r = weightedRoll(useWeights) + 1 // 1..sides
          sum += r
        }
        counts[sum - minSum]++
      }
      const total = counts.reduce((a, b) => a + b, 0)
      const expected = w.length === sides && dice > 7 ? undefined : convolveUniform(sides, dice) // expected only for fair/tractable
      setRows(
        counts.map((c, i) => ({
          label: String(i + minSum),
          count: c,
          prob: c / total,
          expected: expected ? expected[i] : undefined,
        })),
      )
    } else if (mode === "poisson") {
      const kMax = Math.min(60, Math.max(12, Math.ceil(lambda + 6 * Math.sqrt(Math.max(1e-6, lambda)))))
      const counts: number[] = Array(kMax + 1).fill(0)
      for (let t = 0; t < trials; t++) {
        const k = samplePoisson(lambda)
        if (k <= kMax) counts[k]++
      }
      const total = counts.reduce((a, b) => a + b, 0)
      const expected = poissonPMFSeries(lambda, kMax)
      setRows(
        counts.map((c, k) => ({
          label: String(k),
          count: c,
          prob: total ? c / total : 0,
          expected: expected[k],
        })),
      )
    } else if (mode === "exponential") {
      const vals: number[] = []
      for (let t = 0; t < trials; t++) {
        const u = Math.random()
        const x = -Math.log(1 - u) / Math.max(1e-6, lambdaExp)
        vals.push(x)
      }
      const { rows: hist, edges, width } = makeHistogram(vals, bins)
      const expected = hist.map((r, i) => {
        const mid = (edges[i] + edges[i + 1]) / 2
        return expPDF(lambdaExp, mid) * width // prob in bin (midpoint approx)
      })
      setRows(hist.map((r, i) => ({ label: r.label, count: r.count, prob: r.prob, expected: expected[i] })))
    } else if (mode === "gamma") {
      const k = Math.max(1, Math.round(gammaK))
      const lmb = Math.max(1e-6, gammaLambda)
      const vals: number[] = []
      for (let t = 0; t < trials; t++) {
        // sum of k i.i.d exponentials(rate=lmb)
        let sum = 0
        for (let i = 0; i < k; i++) {
          const u = Math.random()
          sum += -Math.log(1 - u) / lmb
        }
        vals.push(sum)
      }
      const { rows: hist, edges, width } = makeHistogram(vals, bins)
      const expected = hist.map((r, i) => {
        const mid = (edges[i] + edges[i + 1]) / 2
        return gammaPDF(k, lmb, mid) * width
      })
      setRows(hist.map((r, i) => ({ label: r.label, count: r.count, prob: r.prob, expected: expected[i] })))
    }
  }

  // utilities
  function normalize(arr: number[]) {
    const s = arr.reduce((a, b) => a + b, 0)
    return arr.map((x) => x / (s || 1))
  }
  function weightedRoll(weights: number[]) {
    const r = Math.random()
    let acc = 0
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i]
      if (r <= acc) return i
    }
    return weights.length - 1
  }
  function binomialPMFSeries(n: number, prob: number) {
    const res: number[] = []
    for (let k = 0; k <= n; k++) res.push(binomial(n, k) * Math.pow(prob, k) * Math.pow(1 - prob, n - k))
    return res
  }
  function binomial(n: number, k: number) {
    if (k < 0 || k > n) return 0
    if (k === 0 || k === n) return 1
    k = Math.min(k, n - k)
    let c = 1
    for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1)
    return c
  }
  function convolveUniform(sides: number, dice: number) {
    // start with one die distribution
    let dist = Array(sides).fill(1 / sides)
    for (let d = 2; d <= dice; d++) {
      const next = Array(dist.length + sides - 1).fill(0)
      for (let i = 0; i < dist.length; i++) {
        for (let j = 0; j < sides; j++) next[i + j] += dist[i] * (1 / sides)
      }
      dist = next
    }
    return dist
  }

  function samplePoisson(lmb: number) {
    // Knuth algorithm
    const L = Math.exp(-Math.max(0, lmb))
    let p = 1
    let k = 0
    while (p > L) {
      k++
      p *= Math.random()
    }
    return k - 1
  }
  function poissonPMFSeries(lmb: number, kMax: number) {
    const out: number[] = []
    let term = Math.exp(-lmb) // k = 0
    out.push(term)
    for (let k = 1; k <= kMax; k++) {
      term = (term * lmb) / k
      out.push(term)
    }
    return out
  }

  function makeHistogram(values: number[], binCount: number) {
    const min = 0
    const max = quantile(values, 0.995) // robust max for axis
    const width = (max - min) / Math.max(1, binCount)
    const edges = Array.from({ length: binCount + 1 }, (_, i) => min + i * width)
    const counts = Array(binCount).fill(0)
    for (const v of values) {
      const i = Math.min(binCount - 1, Math.max(0, Math.floor((v - min) / Math.max(1e-9, width))))
      counts[i]++
    }
    const total = counts.reduce((a, b) => a + b, 0)
    const rows = counts.map((c, i) => ({
      label: `${edges[i].toFixed(2)}–${edges[i + 1].toFixed(2)}`,
      count: c,
      prob: total ? c / total : 0,
    }))
    return { rows, edges, width }
  }
  function quantile(arr: number[], q: number) {
    if (!arr.length) return 0
    const a = [...arr].sort((x, y) => x - y)
    const idx = Math.min(a.length - 1, Math.max(0, Math.floor(q * (a.length - 1))))
    return a[idx]
  }
  function expPDF(lmb: number, x: number) {
    return x < 0 ? 0 : lmb * Math.exp(-lmb * x)
  }
  function gammaPDF(k: number, lmb: number, x: number) {
    if (x < 0) return 0
    // integer k: Gamma(k) = (k-1)!
    let fact = 1
    for (let i = 2; i <= k - 1; i++) fact *= i
    return (Math.pow(lmb, k) * Math.pow(x, k - 1) * Math.exp(-lmb * x)) / (fact || 1)
  }

  const total = rows.reduce((s, r) => s + r.count, 0)
  const chartRows = rows.map((r) => ({
    ...r,
    expectedCount: (r.expected ?? 0) * total,
  }))

  const renderTooltip = (props: any) => {
    const { active, payload, label } = props || {}
    if (!active || !payload || !payload.length) return null
    const d = payload[0]?.payload || {}
    return (
      <div className="rounded-md border bg-background/90 p-2 text-xs shadow-sm">
        <div className="font-semibold">{label}</div>
        <div>Count: {d.count?.toLocaleString?.() ?? d.count}</div>
        <div>Prob: {typeof d.prob === "number" ? d.prob.toFixed(4) : "—"}</div>
        <div>Expected: {scale === "count" ? (d.expectedCount ?? 0).toFixed(2) : (d.expected ?? 0).toFixed(4)}</div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="md:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle>Probability Lab</CardTitle>
          <CardDescription>
            Coins, dice (weighted), Poisson(λ), Exponential(λ), Gamma(k, λ); toggle between counts and probabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ left: 8, right: 16, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
                <XAxis dataKey="label" stroke="hsl(var(--color-muted-foreground))" />
                <YAxis yAxisId="left" stroke="hsl(var(--color-muted-foreground))" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 1]}
                  stroke="hsl(var(--color-muted-foreground))"
                />
                <Tooltip content={renderTooltip} />
                <Legend />
                <Bar
                  dataKey={scale === "count" ? "count" : "prob"}
                  name={scale === "count" ? "Count" : "Probability"}
                  fill="hsl(var(--color-primary))"
                  yAxisId={scale === "count" ? "left" : "right"}
                />
                <Line
                  type="monotone"
                  dataKey={scale === "count" ? "expectedCount" : "expected"}
                  name={scale === "count" ? "Expected (count)" : "Expected (prob.)"}
                  stroke="hsl(var(--color-chart-2))"
                  dot={false}
                  yAxisId={scale === "count" ? "left" : "right"}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            {total ? `Empirical total: ${total.toLocaleString()} samples` : "Run a simulation to see results"}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Controls</CardTitle>
          <CardDescription>Configure experiments and sample size</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Experiment</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick experiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coin-sum">Coin flips — sum of heads</SelectItem>
                <SelectItem value="dice-sum">Dice — sum of faces (weighted)</SelectItem>
                <SelectItem value="poisson">Poisson process — counts in interval</SelectItem>
                <SelectItem value="exponential">Wait times — Exponential(λ)</SelectItem>
                <SelectItem value="gamma">k-stage process — Gamma(k, λ)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Scale</Label>
            <Select value={scale} onValueChange={(v) => setScale(v as "count" | "prob")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Counts</SelectItem>
                <SelectItem value="prob">Probabilities</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "coin-sum" ? (
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="coins">Coins per trial</Label>
                <Slider
                  id="coins"
                  min={1}
                  max={50}
                  step={1}
                  value={[coins]}
                  onValueChange={(v) => setCoins(v[0] ?? 10)}
                />
                <div className="text-sm text-muted-foreground">{coins} coins</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p">Probability of Heads (p)</Label>
                <Slider id="p" min={0.01} max={0.99} step={0.01} value={[p]} onValueChange={(v) => setP(v[0] ?? 0.5)} />
                <div className="text-sm text-muted-foreground">p = {p.toFixed(2)}</div>
              </div>
            </div>
          ) : mode === "dice-sum" ? (
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="dice">Dice per trial</Label>
                <Slider id="dice" min={1} max={12} step={1} value={[dice]} onValueChange={(v) => setDice(v[0] ?? 3)} />
                <div className="text-sm text-muted-foreground">{dice} dice</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sides">Sides per die</Label>
                <Slider
                  id="sides"
                  min={2}
                  max={20}
                  step={1}
                  value={[sides]}
                  onValueChange={(v) => setSides(v[0] ?? 6)}
                />
                <div className="text-sm text-muted-foreground">{sides} sides</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weights">Optional weights (comma-separated)</Label>
                <Input
                  id="weights"
                  placeholder="e.g. 1,1,1,1,1,3 for loaded die"
                  value={weightsStr}
                  onChange={(e) => setWeightsStr(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">Leave blank for fair dice</div>
              </div>
            </div>
          ) : mode === "exponential" ? (
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="lambdaExp">Rate λ</Label>
                <Slider
                  id="lambdaExp"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={[lambdaExp]}
                  onValueChange={(v) => setLambdaExp(v[0] ?? 1.2)}
                />
                <div className="text-sm text-muted-foreground">λ = {lambdaExp.toFixed(1)}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bins">Histogram bins</Label>
                <Slider id="bins" min={8} max={60} step={1} value={[bins]} onValueChange={(v) => setBins(v[0] ?? 24)} />
                <div className="text-sm text-muted-foreground">{bins} bins</div>
              </div>
            </div>
          ) : mode === "gamma" ? (
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="gammaK">Shape k (stages)</Label>
                <Slider
                  id="gammaK"
                  min={1}
                  max={10}
                  step={1}
                  value={[gammaK]}
                  onValueChange={(v) => setGammaK(v[0] ?? 3)}
                />
                <div className="text-sm text-muted-foreground">k = {gammaK}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gammaLambda">Rate λ</Label>
                <Slider
                  id="gammaLambda"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={[gammaLambda]}
                  onValueChange={(v) => setGammaLambda(v[0] ?? 1)}
                />
                <div className="text-sm text-muted-foreground">λ = {gammaLambda.toFixed(1)}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bins2">Histogram bins</Label>
                <Slider
                  id="bins2"
                  min={8}
                  max={60}
                  step={1}
                  value={[bins]}
                  onValueChange={(v) => setBins(v[0] ?? 24)}
                />
                <div className="text-sm text-muted-foreground">{bins} bins</div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="trials">Trials</Label>
            <Slider
              id="trials"
              min={100}
              max={100000}
              step={100}
              value={[trials]}
              onValueChange={(v) => setTrials(v[0] ?? 5000)}
            />
            <div className="text-sm text-muted-foreground">{trials.toLocaleString()} trials</div>
          </div>

          <Button onClick={simulate} className="w-full">
            Run Simulation
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
