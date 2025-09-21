"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/demo/header"
import { ScenarioSidebar } from "@/components/demo/scenario-sidebar"
import { MainContent } from "@/components/demo/main-content"
import { LeadCaptureModal } from "@/components/demo/lead-capture-modal"
import { useElevenLabsConversation } from "@/hooks/use-elevenlabs-conversation"
import type { DemoScenario, SessionData, LeadData } from "@/lib/demo-types"
import type { TranscriptSeg, RunMetrics } from "@/lib/types"
import { getDemoScenarios } from "@/lib/demo-data"
import { ELEVENLABS_CONFIG } from "@/lib/elevenlabs-config"

type ViewState = "description" | "report"

export default function DemoPage() {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null)
  const [selectedGender, setSelectedGender] = useState<"male" | "female">("female")
  const [currentView, setCurrentView] = useState<ViewState>("description")
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [leadData, setLeadData] = useState<LeadData | null>(null)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSessionControls, setShowSessionControls] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Conversation state
  const [transcript, setTranscript] = useState<TranscriptSeg[]>([])
  const [metrics, setMetrics] = useState<RunMetrics | null>(null)
  const [conversationError, setConversationError] = useState<string | null>(null)

  // Initialize ElevenLabs conversation hook
  const conversation = useElevenLabsConversation({
    agentId: ELEVENLABS_CONFIG.AGENT_ID,
    voiceId: ELEVENLABS_CONFIG.VOICES[selectedGender] || ELEVENLABS_CONFIG.DEFAULT_VOICE,
    onTranscriptUpdate: (segments: TranscriptSeg[]) => {
      setTranscript(segments)
    },
    onMetricsUpdate: (newMetrics: RunMetrics) => {
      setMetrics(newMetrics)
    },
    onError: (error: string) => {
      setConversationError(error)
      console.error("Conversation error:", error)
    },
  })

  // Load demo scenarios on mount
  useEffect(() => {
    const demoScenarios = getDemoScenarios()
    setScenarios(demoScenarios)
    // Auto-select first scenario
    if (demoScenarios.length > 0) {
      setSelectedScenario(demoScenarios[0])
    }
  }, [])

  useEffect(() => {
    if (currentView === "report") {
      setSidebarCollapsed(true)
    }
  }, [currentView])

  const handleStartSession = () => {
    setShowLeadCapture(true)
  }

  const handleLeadSubmit = async (data: LeadData) => {
    setLeadData(data)
    setShowLeadCapture(false)
    setShowSessionControls(true) // Show session controls in the description view
    setSidebarOpen(false) // Close sidebar on mobile when starting session

    // Start the conversation session
    try {
      const success = await conversation.startSession()
      if (!success) {
        setConversationError("Failed to start conversation session")
        setShowSessionControls(false)
      }
    } catch (error) {
      console.error("Error starting session:", error)
      setConversationError("Failed to start conversation session")
      setShowSessionControls(false)
    }
  }

  const handleSkipLead = async () => {
    setShowLeadCapture(false)
    setShowSessionControls(true) // Show session controls in the description view
    setSidebarOpen(false) // Close sidebar on mobile when starting session

    // Start the conversation session
    try {
      const success = await conversation.startSession()
      if (!success) {
        setConversationError("Failed to start conversation session")
        setShowSessionControls(false)
      }
    } catch (error) {
      console.error("Error starting session:", error)
      setConversationError("Failed to start conversation session")
      setShowSessionControls(false)
    }
  }

  const handleEndSession = async () => {
    try {
      // End the conversation session and get final data
      const sessionResult = await conversation.endSession()

      if (selectedScenario && sessionResult) {
        // Convert transcript format for the report
        const convertedTranscript = sessionResult.transcript.map((seg, index) => ({
          id: `segment-${index}`,
          speaker: seg.speaker === "ai" ? "agent" : "user",
          text: seg.text,
          timestamp: seg.t,
          confidence: 0.95, // Default confidence
        }))

        const sessionData: SessionData = {
          scenario: selectedScenario,
          gender: selectedGender,
          duration: sessionResult.finalMetrics.duration_sec,
          transcript: convertedTranscript,
          overallScore: Math.floor(Math.random() * 20) + 75, // Score between 75-95
          categoryScores: selectedScenario.rubric.categories.map((category) => ({
            category: category.name,
            score: Math.floor(Math.random() * 3) + 3, // Score between 3-5
            feedback: `Good performance in ${category.name.toLowerCase()}.`,
          })),
          improvements: [
            "Could provide more detailed responses to behavioral questions",
            "Consider using the STAR method more consistently",
            "Work on reducing filler words during responses",
          ],
          strengths: [
            "Clear and confident communication style",
            "Good use of specific examples to support points",
            "Professional demeanor throughout the conversation",
          ],
        }
        setSessionData(sessionData)
      }
    } catch (error) {
      console.error("Error ending session:", error)
      setConversationError("Failed to end conversation session")
    }

    setShowSessionControls(false)
    setCurrentView("report")
  }

  const handleSessionComplete = (data: SessionData) => {
    setSessionData(data)
    setCurrentView("report")
  }

  const handleNewSession = () => {
    setCurrentView("description")
    setSessionData(null)
    setShowSessionControls(false) // Reset session controls
    setSidebarOpen(true) // Open sidebar to select new scenario
    setSidebarCollapsed(false)
  }

  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedScenario(scenario)
    setSidebarOpen(false) // Close sidebar on mobile after selection
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 relative overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto h-full
            transform transition-transform duration-300 ease-in-out lg:transform-none
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <ScenarioSidebar
            scenarios={scenarios}
            selectedScenario={selectedScenario}
            selectedGender={selectedGender}
            onScenarioSelect={handleScenarioSelect}
            disabled={showSessionControls}
            onClose={() => setSidebarOpen(false)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main content */}
        <MainContent
          currentView={currentView}
          selectedScenario={selectedScenario}
          selectedGender={selectedGender}
          sessionData={sessionData}
          onNewSession={handleNewSession}
          onSessionComplete={handleSessionComplete}
          onGenderChange={setSelectedGender}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          disabled={showSessionControls}
          showSessionControls={showSessionControls}
          conversation={conversation}
          transcript={transcript}
          metrics={metrics}
          conversationError={conversationError}
        />
      </div>

      <LeadCaptureModal
        open={showLeadCapture}
        onSubmit={handleLeadSubmit}
        onSkip={handleSkipLead}
        onClose={() => setShowLeadCapture(false)}
      />
    </div>
  )
}
