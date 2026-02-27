"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Video, VideoOff, Share, Settings, Headphones, Monitor } from "lucide-react"

interface VRControlsProps {
  isMuted: boolean
  isVideoOn: boolean
  isScreenSharing: boolean
  isVRMode: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleVR: () => void
  onSettings: () => void
}

export function VRControls({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isVRMode,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleVR,
  onSettings,
}: VRControlsProps) {
  return (
    <Card className="bg-black/80 backdrop-blur-sm border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
            onClick={onToggleMute}
            className="text-white border-gray-600"
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button
            variant={!isVideoOn ? "destructive" : "outline"}
            size="sm"
            onClick={onToggleVideo}
            className="text-white border-gray-600"
          >
            {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="sm"
            onClick={onToggleScreenShare}
            className="text-white border-gray-600"
          >
            <Share className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-600" />

          <Button
            variant={isVRMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleVR}
            className="text-white border-gray-600"
          >
            {isVRMode ? <Monitor className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
            {isVRMode ? "Exit VR" : "Enter VR"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSettings}
            className="text-white border-gray-600 bg-transparent"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
