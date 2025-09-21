// Database types
export interface Profile {
  id: string
  email: string
  full_name: string
  created_at: string
}

// Extended Profile interface for super admin user management
export interface User extends Profile {
  organization: string
  role: string
}

export interface Org {
  id: string
  name: string
  slug: string
  created_at: string
  tags?: string[]
  image_url?: string
  image_path?: string
}

export type OrgRole = "user" | "org_admin"

export interface OrgMember {
  org_id: string
  user_id: string
  role: OrgRole
  created_at: string
}

export interface SuperAdmin {
  user_id: string
  created_at: string
}

export interface Scenario {
  id: string
  org_id: string
  name: string
  description: string
  detailed_description?: string
  goals?: string
  tags: string[]
  difficulty: number
  agent_id_male: string
  agent_id_female: string
  agent_name_male?: string
  agent_name_female?: string
  voice_id_male?: string
  voice_id_female?: string
  agent_avatar_male?: string  // Add this field
  agent_avatar_female?: string // Add this field
  designation?: string
  rubric: any
  report_system_prompt: string
  is_active: boolean
  default_gender?: "male" | "female"
  created_by: string
  created_at: string
  updated_at: string
}

export type RunStatus = "created" | "in_progress" | "completed" | "failed" | "abandoned"

export interface Run {
  id: string
  org_id: string
  scenario_id: string
  user_id: string
  status: RunStatus
  selected_gender?: "male" | "female"
  agent_id_used?: string
  voice_id_used?: string
  started_at?: string
  ended_at?: string
  created_at: string
  metrics?: {
    duration_sec?: number
    wpm_avg?: number
    fillers?: number
    silence_pct?: number
    interruptions?: number
    latency_avg_ms?: number
  }
  error_msg?: string
}

export interface Transcript {
  id: string
  run_id: string
  language?: string
  finalized: boolean
  content: {
    segments: TranscriptSeg[]
  }
  created_at: string
}

export interface Report {
  id: string
  run_id: string
  schema_version: string
  payload: any
  score_overall?: number
  model_used?: string
  created_at: string
}

// Frontend types
export type TranscriptSeg = {
  t: number
  speaker: "user" | "ai"
  text: string
  final?: boolean
  id?: string // Stable ID for referencing (e.g., "t1", "c1")
}

export type ReportEvent =
  | { type: "report_start"; schema_version: string; title?: string }
  | { type: "summary"; text: string }
  | { type: "score"; category: string; score: number; weight?: number; rationale?: string; went_well?: string; next_time?: string; transcript_refs?: string[] }
  | {
    type: "insight"
    label: string
    suggestion: string
    evidence_quotes?: string[]
    impact?: "high" | "medium" | "low"
    after_turn_id?: string
    transcript_refs?: string[] // Array of transcript segment IDs this insight references
    resources?: Array<{
      title: string
      url: string
      type: "video" | "article" | "course"
      description?: string
    }>
  }
  | { type: "action"; step: string; why?: string; practice_prompt?: string; transcript_refs?: string[] }
  | {
    type: "chart"
    chart: { type: "radar" | "bar" | "line" | "pie"; title?: string; data: any[]; xKey?: string; yKey?: string }
  }
  | { type: "final"; overall_score: number }

// Lightweight scenario type for dashboard listing
export interface ScenarioSummary {
  id: string
  org_id: string
  name: string
  description: string
  tags: string[]
  difficulty: number
  agent_name_male?: string
  agent_name_female?: string
  agent_avatar_male?: string
  agent_avatar_female?: string
  designation?: string
  is_active: boolean
  default_gender?: "male" | "female"
  created_at: string
  updated_at: string
  // Enhanced with run data from step-by-step loading
  recent_runs?: Array<{
    id: string
    scenario_id: string
    status: string
    started_at?: string
    ended_at?: string
    created_at: string
    reports?: Array<{ score_overall?: number }>
  }>
  last_run?: {
    id: string
    scenario_id: string
    status: string
    started_at?: string
    ended_at?: string
    created_at: string
    reports?: Array<{ score_overall?: number }>
  } | null
}

export interface ScenarioWithRun extends Scenario {
  recent_run?: Run & { report?: Report }
}

export interface RunWithDetails extends Run {
  scenario: Scenario
  transcript?: Transcript
  report?: Report
}

// User statistics interface
export interface UserRunStats {
  user: Profile
  totalRuns: number
  completedRuns: number
  totalMinutes: number
  averageMinutes: number
  runsByStatus: {
    completed: number
    in_progress: number
    failed: number
    abandoned: number
  }
}

// Demo system types (updated for new schema)
export interface DemoSystemScenario {
  id: number
  name: string
  description: string
  detailed_description?: string
  goals?: string
  tags: string[]
  difficulty: number
  agent_id_male: string
  agent_id_female: string
  agent_name_male?: string
  agent_name_female?: string
  voice_id_male?: string
  voice_id_female?: string
  agent_avatar_male?: string
  agent_avatar_female?: string
  designation?: string
  rubric: any
  report_system_prompt: string
  is_active: boolean
  default_gender?: "male" | "female"
  created_at: string
  updated_at: string
}

export interface DemoSystemRun {
  id: number
  session_id: string
  scenario_id: number
  status: RunStatus
  selected_gender?: "male" | "female"
  agent_id_used?: string
  voice_id_used?: string
  started_at?: string
  ended_at?: string
  created_at: string
  metrics?: {
    duration_sec?: number
    wpm_avg?: number
    fillers?: number
    silence_pct?: number
    interruptions?: number
    latency_avg_ms?: number
  }
  error_msg?: string
}

export interface DemoSystemTranscript {
  id: number
  run_id: number
  language?: string
  finalized: boolean
  content: {
    segments: TranscriptSeg[]
  }
  created_at: string
}

export interface DemoSystemReport {
  id: number
  run_id: number
  schema_version: string
  payload: any
  score_overall?: number
  model_used?: string
  created_at: string
}

export interface DemoSystemRunWithDetails extends DemoSystemRun {
  scenario: DemoSystemScenario
  transcript?: DemoSystemTranscript
  report?: DemoSystemReport
}

// Practice limit tracking for anonymous sessions
export interface DemoSystemSession {
  id: string
  practice_count: number
  max_practices: number
  last_practice_at?: string
  created_at: string
  updated_at: string
}

