"use client"

import { useRouter } from "next/navigation"
import { useLocalParticipant, useRoomContext, useParticipants } from "@livekit/components-react"
import { useMeetStore } from "@/store/meetStore"

export default function ControlBar() {
  const router = useRouter()
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()

  const {
    isMicOn,
    isCamOn,
    isScreenSharing,
    isVRMode,
    isChatOpen,
    isParticipantsOpen,
    isHandRaised,
    unreadCount,
    roomName,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    toggleVRMode,
    toggleChat,
    toggleParticipants,
    toggleHandRaise,
    reset,
  } = useMeetStore()

  const totalParticipants = participants.length + 1

  const handleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicOn)
    toggleMic()
  }

  const handleCam = async () => {
    await localParticipant.setCameraEnabled(!isCamOn)
    toggleCam()
  }

  const handleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing)
      toggleScreenShare()
    } catch {
      // user cancelled
    }
  }

  const handleHandRaise = async () => {
    toggleHandRaise()
  }

  const handleLeave = async () => {
    await room.disconnect()
    reset()
    router.push("/classroom")
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-950 border-t border-gray-800 gap-2">
      <div className="flex items-center gap-2 min-w-0 w-40">
        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
        <span className="text-xs text-gray-400 truncate">{roomName}</span>
      </div>

      <div className="flex items-center gap-2">
        <ControlButton
          active={isMicOn}
          onClick={handleMic}
          label={isMicOn ? "Mute" : "Unmute"}
          activeIcon={<MicIcon />}
          inactiveIcon={<MicOffIcon />}
        />

        <ControlButton
          active={isCamOn}
          onClick={handleCam}
          label={isCamOn ? "Stop Video" : "Start Video"}
          activeIcon={<CamIcon />}
          inactiveIcon={<CamOffIcon />}
        />

        <ControlButton
          active={!isScreenSharing}
          onClick={handleScreenShare}
          label={isScreenSharing ? "Stop Share" : "Share Screen"}
          highlight={isScreenSharing}
          activeIcon={<ScreenShareIcon />}
          inactiveIcon={<ScreenShareIcon />}
        />

        <button
          onClick={handleHandRaise}
          title={isHandRaised ? "Lower hand" : "Raise hand"}
          className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-medium ${
            isHandRaised
              ? "bg-amber-500 text-white hover:bg-amber-400"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          <span className="text-base leading-none">✋</span>
          <span>{isHandRaised ? "Lower" : "Raise"}</span>
        </button>

        <button
          onClick={toggleVRMode}
          title="Toggle VR Mode"
          className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-medium ${
            isVRMode
              ? "bg-purple-600 text-white hover:bg-purple-500"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          <VRIcon />
          <span>{isVRMode ? "Exit VR" : "VR Mode"}</span>
        </button>

        <button
          onClick={handleLeave}
          className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all"
        >
          <LeaveIcon />
          <span>Leave</span>
        </button>
      </div>

      <div className="flex items-center gap-2 w-40 justify-end">
        <button
          onClick={toggleChat}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-medium ${
            isChatOpen ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <ChatIcon />
          <span>Chat</span>
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] flex items-center justify-center px-1 font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={toggleParticipants}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-medium ${
            isParticipantsOpen ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <PeopleIcon />
          <span>People</span>
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-blue-500 text-[10px] flex items-center justify-center px-1 font-bold">
            {totalParticipants}
          </span>
        </button>
      </div>
    </div>
  )
}

function ControlButton({
  active,
  onClick,
  label,
  activeIcon,
  inactiveIcon,
  highlight = false,
}: {
  active: boolean
  onClick: () => void
  label: string
  activeIcon: React.ReactNode
  inactiveIcon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-xs font-medium ${
        highlight
          ? "bg-green-600 text-white hover:bg-green-500"
          : active
            ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            : "bg-red-600/90 text-white hover:bg-red-500"
      }`}
    >
      {active ? activeIcon : inactiveIcon}
      <span>{label}</span>
    </button>
  )
}

function MicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function CamIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CamOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function ScreenShareIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function VRIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function LeaveIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
