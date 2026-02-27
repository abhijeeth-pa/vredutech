"use client"

import type React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Upload, FileText, Wand2, Loader2, CheckCircle, AlertCircle, Play, Save, Share } from "lucide-react"

interface GeneratedExperiment {
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
}

export default function CreateExperimentPage() {
  const [activeTab, setActiveTab] = useState("description")
  const [experimentTitle, setExperimentTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedExperiment, setGeneratedExperiment] = useState<GeneratedExperiment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const validFiles = Array.from(files).filter(
      (file) =>
        file.type === "text/plain" ||
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type.startsWith("image/"),
    )

    setUploadedFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const generateExperiment = async () => {
    if (!experimentTitle.trim() && !description.trim() && uploadedFiles.length === 0) {
      setError("Please provide a title, description, or upload files to generate an experiment.")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGenerationProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      // Prepare file contents
      const fileContents = await Promise.all(
        uploadedFiles.map(async (file) => {
          if (file.type === "text/plain") {
            return {
              name: file.name,
              type: file.type,
              content: await file.text(),
            }
          }
          return {
            name: file.name,
            type: file.type,
            content: `[${file.type} file - content would be extracted in production]`,
          }
        }),
      )

      const response = await fetch("/api/generate-experiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: experimentTitle,
          description: description,
          files: fileContents,
        }),
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (!response.ok) {
        throw new Error("Failed to generate experiment")
      }

      const result = await response.json()
      setGeneratedExperiment(result)
      setActiveTab("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while generating the experiment")
    } finally {
      setIsGenerating(false)
    }
  }

  const saveExperiment = async () => {
    if (!generatedExperiment) return

    try {
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generatedExperiment),
      })

      if (response.ok) {
        const saved = await response.json()
        window.location.href = `/experiments/custom/${saved.id}`
      }
    } catch (err) {
      setError("Failed to save experiment")
    }
  }

  const shareExperiment = () => {
    if (!generatedExperiment) return

    const shareUrl = `${window.location.origin}/experiments/custom/${generatedExperiment.id}`
    navigator.clipboard.writeText(shareUrl)
    alert("Share link copied to clipboard!")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Custom Experiment</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Describe Experiment</TabsTrigger>
              <TabsTrigger value="generate" disabled={!experimentTitle && !description && uploadedFiles.length === 0}>
                Generate
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={!generatedExperiment}>
                Preview & Test
              </TabsTrigger>
            </TabsList>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Experiment Details
                  </CardTitle>
                  <CardDescription>
                    Describe your experiment idea and our AI will generate an interactive VR simulation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Experiment Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Solar System Gravity Simulation"
                      value={experimentTitle}
                      onChange={(e) => setExperimentTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what you want to simulate or explore. Be as detailed as possible about the physics, interactions, and parameters you'd like to control..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label>Supporting Materials (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Upload documents, equations, or reference images
                      </p>
                      <p className="text-xs text-gray-500 mb-3">PDF, DOCX, TXT, PNG, JPG files</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                        Choose Files
                      </Button>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">{file.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setActiveTab("generate")}
                      disabled={!experimentTitle && !description && uploadedFiles.length === 0}
                    >
                      Continue to Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Experiment Generation
                  </CardTitle>
                  <CardDescription>
                    Our AI will analyze your description and create a custom VR experiment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isGenerating && !generatedExperiment && (
                    <div className="text-center py-8">
                      <div className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900 dark:to-pink-900 rounded-lg p-6 mb-6">
                        <Sparkles className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to Generate</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Click below to let AI create your custom VR experiment
                        </p>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <p>✓ Title: {experimentTitle || "Not provided"}</p>
                          <p>✓ Description: {description ? "Provided" : "Not provided"}</p>
                          <p>✓ Files: {uploadedFiles.length} uploaded</p>
                        </div>
                      </div>
                      <Button onClick={generateExperiment} size="lg" className="px-8">
                        <Wand2 className="h-5 w-5 mr-2" />
                        Generate VR Experiment
                      </Button>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="text-center py-8">
                      <Loader2 className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-spin" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Generating Your Experiment
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        AI is analyzing your description and creating Three.js code...
                      </p>
                      <div className="max-w-md mx-auto">
                        <Progress value={generationProgress} className="mb-2" />
                        <p className="text-sm text-gray-500">{generationProgress}% complete</p>
                      </div>
                    </div>
                  )}

                  {generatedExperiment && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Experiment Generated Successfully!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Your custom VR experiment is ready to preview and test
                      </p>
                      <Button onClick={() => setActiveTab("preview")}>
                        <Play className="h-4 w-4 mr-2" />
                        Preview Experiment
                      </Button>
                    </div>
                  )}

                  {error && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Generation Failed</h3>
                      <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                      <Button onClick={generateExperiment} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              {generatedExperiment && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{generatedExperiment.title}</h2>
                      <p className="text-gray-600 dark:text-gray-300">{generatedExperiment.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={shareExperiment} variant="outline" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button onClick={saveExperiment} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save Experiment
                      </Button>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-4 gap-6">
                    {/* Experiment Preview */}
                    <div className="lg:col-span-3">
                      <Card className="h-[600px]">
                        <CardContent className="p-0 h-full">
                          <div className="w-full h-full bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <Sparkles className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Custom VR Experiment
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Your AI-generated experiment is ready!
                              </p>
                              <Badge variant="secondary">Generated with AI</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Controls and Info */}
                    <div className="lg:col-span-1 space-y-6">
                      {/* Instructions */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {generatedExperiment.instructions.map((instruction, index) => (
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

                      {/* Generated Parameters */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Parameters</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {generatedExperiment.parameters.map((param, index) => (
                              <div key={index} className="space-y-1">
                                <Label className="text-sm">{param.label}</Label>
                                <div className="text-xs text-gray-500">
                                  Type: {param.type} | Default: {param.default}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
