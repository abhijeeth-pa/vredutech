import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const validRoles = new Set(["student", "teacher", "admin"])

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json().catch(() => ({ role: "student" }))
    const normalizedRole = validRoles.has(role) ? role : "student"

    const supabase = createSupabaseServerClient()
    const origin = new URL(request.url).origin
    const callback = `${origin}/auth/callback?next=/dashboard&role=${encodeURIComponent(normalizedRole)}`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback,
      },
    })

    if (error || !data.url) {
      return NextResponse.json({ error: error?.message || "Unable to start Google auth" }, { status: 400 })
    }

    return NextResponse.json({ success: true, url: data.url })
  } catch (error) {
    console.error("Google auth init error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

