"use client"

import { useState } from "react"
import { useParticipants, useLocalParticipant, useRoomContext } from "@livekit/components-react"
import { useMeetStore } from "@/store/meetStore"

export default function ParticipantsPanel() {
  const room = useRoomContext()
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const { isHost, localIdentity, participants: storeParticipants } = useMeetStore()
  const [copiedLink, setCopiedLink] = useState(false)
  const [muteAllDone, setMuteAllDone] = useState(false)

  const allParticipants = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant.identity),
  ]

  const sendData = async (payload: object) => {
    const encoded = new TextEncoder().encode(JSON.stringify(payload))
    await room.localParticipant.publishData(encoded, { reliable: true })
  }

  const handleMuteParticipant = (identity: string) =>
    sendData({ type: "host_mute", target: identity })

  const handleKick = (identity: string) => {
    if (!window.confirm("Remove this participant from the meeting?")) return
    void sendData({ type: "host_kick", target: identity })
  }

  const handleMuteAll = async () => {
    await sendData({ type: "host_mute_all" })
    setMuteAllDone(true)
    setTimeout(() => setMuteAllDone(false), 2000)
  }

  const handlePermission = (identity: string, canPublish: boolean) => {
    void sendData({ type: "permission_update", target: identity, permissions: { canPublish } })
  }

  const copyInviteLink = () => {
    const url = `${window.location.origin}/?join=${encodeURIComponent(room.name)}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">People ({allParticipants.length})</h2>
        <button
          onClick={copyInviteLink}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition"
        >
          {copiedLink ? (
            <>
              <svg
                className="w-3.5 h-3.5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Invite link
            </>
          )}
        </button>
      </div>

      <div className="px-4 py-3 border-b border-gray-800/60 flex-shrink-0">
        <button
          onClick={copyInviteLink}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 transition"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm text-blue-400 font-medium">Add people to this call</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {allParticipants.map((p) => {
          const isLocal = p.identity === localParticipant.identity
          const isMuted = !p.isMicrophoneEnabled
          const isCamOff = !p.isCameraEnabled
          const storeP = storeParticipants.get(p.identity)
          const isHandRaised = storeP?.isHandRaised ?? false
          const isParticipantHost = storeP?.isHost ?? (isLocal && isHost)

          const initials = (p.name || p.identity)
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
            p.identity.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length

          return (
            <div
              key={p.identity}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-900/60 transition group"
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-sm font-semibold text-white`}
                >
                  {initials}
                </div>
                {!isMuted && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-950" />
                )}
                {isHandRaised && (
                  <div className="absolute -top-1 -right-1 text-sm leading-none">✋</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">
                    {p.name || p.identity}
                  </span>
                  {isLocal && <span className="text-xs text-gray-500">(You)</span>}
                  {(isParticipantHost || (isLocal && isHost)) && (
                    <span className="text-xs bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 leading-none">
                      Host
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {isMuted && (
                    <span className="text-xs text-red-400 flex items-center gap-0.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                        <path d="M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      </svg>
                      Muted
                    </span>
                  )}
                  {isCamOff && (
                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <line x1="2" y1="2" x2="22" y2="22" />
                        <path d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14" />
                      </svg>
                      Cam off
                    </span>
                  )}
                  {isHandRaised && (
                    <span className="text-xs text-amber-400">Hand raised</span>
                  )}
                </div>
              </div>

              {isHost && !isLocal && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                  <button
                    onClick={() => handleMuteParticipant(p.identity)}
                    title="Mute participant"
                    className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                      <path d="M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handlePermission(p.identity, false)}
                    title="Disable publishing"
                    className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-orange-400 transition"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <line x1="2" y1="2" x2="22" y2="22" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleKick(p.identity)}
                    title="Remove from call"
                    className="p-1.5 rounded-lg hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isHost && (
        <div className="px-4 py-3 border-t border-gray-800 space-y-2 flex-shrink-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Host Controls</p>
          <button
            onClick={handleMuteAll}
            className="w-full text-left text-sm text-gray-300 hover:text-white px-3 py-2.5 rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
              <path d="M15 9.34V4a3 3 0 0 0-5.94-.6" />
            </svg>
            {muteAllDone ? "All muted!" : "Mute all participants"}
          </button>
        </div>
      )}
    </div>
  )
}

