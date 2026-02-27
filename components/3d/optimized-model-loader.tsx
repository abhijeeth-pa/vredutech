"use client"

import { Suspense, useRef, useEffect, useState } from "react"
import { useLoader, useFrame } from "@react-three/fiber"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { Box, Text } from "@react-three/drei"
import type * as THREE from "three"
import type { Asset3D } from "@/lib/asset-manager"

// Draco Loader Setup
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/")

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

interface OptimizedModelProps {
  asset: Asset3D
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
  autoRotate?: boolean
  onLoad?: (model: THREE.Group) => void
  onError?: (error: Error) => void
}

function ModelMesh({
  asset,
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  autoRotate = false,
  onLoad,
  onError,
}: OptimizedModelProps) {
  const meshRef = useRef<THREE.Group>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Load model with caching
  const gltf = useLoader(GLTFLoader, asset.url, (loader) => {
    loader.setDRACOLoader(dracoLoader)

    // Progress tracking
    loader.manager.onProgress = (url, loaded, total) => {
      if (total > 0) {
        setLoadingProgress((loaded / total) * 100)
      }
    }
  })

  useEffect(() => {
    if (gltf && onLoad) {
      onLoad(gltf.scene)
    }
  }, [gltf, onLoad])

  useFrame((state) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  if (!gltf) return null

  return (
    <group ref={meshRef} position={position} scale={scale} rotation={rotation}>
      <primitive object={gltf.scene} />
    </group>
  )
}

function LoadingFallback({ asset }: { asset: Asset3D }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.7
    }
  })

  return (
    <group>
      <Box ref={meshRef} args={[1, 1, 1]}>
        <meshStandardMaterial color="#3498db" transparent opacity={0.6} />
      </Box>
      <Text position={[0, -1.5, 0]} fontSize={0.3} color="white" anchorX="center">
        Loading {asset.name}...
      </Text>
    </group>
  )
}

function ErrorFallback({ asset, error }: { asset: Asset3D; error: Error }) {
  return (
    <group>
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color="#e74c3c" />
      </Box>
      <Text position={[0, -1.5, 0]} fontSize={0.2} color="white" anchorX="center" maxWidth={4}>
        Failed to load {asset.name}
      </Text>
      <Text position={[0, -2, 0]} fontSize={0.15} color="#ffcccc" anchorX="center" maxWidth={4}>
        {error.message}
      </Text>
    </group>
  )
}

export function OptimizedModelLoader(props: OptimizedModelProps) {
  const [error, setError] = useState<Error | null>(null)

  const handleError = (err: Error) => {
    setError(err)
    props.onError?.(err)
  }

  if (error) {
    return <ErrorFallback asset={props.asset} error={error} />
  }

  return (
    <Suspense fallback={<LoadingFallback asset={props.asset} />}>
      <ModelMesh {...props} onError={handleError} />
    </Suspense>
  )
}

// Lazy Loading Component
export function LazyModel({ asset, distance = 50, ...props }: OptimizedModelProps & { distance?: number }) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ camera }) => {
    if (groupRef.current && !shouldLoad) {
      const distanceToCamera = camera.position.distanceTo(groupRef.current.position)
      if (distanceToCamera < distance) {
        setShouldLoad(true)
      }
    }
  })

  return (
    <group ref={groupRef} position={props.position}>
      {shouldLoad ? (
        <OptimizedModelLoader asset={asset} {...props} />
      ) : (
        <Box args={[0.5, 0.5, 0.5]}>
          <meshBasicMaterial color="#666" transparent opacity={0.3} />
        </Box>
      )}
    </group>
  )
}
