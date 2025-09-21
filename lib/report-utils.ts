import type { ReportEvent } from "./types"

export const upsertScore = (
  scores: Array<{ category: string; score: number; weight?: number; rationale?: string; went_well?: string; next_time?: string; transcript_refs?: string[] }>,
  event: Extract<ReportEvent, { type: "score" }>,
) => {
  const existingIndex = scores.findIndex((s) => s.category === event.category)
  if (existingIndex >= 0) {
    scores[existingIndex] = {
      category: event.category,
      score: event.score,
      weight: event.weight,
      rationale: event.rationale,
      went_well: event.went_well,
      next_time: event.next_time,
      transcript_refs: event.transcript_refs,
    }
  } else {
    scores.push({
      category: event.category,
      score: event.score,
      weight: event.weight,
      rationale: event.rationale,
      went_well: event.went_well,
      next_time: event.next_time,
      transcript_refs: event.transcript_refs,
    })
  }
  return scores
}

export const upsertChart = (charts: Array<{ id: string; chart: any }>, id: string, chart: any) => {
  const existingIndex = charts.findIndex((c) => c.id === id)
  if (existingIndex >= 0) {
    charts[existingIndex] = { id, chart }
  } else {
    charts.push({ id, chart })
  }
  return charts
}

export const calculateOverallScore = (scores: Array<{ score: number; weight?: number }>) => {
  if (scores.length === 0) return 0

  const totalWeight = scores.reduce((sum, s) => sum + (s.weight || 1), 0)
  const weightedSum = scores.reduce((sum, s) => sum + s.score * (s.weight || 1), 0)

  return Math.round(weightedSum / totalWeight)
}
