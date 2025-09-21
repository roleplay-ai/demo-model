import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id

    // End ElevenLabs conversation
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/end`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`)
    }

    return NextResponse.json({ status: "ended" })
  } catch (error) {
    console.error("ElevenLabs conversation end error:", error)
    return NextResponse.json({ error: "Failed to end conversation" }, { status: 500 })
  }
}
