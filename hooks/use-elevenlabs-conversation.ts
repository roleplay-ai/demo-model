"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useConversation } from "@elevenlabs/react"
import type { TranscriptSeg } from "@/lib/types"

export type ConversationPhase =
  | "idle"
  | "connecting"
  | "connected"
  | "agent_speaking"
  | "listening"
  | "ended"
  | "error"

export type RunMetrics = {
  duration_sec: number
  wpm_avg: number
  fillers: number
  silence_pct: number
  interruptions: number
  latency_avg_ms: number
}

interface UseElevenLabsConversationProps {
  agentId: string
  voiceId?: string | null
  dynamicVariables?: Record<string, any>
  onTranscriptUpdate: (segments: TranscriptSeg[]) => void
  onMetricsUpdate: (metrics: RunMetrics) => void
  onError: (error: string) => void
}

export function useElevenLabsConversation({
  agentId,
  voiceId,
  dynamicVariables,
  onTranscriptUpdate,
  onMetricsUpdate,
  onError,
}: UseElevenLabsConversationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const isConnectedRef = useRef(false)
  useEffect(() => {
    isConnectedRef.current = isConnected
  }, [isConnected])
  const [phase, setPhase] = useState<ConversationPhase>("idle")
  const phaseRef = useRef<ConversationPhase>("idle")
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const transcriptSegments = useRef<TranscriptSeg[]>([])
  const startTime = useRef<number | null>(null)
  const wordCount = useRef(0)
  const fillerCount = useRef(0)
  const totalSilence = useRef(0)
  const latencyMeasurements = useRef<number[]>([])
  const agentSpeakDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Add audio context initialization
  useEffect(() => {
    const initAudioContext = () => {
      if (!(window as any).audioContext) {
        (window as any).audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        console.log("[v1.06] Audio context initialized")
      }
    }

    const handleUserInteraction = () => {
      initAudioContext()
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
  }, [])



  const conversation = useConversation({
    ...(voiceId && {
      overrides: {
        tts: {
          voiceId: voiceId || "21m00Tcm4TlvDq8ikWAM",
        },
      },
    }),
    onDebug: (message: any) => {
      // Only log critical debug messages
      if (message?.type === 'error' || message?.error) {
        console.error("[v1.06] ElevenLabs Error:", message)
      }
    },
    onConnect: () => {
      console.log("[v1.06] ElevenLabs connected")
      setIsConnected(true)
      isConnectedRef.current = true
      startTime.current = Date.now()
      setPhase("connected")
    },
    onDisconnect: () => {
      console.log("[v1.06] ElevenLabs disconnected")
      setIsConnected(false)
      isConnectedRef.current = false
      if (phaseRef.current !== "ended") setPhase("idle")
    },
    onError: (error: any) => {
      console.error("[v1.06] ElevenLabs error:", error)
      onError((error as any).message || "Connection error")
      setIsConnected(false)
      setPhase("error")
    },
    onMessage: (message: any) => {
      const timestamp = Date.now()

      if (!message || typeof message !== "object") return

      const messageSource = (message as any).source
      const messageContent =
        (message as any).message || (message as any).content || (message as any).text || ""

      if (messageSource === "user") {
        handleUserTranscript(messageContent, timestamp)
        return
      }
      if (messageSource === "ai") {
        handleFinalAgentResponse(messageContent, timestamp)
        return
      }

      const messageType = (message as any).type || (message as any).message_type || (message as any).event_type
      switch (messageType) {
        case "user_transcript":
        case "user_transcription":
          handleUserTranscript(messageContent, timestamp)
          break
        case "internal_tentative_agent_response":
        case "agent_response_tentative":
          handleTentativeAgentResponse(messageContent, timestamp)
          break
        case "agent_response":
        case "agent_response_final":
          handleFinalAgentResponse(messageContent, timestamp)
          break
        case "interruption":
          updateMetrics()
          break
        default:
          // ignore
          break
      }
    },
  })

  // Pull reactive flags from the SDK if available
  const { status: sdkStatus, isSpeaking } = (conversation as unknown) as {
    status?: "connected" | "disconnected"
    isSpeaking?: boolean
  }

  // Remove the isSpeaking logging
  useEffect(() => {
    if (typeof isSpeaking === "undefined") return

    if (isSpeaking) {
      setPhase("agent_speaking")
    } else {
      if (isConnectedRef.current && phaseRef.current !== "listening") {
        setPhase("listening")
      }
    }
  }, [isSpeaking])

  const handleUserTranscript = (message: any, timestamp: number) => {
    const text =
      typeof message === "string"
        ? message
        : message?.user_transcript || message?.transcript || message?.text || message || ""
    const isFinal = typeof message === "object" ? message.final !== false : true

    if (!text || typeof text !== "string") return

    const segment: TranscriptSeg = {
      t: timestamp,
      speaker: "user",
      text: text.trim(),
      final: isFinal,
    }

    transcriptSegments.current.push(segment)
    onTranscriptUpdate([...transcriptSegments.current])

    setPhase("listening")

    if (isFinal) {
      updateMetricsFromUserSpeech(segment.text)
    }
  }

  const handleTentativeAgentResponse = (message: any, timestamp: number) => {
    const text = message?.agent_response || message?.response || message?.text || message || ""
    if (!text || typeof text !== "string") return

    const existingIndex = transcriptSegments.current.findIndex((seg) => seg.speaker === "ai" && !seg.final)
    const segment: TranscriptSeg = { t: timestamp, speaker: "ai", text: text.trim(), final: false }

    if (existingIndex >= 0) transcriptSegments.current[existingIndex] = segment
    else transcriptSegments.current.push(segment)

    onTranscriptUpdate([...transcriptSegments.current])

    setPhase("agent_speaking")

    const hasIsSpeaking = (conversation as any)?.isSpeaking !== undefined
    if (!hasIsSpeaking) {
      if (agentSpeakDebounce.current) clearTimeout(agentSpeakDebounce.current)
      agentSpeakDebounce.current = setTimeout(() => {
        if (phaseRef.current === "agent_speaking") {
          setPhase(isConnectedRef.current ? "listening" : "idle")
        }
      }, 800)
    }
  }

  const handleFinalAgentResponse = (message: any, timestamp: number) => {
    const text = typeof message === "string" ? message : message?.agent_response || message?.response || message?.text || message || ""
    if (!text || typeof text !== "string") return

    const tentativeIndex = transcriptSegments.current.findIndex((seg) => seg.speaker === "ai" && !seg.final)
    const segment: TranscriptSeg = { t: timestamp, speaker: "ai", text: text.trim(), final: true }

    if (tentativeIndex >= 0) transcriptSegments.current[tentativeIndex] = segment
    else transcriptSegments.current.push(segment)

    onTranscriptUpdate([...transcriptSegments.current])

    const lastUser = [...transcriptSegments.current].reverse().find((seg) => seg.speaker === "user" && seg.final)
    if (lastUser) latencyMeasurements.current.push(timestamp - lastUser.t)

    updateMetrics()

    setPhase("agent_speaking")

    const hasIsSpeaking = (conversation as any)?.isSpeaking !== undefined
    if (!hasIsSpeaking) {
      if (agentSpeakDebounce.current) clearTimeout(agentSpeakDebounce.current)
      agentSpeakDebounce.current = setTimeout(() => {
        if (phaseRef.current === "agent_speaking") {
          setPhase(isConnectedRef.current ? "listening" : "idle")
        }
      }, 800)
    }
  }

  const updateMetricsFromUserSpeech = (text: string) => {
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0)
    wordCount.current += words.length

    const fillerWords = ["um", "uh", "like", "you know", "so", "well", "actually"]
    const fillers = words.filter((w) => fillerWords.includes(w.toLowerCase().replace(/[.,!?]/g, "")))
    fillerCount.current += fillers.length

    updateMetrics()
  }

  const updateMetrics = () => {
    if (!startTime.current) return

    const now = Date.now()
    const durationSec = Math.floor((now - startTime.current) / 1000)
    const durationMin = durationSec / 60

    const wpmAvg = durationMin > 0 ? Math.round(wordCount.current / durationMin) : 0
    const avgLatency =
      latencyMeasurements.current.length > 0
        ? Math.round(latencyMeasurements.current.reduce((a, b) => a + b, 0) / latencyMeasurements.current.length)
        : 0

    const silencePct = Math.min((totalSilence.current / (durationSec * 1000)) * 100, 100)

    const metrics: RunMetrics = {
      duration_sec: durationSec,
      wpm_avg: wpmAvg,
      fillers: fillerCount.current,
      silence_pct: silencePct,
      interruptions: 0,
      latency_avg_ms: avgLatency,
    }

    onMetricsUpdate(metrics)
  }

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setHasPermission(true)
      return true
    } catch (e) {
      console.error("Microphone permission denied:", e)
      onError("Microphone permission is required for voice conversations")
      setHasPermission(false)
      return false
    }
  }

  // Remove the testAudioOutput function since it's not needed in production

  const startSession = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestMicrophonePermission()
      if (!granted) return false
    }

    const checkAudioAutoplay = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        await audioContext.resume()
        return true
      } catch (error) {
        console.error("[v1.06] Audio autoplay blocked:", error)
        onError("Please enable audio autoplay in your browser settings")
        return false
      }
    }
    const audioReady = await checkAudioAutoplay()
    if (!audioReady) return false

    try {
      transcriptSegments.current = []
      startTime.current = null
      wordCount.current = 0
      fillerCount.current = 0
      totalSilence.current = 0
      latencyMeasurements.current = []

      const sessionConfig: any = {
        agentId,
        connectionType: "webrtc",
        dynamicVariables: {
          user_name: "Sarah",
          ai_name: "Michael",
          tone: "Professional and engaging, maintaining a warm and conversational tone. They focus on clear communication and building rapport, acting as a knowledgeable conversational partner who listens actively and responds thoughtfully.",

          ...(dynamicVariables || {})
        }
      }

      setPhase("connecting")
      await conversation.startSession(sessionConfig)
      setPhase("listening")
      return true
    } catch (error) {
      console.error("Failed to start ElevenLabs session:", error)
      onError("Failed to start voice conversation")
      setPhase("error")
      return false
    }
  }, [agentId, hasPermission, conversation, dynamicVariables])

  const endSession = useCallback(async () => {
    try {
      await conversation.endSession()
      updateMetrics()
      setPhase("ended")

      return {
        transcript: [...transcriptSegments.current],
        finalMetrics: {
          duration_sec: startTime.current ? Math.floor((Date.now() - startTime.current) / 1000) : 0,
          wpm_avg: wordCount.current,
          fillers: fillerCount.current,
          silence_pct: 0,
          interruptions: 0,
          latency_avg_ms:
            latencyMeasurements.current.length > 0
              ? Math.round(latencyMeasurements.current.reduce((a, b) => a + b, 0) / latencyMeasurements.current.length)
              : 0,
        } as RunMetrics,
      }
    } catch (error) {
      console.error("Failed to end ElevenLabs session:", error)
      onError("Failed to end voice conversation")
      setPhase("error")
      return null
    }
  }, [conversation])

  const toggleMute = useCallback(() => {
    if (!isConnected) return
    const newMuted = !isMuted
    setIsMuted(newMuted)
    // TODO: hook into SDK mute when available
    console.log(newMuted ? "Muted" : "Unmuted")
  }, [isConnected, isMuted])

  return {
    isConnected,
    isMuted,
    hasPermission,
    phase,
    startSession,
    endSession,
    toggleMute,
    requestMicrophonePermission,
  }
}
