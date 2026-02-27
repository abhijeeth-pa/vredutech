import { cookies } from "next/headers"
import { ACCESS_COOKIE } from "@/lib/auth-cookies"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_COOKIE)?.value

    if (!accessToken) {
      return null
    }

    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return null
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle()

    return {
      id: user.id,
      name: profile?.full_name || (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User",
      email: user.email || "",
      role: profile?.role || (user.user_metadata?.role as string) || "student",
    }
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export function isAuthenticated(): Promise<boolean> {
  return getUser().then((user) => !!user)
}
