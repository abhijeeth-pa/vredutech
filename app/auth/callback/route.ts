import { type NextRequest, NextResponse } from "next/server"
import { setAuthCookies } from "@/lib/auth-cookies"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const validRoles = new Set(["student", "teacher", "admin"])

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const nextPath = requestUrl.searchParams.get("next") || "/dashboard"
  const role = requestUrl.searchParams.get("role")
  const safeRole = role && validRoles.has(role) ? role : null
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.session || !data.user) {
    console.error("OAuth callback exchange failed:", error)
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  if (safeRole) {
    // Profile row is upserted by SQL trigger; this updates role from selected signup role.
    await supabase.from("profiles").upsert({ id: data.user.id, role: safeRole })
  }

  const response = NextResponse.redirect(`${origin}${nextPath}`)
  setAuthCookies(response, data.session.access_token, data.session.refresh_token)
  return response
}

