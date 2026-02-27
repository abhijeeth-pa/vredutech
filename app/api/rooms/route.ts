import { NextRequest, NextResponse } from "next/server"

const rooms: Record<
  string,
  { name: string; createdAt: number; hostId: string; isLocked: boolean }
> = {}

export async function GET() {
  return NextResponse.json({
    rooms: Object.entries(rooms).map(([id, r]) => ({ id, ...r })),
  })
}

export async function POST(req: NextRequest) {
  const { roomName, hostId } = await req.json()
  if (!roomName || !hostId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  const id = roomName.toLowerCase().replace(/\s+/g, "-")
  rooms[id] = { name: roomName, createdAt: Date.now(), hostId, isLocked: false }
  return NextResponse.json({ id, ...rooms[id] })
}

export async function PATCH(req: NextRequest) {
  const { roomId, isLocked } = await req.json()
  if (!rooms[roomId]) return NextResponse.json({ error: "Room not found" }, { status: 404 })
  rooms[roomId].isLocked = isLocked
  return NextResponse.json({ success: true })
}

