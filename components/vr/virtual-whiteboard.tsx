"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Pen, Eraser, Square, Circle, Type, Undo, Redo, Download } from "lucide-react"

interface VirtualWhiteboardProps {
  onClose: () => void
}

export function VirtualWhiteboard({ onClose }: VirtualWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<"pen" | "eraser" | "rectangle" | "circle" | "text">("pen")
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 600
    canvas.height = 400

    // Set initial canvas background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = tool === "eraser" ? "white" : color
    ctx.lineWidth = tool === "eraser" ? brushSize * 2 : brushSize
    ctx.lineCap = "round"
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "whiteboard.png"
    link.href = canvas.toDataURL()
    link.click()
  }

  const colors = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffa500"]

  return (
    <Card className="w-[650px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Pen className="h-4 w-4" />
            Virtual Whiteboard
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {/* Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={tool === "pen" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("pen")}
              className="h-8 w-8 p-0"
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "eraser" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("eraser")}
              className="h-8 w-8 p-0"
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "rectangle" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("rectangle")}
              className="h-8 w-8 p-0"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "circle" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("circle")}
              className="h-8 w-8 p-0"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("text")}
              className="h-8 w-8 p-0"
            >
              <Type className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {colors.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded border-2 ${color === c ? "border-gray-800 dark:border-white" : "border-gray-300"}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16"
            />
            <span className="text-xs w-6">{brushSize}</span>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={clearCanvas} className="h-8 px-2">
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadCanvas} className="h-8 w-8 p-0">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        <p className="text-xs text-gray-500 text-center">
          Draw, write, and collaborate in real-time with other participants
        </p>
      </CardContent>
    </Card>
  )
}
