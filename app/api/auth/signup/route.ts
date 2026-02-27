import { type NextRequest, NextResponse } from "next/server"
import { setAuthCookies } from "@/lib/auth-cookies"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const validRoles = new Set(["student", "teacher", "admin"])

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!validRoles.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const origin = new URL(request.url).origin

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const user = {
      id: data.user?.id || "",
      name,
      email,
      role,
    }

    // Email confirmation mode: session can be null until user verifies email.
    if (!data.session) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user,
        message: "Signup successful. Please verify your email before logging in.",
      })
    }

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      user,
      message: "Account created successfully",
    })

    setAuthCookies(response, data.session.access_token, data.session.refresh_token)
    return response
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
