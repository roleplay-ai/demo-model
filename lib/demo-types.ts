export interface DemoScenario {
  id: string
  name: string
  description: string
  detailedDescription: string
  difficulty: 1 | 2 | 3
  estimatedDuration: number
  tags: string[]
  agentConfig: {
    male: {
      name: string
      avatar: string
    }
    female: {
      name: string
      avatar: string
    }
  }
  rubric: {
    categories: Array<{
      name: string
      weight: number
    }>
  }
}

export interface LeadData {
  name: string
  email: string
  company?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export interface SessionData {
  scenario: DemoScenario
  gender: "male" | "female"
  transcript: TranscriptSegment[]
  duration: number
  overallScore: number
  categoryScores: Array<{
    category: string
    score: number
    feedback: string
  }>
  improvements: string[]
  strengths: string[]
}

export interface TranscriptSegment {
  id: string
  speaker: "user" | "agent"
  text: string
  timestamp: number
  confidence?: number
}
