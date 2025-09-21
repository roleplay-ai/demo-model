import { supabase } from "./supabase"
import type { Scenario, Run, Transcript, Report, RunWithDetails, ScenarioWithRun, Org, OrgMember, Profile, ScenarioSummary, User, DemoSystemScenario, DemoSystemRun, DemoSystemReport, DemoSystemRunWithDetails, DemoSystemTranscript, DemoSystemSession } from "./types"

// Development logging utility
const devlog = (...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}

// Scenarios
export const getScenarios = async (orgId: string): Promise<ScenarioSummary[]> => {
  const { data, error } = await supabase
    .from("scenarios")
    .select(`
      id,
      org_id,
      name,
      description,
      tags,
      difficulty,
      agent_name_male,
      agent_name_female,
      agent_avatar_male,
      agent_avatar_female,
      designation,
      is_active,
      created_at,
      updated_at
    `)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}


// Progressive loading functions for scenarios panel
export const getScenariosOnly = async (orgId: string): Promise<ScenarioSummary[]> => {
  devlog("[Database] Loading scenarios only for org:", orgId)
  const { data, error } = await supabase
    .from("scenarios")
    .select(`
      id,
      org_id,
      name,
      description,
      tags,
      difficulty,
      agent_name_male,
      agent_name_female,
      agent_avatar_male,
      agent_avatar_female,
      designation,
      default_gender,
      is_active,
      created_at,
      updated_at
    `)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  devlog("[Database] Scenarios loaded:", data?.length || 0)
  return data || []
}

export const getTagsFromScenarios = (scenarios: ScenarioSummary[]): string[] => {
  devlog("[Database] Extracting tags from scenarios")
  const tags = Array.from(new Set(scenarios.flatMap(s => s.tags || [])))
  devlog("[Database] Tags extracted:", tags.length)
  return tags
}

export const getRunsForScenarios = async (scenarioIds: string[]): Promise<any[]> => {
  devlog("[Database] Loading runs for scenarios:", scenarioIds.length)

  if (scenarioIds.length === 0) {
    devlog("[Database] No scenario IDs provided, skipping runs fetch")
    return []
  }

  const { data: runs, error: runsError } = await supabase
    .from("runs")
    .select(`
      id,
      scenario_id,
      status,
      started_at,
      ended_at,
      created_at,
      reports(score_overall)
    `)
    .in("scenario_id", scenarioIds)
    .order("created_at", { ascending: false })
    .limit(100)

  if (runsError) {
    console.warn("[Database] Warning: Could not load runs:", runsError)
    return []
  }

  devlog("[Database] Runs loaded:", runs?.length || 0)
  return runs || []
}

export const enhanceScenariosWithRuns = (scenarios: ScenarioSummary[], runs: any[]): ScenarioSummary[] => {
  devlog("[Database] Enhancing scenarios with run data")

  // Group runs by scenario_id
  const runsByScenario = runs.reduce((acc, run) => {
    if (!acc[run.scenario_id]) {
      acc[run.scenario_id] = []
    }
    acc[run.scenario_id].push(run)
    return acc
  }, {} as Record<string, any[]>)

  // Enhance scenarios with run data
  const enhancedScenarios = scenarios.map(scenario => ({
    ...scenario,
    recent_runs: runsByScenario[scenario.id] || [],
    last_run: runsByScenario[scenario.id]?.[0] || null
  }))

  devlog("[Database] Scenarios enhanced with run data")
  return enhancedScenarios
}

export const getScenario = async (id: string): Promise<Scenario> => {
  const { data, error } = await supabase.from("scenarios").select("*").eq("id", id).single()

  if (error) throw error
  return data
}

// Lightweight function to get scenario details for conversation
export const getScenarioForConversation = async (id: string): Promise<Scenario> => {
  devlog("[Database] Getting scenario for conversation:", id)
  const { data, error } = await supabase
    .from("scenarios")
    .select(`
      id,
      org_id,
      name,
      description,
      detailed_description,
      goals,
      tags,
      difficulty,
      agent_id_male,
      agent_id_female,
      agent_name_male,
      agent_name_female,
      voice_id_male,
      voice_id_female,
      agent_avatar_male,
      agent_avatar_female,
      designation,
      rubric,
      report_system_prompt,
      is_active,
      created_by,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  devlog("[Database] Scenario loaded for conversation:", data?.name)
  return data
}

// Only require the columns that are NOT NULL in DB; others are optional
export const createScenario = async (
  scenario: Pick<Scenario, "org_id" | "name" | "report_system_prompt"> &
    Partial<
      Pick<
        Scenario,
        | "description"
        | "detailed_description"
        | "goals"
        | "tags"
        | "difficulty"
        | "agent_id_male"
        | "agent_id_female"
        | "agent_name_male"
        | "agent_name_female"
        | "voice_id_male"
        | "voice_id_female"
        | "agent_avatar_male"
        | "agent_avatar_female"
        | "designation"
        | "rubric"
        | "is_active"
        | "default_gender"
        | "created_by"
      >
    >,
) => {
  const { data, error } = await supabase.from("scenarios").insert(scenario as any).select().single()

  if (error) throw error
  return data
}

export const updateScenario = async (id: string, updates: Partial<Scenario>) => {
  const { data, error } = await supabase
    .from("scenarios")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Admin Functions
export const getAllScenarios = async (): Promise<Scenario[]> => {
  const { data, error } = await supabase.from("scenarios").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Orgs (minimal shape for dropdown)
export const getOrgs = async (): Promise<{ id: string; name: string }[]> => {
  const { data, error } = await supabase.from("orgs").select("id, name").order("name", { ascending: true })
  if (error) throw error
  return data
}

export const getAdminUsageStats = async (orgId: string) => {
  // Counts
  const { count: totalUsers } = await supabase
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)

  const { count: totalRuns } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)

  const { count: completedRuns } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "completed")

  // Recent runs for avg duration and daily activity (last 30 days)
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: recentRuns } = await supabase
    .from("runs")
    .select("id, user_id, started_at, ended_at, metrics")
    .eq("org_id", orgId)
    .gte("created_at", since.toISOString())

  // Avg session duration in minutes
  const durations: number[] = (recentRuns || [])
    .map((r: any) => {
      if (r.started_at && r.ended_at) {
        const ms = new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()
        return Math.max(0, ms / 60000)
      }
      const sec = r.metrics?.duration_sec
      return typeof sec === "number" ? sec / 60 : undefined
    })
    .filter((v: any) => typeof v === "number")

  const avgSessionDuration = durations.length
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0

  // Daily activity: runs and distinct users per day
  const byDate: Record<string, { runs: number; users: Set<string> }> = {}
    ; (recentRuns || []).forEach((r: any) => {
      const d = new Date(r.started_at || r.created_at || new Date()).toISOString().split("T")[0]
      if (!byDate[d]) byDate[d] = { runs: 0, users: new Set<string>() }
      byDate[d].runs += 1
      if (r.user_id) byDate[d].users.add(r.user_id)
    })
  const dailyActivity: Array<{ date: string; runs: number; users: number }> = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split("T")[0]
    const rec = byDate[key]
    dailyActivity.push({ date: key, runs: rec?.runs || 0, users: rec ? rec.users.size : 0 })
  }

  // Popular scenarios (by runs and avg report score)
  const { data: scenarioRuns } = await supabase
    .from("runs")
    .select(`scenario_id, scenarios(name), reports(score_overall)`) // nested
    .eq("org_id", orgId)

  const scenarioAgg: Record<string, { name: string; runs: number; scores: number[] }> = {}
    ; (scenarioRuns || []).forEach((r: any) => {
      const name = r.scenarios?.name || "Unknown"
      if (!scenarioAgg[name]) scenarioAgg[name] = { name, runs: 0, scores: [] }
      scenarioAgg[name].runs += 1
      const score = r.reports?.[0]?.score_overall
      if (typeof score === "number") scenarioAgg[name].scores.push(score)
    })
  const popularScenarios = Object.values(scenarioAgg)
    .map((s) => ({ name: s.name, runs: s.runs, avgScore: s.scores.length ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0 }))
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5)

  // User engagement buckets based on runs per user (last 30 days)
  const countsByUser: Record<string, number> = {}
    ; (recentRuns || []).forEach((r: any) => {
      if (!r.user_id) return
      countsByUser[r.user_id] = (countsByUser[r.user_id] || 0) + 1
    })
  const buckets = { "0-1": 0, "2-5": 0, "6-10": 0, "10+": 0 }
  Object.values(countsByUser).forEach((c) => {
    if (c <= 1) buckets["0-1"]++
    else if (c <= 5) buckets["2-5"]++
    else if (c <= 10) buckets["6-10"]++
    else buckets["10+"]++
  })
  const userEngagement = [
    { range: "0-1", count: buckets["0-1"] },
    { range: "2-5", count: buckets["2-5"] },
    { range: "6-10", count: buckets["6-10"] },
    { range: "10+", count: buckets["10+"] },
  ]

  return {
    totalUsers: totalUsers || 0,
    totalRuns: totalRuns || 0,
    completedRuns: completedRuns || 0,
    avgSessionDuration,
    dailyActivity,
    popularScenarios,
    userEngagement,
  }
}

// Runs
export const getRecentRuns = async (
  orgId: string,
  page = 1,
  pageSize = 10,
  userId?: string,
): Promise<{ runs: RunWithDetails[]; total: number }> => {
  const offset = (page - 1) * pageSize

  // Get total count
  let countQuery = supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
  if (userId) countQuery = countQuery.eq("user_id", userId)
  const { count: total } = await countQuery

  // Get paginated data
  let dataQuery = supabase
    .from("runs")
    .select(`
      *,
      scenarios(*),
      transcripts(*),
      reports(*)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1)
  if (userId) dataQuery = dataQuery.eq("user_id", userId)
  const { data, error } = await dataQuery

  if (error) throw error

  return {
    runs: data.map((run: any) => ({
      ...run,
      scenario: run.scenarios,
      transcript: run.transcripts?.[0],
      // reports may come back as an array or a single object depending on the relationship
      report: Array.isArray((run as any).reports)
        ? (run as any).reports?.[0]
        : (run as any).reports ?? undefined,
    })),
    total: total || 0
  }
}

export const getRun = async (id: string): Promise<RunWithDetails> => {
  const { data, error } = await supabase
    .from("runs")
    .select(`
      *,
      scenarios(*),
      transcripts(*),
      reports(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error

  return {
    ...data,
    scenario: data.scenarios,
    transcript: data.transcripts?.[0],
    // reports may come back as an array or a single object
    report: Array.isArray((data as any).reports)
      ? (data as any).reports?.[0]
      : (data as any).reports ?? undefined,
  }
}

export const createRun = async (run: Omit<Run, "id" | "created_at">) => {
  const { data, error } = await supabase.from("runs").insert(run).select().single()

  if (error) throw error
  return data
}

export const updateRun = async (id: string, updates: Partial<Run>) => {
  const { data, error } = await supabase.from("runs").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

// Transcripts
export const createTranscript = async (transcript: Omit<Transcript, "id" | "created_at">) => {
  const { data, error } = await supabase.from("transcripts").insert(transcript).select().single()

  if (error) throw error
  return data
}

export const getTranscriptByRunId = async (runId: string): Promise<Transcript | null> => {
  const { data, error } = await supabase.from("transcripts").select("*").eq("run_id", runId).single()

  if (error) {
    if (error.code === "PGRST116") {
      // No transcript found
      return null
    }
    throw error
  }
  return data
}

// Reports
export const createReport = async (report: Omit<Report, "id" | "created_at">) => {
  const { data, error } = await supabase.from("reports").upsert(report, { onConflict: "run_id" }).select().single()

  if (error) throw error
  return data
}

export const getReportByRunId = async (runId: string): Promise<Report | null> => {
  const { data, error } = await supabase.from("reports").select("*").eq("run_id", runId).single()
  if (error) {
    // PostgREST code for no rows
    if ((error as any).code === "PGRST116") return null
    throw error
  }
  return data
}

// Super Admin Functions
export const getAllOrganizations = async (): Promise<(Org & { member_count: number })[]> => {
  devlog("Fetching all organizations...")
  const { data, error } = await supabase
    .from("orgs")
    .select(`
      *,
      org_members(count)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching organizations:", error)
    throw error
  }

  devlog("Raw organizations data:", data)
  const result = data.map((org: any) => ({
    ...org,
    member_count: org.org_members?.[0]?.count || 0,
  }))
  devlog("Processed organizations:", result)
  return result
}

export const createOrganization = async (org: { name: string; tags?: string[]; image_url?: string; image_path?: string }): Promise<Org> => {
  const { data, error } = await supabase.from("orgs").insert(org).select().single()

  if (error) throw error
  return data
}

export const updateOrganization = async (
  id: string,
  updates: { name?: string; tags?: string[]; image_url?: string; image_path?: string },
): Promise<Org> => {
  const { data, error } = await supabase
    .from("orgs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper function to check if user has super admin privileges
export const checkSuperAdminAccess = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc("is_super_admin")
    if (error) {
      console.error("Error checking super admin access:", error)
      return false
    }
    return data === true
  } catch (error) {
    console.error("Error checking super admin access:", error)
    return false
  }
}

export const deleteOrganization = async (id: string): Promise<void> => {
  devlog("Attempting to delete organization with ID:", id)

  // Since all foreign keys have ON DELETE CASCADE, we can just delete the organization directly
  // The database will automatically handle deleting related records in:
  // - org_members (CASCADE)
  // - scenarios (CASCADE) 
  // - runs (CASCADE)
  // - transcripts (CASCADE via runs)
  // - reports (CASCADE via runs)

  const { error } = await supabase.from("orgs").delete().eq("id", id)

  if (error) {
    console.error("Database error when deleting organization:", error)
    throw new Error(`Failed to delete organization: ${error.message} (Code: ${error.code})`)
  }

  devlog("Organization and all related data deleted successfully from database")
}

export const getOrganizationUsers = async (orgId: string): Promise<(OrgMember & { profile: Profile })[]> => {
  const { data, error } = await supabase
    .from("org_members")
    .select(`
      *,
      profiles(*)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data.map((membership: any) => ({
    ...membership,
    profile: membership.profiles,
  }))
}

export const createOrgMembership = async (membership: {
  org_id: string
  user_id: string
  role: "user" | "org_admin"
}): Promise<OrgMember> => {
  const { data, error } = await supabase.from("org_members").insert(membership).select().single()

  if (error) throw error
  return data
}

export const updateOrgMembership = async (
  id: string,
  updates: { role?: "user" | "org_admin" },
): Promise<OrgMember> => {
  const { data, error } = await supabase.from("org_members").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      org_members(
        *,
        orgs(name)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data.map((profile: any) => ({
    ...profile,
    organization: profile.org_members?.[0]?.orgs?.name || "No Organization",
    role: profile.org_members?.[0]?.role || "user",
  }))
}

// New functions for user management
export const updateUser = async (
  userId: string,
  updates: { full_name?: string; email?: string; org_id?: string; role?: "user" | "org_admin"; password?: string }
): Promise<void> => {
  const { full_name, email, org_id, role, password, ...profileUpdates } = updates

  // Update profile if name or email changed
  if (full_name !== undefined || email !== undefined) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", userId)

    if (profileError) throw profileError
  }

  // Update org membership if org_id or role changed
  if (org_id !== undefined || role !== undefined) {
    const { error: memberError } = await supabase
      .from("org_members")
      .update({ org_id, role })
      .eq("user_id", userId)

    if (memberError) throw memberError
  }
}

export const deleteUser = async (userId: string): Promise<void> => {
  // Delete the auth user (this will cascade to profiles and org_members)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) throw error
}

export const getUserById = async (userId: string): Promise<User> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      org_members(
        *,
        orgs(name)
      )
    `)
    .eq("id", userId)
    .single()

  if (error) throw error

  return {
    ...data,
    organization: data.org_members?.[0]?.orgs?.name || "No Organization",
    role: data.org_members?.[0]?.role || "user",
  }
}

export const getSuperAdminStats = async () => {
  // Get total organizations
  const { count: totalOrgs } = await supabase.from("orgs").select("*", { count: "exact", head: true })

  // Get total users
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  // Get total runs
  const { count: totalRuns } = await supabase.from("runs").select("*", { count: "exact", head: true })

  // Get completed runs
  const { count: completedRuns } = await supabase
    .from("runs")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  // Get organizations with user counts
  const { data: orgData } = await supabase
    .from("orgs")
    .select(`
      id,
      name,
      created_at,
      org_members(count)
    `)
    .order("created_at", { ascending: false })

  const organizationStats =
    orgData?.map((org: any) => ({
      id: org.id,
      name: org.name,
      created_at: org.created_at,
      user_count: org.org_members?.[0]?.count || 0,
    })) || []

  // Get daily activity for last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: runsData } = await supabase
    .from("runs")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true })

  const dailyActivity = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString()
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString()

    const dayRuns = runsData?.filter((run: any) => run.created_at >= dayStart && run.created_at <= dayEnd).length || 0

    dailyActivity.push({ date: dateStr, runs: dayRuns })
  }

  return {
    totalOrgs: totalOrgs || 0,
    totalUsers: totalUsers || 0,
    totalRuns: totalRuns || 0,
    completedRuns: completedRuns || 0,
    organizationStats,
    dailyActivity,
  }
}

// New function to get scenario with recent run data when needed
export const getScenarioWithRecentRun = async (scenarioId: string): Promise<ScenarioWithRun> => {
  const { data, error } = await supabase
    .from("scenarios")
    .select(`
      *,
      runs(
        id,
        status,
        started_at,
        ended_at,
        reports(score_overall)
      )
    `)
    .eq("id", scenarioId)
    .single()

  if (error) throw error

  return {
    ...data,
    recent_run: data.runs?.[0]
      ? {
        ...data.runs[0],
        report: data.runs[0].reports?.[0],
      }
      : undefined,
  }
}

// ===== DEMO SYSTEM FUNCTIONS (Updated for new schema) =====

// Demo System Scenarios
export const getDemoSystemScenarios = async (): Promise<DemoSystemScenario[]> => {
  const { data, error } = await supabase
    .from("demo_system_scenarios")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const getDemoSystemScenario = async (id: number): Promise<DemoSystemScenario> => {
  const { data, error } = await supabase
    .from("demo_system_scenarios")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

// Practice limit management (using anonymous sessions)
export const getDemoSystemSession = async (sessionId: string): Promise<DemoSystemSession | null> => {
  const { data, error } = await supabase
    .from("demo_system_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw error
  }

  return data
}

export const createDemoSystemSession = async (sessionId: string): Promise<DemoSystemSession> => {
  const { data, error } = await supabase
    .from("demo_system_sessions")
    .insert({
      id: sessionId,
      practice_count: 0,
      max_practices: 2
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const canSessionPracticeDemo = async (sessionId: string): Promise<boolean> => {
  let session = await getDemoSystemSession(sessionId)

  // Create session if it doesn't exist
  if (!session) {
    session = await createDemoSystemSession(sessionId)
  }

  return session.practice_count < session.max_practices
}

export const incrementDemoPracticeCount = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from("demo_system_sessions")
    .update({
      practice_count: supabase.sql`COALESCE(practice_count, 0) + 1`,
      last_practice_at: new Date().toISOString()
    })
    .eq("id", sessionId)

  if (error) throw error
}

// Demo System Runs
export const createDemoSystemRun = async (demoRun: Omit<DemoSystemRun, "id" | "created_at">): Promise<DemoSystemRun> => {
  const { data, error } = await supabase
    .from("demo_system_runs")
    .insert(demoRun)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateDemoSystemRun = async (id: number, updates: Partial<DemoSystemRun>): Promise<DemoSystemRun> => {
  const { data, error } = await supabase
    .from("demo_system_runs")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getDemoSystemRun = async (id: number): Promise<DemoSystemRunWithDetails> => {
  const { data, error } = await supabase
    .from("demo_system_runs")
    .select(`
      *,
      demo_system_scenarios(*),
      demo_system_transcripts(*),
      demo_system_reports(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error

  return {
    ...data,
    scenario: data.demo_system_scenarios,
    transcript: data.demo_system_transcripts?.[0],
    report: Array.isArray((data as any).demo_system_reports)
      ? (data as any).demo_system_reports?.[0]
      : (data as any).demo_system_reports ?? undefined,
  }
}

export const getSessionDemoSystemRuns = async (sessionId: string): Promise<DemoSystemRunWithDetails[]> => {
  const { data, error } = await supabase
    .from("demo_system_runs")
    .select(`
      *,
      demo_system_scenarios(*),
      demo_system_transcripts(*),
      demo_system_reports(*)
    `)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((run: any) => ({
    ...run,
    scenario: run.demo_system_scenarios,
    transcript: run.demo_system_transcripts?.[0],
    report: Array.isArray((run as any).demo_system_reports)
      ? (run as any).demo_system_reports?.[0]
      : (run as any).demo_system_reports ?? undefined,
  }))
}

// Demo System Reports
export const createDemoSystemReport = async (report: Omit<DemoSystemReport, "id" | "created_at">): Promise<DemoSystemReport> => {
  const { data, error } = await supabase
    .from("demo_system_reports")
    .upsert(report, { onConflict: "run_id" })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getDemoSystemReportByRunId = async (runId: number): Promise<DemoSystemReport | null> => {
  const { data, error } = await supabase
    .from("demo_system_reports")
    .select("*")
    .eq("run_id", runId)
    .single()

  if (error) {
    if ((error as any).code === "PGRST116") return null
    throw error
  }
  return data
}

// Demo System Transcripts
export const createDemoSystemTranscript = async (transcript: Omit<DemoSystemTranscript, "id" | "created_at">): Promise<DemoSystemTranscript> => {
  const { data, error } = await supabase
    .from("demo_system_transcripts")
    .insert(transcript)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getDemoSystemTranscriptByRunId = async (runId: number): Promise<DemoSystemTranscript | null> => {
  const { data, error } = await supabase
    .from("demo_system_transcripts")
    .select("*")
    .eq("run_id", runId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw error
  }
  return data
}
