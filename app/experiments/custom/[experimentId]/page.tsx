"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CustomExperimentViewer } from "@/components/experiments/custom-experiment-viewer"
import { ExperimentControls } from "@/components/experiments/experiment-controls"
import { Sparkles, ArrowLeft, Share, Bookmark, Code } from "lucide-react"

interface CustomExperiment {
  id: string
  title: string
  description: string
  code: string
  parameters: Array<{
    name: string
    label: string
    type: string
    min?: number
    max?: number
    default: any
    options?: string[]
  }>
  instructions: string[]
  createdAt?: string
  author?: string
}

export default function CustomExperimentPage() {
  const params = useParams()
  const experimentId = params.experimentId as string
  const [experiment, setExperiment] = useState<CustomExperiment | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, we'll simulate loading a custom experiment
    const loadExperiment = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock experiment data
        const mockExperiment: CustomExperiment = {
          id: experimentId,
          title: "AI-Generated Solar System",
          description:
            "An interactive solar system simulation with adjustable planetary parameters and orbital mechanics.",
          code: `
// AI-Generated Solar System VR Experiment
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Text, Trail } from '@react-three/drei'
import * as THREE from 'three'

export function SolarSystemExperiment({ parameters }) {
  const sunRef = useRef()
  const earthRef = useRef()
  const moonRef = useRef()
  
  useFrame((state) => {
    const time = state.clock.elapsedTime * (parameters.timeSpeed || 1)
    
    // Earth orbit around Sun
    if (earthRef.current) {
      const earthDistance = parameters.earthDistance || 5
      earthRef.current.position.x = Math.cos(time * 0.5) * earthDistance
      earthRef.current.position.z = Math.sin(time * 0.5) * earthDistance
    }
    
    // Moon orbit around Earth
    if (moonRef.current && earthRef.current) {
      const moonDistance = parameters.moonDistance || 2
      moonRef.current.position.x = earthRef.current.position.x + Math.cos(time * 2) * moonDistance
      moonRef.current.position.z = earthRef.current.position.z + Math.sin(time * 2) * moonDistance
    }
    
    // Sun rotation
    if (sunRef.current) {
      sunRef.current.rotation.y = time * 0.1
    }
  })
  
  return (
    <group>
      {/* Sun */}
      <Sphere ref={sunRef} args={[parameters.sunSize || 1]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#FDB813" 
          emissive="#FDB813" 
          emissiveIntensity={0.3}
        />
      </Sphere>
      <Text position={[0, -1.5, 0]} fontSize={0.2} color="white" anchorX="center">
        Sun
      </Text>
      
      {/* Earth */}
      <Sphere ref={earthRef} args={[parameters.earthSize || 0.3]} position={[5, 0, 0]}>
        <meshStandardMaterial color="#6B93D6" />
      </Sphere>
      
      {/* Moon */}
      <Sphere ref={moonRef} args={[parameters.moonSize || 0.1]} position={[7, 0, 0]}>
        <meshStandardMaterial color="#C0C0C0" />
      </Sphere>
      
      {/* Orbital paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[parameters.earthDistance || 5, (parameters.earthDistance || 5) + 0.02, 64]} />
        <meshBasicMaterial color="white" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}`,
          parameters: [
            {
              name: "timeSpeed",
              label: "Time Speed",
              type: "number",
              min: 0.1,
              max: 5,
              default: 1,
              step: 0.1,
            },
            {
              name: "sunSize",
              label: "Sun Size",
              type: "number",
              min: 0.5,
              max: 2,
              default: 1,
              step: 0.1,
            },
            {
              name: "earthSize",
              label: "Earth Size",
              type: "number",
              min: 0.1,
              max: 0.8,
              default: 0.3,
              step: 0.05,
            },
            {
              name: "earthDistance",
              label: "Earth Distance",
              type: "number",
              min: 3,
              max: 8,
              default: 5,
              step: 0.5,
            },
            {
              name: "moonSize",
              label: "Moon Size",
              type: "number",
              min: 0.05,
              max: 0.3,
              default: 0.1,
              step: 0.01,
            },
            {
              name: "moonDistance",
              label: "Moon Distance",
              type: "number",
              min: 1,
              max: 3,
              default: 2,
              step: 0.1,
            },
          ],
          instructions: [
            "Adjust the time speed to see orbital motion",
            "Change planetary sizes to explore scale",
            "Modify distances to see gravitational effects",
            "Observe how the moon orbits Earth while Earth orbits the Sun",
            "Try extreme values to understand orbital mechanics",
          ],
          createdAt: new Date().toISOString(),
          author: "AI Generated",
        }

        setExperiment(mockExperiment)
      } catch (error) {
        console.error("Failed to load experiment:", error)
      } finally {
        setLoading(false)
      }
    }

    loadExperiment()
  }, [experimentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Custom Experiment</h2>
          <p className="text-gray-600 dark:text-gray-300">Preparing your AI-generated VR experience...</p>
        </div>
      </div>
    )
  }

  if (!experiment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Experiment Not Found</h1>
          <Link href="/create-experiment">
            <Button>Create New Experiment</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/experiments">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Experiments
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-orange-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{experiment.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                      AI Generated
                    </Badge>
                    <Badge variant="outline">Custom</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCode(!showCode)}>
                <Code className="h-4 w-4 mr-2" />
                {showCode ? "Hide" : "View"} Code
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Experiment Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <CustomExperimentViewer experiment={experiment} />
              </CardContent>
            </Card>
          </div>

          {/* Controls and Instructions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {experiment.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 rounded-full text-xs flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{instruction}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <ExperimentControls parameters={experiment.parameters} />

            {/* Code Viewer */}
            {showCode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-auto max-h-60">
                    <code>{experiment.code}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
