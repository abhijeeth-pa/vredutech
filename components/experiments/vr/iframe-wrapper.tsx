"use client"

import { useEffect, useState } from "react"

export default function IframeWithFallback({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
    const t = setTimeout(() => {
      if (!loaded) setFailed(true)
    }, 6000)
    return () => clearTimeout(t)
  }, [src, loaded])

  // If it's a Sketchfab embed, ensure useful query params are present
  let finalSrc = src
  try {
    const u = new URL(src)
    if (u.hostname.includes('sketchfab.com')) {
      if (!u.searchParams.has('preload')) u.searchParams.set('preload', '1')
      if (!u.searchParams.has('autostart')) u.searchParams.set('autostart', '1')
      finalSrc = u.toString()
    }
  } catch (e) {
    // ignore URL parse errors — fall back to original src
    finalSrc = src
  }

  return (
    <div className="w-full h-full bg-black/50 flex items-center justify-center relative">
      {!loaded && !failed && <div className="text-gray-300">Loading 3D model...</div>}
      {failed && (
        <div className="text-center p-4 text-sm text-gray-300">
          Failed to load the embed.{' '}
          <a href={finalSrc} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            Open in new tab
          </a>
        </div>
      )}
      <iframe
        title={title}
        src={finalSrc}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; xr-spatial-tracking"
        className="w-full h-full absolute inset-0"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
