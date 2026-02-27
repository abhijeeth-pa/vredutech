"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssetBrowser } from "@/components/3d/asset-browser"
import { PerformanceSettings } from "@/components/3d/performance-monitor"
import { Badge } from "@/components/ui/badge"
import { Eye, Settings, Zap, Download, Globe } from "lucide-react"
import type { Asset3D, HDRIEnvironment } from "@/lib/asset-manager"

export default function AssetsPage() {
  const [selectedAsset, setSelectedAsset] = useState<Asset3D | HDRIEnvironment | null>(null)
  const [showPerformanceSettings, setShowPerformanceSettings] = useState(false)

  const handleSelectModel = (asset: Asset3D) => {
    setSelectedAsset(asset)
    console.log("Selected 3D model:", asset)
  }

  const handleSelectEnvironment = (environment: HDRIEnvironment) => {
    setSelectedAsset(environment)
    console.log("Selected HDRI environment:", environment)
  }

  const handlePreview = (asset: Asset3D | HDRIEnvironment) => {
    console.log("Preview asset:", asset)
    // In a real app, this would open a 3D preview modal
  }

  const handleQualityChange = (quality: "low" | "medium" | "high") => {
    console.log("Quality changed to:", quality)
    // Apply quality settings to 3D renderer
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
              <Eye className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">3D Assets & Optimization</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPerformanceSettings(!showPerformanceSettings)}>
              <Settings className="h-4 w-4 mr-2" />
              Performance
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5 text-blue-600" />
                3D Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">High-quality assets</p>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  Draco Compressed
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-orange-600" />
                HDRI Environments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">PolyHaven quality</p>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                  1K-8K Resolution
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-purple-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">60 FPS</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Optimized rendering</p>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  GPU Accelerated
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-gray-600" />
                Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Size reduction</p>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Lazy Loading</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Asset Browser */}
          <div className="lg:col-span-3">
            <AssetBrowser
              onSelectModel={handleSelectModel}
              onSelectEnvironment={handleSelectEnvironment}
              onPreview={handlePreview}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selected Asset Info */}
            {selectedAsset && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">{selectedAsset.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {"type" in selectedAsset ? selectedAsset.type : selectedAsset.category}
                      </p>
                    </div>

                    {"metadata" in selectedAsset && selectedAsset.metadata && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Vertices:</span>
                          <span>{selectedAsset.metadata.vertices?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Materials:</span>
                          <span>{selectedAsset.metadata.materials}</span>
                        </div>
                      </div>
                    )}

                    {"resolution" in selectedAsset && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Resolution:</span>
                          <span>{selectedAsset.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <span>{selectedAsset.category}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Settings */}
            {showPerformanceSettings && <PerformanceSettings onQualityChange={handleQualityChange} />}

            {/* Optimization Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Optimization Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Draco Compression</p>
                    <p className="text-gray-600 dark:text-gray-300">Reduces file sizes by up to 90%</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Lazy Loading</p>
                    <p className="text-gray-600 dark:text-gray-300">Assets load only when needed</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">HDRI Environments</p>
                    <p className="text-gray-600 dark:text-gray-300">Photorealistic lighting from PolyHaven</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
