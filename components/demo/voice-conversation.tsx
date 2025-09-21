"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Square, Volume2, VolumeX } from "lucide-react"
import type { DemoScenario, SessionData, TranscriptSegment } from "@/lib/demo-types"
import { generateMockTranscript, generateMockReport } from "@/lib/demo-data"
import { cn } from "@/lib/utils"

interface VoiceConversationProps {
  scenario: DemoScenario
  selectedGender: "male" | "female"
  onComplete: (data: SessionData) => void
}

type ConversationPhase = "starting" | "listening" | "speaking" | "thinking" | "ended"

export function VoiceConversation({ scenario, selectedGender, onComplete }: VoiceConversationProps) {
  const [phase, setPhase] = useState<ConversationPhase>("starting")
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [sessionStartTime] = useState(Date.now())
  const [currentTime, setCurrentTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const agent = scenario.agentConfig[selectedGender]

  // Simulate conversation flow
  useEffect(() => {
    if (phase === "starting") {
      const timer = setTimeout(() => {
        setPhase("speaking")
        // Add initial agent message
        const initialMessage: TranscriptSegment = {
          id: "1",
          speaker: "agent",
          text: `Hello! I'm ${agent.name}. I'm excited to help you practice your ${scenario.name.toLowerCase()} skills today. Are you ready to begin?`,
          timestamp: Date.now() - sessionStartTime,
          confidence: 0.95,
        }
        setTranscript([initialMessage])

        // After agent speaks, wait for user
        setTimeout(() => {
          setPhase("listening")
          setIsRecording(true)
        }, 3000)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [phase, agent.name, scenario.name, sessionStartTime])

  // Timer for session duration
  useEffect(() => {
    if (phase !== "ended") {
      intervalRef.current = setInterval(() => {
        setCurrentTime(Date.now() - sessionStartTime)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [phase, sessionStartTime])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript])

  const handleMicToggle = () => {
    if (phase === "listening") {
      setIsRecording(!isRecording)
      if (isRecording) {
        // Simulate user finishing speaking
        setTimeout(() => {
          simulateUserResponse()
        }, 500)
      }
    }
  }

  const simulateUserResponse = () => {
    setPhase("thinking")

    // Add user response after a delay
    setTimeout(() => {
      const userResponse: TranscriptSegment = {
        id: `user-${transcript.length + 1}`,
        speaker: "user",
        text: getSimulatedUserResponse(scenario.id, transcript.length),
        timestamp: Date.now() - sessionStartTime,
        confidence: 0.89,
      }

      setTranscript((prev) => [...prev, userResponse])

      // Agent responds
      setTimeout(() => {
        setPhase("speaking")
        const agentResponse: TranscriptSegment = {
          id: `agent-${transcript.length + 2}`,
          speaker: "agent",
          text: getSimulatedAgentResponse(scenario.id, transcript.length),
          timestamp: Date.now() - sessionStartTime,
          confidence: 0.96,
        }

        setTranscript((prev) => [...prev, agentResponse])

        // Continue conversation or end
        setTimeout(() => {
          if (transcript.length >= 6) {
            handleEndSession()
          } else {
            setPhase("listening")
            setIsRecording(true)
          }
        }, 2000)
      }, 1000)
    }, 1500)
  }

  const handleEndSession = () => {
    setPhase("ended")
    setIsRecording(false)

    // Generate session data
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000)
    const mockReport = generateMockReport(scenario, duration)
    const mockTranscript = generateMockTranscript(scenario, duration)

    const sessionData: SessionData = {
      scenario,
      gender: selectedGender,
      transcript: [...transcript, ...mockTranscript.slice(transcript.length)],
      duration,
      ...mockReport,
    }

    setTimeout(() => {
      onComplete(sessionData)
    }, 1000)
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getPhaseStatus = () => {
    switch (phase) {
      case "starting":
        return { text: "Initializing session...", color: "text-muted-foreground" }
      case "listening":
        return { text: "Listening to you", color: "text-green-600" }
      case "speaking":
        return { text: `${agent.name} is speaking`, color: "text-primary" }
      case "thinking":
        return { text: "Processing your response...", color: "text-amber-600" }
      case "ended":
        return { text: "Session completed", color: "text-muted-foreground" }
      default:
        return { text: "Ready", color: "text-muted-foreground" }
    }
  }

  const status = getPhaseStatus()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={agent.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {agent.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{scenario.name}</h2>
              <p className="text-sm text-muted-foreground">with {agent.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">{formatTime(currentTime)}</div>
              <div className={cn("text-xs", status.color)}>{status.text}</div>
            </div>
            <Badge variant={phase === "ended" ? "secondary" : "default"}>
              {phase === "ended" ? "Completed" : "Live"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {transcript.map((segment) => (
            <div
              key={segment.id}
              className={cn("flex gap-3", segment.speaker === "user" ? "justify-end" : "justify-start")}
            >
              {segment.speaker === "agent" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={agent.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {agent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              )}
              <Card
                className={cn(
                  "max-w-[70%] p-4",
                  segment.speaker === "user" ? "bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                <p className="text-sm text-pretty">{segment.text}</p>
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{segment.speaker === "user" ? "You" : agent.name}</span>
                  <span>{formatTime(segment.timestamp)}</span>
                </div>
              </Card>
              {segment.speaker === "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {phase === "thinking" && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                </div>
                <span>Processing your response...</span>
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
          {phase !== "ended" ? (
            <>
              <Button variant="outline" size="icon" onClick={() => setIsMuted(!isMuted)} className="h-12 w-12">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <Button
                onClick={handleMicToggle}
                disabled={phase === "speaking" || phase === "thinking"}
                className={cn(
                  "h-16 w-16 rounded-full transition-all duration-200",
                  isRecording && phase === "listening"
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-primary hover:bg-primary/90",
                )}
              >
                {isRecording && phase === "listening" ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              <Button variant="outline" onClick={handleEndSession} className="h-12 px-6 bg-transparent">
                <Square className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Session completed! Generating your performance report...
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions for simulated responses
function getSimulatedUserResponse(scenarioId: string, responseIndex: number): string {
  const responses: Record<string, string[]> = {
    "job-interview": [
      "Yes, I'm ready. Thank you for this opportunity to practice.",
      "Absolutely. In my previous role as a project manager, we faced a critical deadline when our main developer left unexpectedly. I quickly assessed our resources, redistributed tasks among the team, and brought in a freelance developer. We delivered the project on time and actually improved our process documentation.",
      "I think my biggest strength is my ability to adapt quickly to new situations and find creative solutions under pressure.",
    ],
    "sales-pitch": [
      "Yes, I'm excited to share our product with you today.",
      "Thank you for your interest! Our product stands out because it combines AI-powered analytics with an intuitive user interface. Unlike competitors who focus on just data collection, we provide actionable insights that help businesses make decisions 40% faster.",
      "I understand that concern. Let me show you how our ROI calculator demonstrates the value within the first quarter of implementation.",
    ],
    "presentation-skills": [
      "Yes, I'm ready to present my topic.",
      "Good morning everyone. Today I want to share how small changes in our daily communication can lead to extraordinary results. Imagine if every conversation you had could build stronger relationships and drive better outcomes.",
      "Thank you for that question. That's exactly the kind of challenge we can address with the framework I'm presenting today.",
    ],
    "customer-service": [
      "Yes, I'm here to help you with any concerns you may have.",
      "I completely understand your frustration, and I sincerely apologize for the inconvenience with your order. Let me look into this right away and find the best solution for you. Can you please provide me with your order number?",
      "I've found the issue with your order and I'm going to personally ensure this gets resolved today. Here's what I'm going to do for you...",
    ],
  }

  const scenarioResponses = responses[scenarioId] || responses["job-interview"]
  return scenarioResponses[responseIndex % scenarioResponses.length]
}

function getSimulatedAgentResponse(scenarioId: string, responseIndex: number): string {
  const responses: Record<string, string[]> = {
    "job-interview": [
      "Great! Let's start with a common question: Can you tell me about a time when you faced a significant challenge at work and how you overcame it?",
      "That's an excellent example of leadership under pressure. I like how you took initiative and found a creative solution. Can you tell me what you learned from that experience?",
      "That's a valuable insight. Now, let's talk about areas for growth. What would you say is one skill you'd like to develop further?",
    ],
    "sales-pitch": [
      "Perfect! I'm interested in learning more about your product. Can you walk me through what makes it unique in the market?",
      "That sounds impressive. However, I'm concerned about the implementation time and cost. How do you address those concerns with your clients?",
      "I appreciate the transparency. Before we move forward, I'd like to understand your support structure. What happens if we run into issues during implementation?",
    ],
    "presentation-skills": [
      "Excellent! I'd like you to present your topic as if I'm your target audience. Please begin with your opening statement.",
      "That's a compelling opening! I can see you've thought about your audience. Now, can you dive deeper into your main points? I have a question about implementation.",
      "Great job addressing that question directly. As we wrap up, what would you say is the key takeaway you want your audience to remember?",
    ],
    "customer-service": [
      "Thank you. I'm calling because I'm having an issue with my recent order and I'm quite frustrated about it. Can you help me?",
      "Well, I ordered this item two weeks ago and it still hasn't arrived. I've been tracking it and it seems to be stuck somewhere. This is really inconvenient for me.",
      "Thank you for taking ownership of this issue. I appreciate that you're being proactive. What's the timeline for resolution?",
    ],
  }

  const scenarioResponses = responses[scenarioId] || responses["job-interview"]
  return scenarioResponses[responseIndex % scenarioResponses.length]
}
