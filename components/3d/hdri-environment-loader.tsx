"use client"

import { Suspense, useState } from "react"
import { useLoader } from "@react-three/fiber"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
import { Environment } from "@react-three/drei"
import type { HDRIEnvironment } from "@/lib/asset-manager"

interface HDRIEnvironmentLoaderProps {
  environment: HDRIEnvironment
  background?: boolean
  blur?: number
  intensity?: number
  onLoad?: () => void
  onError?: (error: Error) => void
}

function HDRIEnvironmentMesh({
  environment,
  background = true,
  blur = 0,
  intensity = 1,
  onLoad,
  onError,
}: HDRIEnvironmentLoaderProps) {
  try {
    const texture = useLoader(RGBELoader, environment.url)

    if (onLoad) {
      onLoad()
    }

    return <Environment map={texture} background={background} blur={blur} intensity={intensity} />
  } catch (error) {
    if (onError) {
      onError(error as Error)
    }
    return null
  }
}

function EnvironmentFallback() {
  return <Environment preset="city" />
}

export function HDRIEnvironmentLoader(props: HDRIEnvironmentLoaderProps) {
  const [error, setError] = useState<Error | null>(null)

  const handleError = (err: Error) => {
    console.error(`Failed to load HDRI environment: ${props.environment.name}`, err)
    setError(err)
    props.onError?.(err)
  }

  if (error) {
    return <EnvironmentFallback />
  }

  return (
    <Suspense fallback={<EnvironmentFallback />}>
      <HDRIEnvironmentMesh {...props} onError={handleError} />
    </Suspense>
  )
}

// Environment Selector Component
export function EnvironmentSelector({
  environments,
  selected,
  onSelect,
}: {
  environments: HDRIEnvironment[]
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {environments.map((env) => (
        <button
          key={env.id}
          onClick={() => onSelect(env.id)}
          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
            selected === env.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <img src={env.preview || "/placeholder.svg"} alt={env.name} className="w-full h-20 object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1">
            <p className="text-xs font-medium truncate">{env.name}</p>
            <p className="text-xs opacity-75">
              {env.resolution} • {env.category}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
