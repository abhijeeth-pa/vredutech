"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import "@livekit/components-styles";
import { useMeetStore } from "@/store/meetStore";
import VideoGrid from "@/components/room/VideoGrid";
import ControlBar from "@/components/room/ControlBar";
import ChatPanel from "@/components/room/ChatPanel";
import ParticipantsPanel from "@/components/room/ParticipantsPanel";

const VRMode = dynamic(() => import("@/components/vr/VRMode"), { ssr: false });

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomName = decodeURIComponent(params.roomId as string);
  const { token, serverUrl, isVRMode, isChatOpen, isParticipantsOpen, reset } = useMeetStore();
  const [localToken] = useState(token);
  const [localServerUrl] = useState(serverUrl);

  // If accessed directly via URL (no token in store), prompt to join
  useEffect(() => {
    if (!token) {
      router.push(`/classroom?join=${encodeURIComponent(roomName)}`);
    }
  }, [token, roomName, router]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!localToken || !localServerUrl) return null;

  return (
    <LiveKitRoom
      token={localToken}
      serverUrl={localServerUrl}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={() => {
        reset();
        router.push("/classroom");
      }}
      onError={(err) => {
        console.error("LiveKit error:", err);
      }}
      style={{ height: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <RoomAudioRenderer />
      <RoomInner
        isVRMode={isVRMode}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        roomName={roomName}
      />
    </LiveKitRoom>
  );
}

function RoomInner({
  isVRMode,
  isChatOpen,
  isParticipantsOpen,
  roomName,
}: {
  isVRMode: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  roomName: string;
}) {
  const room = useRoomContext();
  const router = useRouter();
  const {
    localIdentity,
    localName,
    isHost,
    isMicOn,
    isCamOn,
    isHandRaised,
    reset,
    toggleMic,
    toggleCam,
    addChatMessage,
    setWhiteboardText,
    updateParticipant,
    removeParticipant,
  } = useMeetStore();

  const showSidebar = isChatOpen || isParticipantsOpen;

  // Handle incoming data messages
  const handleData = useCallback(
    (payload: Uint8Array, participant: { identity: string; name?: string } | undefined) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        switch (msg.type) {
          case "chat":
            addChatMessage(
              msg.sender || participant?.name || participant?.identity || "Unknown",
              msg.senderIdentity || participant?.identity || "",
              msg.text
            );
            break;

          case "host_kick":
            if (msg.target === localIdentity) {
              alert("You have been removed from the meeting by the host.");
              room.disconnect();
              reset();
              router.push("/classroom");
            }
            break;

          case "host_mute":
            if (msg.target === localIdentity) {
              room.localParticipant.setMicrophoneEnabled(false);
              if (isMicOn) toggleMic();
            }
            break;

          case "host_mute_all":
            room.localParticipant.setMicrophoneEnabled(false);
            if (isMicOn) toggleMic();
            break;

          case "hand_raise":
            updateParticipant(msg.identity, { isHandRaised: msg.raised });
            break;

          case "permission_update":
            if (msg.target === localIdentity) {
              if (msg.permissions?.canPublish === false) {
                room.localParticipant.setMicrophoneEnabled(false);
                room.localParticipant.setCameraEnabled(false);
              }
            }
            break;

          case "host_identity":
            if (msg.identity) {
              updateParticipant(msg.identity, {
                isHost: true,
                name: msg.name || participant?.name || participant?.identity || msg.identity,
              });
            }
            break;

          case "board_update":
            setWhiteboardText(typeof msg.text === "string" ? msg.text : "");
            break;
        }
      } catch {
        // ignore malformed messages
      }
    },
    [localIdentity, isMicOn, room, reset, router, toggleMic, addChatMessage, setWhiteboardText, updateParticipant]
  );

  // Broadcast hand raise state whenever it changes
  useEffect(() => {
    const payload = new TextEncoder().encode(
      JSON.stringify({ type: "hand_raise", identity: localIdentity, raised: isHandRaised })
    );
    room.localParticipant.publishData(payload, { reliable: true }).catch(() => {});
  }, [isHandRaised, localIdentity, room]);

  useEffect(() => {
    if (!localIdentity) return;
    updateParticipant(localIdentity, {
      identity: localIdentity,
      name: localName || localIdentity,
      isHost,
    });
  }, [isHost, localIdentity, localName, updateParticipant]);

  useEffect(() => {
    if (!isHost || !localIdentity) return;
    const payload = new TextEncoder().encode(
      JSON.stringify({
        type: "host_identity",
        identity: localIdentity,
        name: localName || localIdentity,
      }),
    );
    room.localParticipant.publishData(payload, { reliable: true }).catch(() => {});
  }, [isHost, localIdentity, localName, room]);

  useEffect(() => {
    room.on("dataReceived", handleData);
    return () => { room.off("dataReceived", handleData); };
  }, [room, handleData]);

  // Track participants joining/leaving
  useEffect(() => {
    const onConnected = (participant: { identity: string; name?: string }) => {
      updateParticipant(participant.identity, {
        name: participant.name || participant.identity,
        isHost: false,
      });
      if (isHost && localIdentity) {
        const payload = new TextEncoder().encode(
          JSON.stringify({
            type: "host_identity",
            identity: localIdentity,
            name: localName || localIdentity,
          }),
        );
        room.localParticipant.publishData(payload, { reliable: true }).catch(() => {});
      }
    };
    const onDisconnected = (participant: { identity: string }) => {
      removeParticipant(participant.identity);
    };

    room.on("participantConnected", onConnected);
    room.on("participantDisconnected", onDisconnected);
    return () => {
      room.off("participantConnected", onConnected);
      room.off("participantDisconnected", onDisconnected);
    };
  }, [isHost, localIdentity, localName, room, updateParticipant, removeParticipant]);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white" style={{ height: "100dvh" }}>
      {/* VR Mode overlay */}
      {isVRMode && <VRMode />}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-950 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-sm">VRMeet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-medium truncate max-w-48">{roomName}</span>
          <CopyRoomButton roomName={roomName} />
        </div>
        <LiveTime />
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 p-3 overflow-hidden">
          <VideoGrid />
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 flex-shrink-0 border-l border-gray-800 overflow-hidden flex flex-col">
            {isChatOpen && <ChatPanel />}
            {isParticipantsOpen && <ParticipantsPanel />}
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex-shrink-0">
        <ControlBar />
      </div>
    </div>
  );
}

function CopyRoomButton({ roomName }: { roomName: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const url = `${window.location.origin}/classroom?join=${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy invite link"
      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function LiveTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <div className="text-sm text-gray-400 tabular-nums">{time}</div>;
}
