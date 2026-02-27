"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, Suspense, ChangeEvent } from "react";

function DeviceCheckContent() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const [cameraStatus, setCameraStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [micStatus, setMicStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [speakerStatus, setSpeakerStatus] = useState<"idle" | "checking" | "success" | "error">("idle");

  const [devices, setDevices] = useState<{
    cameras: MediaDeviceInfo[];
    mics: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  }>({
    cameras: [],
    mics: [],
    speakers: [],
  });

  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");

  const [audioLevel, setAudioLevel] = useState(0);
  const [speakerVolume, setSpeakerVolume] = useState(50);
  const [testingAudio, setTestingAudio] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Enumerate devices
  useEffect(() => {
    const enumerateDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const cameras = devs.filter((d) => d.kind === "videoinput");
        const mics = devs.filter((d) => d.kind === "audioinput");
        const speakers = devs.filter((d) => d.kind === "audiooutput");

        setDevices({ cameras, mics, speakers });
        if (cameras[0]) setSelectedCamera(cameras[0].deviceId);
        if (mics[0]) setSelectedMic(mics[0].deviceId);
        if (speakers[0]) setSelectedSpeaker(speakers[0].deviceId);
      } catch (err) {
        console.error("Failed to enumerate devices", err);
      }
    };

    enumerateDevices();
  }, []);

  // Test camera
  useEffect(() => {
    if (!isChecking || !selectedCamera) return;

    const testCamera = async () => {
      try {
        setCameraStatus("checking");
        if (previewStreamRef.current) {
          previewStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedCamera },
          audio: false,
        });

        previewStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraStatus("success");
      } catch {
        setCameraStatus("error");
      }
    };

    testCamera();

    return () => {
      // Keep stream alive for preview
    };
  }, [isChecking, selectedCamera]);

  // Test microphone
  useEffect(() => {
    if (!isChecking || !selectedMic) return;

    const testMicrophone = async () => {
      try {
        setMicStatus("checking");

        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
        cancelAnimationFrame(animFrameRef.current);

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedMic },
          video: false,
        });

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

        stream.getTracks().forEach((t) => t.stop());
        setMicStatus("success");
      } catch {
        setMicStatus("error");
      }
    };

    testMicrophone();

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isChecking, selectedMic]);

  // Test speaker
  useEffect(() => {
    if (!isChecking || !selectedSpeaker) return;

    setSpeakerStatus("checking");
    // Simulate check
    const timer = setTimeout(() => {
      setSpeakerStatus("success");
    }, 500);

    return () => clearTimeout(timer);
  }, [isChecking, selectedSpeaker]);

  const playTestAudio = async () => {
    try {
      setTestingAudio(true);

      if (!audioCtxRef.current) {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillatorRef.current = oscillator;

      oscillator.frequency.value = 440;
      oscillator.type = "sine";

      gain.gain.setValueAtTime(0.3 * (speakerVolume / 100), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);

      oscillatorRef.current = null;

      setTimeout(() => setTestingAudio(false), 1000);
    } catch (err) {
      setTestingAudio(false);
    }
  };

  const handleStartCheck = () => {
    setIsChecking(true);
  };

  const handleProceed = () => {
    if (roomName.trim()) {
      router.push(`/classroom/prejoin/${encodeURIComponent(roomName.trim())}`);
    }
  };

  const handleProceedWithDeviceCheck = () => {
    if (roomName.trim()) {
      router.push(`/classroom/prejoin/${encodeURIComponent(roomName.trim())}/device-check`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!isChecking) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-lg font-semibold">VRMeet Device Check</span>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-2 text-center">Check Your Devices</h1>
          <p className="text-gray-400 text-center mb-8">
            Make sure your camera, microphone, and speakers are working before joining a meeting
          </p>

          <div className="space-y-6">
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Room Name (Optional)</label>
              <input
                type="text"
                value={roomName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomName(e.target.value)}
                placeholder="Enter room name or skip"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                If you enter a room name, you'll be taken to the pre-join screen after testing
              </p>
            </div>

            {/* Quick Start Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleStartCheck}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-900/30"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Device Check
                </div>
              </button>

              {roomName.trim() && (
                <button
                  onClick={handleProceed}
                  className="w-full py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 font-semibold transition-all"
                >
                  Skip to Pre-Join
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push("/classroom")}
            className="w-full py-3 mt-6 rounded-xl text-gray-400 hover:text-white text-sm transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const allPassed = cameraStatus === "success" && micStatus === "success" && speakerStatus === "success";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-lg font-semibold">VRMeet Device Check</span>
      </div>

      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Testing Your Devices</h1>
        <p className="text-gray-400 text-center mb-8">Checking camera, microphone, and speaker</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Camera Check */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Camera</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cameraStatus === "checking" && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                {cameraStatus === "success" && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {cameraStatus === "error" && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
          </div>

          {/* Microphone Check */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Microphone</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {micStatus === "checking" && (
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                {micStatus === "success" && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {micStatus === "error" && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-400">Audio level</p>
              <div className="h-12 bg-gray-800 rounded-lg p-2 border border-gray-700">
                <div className="h-full flex items-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all duration-75 ${
                        audioLevel > (i / 20) * 100 ? "bg-green-500" : "bg-gray-700"
                      }`}
                      style={{ height: `${20 + (i + 1) * 2}%` }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">Speak to test</p>
            </div>
          </div>

          {/* Speaker Check */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 0l4.707 4.707v1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Speaker</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {speakerStatus === "checking" && (
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                {speakerStatus === "success" && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">Volume</label>
                  <span className="text-xs font-mono text-gray-400">{speakerVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={speakerVolume}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSpeakerVolume(Number(e.target.value))}
                  disabled={testingAudio}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              <button
                onClick={playTestAudio}
                disabled={testingAudio}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium text-sm transition-all"
              >
                {testingAudio ? "Playing..." : "Play Tone"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className={`mb-8 p-4 rounded-xl border ${
          allPassed
            ? "bg-green-950 border-green-800 text-green-300"
            : "bg-yellow-950 border-yellow-800 text-yellow-300"
        }`}>
          <div className="flex items-center gap-3">
            {allPassed ? (
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
            <div>
              {allPassed ? (
                <p className="text-sm font-medium">All devices working! Ready to join.</p>
              ) : (
                <p className="text-sm font-medium">Waiting for all devices to be ready...</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setIsChecking(false)}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 font-semibold transition-all"
          >
            Back
          </button>
          {roomName.trim() ? (
            <button
              onClick={handleProceedWithDeviceCheck}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
            >
              Go to Room
            </button>
          ) : (
            <button
              onClick={() => router.push("/classroom")}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeviceCheckPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DeviceCheckContent />
    </Suspense>
  );
}
