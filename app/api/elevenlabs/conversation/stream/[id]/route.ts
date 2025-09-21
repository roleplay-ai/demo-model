import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id

    // Create a readable stream for real-time conversation events
    const stream = new ReadableStream({
      start(controller) {
        // Connect to ElevenLabs WebSocket or Server-Sent Events
        const eventSource = new EventSource(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/stream`,
          {
            headers: {
              "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
            },
          },
        )

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data)
          controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + "\n"))
        }

        eventSource.onerror = () => {
          controller.close()
        }

        // Cleanup on stream close
        return () => {
          eventSource.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("ElevenLabs stream error:", error)
    return NextResponse.json({ error: "Failed to stream conversation" }, { status: 500 })
  }
}
