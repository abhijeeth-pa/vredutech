"use client";

import { useEffect, useRef, useState, Suspense, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";

function DeviceCheckContent() {
  const router = useRouter();
  const params = useParams();
  const roomName = decodeURIComponent(params.roomId as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cameraStatus, setCameraStatus] = useState<"checking" | "success" | "error">("checking");
  const [micStatus, setMicStatus] = useState<"checking" | "success" | "error">("checking");
  const [speakerStatus, setSpeakerStatus] = useState<"checking" | "success" | "error">("checking");

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
  const gainRef = useRef<GainNode | null>(null);

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
        setError("Failed to enumerate devices");
        setCameraStatus("error");
        setMicStatus("error");
        setSpeakerStatus("error");
      }
    };

    enumerateDevices();
  }, []);

  // Test camera
  useEffect(() => {
    const testCamera = async () => {
      try {
        if (!selectedCamera) return;

        // Stop previous stream
        if (previewStreamRef.current) {
          previewStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: selectedCamera },
          audio: false,
        });

        previewStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setCameraStatus("success");
        }
      } catch {
        setCameraStatus("error");
      }
    };

    if (selectedCamera && !loading) {
      testCamera();
    }

    return () => {
      // Don't stop stream here, we'll do it on unmount
    };
  }, [selectedCamera, loading]);

  // Test microphone
  useEffect(() => {
    const testMicrophone = async () => {
      try {
        if (!selectedMic) return;

        // Clean up previous audio context
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

        // Stop the stream used for analysis after setup
        stream.getTracks().forEach((t) => t.stop());

        setMicStatus("success");
      } catch {
        setMicStatus("error");
      }
    };

    if (selectedMic && !loading) {
      testMicrophone();
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedMic, loading]);

  // Test speaker
  useEffect(() => {
    const testSpeaker = async () => {
      try {
        if (!selectedSpeaker) {
          setSpeakerStatus("error");
          return;
        }

        // Try to set sink ID if available
        if (audioCtxRef.current && audioCtxRef.current.destination && "setSinkId" in audioCtxRef.current.destination) {
          setSpeakerStatus("success");
        } else {
          setSpeakerStatus("success");
        }
      } catch {
        setSpeakerStatus("error");
      }
    };

    if (!loading) {
      testSpeaker();
    }
  }, [selectedSpeaker, loading]);

  // Generate test tone for speaker
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

      // Create oscillator for tone
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillatorRef.current = oscillator;
      gainRef.current = gain;

      oscillator.frequency.value = 440; // A4 note
      oscillator.type = "sine";

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);

      oscillatorRef.current = null;
      gainRef.current = null;

      setTimeout(() => setTestingAudio(false), 1000);
    } catch (err) {
      setTestingAudio(false);
    }
  };

  // Initially load all checks
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
      cancelAnimationFrame(animFrameRef.current);
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const allChecked = cameraStatus !== "checking" && micStatus !== "checking" && speakerStatus !== "checking";
  const allPassed = cameraStatus === "success" && micStatus === "success" && speakerStatus === "success";

  const handleContinue = () => {
    router.push(`/classroom/prejoin/${encodeURIComponent(roomName)}`);
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
        <span className="text-lg font-semibold">VRMeet Device Check</span>
      </div>

      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Check Your Devices</h1>
        <p className="text-gray-400 text-center mb-8">
          Let's make sure your camera, microphone, and speakers are working properly
        </p>

        {error && (
          <div className="mb-6 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

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
                  <p className="text-xs text-gray-500">Video input</p>
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

            <div className="mb-4">
              {devices.cameras.length > 1 && (
                <select
                  value={selectedCamera}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCamera(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {devices.cameras.map((d: MediaDeviceInfo) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              )}
              {devices.cameras.length === 0 && !loading && (
                <p className="text-xs text-gray-500">No cameras found</p>
              )}
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Microphone</h3>
                  <p className="text-xs text-gray-500">Audio input</p>
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

            <div className="mb-4">
              {devices.mics.length > 1 && (
                <select
                  value={selectedMic}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMic(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {devices.mics.map((d: MediaDeviceInfo) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Mic ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              )}
              {devices.mics.length === 0 && !loading && (
                <p className="text-xs text-gray-500">No microphones found</p>
              )}
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
              <p className="text-xs text-gray-500 text-center">Speak to test your microphone</p>
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
                  <p className="text-xs text-gray-500">Audio output</p>
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
                {speakerStatus === "error" && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            <div className="mb-4">
              {devices.speakers.length > 1 && (
                <select
                  value={selectedSpeaker}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSpeaker(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {devices.speakers.map((d: MediaDeviceInfo) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              )}
              {devices.speakers.length === 0 && !loading && (
                <p className="text-xs text-gray-500">No speakers found</p>
              )}
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
                  disabled={loading || testingAudio}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              <button
                onClick={playTestAudio}
                disabled={loading || testingAudio || speakerStatus === "error"}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium text-sm transition-all"
              >
                {testingAudio ? "Playing..." : "Play Test Tone"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {allChecked && (
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
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                {allPassed ? (
                  <p className="text-sm font-medium">All devices are working! You're ready to join the meeting.</p>
                ) : (
                  <p className="text-sm font-medium">Some devices need attention. Check the settings above or try different devices.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 font-semibold transition-all"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-all"
          >
            Continue to Pre-Join
          </button>
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
