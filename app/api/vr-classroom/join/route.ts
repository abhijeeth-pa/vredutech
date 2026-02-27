/**
 * API route to create and join a VR classroom room
 * GET /api/vr-classroom/join
 * 
 * Query params:
 * - roomId: string (required)
 * - userName: string (required)
 * - isTeacher: boolean (optional, defaults to false)
 * 
 * Response:
 * {
 *   success: boolean,
 *   roomId: string,
 *   joinUrl: string,
 *   message?: string
 * }
 */

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const roomId = url.searchParams.get("roomId")
    const userName = url.searchParams.get("userName")
    const isTeacher = url.searchParams.get("isTeacher") === "true"

    if (!roomId || !userName) {
      return Response.json(
        { success: false, message: "Missing required parameters: roomId, userName" },
        { status: 400 },
      )
    }

    // Build join URL with query params
    const joinUrl = new URL("/classroom/room/" + roomId, request.url)
    joinUrl.searchParams.set("host", isTeacher.toString())
    joinUrl.searchParams.set("user", userName)
    joinUrl.searchParams.set("name", `Room ${roomId}`)

    return Response.json({
      success: true,
      roomId: roomId,
      joinUrl: joinUrl.pathname + joinUrl.search,
      message: "Ready to join VR classroom",
    })
  } catch (error) {
    console.error("[VR API] Error:", error)
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    )
  }
}
