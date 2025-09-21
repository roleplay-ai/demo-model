import type { NextRequest } from "next/server"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"


export const runtime = "nodejs"





export async function POST(request: NextRequest) {
  try {
    const { runId, scenario, transcript, metrics } = await request.json()
    console.log("[report-stream] POST body:", {
      runId,
      scenario: scenario?.name,
      hasRubric: !!scenario?.rubric,
      transcriptSegs: transcript?.segments?.length || 0,
      hasMetrics: !!metrics && Object.keys(metrics || {}).length > 0,
    })



    const systemPrompt =
      (scenario.report_system_prompt ? scenario.report_system_prompt + "\n" : "") +
      `You are an expert evaluator assessing the USER (not the AI coach) in a spoken roleplay. Evaluate only USER turns; never judge the coach. Be objective, actionable, and concise.

Rules:
- Output must be NDJSON: one standalone JSON object per line. No prose lines, no markdown, no code fences.
- The server will emit the first report_start event. Do not emit report_start yourself. You must end with a final event.
- Prefer streaming granular events frequently as they are ready.
- Use only fields defined below; avoid extra keys.
- Base your analysis ONLY on [USER] lines in the provided transcript and scenario rubric. If a category is not evidenced in USER lines, mention it in rationale.
- For each insight, include 1-2 evidence_quotes that clearly show the issue with role labels: always include a labeled "[USER] ..." quote and optionally one relevant labeled "[COACH] ..." line for context.
- CRITICAL: For each insight and score, include a "transcript_refs" array with the exact turn IDs (like "t1", "t2", "c1") that this feedback references. This is MANDATORY for both insights and scores. NEVER omit transcript_refs from any score or insight event. Limit to maximum 3 references per event.

JSON Schemas (informal, exact keys and types):
- report_start: { "type":"report_start", "schema_version":"v1", "title"?: string }
- summary: { "type":"summary", "text": string }
- score: { "type":"score", "category": string, "score": number /*0-100*/, "weight"?: number, "rationale"?: string, "went_well"?: string /*2-3 lines*/, "next_time"?: string /*2-3 lines*/, "transcript_refs"?: string[] }
- insight: {
    "type":"insight",
    "label": string,
    "impact"?: "high"|"medium"|"low",
    "after_turn_id": string /* must be of the form "t{N}" where N is the 1-based USER turn index in the transcript (count only [USER] lines) */,
    "why": string /* brief explanation of the issue or praise */,
    "coach_says": string /* concise coaching guidance */,
    "you_said": string /* a single labeled quote from the USER: "[USER] ..." */,
    "better_version"?: string /* improved phrasing suggestion */, 
    "evidence_quotes"?: string[] /* Optional. Include 1-2 labeled quotes, always at least one [USER] quote; include one [COACH] only if helpful for context. */,
    "transcript_refs"?: string[] /* Array of turn IDs this insight references (e.g., ["t1", "c2"]) */,
    "resources"?: Array<{
      "title": string,
      "url": string,
      "type": "video"|"article"|"course",
      "description"?: string
    }> /* IMPORTANT: Select 1-3 relevant learning resources from the available resources list above. Always include resources for insights with medium or high impact. Use the exact URLs from the resources list. */
  }
- action: { "type":"action", "step": string, "why"?: string, "practice_prompt"?: string, "transcript_refs"?: string[] }
- chart: { "type":"chart", "chart": { "type": "radar"|"bar"|"line"|"pie", "title"?: string, "data": any[], "xKey"?: string, "yKey"?: string } }
- final: { "type":"final", "overall_score": number /*0-100*/ }

Event order (strict):
1) report_start (emitted by server; do not output)
2) summary (>=1 line; if content is limited, provide a brief summary anyway)
3) score (>=1 lines, one per category you assess)
4) insight (2-4 lines)
5) action (2-4 lines)
6) chart (0-2 lines; optional)
7) final (exactly once, last line)

Do not emit events outside this order. Do not interleave after you move to the next section.

Resource Selection Guidelines:
- When including resources in insights, select from the available resources list above based on the skill area being addressed
- Match the resource skill category to the insight topic (e.g., if discussing confidence issues, select from "Confidence Building" resources)
- Prefer resources that match the impact level (high/medium impact insights should always include resources)
- Use the exact URLs provided in the resources list; do not make up or modify URLs
- Include a mix of resource types (video, article, course) when possible
- For resource titles, use the format: "{Skill} {Type} {Resource #}" (e.g., "Confidence Building Video 1")


Allowed events (examples):
{"type":"report_start","schema_version":"v1","title":"User Performance Analysis"}
{"type":"summary","text":"Overall, the user stayed on topic and asked clarifying questions effectively."}
{"type":"score","category":"Clarity","score":78,"weight":1.2,"rationale":"Mostly clear; minor mumbles at t=45s and t=90s.","went_well":"From the very beginning, the user demonstrated strong communication skills by speaking in complete sentences and maintaining a steady pace. At [t1], they introduced themselves clearly and set proper expectations for the conversation. When the coach asked for clarification at [t2], the user responded with well-structured thoughts that showed good organization. Throughout the interaction, they avoided rambling and stayed focused on the main points. Even when discussing complex topics, they broke down information into digestible pieces that were easy to follow.","next_time":"One area for improvement is the user's tendency to rush through important details at [t3]. Instead of quickly moving past key information, they could pause and emphasize critical points with slightly slower speech and strategic repetition. This would help ensure the listener fully grasps the message before moving forward. \n\nAnother opportunity came at [t5], where the user could have used more transitional phrases to connect their ideas. Phrases like 'building on that point' or 'to elaborate further' would create smoother flow between concepts and make the conversation feel more natural and professional.","transcript_refs":["t1","t2","t3"]}
{"type":"score","category":"Confidence","score":85,"rationale":"Spoke with good confidence throughout the conversation.","went_well":"The user entered the conversation with a strong sense of presence and maintained that confidence throughout the entire interaction. At [t1], they greeted the coach with a warm but professional tone that immediately established rapport. When presented with challenging questions at [t2], they didn't hesitate or become defensive; instead, they responded thoughtfully and maintained their composure. Their voice remained steady and clear even when discussing potentially sensitive topics. The user's ability to maintain eye contact and speak with conviction at [t4] showed they were comfortable in their role and believed in what they were saying.","next_time":"While the user showed good overall confidence, there were moments where they could have been more assertive. At [t3], when the coach questioned their approach, the user could have defended their position more strongly with specific examples or data points. This would have demonstrated deeper conviction in their methodology. \n\nAdditionally, at [t5], the user's closing statement could have been delivered with more authority. Instead of ending with a question, they could have made a confident declaration about next steps, which would have shown leadership and decisiveness.","transcript_refs":["t1","t2","t4"]}
{"type":"insight","label":"Speaking Pace","impact":"medium","after_turn_id":"t2","why":"Hesitation and fillers reduced clarity.","coach_says":"Pause briefly between clauses and finish sentences.","you_said":"[USER] I think, um, we could...","better_version":"I propose we try option A now, then evaluate results Friday.","evidence_quotes":["[USER] I think, um, we could...","[COACH] Could you clarify your request?"],"resources":[{"title":"De-escalation Video 1","url":"https://www.youtube.com/watch?v=EaXRYn5jZoI","type":"video","description":"Learn techniques to reduce um, uh, and other filler words"},{"title":"Confidence Building Course","url":"https://alison.com/course/building-your-confidence-and-working-ethically","type":"course","description":"Complete course on building speaking confidence"}]}
{"type":"action","step":"Practice the 4-7-8 breathing technique","why":"Reduces fillers and stabilizes pace","practice_prompt":"Inhale 4, hold 7, exhale 8 for 4 cycles before speaking."}
{"type":"chart","chart":{"type":"radar","title":"Skills Overview","data":[{"category":"Clarity","value":78},{"category":"Pace","value":72}]}}
{"type":"final","overall_score":76}

Scoring guidance:
- Scoring categories/rubric will be present in the system prompt when present; only use these default values if there is no mention of these rubric values: Clarity, Pace, Confidence, Engagement, Grammar, Vocabulary.
- Score each category 0-100; include brief rationale; use weight if rubric provides weights.
- For each score, also provide two narrative fields:
  - went_well: Write a short narrative (5-8 sentences, paragraph style) that tells the story of what the USER did well in this category. Use conversational language and storytelling — e.g., "In the early turns, the user set the tone by… Later, when challenged at [t3], they handled it by…". Reference turns by ID only (e.g., [t3], [t5]) but do not include timestamps.
  - next_time: Provide 2-3 detailed, story-like suggestions for improvement. Each should be a short paragraph (3-5 sentences), not just a bullet. Frame them narratively — e.g., "Instead of moving quickly to the close at [t4], the user could have paused to validate the concern…". Again, reference only turn IDs (e.g., [t2]), no timestamps.

Example transcript (role-labeled) and event sequence:
[USER] May I come in, sir?
[COACH] Yes, go ahead. What would you like to discuss?
[USER] I'm proposing a new approach but I'm not fully sure about the details yet.

{"type":"report_start","schema_version":"v1","title":"Performance Analysis"}
{"type":"summary","text":"The user was polite and concise, but lacked specificity when proposing the idea."}
{"type":"score","category":"Clarity","score":72,"rationale":"Hesitation and vague wording reduced clarity.","went_well":"The user demonstrated good conversational flow and maintained politeness throughout the interaction. At [t1], they approached the situation with appropriate respect and used proper greeting etiquette. When the coach invited them to share their thoughts, they responded promptly and stayed focused on the main topic. Their responses were concise and to the point, showing they understood the importance of not wasting the other person's time. The user's ability to stay on topic despite some uncertainty showed good conversational discipline.","next_time":"The main area for improvement is the user's tendency to be vague when presenting ideas. At [t1], instead of saying 'I'm proposing a new approach but I'm not fully sure about the details yet,' they could have prepared a more concrete opening statement. This would have immediately established credibility and given the coach something specific to respond to. \n\nAdditionally, the user could have used the opportunity at [t2] to provide more specific details about their proposal. Rather than leaving the idea open-ended, they could have shared at least one concrete example or implementation detail that would have demonstrated deeper thinking and preparation.","transcript_refs":["t1","t2"]}
{"type":"score","category":"Confidence","score":65,"rationale":"Frequent hedging (""not fully sure"") signaled uncertainty.","went_well":"Despite some uncertainty, the user showed courage by bringing forward their idea in the first place. At [t1], they took the initiative to propose something new rather than staying silent or avoiding the topic. When they spoke, their tone remained respectful and professional, which helped maintain a positive atmosphere. The user's willingness to admit uncertainty rather than pretending to know everything showed honesty and self-awareness. They also maintained composure throughout the conversation without becoming flustered or defensive.","next_time":"The user's confidence would improve significantly by preparing more thoroughly before important conversations. At [t1], instead of admitting uncertainty upfront, they could have prepared at least three key points about their proposal to share confidently. This preparation would eliminate the need for hedging language and project more authority. \n\nAnother opportunity for improvement is the user's delivery style. At [t2], they could have used stronger, more decisive language. Instead of tentative phrasing, they could have made statements with conviction, even if they were still exploring the idea. This would signal confidence in their thinking process and encourage more productive dialogue.","transcript_refs":["t1"]}
{"type":"insight","label":"Be Specific","impact":"high","after_turn_id":"t1","why":"Vague phrasing hurt clarity.","coach_says":"Lead with a concrete one-sentence proposal, then add two specifics.","you_said":"[USER] I'm proposing a new approach but I'm not fully sure about the details yet.","better_version":"I'd like to pilot the new onboarding script with 10 users next week to reduce drop-off.","evidence_quotes":["[USER] I'm proposing a new approach but I'm not fully sure about the details yet.","[COACH] What would you like to discuss?"],"resources":[{"title":"Problem-Solving Video 1","url":"https://m.youtube.com/watch?v=ehRNriENFic","type":"video","description":"Learn problem-solving techniques"},{"title":"Confidence Building Article 1","url":"https://www.themuse.com/advice/ways-to-build-confidence-at-work","type":"article","description":"Build confidence at work"}]}
{"type":"action","step":"Use a one-sentence pitch","why":"Improves clarity and confidence","practice_prompt":"In one sentence, state the goal, audience, and outcome of your idea."}
{"type":"chart","chart":{"type":"radar","title":"Skills Overview","data":[{"category":"Clarity","value":72},{"category":"Confidence","value":65}]}}
{"type":"final","overall_score":69}
`

    // Build a clearly role-labeled transcript for the model with USER turn IDs (tN)
    let __userTurnCounter = 0
    const labeledTranscript = (transcript?.segments || [])
      .map((s: any) => {
        const role = s.speaker === "user" ? "USER" : "COACH"
        const turnSuffix = role === "USER" ? ` t${++__userTurnCounter}` : ""
        return `[${role}${turnSuffix}] ${s.text}`
      })
      .join("\n")

    const userMessage = `
Task: Generate a real-time evaluation REPORT for the USER only. Do NOT evaluate, critique, or score the AI coach. Stream NDJSON events as specified.

Scenario: ${scenario.name}
Description: ${scenario.description}
Rubric: ${JSON.stringify(scenario.rubric)}

Transcript (role-labeled, chronological):\n${labeledTranscript}

Raw transcript object (reference only): ${JSON.stringify(transcript)}
Metrics (may be sparse): ${JSON.stringify(metrics)}


Instructions:
- Consider ONLY lines prefixed with [USER] as evidence for scoring, insights, actions, and summary.
- Ignore any [COACH] content except as conversational context; never judge the coach.
- Produce multiple score events covering key categories (from rubric if given). If not use these categories, use Clarity, Pace, Confidence, Engagement, Grammar, Vocabulary.
  For each score, include narrative went_well (5-8 sentences telling the story of what went well) and next_time (2-3 detailed story-like improvement suggestions, each 3-5 sentences). Use conversational storytelling language and reference turns by ID only (e.g., [t3], [t5]).
  CRITICAL: Each score MUST include a "transcript_refs" array with the turn IDs that support this score evaluation. This is MANDATORY - never omit transcript_refs from score events. Limit to maximum 3 references per score.
- Add 2-4 insight events. For each insight you MUST:
  - Compute the 1-based index of the USER turn to which the feedback applies and set after_turn_id to the string "t{N}" (count only [USER] lines in order).
  - Provide the fields: why, coach_says, you_said (a single [USER] quote), and an optional better_version.
  - Include impact as one of: high, medium, low.
  - Optionally include evidence_quotes (1-2 items) with labeled quotes; always include one [USER] quote and only include a [COACH] quote if it helps.
  - Add transcript_refs for each insight and score. This is MANDATORY for both types. NEVER create a score or insight event without transcript_refs. Limit to maximum 3 references per event.


- The transcript above includes user turn labels like [USER t1], [USER t2], ... Use the same N when setting after_turn_id (e.g., after_turn_id: "t2").
- For score events: Include transcript_refs with the turn IDs that contain evidence for that score. For example, if scoring "Clarity" based on user turns t1 and t3, include "transcript_refs":["t1","t3"]. Limit to maximum 3 references per score.
- Add 2-4 action events with concrete practice prompts.
- Optionally include up to two chart events summarizing the scores (radar recommended).
- Finish with a final event that includes overall_score.

REMINDER: Every score and insight event MUST include transcript_refs. This is not optional. If you cannot find specific turn references, use the most relevant user turns that support your evaluation. Limit to maximum 3 references per event.
`

    const result = await streamText({
      model: openai("gpt-4.1-mini"),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
    })
    console.log("[report-stream] systemPrompt", systemPrompt)
    console.log("[report-stream] userMessage", userMessage)

    // Transform the text stream into NDJSON events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial event
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "report_start",
              schema_version: "v1",
              title: "Performance Analysis",
            }) + "\n",
          ),
        )

        let buffer = ""

        // Helper: strip markdown code fences that some models add
        const stripFences = (text: string) =>
          text.replace(/```(?:ndjson|json)?/gi, "").replace(/```/g, "")

        // Helper: extract balanced JSON objects from buffer by brace depth
        const extractJsonObjects = (text: string): { objects: string[]; rest: string } => {
          const out: string[] = []
          let depth = 0
          let start = -1
          let inString = false
          let escape = false
          for (let i = 0; i < text.length; i++) {
            const ch = text[i]
            if (inString) {
              if (escape) {
                escape = false
              } else if (ch === "\\") {
                escape = true
              } else if (ch === '"') {
                inString = false
              }
            } else {
              if (ch === '"') {
                inString = true
              } else if (ch === "{") {
                if (depth === 0) start = i
                depth++
              } else if (ch === "}") {
                depth--
                if (depth === 0 && start !== -1) {
                  out.push(text.slice(start, i + 1))
                  start = -1
                }
              }
            }
          }
          const rest = depth > 0 && start !== -1 ? text.slice(start) : ""
          return { objects: out, rest }
        }

        for await (const rawChunk of result.textStream) {
          const chunk = stripFences(rawChunk)
          buffer += chunk

          const { objects, rest } = extractJsonObjects(buffer)
          buffer = rest

          for (const obj of objects) {
            try {
              const event = JSON.parse(obj)
              // Normalize accidental bare chart types (e.g., {"type":"radar",...})
              if (
                typeof event?.type === "string" &&
                ["radar", "bar", "line", "pie"].includes(event.type)
              ) {
                const { type, title, data, xKey, yKey, chart } = event
                const normalized = {
                  type: "chart",
                  chart: chart ?? { type, title, data, xKey, yKey },
                }
                console.log?.("[report-stream] normalize chart", type)
                controller.enqueue(encoder.encode(JSON.stringify(normalized) + "\n"))
                continue
              }

              if (event?.type) {
                controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
              }
            } catch (e) {
              console.log?.("[report-stream] parse error obj", obj.slice(0, 160))
            }
          }
        }

        // Process any remaining balanced JSON in buffer
        if (buffer.trim()) {
          const cleaned = stripFences(buffer)
          const { objects } = extractJsonObjects(cleaned)
          for (const obj of objects) {
            try {
              const event = JSON.parse(obj)
              if (event?.type) {
                console.log?.("[report-stream] tail emit", event.type)
                controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
              }
            } catch (e) {
              console.log?.("[report-stream] tail parse error obj", obj.slice(0, 160))
            }
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in report stream:", error)
    return new Response(JSON.stringify({ error: "Failed to generate report" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

