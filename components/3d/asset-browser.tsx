"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, Eye } from "lucide-react"
import { MODEL_ASSETS, POLYHAVEN_ENVIRONMENTS, type Asset3D, type HDRIEnvironment } from "@/lib/asset-manager"

interface AssetBrowserProps {
  onSelectModel?: (asset: Asset3D) => void
  onSelectEnvironment?: (environment: HDRIEnvironment) => void
  onPreview?: (asset: Asset3D | HDRIEnvironment) => void
}

export function AssetBrowser({ onSelectModel, onSelectEnvironment, onPreview }: AssetBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("models")

  const filteredModels = MODEL_ASSETS.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredEnvironments = POLYHAVEN_ENVIRONMENTS.filter(
    (env) =>
      env.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      env.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) return `${(sizeInMB * 1024).toFixed(0)} KB`
    return `${sizeInMB.toFixed(1)} MB`
  }

  const getQualityBadge = (size: number) => {
    if (size < 2) return { label: "Optimized", color: "bg-green-100 text-green-800" }
    if (size < 5) return { label: "Standard", color: "bg-blue-100 text-blue-800" }
    return { label: "High Detail", color: "bg-purple-100 text-purple-800" }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          3D Asset Browser
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="models">3D Models ({filteredModels.length})</TabsTrigger>
            <TabsTrigger value="environments">HDRI Environments ({filteredEnvironments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((asset) => {
                const quality = getQualityBadge(asset.size || 0)
                return (
                  <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-t-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">3D</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Preview</p>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-sm">{asset.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {asset.type}
                            </Badge>
                            <Badge className={`text-xs ${quality.color}`}>{quality.label}</Badge>
                            {asset.compressed && (
                              <Badge variant="secondary" className="text-xs">
                                Draco
                              </Badge>
                            )}
                          </div>
                        </div>

                        {asset.metadata && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            <div className="flex justify-between">
                              <span>Vertices:</span>
                              <span>{asset.metadata.vertices?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Size:</span>
                              <span>{formatFileSize(asset.size || 0)}</span>
                            </div>
                            {asset.metadata.animations && asset.metadata.animations.length > 0 && (
                              <div className="flex justify-between">
                                <span>Animations:</span>
                                <span>{asset.metadata.animations.length}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onPreview?.(asset)} className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" onClick={() => onSelectModel?.(asset)} className="flex-1">
                            <Download className="h-3 w-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="environments" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEnvironments.map((env) => (
                <Card key={env.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-video rounded-t-lg overflow-hidden">
                    <img
                      src={env.preview || "/placeholder.svg"}
                      alt={env.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm">{env.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {env.resolution}
                          </Badge>
                          <Badge className="text-xs bg-orange-100 text-orange-800">{env.category}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            PolyHaven
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onPreview?.(env)} className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" onClick={() => onSelectEnvironment?.(env)} className="flex-1">
                          <Download className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
