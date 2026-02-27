// Asset Management System for 3D Models and Environments
export interface Asset3D {
  id: string
  name: string
  type: "model" | "environment" | "texture"
  url: string
  compressed?: boolean
  size?: number
  metadata?: {
    vertices?: number
    faces?: number
    materials?: number
    animations?: string[]
  }
}

export interface HDRIEnvironment {
  id: string
  name: string
  url: string
  resolution: "1k" | "2k" | "4k" | "8k"
  category: "studio" | "outdoor" | "indoor" | "abstract"
  preview: string
}

// PolyHaven HDRI Environments
export const POLYHAVEN_ENVIRONMENTS: HDRIEnvironment[] = [
  {
    id: "studio_small_03",
    name: "Studio Small 03",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr",
    resolution: "1k",
    category: "studio",
    preview: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "forest_slope",
    name: "Forest Slope",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/forest_slope_1k.hdr",
    resolution: "1k",
    category: "outdoor",
    preview: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "modern_buildings_2",
    name: "Modern Buildings 2",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/modern_buildings_2_1k.hdr",
    resolution: "1k",
    category: "outdoor",
    preview: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "workshop",
    name: "Workshop",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/workshop_1k.hdr",
    resolution: "1k",
    category: "indoor",
    preview: "/placeholder.svg?height=200&width=300",
  },
  {
    id: "sunset_fairway",
    name: "Sunset Fairway",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_fairway_1k.hdr",
    resolution: "1k",
    category: "outdoor",
    preview: "/placeholder.svg?height=200&width=300",
  },
]

// 3D Model Assets (Sketchfab-style)
export const MODEL_ASSETS: Asset3D[] = [
  {
    id: "dna_double_helix",
    name: "DNA Double Helix",
    type: "model",
    url: "/models/dna_helix.glb",
    compressed: true,
    size: 2.1,
    metadata: {
      vertices: 15420,
      faces: 8960,
      materials: 3,
      animations: ["rotate", "unwind"],
    },
  },
  {
    id: "human_heart",
    name: "Human Heart Anatomy",
    type: "model",
    url: "/models/human_heart.glb",
    compressed: true,
    size: 4.8,
    metadata: {
      vertices: 28340,
      faces: 16720,
      materials: 8,
      animations: ["beat", "cross_section"],
    },
  },
  {
    id: "solar_system",
    name: "Solar System",
    type: "model",
    url: "/models/solar_system.glb",
    compressed: true,
    size: 6.2,
    metadata: {
      vertices: 45680,
      faces: 23400,
      materials: 12,
      animations: ["orbit", "rotation"],
    },
  },
  {
    id: "molecule_caffeine",
    name: "Caffeine Molecule",
    type: "model",
    url: "/models/caffeine_molecule.glb",
    compressed: true,
    size: 1.3,
    metadata: {
      vertices: 8920,
      faces: 4560,
      materials: 4,
    },
  },
  {
    id: "pendulum_apparatus",
    name: "Pendulum Apparatus",
    type: "model",
    url: "/models/pendulum.glb",
    compressed: true,
    size: 3.1,
    metadata: {
      vertices: 18760,
      faces: 9840,
      materials: 6,
      animations: ["swing"],
    },
  },
]

// Asset Loading Cache
class AssetCache {
  private cache = new Map<string, any>()
  private loading = new Map<string, Promise<any>>()

  async load(url: string, loader: (url: string) => Promise<any>): Promise<any> {
    // Return cached asset if available
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }

    // Return existing loading promise if already loading
    if (this.loading.has(url)) {
      return this.loading.get(url)
    }

    // Start loading
    const loadingPromise = loader(url).then((asset) => {
      this.cache.set(url, asset)
      this.loading.delete(url)
      return asset
    })

    this.loading.set(url, loadingPromise)
    return loadingPromise
  }

  clear() {
    this.cache.clear()
    this.loading.clear()
  }

  getCacheSize() {
    return this.cache.size
  }
}

export const assetCache = new AssetCache()

// Performance Monitoring
export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60

  update() {
    this.frameCount++
    const currentTime = performance.now()

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      this.frameCount = 0
      this.lastTime = currentTime
    }

    return this.fps
  }

  getFPS() {
    return this.fps
  }

  getMemoryUsage() {
    if ("memory" in performance) {
      return {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576),
      }
    }
    return null
  }
}

export const performanceMonitor = new PerformanceMonitor()
