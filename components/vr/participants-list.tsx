"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mic, MicOff, Video, VideoOff, Crown, Zap } from "lucide-react"
import type { RemoteParticipant } from "@/lib/vr-networking"

interface ParticipantsListProps {
  participants: RemoteParticipant[]
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  return (
    <Card className="w-64 bg-black/80 backdrop-blur-sm border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <Users className="h-4 w-4" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
              participant.isSpotlighted ? "bg-yellow-900/50 border border-yellow-600" : "bg-gray-800/50 hover:bg-gray-700/50"
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {participant.role === "teacher" && <Crown className="h-3 w-3 text-blue-400" />}
                <span className="text-white text-sm truncate">{participant.name}</span>
              </div>
              {participant.role === "teacher" && (
                <Badge variant="secondary" className="text-xs">
                  Teacher
                </Badge>
              )}
              {participant.isSpotlighted && <Zap className="h-3 w-3 text-yellow-400" />}
            </div>
            <div className="flex items-center gap-1">
              {participant.isMuted ? (
                <MicOff className="h-3 w-3 text-red-500" />
              ) : (
                <Mic className="h-3 w-3 text-green-500" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
