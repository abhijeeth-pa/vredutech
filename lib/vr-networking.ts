/**
 * VR Classroom Networking Module
 * 
 * Handles:
 * - Socket.IO connection and room management
 * - Presence tracking (participant join/leave)
 * - WebXR transform capture (head + hands)
 * - Transform synchronization and interpolation
 * - WebRTC audio peer connections
 * - Classroom events (mute, spotlight, etc.)
 */

import { io, Socket } from "socket.io-client";

/**
 * Transform types (position and quaternion rotation)
 */
export interface Transform {
  pos: [number, number, number];
  rot: [number, number, number, number]; // quaternion [x, y, z, w]
}

/**
 * Participant state maintained on client
 */
export interface RemoteParticipant {
  id: string;
  name: string;
  role: "teacher" | "student";
  isMuted: boolean;
  isSpotlighted: boolean;
  // Current transforms
  head: Transform;
  leftHand: Transform;
  rightHand: Transform;
  // Previous transforms (for interpolation)
  headPrev: Transform;
  leftHandPrev: Transform;
  rightHandPrev: Transform;
  // WebRTC
  peerConnection?: RTCPeerConnection;
  audioElement?: HTMLAudioElement;
  audioStream?: MediaStream;
}

/**
 * VRNetworkingClient
 * 
 * Usage:
 *   const client = new VRNetworkingClient(serverUrl);
 *   await client.joinRoom(roomId, userId, userName, role);
 *   client.onParticipantJoined = (p) => { ... };
 *   client.onTransforms = (transforms) => { ... };
 *   client.captureXRTransforms(head, leftHand, rightHand); // Call every frame
 */
export class VRNetworkingClient {
  socket: Socket | null = null;
  serverUrl: string;
  roomId: string = "";
  userId: string = "";
  userName: string = "";
  role: "teacher" | "student" = "student";

  // Participant tracking
  remoteParticipants = new Map<string, RemoteParticipant>();

  // Local media
  localAudioStream: MediaStream | null = null;
  localAudioElement: HTMLAudioElement | null = null;

  // Callbacks
  onParticipantJoined: ((p: RemoteParticipant) => void) | null = null;
  onParticipantLeft: ((userId: string) => void) | null = null;
  onTransforms: ((transforms: Record<string, { head: Transform; leftHand: Transform; rightHand: Transform }>) => void) | null = null;
  onMuteStateChanged: ((userId: string, isMuted: boolean) => void) | null = null;
  onParticipantSpotlighted: ((userId: string, isSpotlighted: boolean) => void) | null = null;
  onAllStudentsMuted: (() => void) | null = null;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * Join a classroom room
   */
  async joinRoom(
    roomId: string,
    userId: string,
    userName: string,
    role: "teacher" | "student",
  ): Promise<void> {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    this.role = role;

    // Connect to Socket.IO server
    this.socket = io(this.serverUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Socket.IO event handlers
    this.socket.on("connect", () => {
      console.log(`[VR Network] Connected to server: ${this.socket!.id}`);

      // Emit join event to server
      this.socket!.emit("classroom:join", {
        roomId: this.roomId,
        userId: this.userId,
        userName: this.userName,
        role: this.role,
      });
    });

    this.socket.on("classroom:participant-list", (participants: any[]) => {
      console.log("[VR Network] Received participant list:", participants);

      // Initialize remote participants
      participants.forEach((p) => {
        if (p.id !== this.userId) {
          this.remoteParticipants.set(p.id, {
            id: p.id,
            name: p.name,
            role: p.role,
            isMuted: p.isMuted,
            isSpotlighted: p.isSpotlighted,
            head: p.head,
            leftHand: p.leftHand,
            rightHand: p.rightHand,
            headPrev: { ...p.head },
            leftHandPrev: { ...p.leftHand },
            rightHandPrev: { ...p.rightHand },
          });

          // Initiate WebRTC connection to this participant
          this.initiateWebRTC(p.id).catch((err) =>
            console.error(`[WebRTC] Failed to initiate with ${p.id}:`, err),
          );
        }
      });
    });

    this.socket.on("classroom:participant-joined", (data: any) => {
      console.log("[VR Network] Participant joined:", data);

      if (data.userId !== this.userId) {
        const newParticipant: RemoteParticipant = {
          id: data.userId,
          name: data.userName,
          role: data.role,
          isMuted: false,
          isSpotlighted: false,
          head: { pos: [0, 1.6, 0], rot: [0, 0, 0, 1] },
          leftHand: { pos: [0, 0, 0], rot: [0, 0, 0, 1] },
          rightHand: { pos: [0, 0, 0], rot: [0, 0, 0, 1] },
          headPrev: { pos: [0, 1.6, 0], rot: [0, 0, 0, 1] },
          leftHandPrev: { pos: [0, 0, 0], rot: [0, 0, 0, 1] },
          rightHandPrev: { pos: [0, 0, 0], rot: [0, 0, 0, 1] },
        };

        this.remoteParticipants.set(data.userId, newParticipant);

        if (this.onParticipantJoined) {
          this.onParticipantJoined(newParticipant);
        }

        // Initiate WebRTC with new participant
        this.initiateWebRTC(data.userId).catch((err) =>
          console.error(`[WebRTC] Failed to initiate with ${data.userId}:`, err),
        );
      }
    });

    this.socket.on("classroom:participant-left", (data: any) => {
      console.log("[VR Network] Participant left:", data);

      if (this.remoteParticipants.has(data.userId)) {
        const participant = this.remoteParticipants.get(data.userId)!;

        // Close WebRTC connection
        if (participant.peerConnection) {
          participant.peerConnection.close();
        }

        // Stop audio
        if (participant.audioElement) {
          participant.audioElement.pause();
          participant.audioElement.srcObject = null;
        }

        this.remoteParticipants.delete(data.userId);

        if (this.onParticipantLeft) {
          this.onParticipantLeft(data.userId);
        }
      }
    });

    this.socket.on("classroom:transforms", (transforms: any) => {
      // Update remote participant transforms
      Object.entries(transforms).forEach(([userId, data]: [string, any]) => {
        const participant = this.remoteParticipants.get(userId);
        if (participant) {
          // Store previous for interpolation
          participant.headPrev = { ...participant.head };
          participant.leftHandPrev = { ...participant.leftHand };
          participant.rightHandPrev = { ...participant.rightHand };

          // Update with new transforms
          participant.head = data.head;
          participant.leftHand = data.leftHand;
          participant.rightHand = data.rightHand;
        }
      });

      if (this.onTransforms) {
        this.onTransforms(transforms);
      }
    });

    this.socket.on("classroom:participant-muted", (data: any) => {
      const participant = this.remoteParticipants.get(data.userId);
      if (participant) {
        participant.isMuted = data.isMuted;

        if (this.onMuteStateChanged) {
          this.onMuteStateChanged(data.userId, data.isMuted);
        }
      }
    });

    this.socket.on("classroom:participant-spotlighted", (data: any) => {
      const participant = this.remoteParticipants.get(data.userId);
      if (participant) {
        participant.isSpotlighted = data.isSpotlighted;

        if (this.onParticipantSpotlighted) {
          this.onParticipantSpotlighted(data.userId, data.isSpotlighted);
        }
      }
    });

    this.socket.on("classroom:all-students-muted", () => {
      console.log("[VR Network] All students muted by teacher");

      if (this.role === "student") {
        this.setLocalMute(true);
      }

      if (this.onAllStudentsMuted) {
        this.onAllStudentsMuted();
      }
    });

    // WebRTC signaling events
    this.socket.on("webrtc:offer", (data: any) => {
      this.handleWebRTCOffer(data).catch((err) =>
        console.error("[WebRTC] Failed to handle offer:", err),
      );
    });

    this.socket.on("webrtc:answer", (data: any) => {
      this.handleWebRTCAnswer(data).catch((err) =>
        console.error("[WebRTC] Failed to handle answer:", err),
      );
    });

    this.socket.on("webrtc:ice-candidate", (data: any) => {
      this.handleWebRTCICECandidate(data).catch((err) =>
        console.error("[WebRTC] Failed to handle ICE candidate:", err),
      );
    });

    this.socket.on("disconnect", () => {
      console.log("[VR Network] Disconnected from server");
    });

    // Request local audio stream
    try {
      this.localAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      console.log("[VR Network] Local audio stream acquired");
    } catch (error) {
      console.error("[VR Network] Failed to get audio stream:", error);
    }
  }

  /**
   * Leave the room
   */
  leaveRoom(): void {
    // Close all WebRTC connections
    this.remoteParticipants.forEach((participant) => {
      if (participant.peerConnection) {
        participant.peerConnection.close();
      }
      if (participant.audioElement) {
        participant.audioElement.pause();
        participant.audioElement.srcObject = null;
      }
    });
    this.remoteParticipants.clear();

    // Stop local audio
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => track.stop());
      this.localAudioStream = null;
    }

    // Disconnect Socket.IO
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log("[VR Network] Left room");
  }

  /**
   * Capture WebXR transforms and send to server
   * Call this every VR frame (~90 Hz)
   */
  captureXRTransforms(
    head: { pos: [number, number, number]; rot: [number, number, number, number] },
    leftHand: { pos: [number, number, number]; rot: [number, number, number, number] },
    rightHand: { pos: [number, number, number]; rot: [number, number, number, number] },
  ): void {
    if (!this.socket || !this.socket.connected) return;

    // Emit transform update to server
    this.socket.emit("classroom:transform-update", {
      head: { pos: head.pos, rot: head.rot },
      leftHand: { pos: leftHand.pos, rot: leftHand.rot },
      rightHand: { pos: rightHand.pos, rot: rightHand.rot },
    });
  }

  /**
   * Set local mute state and broadcast
   */
  setLocalMute(isMuted: boolean): void {
    if (!this.socket || !this.socket.connected) return;

    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }

    this.socket.emit("classroom:mute-changed", { isMuted });
    console.log(`[VR Network] Local mute set to ${isMuted}`);
  }

  /**
   * Teacher action: mute all students
   */
  teacherMuteAll(): void {
    if (this.role !== "teacher") {
      console.warn("[VR Network] Only teachers can mute all");
      return;
    }

    if (!this.socket || !this.socket.connected) return;

    this.socket.emit("classroom:teacher-mute-all");
    console.log("[VR Network] Teacher muted all students");
  }

  /**
   * Teacher action: spotlight a student
   */
  teacherSpotlight(targetUserId: string, isSpotlighted: boolean): void {
    if (this.role !== "teacher") {
      console.warn("[VR Network] Only teachers can spotlight");
      return;
    }

    if (!this.socket || !this.socket.connected) return;

    this.socket.emit("classroom:teacher-spotlight", {
      targetUserId: targetUserId,
      isSpotlighted: isSpotlighted,
    });
  }

  /**
   * Initiate WebRTC peer connection to a remote participant
   */
  private async initiateWebRTC(remotePeerId: string): Promise<void> {
    const participant = this.remoteParticipants.get(remotePeerId);
    if (!participant || !this.localAudioStream) return;

    // Create peer connection
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302"] },
        { urls: ["stun:stun1.l.google.com:19302"] },
      ],
    });

    participant.peerConnection = peerConnection;

    // Add local audio tracks
    this.localAudioStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, this.localAudioStream!);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log("[WebRTC] Received remote track:", event.track.kind);

      if (event.track.kind === "audio") {
        // Create audio element for remote audio
        if (!participant.audioElement) {
          participant.audioElement = new Audio();
          participant.audioElement.autoplay = true;
          participant.audioElement.playsinline = true;
        }

        if (!participant.audioStream) {
          participant.audioStream = new MediaStream();
          participant.audioElement.srcObject = participant.audioStream;
        }

        participant.audioStream!.addTrack(event.track);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit("webrtc:ice-candidate", {
          toUserId: remotePeerId,
          candidate: event.candidate,
        });
      }
    };

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (this.socket) {
        this.socket.emit("webrtc:offer", {
          toUserId: remotePeerId,
          offer: offer,
        });
      }

      console.log(`[WebRTC] Offer sent to ${remotePeerId}`);
    } catch (error) {
      console.error("[WebRTC] Failed to create offer:", error);
    }
  }

  /**
   * Handle WebRTC offer from remote peer
   */
  private async handleWebRTCOffer(data: any): Promise<void> {
    const { fromUserId, offer } = data;
    const participant = this.remoteParticipants.get(fromUserId);
    if (!participant || !this.localAudioStream) return;

    // Create peer connection if needed
    if (!participant.peerConnection) {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun1.l.google.com:19302"] },
        ],
      });

      participant.peerConnection = peerConnection;

      // Add local audio tracks
      this.localAudioStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localAudioStream!);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("[WebRTC] Received remote track:", event.track.kind);

        if (event.track.kind === "audio") {
          if (!participant.audioElement) {
            participant.audioElement = new Audio();
            participant.audioElement.autoplay = true;
            participant.audioElement.playsinline = true;
          }

          if (!participant.audioStream) {
            participant.audioStream = new MediaStream();
            participant.audioElement.srcObject = participant.audioStream;
          }

          participant.audioStream!.addTrack(event.track);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.socket) {
          this.socket.emit("webrtc:ice-candidate", {
            toUserId: fromUserId,
            candidate: event.candidate,
          });
        }
      };
    }

    try {
      await participant.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer),
      );
      const answer = await participant.peerConnection.createAnswer();
      await participant.peerConnection.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit("webrtc:answer", {
          toUserId: fromUserId,
          answer: answer,
        });
      }

      console.log(`[WebRTC] Answer sent to ${fromUserId}`);
    } catch (error) {
      console.error("[WebRTC] Failed to handle offer:", error);
    }
  }

  /**
   * Handle WebRTC answer from remote peer
   */
  private async handleWebRTCAnswer(data: any): Promise<void> {
    const { fromUserId, answer } = data;
    const participant = this.remoteParticipants.get(fromUserId);
    if (!participant || !participant.peerConnection) return;

    try {
      await participant.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
      console.log(`[WebRTC] Answer received from ${fromUserId}`);
    } catch (error) {
      console.error("[WebRTC] Failed to handle answer:", error);
    }
  }

  /**
   * Handle ICE candidate from remote peer
   */
  private async handleWebRTCICECandidate(data: any): Promise<void> {
    const { fromUserId, candidate } = data;
    const participant = this.remoteParticipants.get(fromUserId);
    if (!participant || !participant.peerConnection) return;

    try {
      await participant.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate),
      );
    } catch (error) {
      console.error("[WebRTC] Failed to add ICE candidate:", error);
    }
  }

  /**
   * Linear interpolation helper
   */
  interpolateTransform(prev: Transform, current: Transform, t: number): Transform {
    const pos: [number, number, number] = [
      prev.pos[0] + (current.pos[0] - prev.pos[0]) * t,
      prev.pos[1] + (current.pos[1] - prev.pos[1]) * t,
      prev.pos[2] + (current.pos[2] - prev.pos[2]) * t,
    ];

    // Simple linear interpolation for rotation (not ideal, but fast)
    // For production, use SLERP (spherical linear interpolation)
    const rot: [number, number, number, number] = [
      prev.rot[0] + (current.rot[0] - prev.rot[0]) * t,
      prev.rot[1] + (current.rot[1] - prev.rot[1]) * t,
      prev.rot[2] + (current.rot[2] - prev.rot[2]) * t,
      prev.rot[3] + (current.rot[3] - prev.rot[3]) * t,
    ];

    return { pos, rot };
  }

  /**
   * Get interpolated transform for a participant
   * Use when rendering to smooth motion between updates
   */
  getInterpolatedTransform(
    userId: string,
    bodyPart: "head" | "leftHand" | "rightHand",
    alpha: number, // 0..1, where 0 = previous frame, 1 = current frame
  ): Transform | null {
    const participant = this.remoteParticipants.get(userId);
    if (!participant) return null;

    const current =
      bodyPart === "head"
        ? participant.head
        : bodyPart === "leftHand"
          ? participant.leftHand
          : participant.rightHand;

    const prev =
      bodyPart === "head"
        ? participant.headPrev
        : bodyPart === "leftHand"
          ? participant.leftHandPrev
          : participant.rightHandPrev;

    return this.interpolateTransform(prev, current, alpha);
  }
}

export default VRNetworkingClient;
