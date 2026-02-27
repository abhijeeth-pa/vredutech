# VR Classroom Quick Start Guide

## 5-Minute Setup

### 1. Start the Server

```bash
cd server
npm install
npm start
```

Expected output:
```
[Server] VR Classroom server listening on port 3001
[Server] Awaiting connections from WebXR clients...
```

### 2. Start the Client (in new terminal)

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

### 3. Join a Classroom

#### Option A: Teacher (Host)
Open: `http://localhost:3000/classroom/room/demo-001?host=true&user=Teacher&name=Demo%20Classroom`

#### Option B: Student
Open: `http://localhost:3000/classroom/room/demo-001?host=false&user=Student1&name=Demo%20Classroom`

#### Multi-User Demo
Open **3+ browser tabs/windows** with different URLs (use different student names):
- Tab 1: Teacher
- Tab 2: Student1
- Tab 3: Student2
- Tab 4: Student3

---

## Basic Controls

| Control | Action |
|---------|--------|
| **Mic Button** | Toggle audio (mute/unmute) |
| **Video Button** | Toggle video stream |
| **Share Button** | Start screen sharing |
| **VR Button** | Enter/exit VR mode (requires headset or emulator) |
| **Whiteboard** | Open collaborative canvas |
| **Mute All** (Teacher only) | Silence all students |
| **Participants Panel** | See all connected users and their status |

---

## Testing Features

### 1. Presence & Avatars
- Open 2+ tabs with different users
- **Expected**: See colored 3D avatars for each user (blue=teacher, green=student)
- **Verify**: Avatars update position as you move camera (use mouse to orbit)

### 2. Mute/Unmute
- Tab 1 (Teacher): Click mute button
- Tab 2 (Student): You should see a **red circle** on Teacher's avatar head
- **Verify**: Red indicator appears/disappears when muted

### 3. Teacher Spotlight
- Tab 1 (Teacher): Open Participants panel → Click lightning bolt on a student
- Tab 2 (Student): Avatar glows **golden yellow**
- **Verify**: Spotlight effect appears/disappears

### 4. WebRTC Audio
- Open 2 tabs (or actual devices)
- Allow microphone access when prompted
- **Expected**: Audio connects automatically
- **Verify**: Speaker icon in browser tab shows active audio
- **Troubleshoot**: Check console for WebRTC errors

### 5. VR Mode (Optional)
- Have a VR headset (Meta Quest 3, Valve Index, etc.) **OR**
- Use [WebXR Emulator extension](https://chrome.google.com/webstore/detail/webxr-api-emulator/) in Chrome
- Click "Enter VR" button
- **Expected**: Scene renders in stereo/headset
- **Verify**: Hand poses sync to remote clients (see hand spheres move)

### 6. Whiteboard
- Click "Whiteboard" button
- Draw on canvas
- **Note**: Drawing is local-only in this version (requires Socket.IO integration to sync)

---

## Network Inspection

### Chrome DevTools
1. Open DevTools: `F12`
2. Go to **Network** tab
3. Filter by "websocket"
4. You should see a Socket.IO connection (`socket.io/?...`)
5. Click it → **Messages** tab → see events flowing

### Example Events
```
classroom:join
classroom:participant-list
classroom:transforms (repeating every ~33ms)
classroom:participant-joined
classroom:mute-changed
```

### Console Logs
Look for:
- `[VR Network] Connected to server`
- `[Room] Received participant list`
- `[WebRTC] Offer sent to ...`
- `[WebRTC] Answer received from ...`

---

## Troubleshooting

### "Can't connect to server"
**Problem**: Browser can't reach `http://localhost:3001`
- [ ] Is Node server running? Check terminal output
- [ ] Is port 3001 in use? Change `server/index.js` PORT and update `.env.local`
- [ ] Check firewall rules

**Fix**:
```bash
# Check if port 3001 is listening
netstat -an | grep 3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows
```

### "WebXR not supported"
**Problem**: "VR mode not supported on this device"
- [ ] Use [WebXR Emulator](https://chrome.google.com/webstore/detail/webxr-api-emulator/) extension
- [ ] Use actual VR headset (Meta Quest 3, Valve Index, etc.)
- [ ] Check browser console for detailed error

### "No audio after join"
**Problem**: Microphone not working
- [ ] Check browser permissions (click mic icon in URL bar)
- [ ] Verify microphone is not muted
- [ ] Check if `getUserMedia` is blocked (DevTools → Security)
- [ ] For remote server: ensure HTTPS is enabled (required by spec)

**Fix**:
```javascript
// In browser console, test mic access:
navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => console.log("Mic works!"))
  .catch(err => console.error("Mic error:", err.name));
```

### "Avatars not showing"
**Problem**: Other participants' avatars not visible
- [ ] Check console for errors in vr-classroom.tsx
- [ ] Verify Socket.IO connection is active (check Network tab)
- [ ] Confirm participants are joining (check server logs)
- [ ] Try refreshing page and rejoin

### "High latency / Jittery avatars"
**Problem**: Avatars jumping or moving in chunks
- [ ] Check network latency: DevTools → Network → WebSocket message timing
- [ ] This is expected if latency > 200ms
- [ ] Future: implement prediction/extrapolation for smoother motion

---

## Running Tests

### Manual Load Test (Multiple Clients)
```bash
# Terminal 1: Start server
cd server && npm start

# Terminal 2: Start client
npm run dev

# Terminal 3+: Open multiple browser tabs with different user names
# http://localhost:3000/classroom/room/test-room-001?host=true&user=Teacher&name=Test
# http://localhost:3000/classroom/room/test-room-001?host=false&user=Student1&name=Test
# http://localhost:3000/classroom/room/test-room-001?host=false&user=Student2&name=Test
# ... (repeat for 5, 10, 20 participants)

# Observe:
# - Server console for participant join/leave logs
# - WebSocket message frequency (should be ~30 Hz)
# - Bandwidth usage in Network tab
# - CPU/Memory in DevTools Performance tab
```

### Performance Monitoring
```javascript
// Paste in browser console to see real-time bandwidth:
const startTime = performance.now();
let messageCount = 0;
const socket = io("http://localhost:3001");
socket.onAny(() => messageCount++);
setInterval(() => {
  const elapsed = (performance.now() - startTime) / 1000;
  console.log(`${messageCount / elapsed | 0} msg/sec`);
}, 1000);
```

---

## What's Implemented

✅ **Networking**
- Socket.IO real-time presence
- Transform synchronization (30 Hz)
- WebRTC audio peer connections
- Automatic reconnection

✅ **Avatars**
- Head + hands tracking
- Role-based coloring (teacher/student)
- Name tags and status indicators
- Spotlight visual effect

✅ **Classroom Logic**
- Session management
- Teacher controls (mute all, spotlight)
- Attendance tracking (join/leave)
- Event broadcasting

✅ **Voice**
- WebRTC peer-to-peer audio
- Mute/unmute controls
- Teacher voice prioritization (basic)

### TODO / Not Yet Implemented

⏳ **Whiteboard Sync**
- Drawing currently local-only
- Need: Socket.IO events for strokes
- Plan: Emit `classroom:whiteboard-stroke` on draw

⏳ **Hand Tracking Mesh**
- Currently: simple spheres for hands
- Future: full skeletal hand model + bone transforms

⏳ **Persistent Sessions**
- Room state is in-memory (ephemeral)
- Future: Database (MongoDB, PostgreSQL) for session history

⏳ **Video Streaming**
- Audio only currently
- Future: WebRTC video track + rendering in 3D space

⏳ **Spatial Audio**
- Distance-based attenuation ready (in code)
- Future: Implement HRTF/3D audio using Web Audio API

⏳ **Authentication**
- No user login currently
- Future: OAuth/JWT for secure access

---

## Next Steps (Extending the System)

### 1. Add Whiteboard Sync
```typescript
// In VirtualWhiteboard.tsx:
socket.emit("classroom:whiteboard-stroke", {
  points: [...],
  color: "#000000",
  size: 3,
  timestamp: Date.now()
});

// In networking client:
socket.on("classroom:whiteboard-stroke", (data) => {
  drawRemoteStroke(data);
});
```

### 2. Add Video Streaming
```typescript
// In VRNetworkingClient:
const videoStream = await navigator.mediaDevices.getDisplayMedia({video: true});
peerConnection.addTrack(videoStream.getVideoTracks()[0]);

// Render video texture on 3D plane in classroom
```

### 3. Scale to Large Rooms (100+ participants)
```javascript
// Deploy a media server (SFU):
// Option 1: Mediasoup (most flexible)
// Option 2: Jitsi (open source)
// Option 3: Pion (Go-based, lightweight)

// Update networking client to use SFU instead of P2P
```

### 4. Add Database Integration
```typescript
// Store session history
const sessionDb = new SessionDatabase("mongodb://...");
await sessionDb.createSession({
  roomId,
  hostId,
  startedAt: Date.now(),
  participants: []
});
```

---

## Performance Metrics

### Expected on Localhost
- **Latency**: 0-10 ms
- **Messages/sec**: ~30 (transforms only)
- **Bandwidth per client**: ~2-5 KB/s upstream, 5-50 KB/s downstream (depending on room size)
- **CPU (browser)**: 10-20% (rendering + networking)

### Expected on LAN (same network)
- **Latency**: 1-50 ms
- **Bandwidth**: Same as localhost
- **CPU**: Same as localhost

### Expected on Internet (100+ ms latency)
- **Latency**: 100-300 ms (depending on ISP/routing)
- **Avatar motion**: Will appear more "chunky" due to larger gaps between updates
- **Audio**: Still low-latency (WebRTC bypass)
- **Mitigation**: Implement client-side prediction

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Client                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ React Components                                     │   │
│  │ - VRClassroom (Three.js canvas)                      │   │
│  │ - ParticipantsList (UI)                              │   │
│  │ - VirtualWhiteboard (Canvas)                         │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │ VRNetworkingClient (Networking Layer)                │   │
│  │ - Socket.IO (transforms, presence)                   │   │
│  │ - WebRTC (peer-to-peer audio)                        │   │
│  │ - Interpolation & smoothing                          │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │ WebXR (VR Input)                                     │   │
│  │ - Head pose                                          │   │
│  │ - Hand/controller poses                              │   │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬────────────────────────────────────────┘
                       │
                Socket.IO + WebRTC
                       │
┌──────────────────────▼────────────────────────────────────────┐
│            Node.js VR Classroom Server                        │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Socket.IO Connection Handler                          │   │
│  │ - Room join/leave                                      │   │
│  │ - Presence tracking                                    │   │
│  │ - Transform broadcasting (30 Hz)                       │   │
│  │ - WebRTC signaling relay                               │   │
│  │ - Teacher controls (mute, spotlight)                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ In-Memory State                                        │   │
│  │ - rooms: Map<roomId, {participants, state}>            │   │
│  │ - heartbeat monitoring (10s timeout)                   │   │
│  └────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘

[Future: Database, TURN server, Media Server for scaling]
```

---

## Support & Issues

### Getting Help
1. Check console logs (DevTools → Console)
2. Check server logs (terminal)
3. Review README.md for detailed docs
4. Check WebSocket connection in DevTools Network tab

### Reporting Bugs
Include:
- Browser version
- Server logs
- Browser console errors
- Network tab (WebSocket messages)
- Steps to reproduce

---

**Happy teaching! 🚀**
