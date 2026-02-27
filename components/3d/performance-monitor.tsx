"use client"

import { useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { performanceMonitor } from "@/lib/asset-manager"
import { Activity, Cpu, HardDrive, Zap } from "lucide-react"

interface PerformanceStats {
  fps: number
  memory?: {
    used: number
    total: number
    limit: number
  }
  drawCalls?: number
  triangles?: number
}

export function PerformanceMonitor({ show = false }: { show?: boolean }) {
  const [stats, setStats] = useState<PerformanceStats>({ fps: 60 })

  useFrame(({ gl }) => {
    const fps = performanceMonitor.update()
    const memory = performanceMonitor.getMemoryUsage()

    setStats({
      fps,
      memory,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
    })
  })

  if (!show) return null

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return "text-green-600"
    if (fps >= 30) return "text-yellow-600"
    return "text-red-600"
  }

  const getMemoryUsage = () => {
    if (!stats.memory) return 0
    return (stats.memory.used / stats.memory.total) * 100
  }

  return (
    <Card className="fixed top-4 right-4 w-64 bg-black/80 backdrop-blur-sm border-gray-700 text-white z-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* FPS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            <span className="text-xs">FPS</span>
          </div>
          <Badge variant="outline" className={`${getFPSColor(stats.fps)} border-current`}>
            {stats.fps}
          </Badge>
        </div>

        {/* Memory Usage */}
        {stats.memory && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3 w-3" />
                <span className="text-xs">Memory</span>
              </div>
              <span className="text-xs">
                {stats.memory.used}MB / {stats.memory.total}MB
              </span>
            </div>
            <Progress value={getMemoryUsage()} className="h-1" />
          </div>
        )}

        {/* Render Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            <span>Calls: {stats.drawCalls || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Triangles: {stats.triangles ? Math.round(stats.triangles / 1000) : 0}k</span>
          </div>
        </div>

        {/* Performance Tips */}
        {stats.fps < 30 && (
          <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
            ⚠️ Low FPS detected. Consider reducing model complexity or environment quality.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Performance Settings Component
export function PerformanceSettings({
  onQualityChange,
}: {
  onQualityChange: (quality: "low" | "medium" | "high") => void
}) {
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium")

  const handleQualityChange = (newQuality: "low" | "medium" | "high") => {
    setQuality(newQuality)
    onQualityChange(newQuality)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Rendering Quality</label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as const).map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  quality === q
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                }`}
              >
                {q.charAt(0).toUpperCase() + q.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <p>
            <strong>Low:</strong> Reduced shadows, simplified materials
          </p>
          <p>
            <strong>Medium:</strong> Balanced quality and performance
          </p>
          <p>
            <strong>High:</strong> Maximum quality, may impact performance
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
