/**
 * VR Classroom Server
 * 
 * Authoritative server for:
 * - Room management (create, join, leave)
 * - Presence tracking (participant join/leave/mute states)
 * - Transform broadcasting (head + hand poses at 30 Hz tick)
 * - WebRTC signaling (offer/answer/ICE candidates)
 * - Classroom logic (session state, attendance, teacher controls)
 * 
 * Socket.IO is used for WebSocket communication and signaling.
 * Room state is in-memory and ephemeral (suitable for demo/testing).
 */

const http = require("http");
const { Server: SocketIOServer } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 3001;

// Create HTTP server and Socket.IO instance
const httpServer = http.createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

/**
 * In-memory room store
 * Structure:
 * {
 *   [roomId]: {
 *     id: string,
 *     hostId: string,
 *     state: "active" | "ended",
 *     createdAt: number,
 *     participants: {
 *       [userId]: {
 *         id: string,
 *         name: string,
 *         role: "teacher" | "student",
 *         socketId: string,
 *         isMuted: boolean,
 *         isSpotlighted: boolean,
 *         joinedAt: number,
 *         lastHeartbeat: number,
 *         // Transform data (updated at 30 Hz)
 *         head: { pos: [x, y, z], rot: [x, y, z, w] },
 *         leftHand: { pos: [x, y, z], rot: [x, y, z, w] },
 *         rightHand: { pos: [x, y, z], rot: [x, y, z, w] },
 *       }
 *     }
 *   }
 * }
 */
const rooms = new Map();

/**
 * Socket.IO event handlers
 */

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  /**
   * JOIN_ROOM
   * Client joins a classroom room with user info
   * Emits: room state, participant list to all clients in room
   */
  socket.on("classroom:join", (data) => {
    const { roomId, userId, userName, role } = data;
    console.log(`[Room] User ${userId} (${userName}) joining room ${roomId} as ${role}`);

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        hostId: role === "teacher" ? userId : null,
        state: "active",
        createdAt: Date.now(),
        participants: new Map(),
      });
    }

    const room = rooms.get(roomId);

    // Add participant to room
    room.participants.set(userId, {
      id: userId,
      name: userName,
      role: role,
      socketId: socket.id,
      isMuted: false,
      isSpotlighted: false,
      joinedAt: Date.now(),
      lastHeartbeat: Date.now(),
      // Initialize transforms at origin
      head: { pos: [0, 1.6, 0], rot: [0, 0, 0, 1] },
      leftHand: { pos: [0, 0, 0], rot: [0, 0, 0, 1] },
      rightHand: { pos: [0, 0, 0], rot: [0, 0, 0, 1] },
    });

    // Join socket to Socket.IO room
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = userId;

    // Broadcast participant joined event
    io.to(roomId).emit("classroom:participant-joined", {
      userId: userId,
      userName: userName,
      role: role,
      participantCount: room.participants.size,
    });

    // Send current participants list to joining user
    const participants = Array.from(room.participants.values()).map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      isMuted: p.isMuted,
      isSpotlighted: p.isSpotlighted,
      head: p.head,
      leftHand: p.leftHand,
      rightHand: p.rightHand,
    }));

    socket.emit("classroom:participant-list", participants);

    // Log room state
    console.log(
      `[Room] ${roomId} now has ${room.participants.size} participants`,
    );
  });

  /**
   * TRANSFORM_UPDATE
   * Client sends local head and hand transforms
   * Server broadcasts to room at bounded rate (30 Hz tick)
   */
  socket.on("classroom:transform-update", (data) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;

    if (!roomId || !userId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.get(userId);
    if (!participant) return;

    // Update participant transforms
    if (data.head) participant.head = data.head;
    if (data.leftHand) participant.leftHand = data.leftHand;
    if (data.rightHand) participant.rightHand = data.rightHand;
    participant.lastHeartbeat = Date.now();
  });

  /**
   * MUTE_STATE_CHANGE
   * Client broadcasts mute state change
   */
  socket.on("classroom:mute-changed", (data) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;

    if (!roomId || !userId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.get(userId);
    if (!participant) return;

    participant.isMuted = data.isMuted;

    io.to(roomId).emit("classroom:participant-muted", {
      userId: userId,
      isMuted: data.isMuted,
    });

    console.log(`[Room] User ${userId} mute set to ${data.isMuted}`);
  });

  /**
   * WEBRTC_OFFER
   * Client A sends WebRTC offer to connect to Client B
   * Relayed via server
   */
  socket.on("webrtc:offer", (data) => {
    const roomId = socket.data.roomId;
    const fromUserId = socket.data.userId;
    const { toUserId, offer } = data;

    if (!roomId || !fromUserId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const toParticipant = room.participants.get(toUserId);
    if (!toParticipant) return;

    console.log(
      `[WebRTC] Offer from ${fromUserId} to ${toUserId}`,
    );

    io.to(toParticipant.socketId).emit("webrtc:offer", {
      fromUserId: fromUserId,
      offer: offer,
    });
  });

  /**
   * WEBRTC_ANSWER
   * Client B sends WebRTC answer back to Client A
   * Relayed via server
   */
  socket.on("webrtc:answer", (data) => {
    const roomId = socket.data.roomId;
    const fromUserId = socket.data.userId;
    const { toUserId, answer } = data;

    if (!roomId || !fromUserId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const toParticipant = room.participants.get(toUserId);
    if (!toParticipant) return;

    console.log(
      `[WebRTC] Answer from ${fromUserId} to ${toUserId}`,
    );

    io.to(toParticipant.socketId).emit("webrtc:answer", {
      fromUserId: fromUserId,
      answer: answer,
    });
  });

  /**
   * WEBRTC_ICE_CANDIDATE
   * Client sends ICE candidate to peer
   * Relayed via server
   */
  socket.on("webrtc:ice-candidate", (data) => {
    const roomId = socket.data.roomId;
    const fromUserId = socket.data.userId;
    const { toUserId, candidate } = data;

    if (!roomId || !fromUserId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const toParticipant = room.participants.get(toUserId);
    if (!toParticipant) return;

    io.to(toParticipant.socketId).emit("webrtc:ice-candidate", {
      fromUserId: fromUserId,
      candidate: candidate,
    });
  });

  /**
   * TEACHER_MUTE_ALL
   * Teacher mutes all students
   */
  socket.on("classroom:teacher-mute-all", () => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;

    if (!roomId || !userId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.get(userId);
    if (!participant || participant.role !== "teacher") return;

    // Set all students to muted
    room.participants.forEach((p) => {
      if (p.role === "student") {
        p.isMuted = true;
      }
    });

    io.to(roomId).emit("classroom:all-students-muted");
    console.log(`[Room] Teacher ${userId} muted all students in ${roomId}`);
  });

  /**
   * TEACHER_SPOTLIGHT_STUDENT
   * Teacher spotlights a student (priority audio, highlight)
   */
  socket.on("classroom:teacher-spotlight", (data) => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    const { targetUserId, isSpotlighted } = data;

    if (!roomId || !userId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.get(userId);
    if (!participant || participant.role !== "teacher") return;

    const target = room.participants.get(targetUserId);
    if (!target) return;

    target.isSpotlighted = isSpotlighted;

    io.to(roomId).emit("classroom:participant-spotlighted", {
      userId: targetUserId,
      isSpotlighted: isSpotlighted,
    });

    console.log(
      `[Room] Teacher ${userId} spotlight ${targetUserId} = ${isSpotlighted}`,
    );
  });

  /**
   * DISCONNECT
   * Client leaves room
   */
  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;

    if (!roomId || !userId) {
      console.log(`[Socket] Client disconnected: ${socket.id} (no room data)`);
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      console.log(`[Socket] Client disconnected: ${socket.id} (room not found)`);
      return;
    }

    // Remove participant from room
    room.participants.delete(userId);

    io.to(roomId).emit("classroom:participant-left", {
      userId: userId,
      participantCount: room.participants.size,
    });

    console.log(
      `[Room] User ${userId} left room ${roomId}. Remaining: ${room.participants.size}`,
    );

    // Clean up empty rooms
    if (room.participants.size === 0) {
      rooms.delete(roomId);
      console.log(`[Room] Room ${roomId} deleted (empty)`);
    }
  });
});

/**
 * Broadcast transforms at 30 Hz tick
 * This is the authoritative state update; clients receive full room state
 */
setInterval(() => {
  rooms.forEach((room, roomId) => {
    if (room.participants.size === 0) return;

    const transforms = {};
    room.participants.forEach((p) => {
      transforms[p.id] = {
        head: p.head,
        leftHand: p.leftHand,
        rightHand: p.rightHand,
      };
    });

    io.to(roomId).emit("classroom:transforms", transforms);
  });
}, 1000 / 30); // ~33 ms interval = 30 Hz

/**
 * Heartbeat check: remove stale participants
 */
setInterval(() => {
  rooms.forEach((room, roomId) => {
    const now = Date.now();
    const staleParticipants = [];

    room.participants.forEach((p, userId) => {
      if (now - p.lastHeartbeat > 10000) {
        // 10 second timeout
        staleParticipants.push(userId);
      }
    });

    staleParticipants.forEach((userId) => {
      room.participants.delete(userId);
      io.to(roomId).emit("classroom:participant-left", {
        userId: userId,
        participantCount: room.participants.size,
      });
      console.log(`[Room] User ${userId} removed from ${roomId} (stale)`);
    });

    if (room.participants.size === 0) {
      rooms.delete(roomId);
      console.log(`[Room] Room ${roomId} deleted (empty after stale cleanup)`);
    }
  });
}, 5000); // Check every 5 seconds

// Start server
httpServer.listen(PORT, () => {
  console.log(`\n[Server] VR Classroom server listening on port ${PORT}`);
  console.log(`[Server] Awaiting connections from WebXR clients...\n`);
});

/**
 * Graceful shutdown
 */
process.on("SIGINT", () => {
  console.log("\n[Server] Shutting down...");
  io.close();
  httpServer.close(() => {
    console.log("[Server] Closed.");
    process.exit(0);
  });
});
