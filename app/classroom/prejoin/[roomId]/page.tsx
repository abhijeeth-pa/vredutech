"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMeetStore } from "@/store/meetStore";
import { v4 as uuidv4 } from "uuid";

function PreJoinContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomName = decodeURIComponent(params.roomId as string);
  const isHost = searchParams.get("host") === "1";
  const nameParam = searchParams.get("name") || "";

  const { setLocalInfo, setRoomInfo } = useMeetStore();

  const [name, setName] = useState(nameParam);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[] }>({
    cameras: [],
    mics: [],
  });
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMic, setSelectedMic] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // Get available devices
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devs) => {
        const cameras = devs.filter((d) => d.kind === "videoinput");
        const mics = devs.filter((d) => d.kind === "audioinput");
        setDevices({ cameras, mics });
        if (cameras[0]) setSelectedCamera(cameras[0].deviceId);
        if (mics[0]) setSelectedMic(mics[0].deviceId);
      })
      .catch(() => {});
  }, []);

  // Start preview stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        if (previewStream) {
          previewStream.getTracks().forEach((t) => t.stop());
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: camOn ? { deviceId: selectedCamera || undefined } : false,
          audio: micOn ? { deviceId: selectedMic || undefined } : false,
        });
        setPreviewStream(stream);
        if (videoRef.current && camOn) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Audio level meter
        if (micOn) {
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyserRef.current = analyser;
          analyser.fftSize = 256;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const data = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            setAudioLevel(Math.min(100, avg * 2));
            animFrameRef.current = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch {
        // permissions denied or device not available
      }
    };

    start();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
      cancelAnimationFrame(animFrameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn, micOn, selectedCamera, selectedMic]);

  const handleJoin = async () => {
    if (!name.trim()) return setError("Please enter your name.");
    setError("");
    setLoading(true);

    // Stop preview
    previewStream?.getTracks().forEach((t) => t.stop());

    try {
      const identity = `${name.trim().replace(/\s+/g, "-")}-${uuidv4().slice(0, 6)}`;

      const res = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          identity,
          name: name.trim(),
          canPublish: true,
          canSubscribe: true,
          isAdmin: isHost,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get token");

      setLocalInfo(identity, name.trim());
      setRoomInfo(roomName, data.token, data.serverUrl, isHost);

      // Apply initial device states to store
      const store = useMeetStore.getState();
      if (!micOn && store.isMicOn) store.toggleMic();
      if (!camOn && store.isCamOn) store.toggleCam();

      router.push(`/classroom/room/${encodeURIComponent(roomName)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-lg font-semibold">VRMeet</span>
      </div>

      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-1 text-center">Ready to join?</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Joining <span className="text-white font-medium">{roomName}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera preview */}
          <div>
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video border border-gray-800 mb-4">
              {camOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                      {name ? name.slice(0, 2).toUpperCase() : "?"}
                    </div>
                    <p className="text-xs text-gray-500">Camera is off</p>
                  </div>
                </div>
              )}

              {/* Controls overlay */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <button
                  onClick={() => setCamOn(!camOn)}
                  title={camOn ? "Stop camera" : "Start camera"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                    camOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"
                  }`}
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    {!camOn && <line x1="2" y1="2" x2="22" y2="22" />}
                  </svg>
                </button>
                <button
                  onClick={() => setMicOn(!micOn)}
                  title={micOn ? "Mute" : "Unmute"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                    micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-500"
                  }`}
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {micOn ? (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </>
                    ) : (
                      <>
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mic level meter */}
            {micOn && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                  <span className="text-xs text-gray-400">Microphone level</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                autoFocus
              />
            </div>

            {/* Camera select */}
            {devices.cameras.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Camera</label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  {devices.cameras.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mic select */}
            {devices.mics.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Microphone</label>
                <select
                  value={selectedMic}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  {devices.mics.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Mic ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status toggles */}
            <div className="flex gap-3">
              <button
                onClick={() => setCamOn(!camOn)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                  camOn
                    ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "border-red-800 bg-red-950 text-red-400"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  {!camOn && <line x1="2" y1="2" x2="22" y2="22" />}
                </svg>
                {camOn ? "Cam on" : "Cam off"}
              </button>
              <button
                onClick={() => setMicOn(!micOn)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                  micOn
                    ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "border-red-800 bg-red-950 text-red-400"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {micOn ? (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </>
                  ) : (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    </>
                  )}
                </svg>
                {micOn ? "Mic on" : "Mic off"}
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={loading || !name.trim()}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold text-base transition-all shadow-lg shadow-blue-900/30"
            >
              {loading ? "Joining..." : "Join Now"}
            </button>

            <button
              onClick={() => router.push(`/classroom/prejoin/${encodeURIComponent(roomName)}/device-check`)}
              className="w-full py-2.5 rounded-xl text-gray-300 hover:text-white text-sm transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check Devices
            </button>

            <button
              onClick={() => router.push("/classroom")}
              className="w-full py-2.5 rounded-xl text-gray-400 hover:text-white text-sm transition"
            >
              Back to lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PreJoinContent />
    </Suspense>
  );
}
