import { create } from "zustand"

export type ParticipantPermissions = {
  canPublish: boolean
  canShare: boolean
  canChat: boolean
}

export type RoomParticipant = {
  identity: string
  name: string
  isHost: boolean
  permissions: ParticipantPermissions
  isMuted: boolean
  isCamOff: boolean
  isHandRaised: boolean
}

export type ChatMessage = {
  id: string
  sender: string
  senderIdentity: string
  text: string
  time: number
}

type MeetStore = {
  localIdentity: string
  localName: string
  roomName: string
  isHost: boolean
  token: string
  serverUrl: string
  isInRoom: boolean
  isMicOn: boolean
  isCamOn: boolean
  isScreenSharing: boolean
  isVRMode: boolean
  isChatOpen: boolean
  isParticipantsOpen: boolean
  isHandRaised: boolean
  pinnedIdentity: string | null
  unreadCount: number
  chatMessages: ChatMessage[]
  participants: Map<string, RoomParticipant>
  whiteboardText: string

  setLocalInfo: (identity: string, name: string) => void
  setRoomInfo: (roomName: string, token: string, serverUrl: string, isHost: boolean) => void
  setIsInRoom: (v: boolean) => void
  toggleMic: () => void
  toggleCam: () => void
  toggleScreenShare: () => void
  toggleVRMode: () => void
  toggleChat: () => void
  toggleParticipants: () => void
  toggleHandRaise: () => void
  setPinnedIdentity: (identity: string | null) => void
  clearUnread: () => void
  setWhiteboardText: (text: string) => void
  addChatMessage: (sender: string, senderIdentity: string, text: string) => void
  updateParticipant: (identity: string, data: Partial<RoomParticipant>) => void
  removeParticipant: (identity: string) => void
  reset: () => void
}

export const useMeetStore = create<MeetStore>((set, get) => ({
  localIdentity: "",
  localName: "",
  roomName: "",
  isHost: false,
  token: "",
  serverUrl: "",
  isInRoom: false,
  isMicOn: true,
  isCamOn: true,
  isScreenSharing: false,
  isVRMode: false,
  isChatOpen: false,
  isParticipantsOpen: false,
  isHandRaised: false,
  pinnedIdentity: null,
  unreadCount: 0,
  chatMessages: [],
  participants: new Map(),
  whiteboardText: "",

  setLocalInfo: (identity, name) => set({ localIdentity: identity, localName: name }),
  setRoomInfo: (roomName, token, serverUrl, isHost) =>
    set({ roomName, token, serverUrl, isHost }),
  setIsInRoom: (v) => set({ isInRoom: v }),
  toggleMic: () => set((s) => ({ isMicOn: !s.isMicOn })),
  toggleCam: () => set((s) => ({ isCamOn: !s.isCamOn })),
  toggleScreenShare: () => set((s) => ({ isScreenSharing: !s.isScreenSharing })),
  toggleVRMode: () => set((s) => ({ isVRMode: !s.isVRMode })),
  toggleHandRaise: () => set((s) => ({ isHandRaised: !s.isHandRaised })),
  setPinnedIdentity: (identity) => set({ pinnedIdentity: identity }),
  clearUnread: () => set({ unreadCount: 0 }),
  setWhiteboardText: (text) => set({ whiteboardText: text.slice(0, 800) }),
  toggleChat: () =>
    set((s) => ({
      isChatOpen: !s.isChatOpen,
      isParticipantsOpen: false,
      unreadCount: s.isChatOpen ? s.unreadCount : 0,
    })),
  toggleParticipants: () =>
    set((s) => ({ isParticipantsOpen: !s.isParticipantsOpen, isChatOpen: false })),
  addChatMessage: (sender, senderIdentity, text) =>
    set((s) => ({
      chatMessages: [
        ...s.chatMessages,
        {
          id: Math.random().toString(36).slice(2),
          sender,
          senderIdentity,
          text,
          time: Date.now(),
        },
      ],
      unreadCount: s.isChatOpen ? 0 : s.unreadCount + 1,
    })),
  updateParticipant: (identity, data) =>
    set((s) => {
      const map = new Map(s.participants)
      const existing = map.get(identity) || {
        identity,
        name: identity,
        isHost: false,
        permissions: { canPublish: true, canShare: true, canChat: true },
        isMuted: false,
        isCamOff: false,
        isHandRaised: false,
      }
      map.set(identity, { ...existing, ...data })
      return { participants: map }
    }),
  removeParticipant: (identity) =>
    set((s) => {
      const map = new Map(s.participants)
      map.delete(identity)
      return { participants: map }
    }),
  reset: () =>
    set({
      localIdentity: "",
      localName: "",
      roomName: "",
      isHost: false,
      token: "",
      serverUrl: "",
      isInRoom: false,
      isMicOn: true,
      isCamOn: true,
      isScreenSharing: false,
      isVRMode: false,
      isChatOpen: false,
      isParticipantsOpen: false,
      isHandRaised: false,
      pinnedIdentity: null,
      unreadCount: 0,
      chatMessages: [],
      participants: new Map(),
      whiteboardText: "",
    }),
}))
