import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { agent_id, voice_id, scenario_context } = await request.json()

    // ElevenLabs Conversational AI initialization
    const response = await fetch("https://api.elevenlabs.io/v1/convai/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
      body: JSON.stringify({
        agent_id,
        voice_id,
        context: {
          scenario: scenario_context.name,
          description: scenario_context.description,
          instructions: `You are a professional coach helping the user practice ${scenario_context.name}. ${scenario_context.description}`,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      conversation_id: data.conversation_id,
      status: "initialized",
    })
  } catch (error) {
    console.error("ElevenLabs conversation start error:", error)
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 })
  }
}
