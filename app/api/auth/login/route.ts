import { type NextRequest, NextResponse } from "next/server"
import { setAuthCookies } from "@/lib/auth-cookies"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: error?.message || "Invalid credentials" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", data.user.id)
      .maybeSingle()

    const user = {
      id: data.user.id,
      name: profile?.full_name || (data.user.user_metadata?.full_name as string) || data.user.email?.split("@")[0] || "User",
      email: data.user.email || email,
      role: profile?.role || (data.user.user_metadata?.role as string) || "student",
    }

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      user,
      message: "Login successful",
    })

    setAuthCookies(response, data.session.access_token, data.session.refresh_token)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
