"use client"

import { useParticipants, useLocalParticipant, useTracks, VideoTrack, AudioTrack, useIsSpeaking } from "@livekit/components-react"
import { Track, type Participant } from "livekit-client"
import { useMeetStore } from "@/store/meetStore"

function ParticipantTile({
  participant,
  isPinned,
  onPin,
}: {
  participant: Participant
  isPinned: boolean
  onPin: (identity: string | null) => void
}) {
  const { localParticipant } = useLocalParticipant()
  const isLocal = participant.identity === localParticipant.identity
  const isSpeaking = useIsSpeaking(participant)
  const { participants: storeParticipants } = useMeetStore()
  const storeP = storeParticipants.get(participant.identity)
  const isHandRaised = storeP?.isHandRaised ?? false

  const videoTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false, updateOnlyOn: [] },
  ).filter((t) => t.participant.identity === participant.identity)

  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  ).filter((t) => t.participant.identity === participant.identity)

  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: false },
  ).filter((t) => t.participant.identity === participant.identity && !isLocal)

  const hasVideo = videoTracks.some((t) => t.publication?.isSubscribed || isLocal) && videoTracks[0]?.publication
  const hasScreen = screenTracks.length > 0
  const isMuted = participant.isMicrophoneEnabled === false

  const initials = (participant.name || participant.identity)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const colors = [
    "from-blue-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
    "from-violet-500 to-indigo-600",
    "from-amber-500 to-yellow-600",
  ]
  const colorIdx =
    participant.identity.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length

  return (
    <div
      className={`relative bg-gray-900 rounded-2xl overflow-hidden aspect-video border-2 transition-all group cursor-pointer ${
        isSpeaking
          ? "border-green-500 shadow-lg shadow-green-500/20"
          : isPinned
            ? "border-blue-500"
            : "border-gray-800"
      }`}
      onClick={() => onPin(isPinned ? null : participant.identity)}
    >
      {hasVideo && videoTracks[0] && videoTracks[0].publication ? (
        <VideoTrack trackRef={videoTracks[0] as any} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900">
          <div
            className={`w-16 h-16 rounded-full bg-linear-to-br ${colors[colorIdx]} flex items-center justify-center text-2xl font-bold text-white`}
          >
            {initials}
          </div>
        </div>
      )}

      {hasScreen && screenTracks[0] && (
        <div className="absolute inset-0">
          <VideoTrack
            trackRef={screenTracks[0] as any}
            className="w-full h-full object-contain bg-black"
          />
          <div className="absolute top-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded-lg font-medium">
            Screen
          </div>
        </div>
      )}

      {audioTracks.map((t) => (
        <AudioTrack key={t.publication?.trackSid} trackRef={t as any} />
      ))}

      {isSpeaking && (
        <div className="absolute inset-0 rounded-2xl border-2 border-green-500 pointer-events-none animate-pulse" />
      )}

      {isHandRaised && (
        <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1">
          <span>✋</span>
        </div>
      )}

      {isPinned && (
        <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-xs px-2 py-1 rounded-lg font-medium">
          Pinned
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-linear-to-t from-black/80 to-transparent flex items-center justify-between opacity-100 group-hover:opacity-100">
        <span className="text-white text-sm font-medium truncate max-w-[70%]">
          {participant.name || participant.identity}
          {isLocal && <span className="text-blue-400 ml-1 text-xs">(You)</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {isSpeaking && !isMuted && (
            <div className="flex items-end gap-px h-4">
              <div className="w-0.5 h-1.5 bg-green-400 rounded animate-[wave_0.5s_ease-in-out_infinite]" />
              <div className="w-0.5 h-3 bg-green-400 rounded animate-[wave_0.5s_ease-in-out_0.1s_infinite]" />
              <div className="w-0.5 h-2 bg-green-400 rounded animate-[wave_0.5s_ease-in-out_0.2s_infinite]" />
              <div className="w-0.5 h-3 bg-green-400 rounded animate-[wave_0.5s_ease-in-out_0.1s_infinite]" />
            </div>
          )}
          {isMuted && (
            <div className="w-5 h-5 rounded-full bg-red-600/80 flex items-center justify-center">
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VideoGrid() {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const { pinnedIdentity, setPinnedIdentity } = useMeetStore()

  const all = [localParticipant, ...participants.filter((p) => p.identity !== localParticipant.identity)]
  const count = all.length

  const pinnedParticipant = pinnedIdentity ? all.find((p) => p.identity === pinnedIdentity) : null
  const otherParticipants = pinnedParticipant ? all.filter((p) => p.identity !== pinnedIdentity) : all

  if (pinnedParticipant) {
    return (
      <div className="flex flex-col h-full gap-2">
        <div className="flex-1 min-h-0">
          <ParticipantTile participant={pinnedParticipant} isPinned onPin={setPinnedIdentity} />
        </div>
        {otherParticipants.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
            {otherParticipants.map((p) => (
              <div key={p.identity} className="w-40 shrink-0">
                <ParticipantTile participant={p} isPinned={false} onPin={setPinnedIdentity} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const gridClass =
    count === 1
      ? "grid-cols-1 max-w-2xl mx-auto w-full"
      : count === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : count <= 4
          ? "grid-cols-2"
          : count <= 6
            ? "grid-cols-2 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"

  return (
    <div className={`grid gap-2 w-full h-full content-start ${gridClass}`}>
      {all.map((p) => (
        <ParticipantTile
          key={p.identity}
          participant={p}
          isPinned={false}
          onPin={setPinnedIdentity}
        />
      ))}
    </div>
  )
}

