"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const joinParam = searchParams.get("join") || "";

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState(joinParam);
  const [isCreating, setIsCreating] = useState(!joinParam);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"join" | "new">(joinParam ? "join" : "new");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (joinParam) {
      setRoomCode(joinParam);
      setActiveTab("join");
      setIsCreating(false);
    }
  }, [joinParam]);

  const handleJoinOrCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your name.");
    if (!roomCode.trim()) return setError("Please enter a room name.");
    setError("");
    const targetRoom = roomCode.trim().toLowerCase().replace(/\s+/g, "-");
    router.push(
      `/classroom/prejoin/${encodeURIComponent(targetRoom)}?name=${encodeURIComponent(name.trim())}&host=${isCreating ? "1" : "0"}`
    );
  };

  const generateRoomCode = () => {
    const words = ["alpha", "beta", "gamma", "delta", "echo", "foxtrot", "hotel", "india", "juliet", "kilo"];
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    setRoomCode(`${w1}-${w2}-${num}`);
  };

  const handleCopyLink = () => {
    if (!roomCode.trim()) return;
    const url = `${window.location.origin}/classroom?join=${encodeURIComponent(roomCode.trim().toLowerCase().replace(/\s+/g, "-"))}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight">VRMeet</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            Supports VR &amp; Non-VR
          </div>
          <button
            onClick={() => router.push("/classroom/device-check")}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
            title="Test your camera, microphone, and speakers"
          >
            Check Devices
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Video meetings for everyone
            </h1>
            <p className="text-gray-400 text-lg">
              Connect, collaborate, and experience in VR or your browser.
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex rounded-xl bg-gray-900 p-1 mb-6 border border-gray-800">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "new"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => {
                setActiveTab("new");
                setIsCreating(true);
                setRoomCode("");
                generateRoomCode();
              }}
            >
              New Meeting
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "join"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => {
                setActiveTab("join");
                setIsCreating(false);
                if (!joinParam) setRoomCode("");
              }}
            >
              Join Meeting
            </button>
          </div>

          <form onSubmit={handleJoinOrCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {activeTab === "new" ? "Room Name" : "Meeting Code"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder={activeTab === "join" ? "Enter meeting code (e.g. alpha-beta-123)" : "Room name"}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition pr-28"
                />
                {activeTab === "new" && (
                  <button
                    type="button"
                    onClick={generateRoomCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
                  >
                    Generate
                  </button>
                )}
              </div>
            </div>

            {/* Copy invite link (shown when room code is entered) */}
            {roomCode.trim() && activeTab === "new" && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-sm transition"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400">Invite link copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Copy invite link
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-all shadow-lg shadow-blue-900/30"
            >
              {activeTab === "new"
                ? "Start Meeting"
                : "Join Meeting"}
            </button>
          </form>

          {/* Features */}
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: "🎥", label: "HD Video" },
              { icon: "🥽", label: "VR Ready" },
              { icon: "🔒", label: "Host Controls" },
            ].map((f) => (
              <div key={f.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs text-gray-400 font-medium">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LobbyContent />
    </Suspense>
  );
}
