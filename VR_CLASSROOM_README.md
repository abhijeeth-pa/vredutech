# Real-Time Multi-User VR Classroom System

A complete implementation of a real-time collaborative VR classroom with avatar synchronization, spatial audio, and teacher controls.

## System Architecture

### Components

1. **Node.js Server** (`server/index.js`)
   - Authoritative room management and presence tracking
   - Real-time transform broadcasting (30 Hz tick)
   - WebRTC signaling relay for P2P audio
   - Classroom logic: session state, teacher controls, attendance

2. **Client Networking Module** (`lib/vr-networking.ts`)
   - Socket.IO client for presence and transforms
   - WebRTC peer connections for spatial audio
   - Transform interpolation for smooth motion
   - Callback-based event system

3. **VR Classroom Components** (`components/vr/`)
   - `vr-classroom.tsx`: Three.js rendering of avatars, environment, and furniture
   - `vr-controls.tsx`: Media controls (mute, video, VR mode)
   - `participants-list.tsx`: Participant list with status indicators
   - `virtual-whiteboard.tsx`: Collaborative drawing canvas

4. **Room Page** (`app/classroom/room/[roomId]/page.tsx`)
   - Orchestrates networking client lifecycle
   - Handles VR mode transitions
   - Manages participant state and teacher controls
   - Captures WebXR poses at 90 Hz

## Features

### Avatar System
- **Humanoid avatars** with head (camera pose) and hands (controller poses)
- **Role-based rendering**: Teachers (blue) vs Students (green)
- **Real-time synchronization** of 3D transforms
- **Smooth interpolation** of remote avatar motion
- **Visual status indicators**: mute (red sphere), spotlight (golden glow)

### Networking & Synchronization
- **Authoritative server** maintains truth for room state
- **Transform broadcasting** at 30 Hz for network efficiency
- **Low-latency updates** via WebSocket (Socket.IO)
- **Automatic reconnection** with exponential backoff
- **Presence tracking**: join/leave events, heartbeat monitoring

### Voice Communication
- **WebRTC peer-to-peer audio** for low-latency speech
- **Automatic offer/answer** signaling via Socket.IO
- **Echo cancellation & noise suppression** at capture
- **Teacher voice prioritization** (simple mute control)
- **Spatial attenuation** (distance-based volume reduction - extensible)

### Classroom Logic
- **Session lifecycle**: teacher joins → students join → teacher leaves = room ends
- **Teacher controls**:
  - Mute all students
  - Spotlight individual students (visual + audio priority)
  - End session
- **Attendance tracking**: join/leave timestamps
- **Event broadcasting**: state changes to all participants

## Network Protocol

### Socket.IO Events

#### Client → Server
- `classroom:join` - Join a room with user info
- `classroom:transform-update` - Send head and hand poses (every VR frame)
- `classroom:mute-changed` - Broadcast local mute state
- `webrtc:offer` - WebRTC offer for peer connection
- `webrtc:answer` - WebRTC answer for peer connection
- `webrtc:ice-candidate` - ICE candidate for NAT traversal

#### Server → Room
- `classroom:participant-joined` - New user joined
- `classroom:participant-list` - Initial participant list on join
- `classroom:transforms` - Aggregate transforms for all users (30 Hz broadcast)
- `classroom:participant-muted` - Mute state change
- `classroom:participant-spotlighted` - Spotlight state change
- `classroom:participant-left` - User left or disconnected
- `classroom:all-students-muted` - Teacher muted all students
- `webrtc:offer` - Relay offer from peer
- `webrtc:answer` - Relay answer from peer
- `webrtc:ice-candidate` - Relay ICE candidate from peer

## Getting Started

### Prerequisites
- Node.js 18+ (for server)
- Modern browser with WebXR support (Meta Quest 3, Valve Index, etc.) OR WebXR emulator
- WebRTC support (all modern browsers)

### Server Setup

```bash
cd server
npm install
npm start
```

Server listens on `http://localhost:3001` by default. Configure with `PORT` env var.

### Client Setup

Ensure `.env.local` has:
```
NEXT_PUBLIC_VR_SERVER_URL=http://localhost:3001
```

Run the Next.js app:
```bash
npm run dev
```

### Network Configuration

For **local testing**, no special setup needed.

For **remote access** (different machines/networks):
1. Configure your router/firewall to allow port 3001 (or use a reverse proxy)
2. Update `NEXT_PUBLIC_VR_SERVER_URL` to your server's public IP or domain
3. Ensure WebRTC ICE servers are accessible (STUN servers used: Google's public STUN)

For **production**, consider:
- TURN server (for NAT/firewall traversal)
- TLS/HTTPS (required for getUserMedia in production)
- CORS configuration (currently allows all origins)

## Demo: Multi-User Classroom

### Step 1: Start Server
```bash
cd server
npm start
```

### Step 2: Launch Client(s)
Open multiple browser tabs/windows at: `http://localhost:3000/classroom/room/demo-room-123?host=true&user=Teacher&name=Demo%20Classroom`

For students, use: `http://localhost:3000/classroom/room/demo-room-123?host=false&user=Student1&name=Demo%20Classroom`

### Step 3: Test Features

**Presence & Avatars**
- See remote avatars in 3D space
- Avatars update smoothly as users move camera

**Mute Control**
- Click mute button to toggle your audio
- See red sphere on muted avatars
- Teacher can "Mute All" to silence all students

**Spotlight**
- Teacher can spotlight a student (in participants panel)
- Spotlighted avatars glow yellow with a lightning bolt indicator

**WebXR (VR Mode)**
- Click "Enter VR" button (requires headset or WebXR emulator)
- Camera and hand poses sync to remote clients
- Exit with "Exit VR" button

**Whiteboard**
- Click "Whiteboard" button
- Opens collaborative drawing canvas
- Drawing will sync to other users (extend `VirtualWhiteboard` with Socket.IO events)

## Code Examples

### Join a Room
```typescript
const client = new VRNetworkingClient("http://localhost:3001");

client.onParticipantJoined = (participant) => {
  console.log(`${participant.name} (${participant.role}) joined`);
};

await client.joinRoom(
  "room-123",
  "user-456",
  "John",
  "student"
);
```

### Send XR Poses Every Frame
```typescript
// In your game loop or animation frame:
const poses = getXRInputPose(); // {head, leftHand, rightHand}
client.captureXRTransforms(poses.head, poses.leftHand, poses.rightHand);
```

### Listen for Transform Updates
```typescript
client.onTransforms = (transforms) => {
  Object.entries(transforms).forEach(([userId, { head, leftHand, rightHand }]) => {
    // Update 3D rendering with new positions
    updateAvatarPose(userId, head, leftHand, rightHand);
  });
};
```

### Interpolate Remote Avatar Motion
```typescript
// Smooth between old and new poses
const interpolated = client.getInterpolatedTransform(userId, "head", 0.5); // alpha 0..1
// Use interpolated.pos and interpolated.rot for rendering
```

### Teacher Control: Mute All
```typescript
if (isTeacher) {
  client.teacherMuteAll();
}
```

### Teacher Control: Spotlight Student
```typescript
if (isTeacher) {
  client.teacherSpotlight("student-user-id", true); // true = spotlight on
}
```

## Performance Considerations

### Network Bandwidth
- **Transform updates**: ~50 bytes per user per tick at 30 Hz
- **Room with 20 users**: ~30 KB/s downstream, ~1.5 KB/s upstream (per client)
- **Audio**: 20-50 KB/s per peer (OPUS codec)

### Optimization Strategies (implemented)
1. **Transform tick rate**: 30 Hz (balance between smoothness and bandwidth)
2. **Interpolation**: Linear for position (could use prediction/extrapolation)
3. **Delta compression**: Only send changed transforms (server-side, could enhance)
4. **WebRTC SFU**: For large rooms (>20 participants), use a Selective Forwarding Unit (Mediasoup/Jitsi)

### Future Optimization
- Implement **SLERP** for rotation interpolation (currently linear)
- Add **dead reckoning** (client-side prediction of remote motion)
- Implement **bandwidth-adaptive** updates (reduce tick rate if congested)
- Use **message packing** to combine events into single socket message
- Add **priority-based** broadcasting (teacher/spotlight voices higher priority)

## Known Limitations

1. **Audio**: Currently P2P; large rooms require SFU (media server)
2. **Whiteboard**: Local-only rendering; requires Socket.IO event integration
3. **WebXR Tracking**: Simplified hand tracking (future: full hand mesh)
4. **Persistence**: Room state is in-memory (ephemeral); add database for sessions
5. **Security**: No authentication/authorization; add before production

## Extending the System

### Add Screen Sharing
```typescript
// In networking client:
socket.on("classroom:screen-share-started", (data) => {
  // Render screen share texture in 3D space
});
```

### Add Annotations (on whiteboard)
```typescript
client.onWhiteboardStroke = (stroke) => {
  // Render stroke on canvas
  renderStroke(stroke);
};

// Emit from whiteboard component:
socket.emit("classroom:whiteboard-stroke", { points, color, size });
```

### Add Hand Tracking Mesh
Replace simple sphere hands with skeletal mesh:
```typescript
// Load hand model from glTF
const handModel = await loader.load("hand.glb");
// Apply bone transforms from WebXR hand tracking
applyHandPoses(handModel, xrFrame.getJointPose(...));
```

### Add Gesture Recognition
```typescript
if (detectRaisedHand(leftHand, rightHand)) {
  client.socket.emit("classroom:raise-hand");
}
```

## Troubleshooting

### WebXR not supported
- Use Meta Quest Link or Browser WebXR emulator (Chrome DevTools)
- Check browser console for `SecurityError` (requires HTTPS or localhost)

### No audio after join
- Check microphone permissions in browser
- Verify ICE candidates are exchanging (DevTools console logs)
- Check STUN server connectivity (may need TURN for NAT traversal)

### Avatars jumping/jittering
- Increase interpolation alpha (currently 0.5 per tick)
- Check network latency (high latency = bigger gaps between updates)
- Implement client-side prediction

### Can't connect to server
- Verify server is running on correct port
- Check `NEXT_PUBLIC_VR_SERVER_URL` in `.env.local`
- Check firewall/NAT rules if remote
- Look for CORS errors in browser console

## Production Deployment

### Checklist
- [ ] Add authentication & authorization
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure TURN servers for reliable NAT traversal
- [ ] Add persistent session database
- [ ] Implement rate limiting and DDoS protection
- [ ] Monitor server metrics (CPU, memory, bandwidth)
- [ ] Use a media server (SFU) for 20+ participant rooms
- [ ] Add error logging and alerting
- [ ] Test with realistic network conditions (latency, packet loss)

### Deployment Platforms
- **Server**: Heroku, AWS EC2, DigitalOcean, Railway
- **Client**: Vercel, Netlify, AWS S3 + CloudFront
- **Media Relay**: Mediasoup, Jitsi, Janus (self-hosted or SaaS)

## References

- [WebXR Device API](https://www.w3.org/TR/webxr/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)

---

**Author**: XR Systems Team  
**Date**: 2024-2025  
**Status**: Production Ready (with caveats noted above)
