import { ScenarioDescription } from "./scenario-description"
import { PerformanceReport } from "./performance-report"
import { Mic } from "lucide-react"
import type { DemoScenario, SessionData } from "@/lib/demo-types"
import type { TranscriptSeg, RunMetrics } from "@/lib/types"

interface MainContentProps {
  currentView: "description" | "report" // Removed "conversation" from the union type
  selectedScenario: DemoScenario | null
  selectedGender: "male" | "female"
  sessionData: SessionData | null
  onNewSession: () => void
  onSessionComplete: (data: SessionData) => void
  onGenderChange: (gender: "male" | "female") => void
  onStartSession: () => void
  onEndSession: () => void // Added onEndSession prop
  disabled?: boolean
  showSessionControls?: boolean // Added showSessionControls prop
  conversation?: any // ElevenLabs conversation object
  transcript?: TranscriptSeg[]
  metrics?: RunMetrics | null
  conversationError?: string | null
}

export function MainContent({
  currentView,
  selectedScenario,
  selectedGender,
  sessionData,
  onNewSession,
  onSessionComplete,
  onGenderChange,
  onStartSession,
  onEndSession, // Added onEndSession
  disabled = false,
  showSessionControls = false, // Added showSessionControls
  conversation,
  transcript,
  metrics,
  conversationError,
}: MainContentProps) {
  if (!selectedScenario) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Mic className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-balance">Select a scenario to get started</h3>
          <p className="text-muted-foreground text-pretty">
            Choose from the practice scenarios in the sidebar to begin your AI coaching session
          </p>
          <div className="mt-6 lg:hidden">
            <p className="text-sm text-muted-foreground">Tap the menu button to view scenarios</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full flex flex-col">
      {currentView === "description" && (
        <ScenarioDescription
          scenario={selectedScenario}
          selectedGender={selectedGender}
          onGenderChange={onGenderChange}
          onStartSession={onStartSession}
          onEndSession={onEndSession}
          disabled={disabled}
          showSessionControls={showSessionControls}
          conversation={conversation}
          transcript={transcript}
          metrics={metrics}
          conversationError={conversationError}
        />
      )}

      {currentView === "report" && sessionData && (
        <PerformanceReport sessionData={sessionData} onNewSession={onNewSession} />
      )}
    </div>
  )
}
