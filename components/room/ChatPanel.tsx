"use client"

import { useEffect, useRef, useState } from "react"
import { useRoomContext } from "@livekit/components-react"
import { useMeetStore } from "@/store/meetStore"

export default function ChatPanel() {
  const { addChatMessage, chatMessages, localName, localIdentity } = useMeetStore()
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const room = useRoomContext()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  useEffect(() => {
    const handleData = (
      payload: Uint8Array,
      participant: { identity: string; name?: string } | undefined,
    ) => {
      try {
        const text = new TextDecoder().decode(payload)
        const msg = JSON.parse(text)
        if (msg.type === "chat") {
          addChatMessage(
            msg.sender || participant?.name || participant?.identity || "Unknown",
            msg.senderIdentity || participant?.identity || "",
            msg.text,
          )
        }
      } catch {
        // ignore malformed
      }
    }
    room.on("dataReceived", handleData)
    return () => {
      room.off("dataReceived", handleData)
    }
  }, [room, addChatMessage])

  const sendMessage = async () => {
    if (!input.trim()) return
    const text = input.trim()
    const senderName = localName || localIdentity
    setInput("")
    addChatMessage(senderName, localIdentity, text)
    const payload = new TextEncoder().encode(
      JSON.stringify({
        type: "chat",
        sender: senderName,
        senderIdentity: localIdentity,
        text,
      }),
    )
    await room.localParticipant.publishData(payload, { reliable: true })
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">In-call messages</h2>
        <span className="text-xs text-gray-500">{chatMessages.length} messages</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-600 text-sm mt-8">
            <div className="text-3xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Messages are only visible during this call</p>
          </div>
        )}
        {chatMessages.map((m) => {
          const isMe = m.senderIdentity === localIdentity || m.sender === (localName || localIdentity)
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-xs text-gray-500 mb-1">
                {isMe ? "You" : m.sender} · {formatTime(m.time)}
              </span>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-200 rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Send a message to everyone..."
            rows={2}
            className="flex-1 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500 transition"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white transition-all flex-shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

