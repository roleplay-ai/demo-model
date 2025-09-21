import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Helper function to get current user session
export const getCurrentUser = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user || null
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

// Helper function to get user's org membership
export const getUserOrgMembership = async (userId: string) => {
  const { data, error } = await supabase
    .from("org_members")
    .select(`
      *,
      orgs (*)
    `)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  return data
}

// Helper function to check if user is super admin
export const isUserSuperAdmin = async (userId: string) => {
  // Use RPC to avoid RLS issues on direct table selects
  const { data, error } = await supabase.rpc("is_super_admin")
  if (error) return false
  return data === true
}
