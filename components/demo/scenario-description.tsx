"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Clock, Target, CheckCircle, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react"
import type { DemoScenario } from "@/lib/demo-types"
import type { TranscriptSeg, RunMetrics } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface ScenarioDescriptionProps {
  scenario: DemoScenario
  selectedGender: "male" | "female"
  onGenderChange: (gender: "male" | "female") => void
  onStartSession: () => void
  onEndSession: () => void // Added onEndSession prop
  disabled?: boolean
  showSessionControls?: boolean // Added prop to control when to show session controls
  conversation?: any // ElevenLabs conversation object
  transcript?: TranscriptSeg[]
  metrics?: RunMetrics | null
  conversationError?: string | null
}

export function ScenarioDescription({
  scenario,
  selectedGender,
  onGenderChange,
  onStartSession,
  onEndSession, // Added onEndSession
  disabled = false,
  showSessionControls = false, // Added showSessionControls prop
  conversation,
  transcript,
  metrics,
  conversationError,
}: ScenarioDescriptionProps) {
  const agent = scenario.agentConfig[selectedGender]
  const [sessionStarted, setSessionStarted] = useState(showSessionControls) // Initialize based on prop
  const [isMuted, setIsMuted] = useState(false)
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [sessionStatus, setSessionStatus] = useState("Ready to start")

  // Use conversation state for real-time updates
  const isConnected = conversation?.isConnected || false
  const phase = conversation?.phase || "idle"
  const isMutedFromHook = conversation?.isMuted || false

  useEffect(() => {
    if (showSessionControls && !sessionStarted) {
      setSessionStarted(true)
    }
  }, [showSessionControls, sessionStarted])

  // Update session status based on conversation phase
  useEffect(() => {
    if (sessionStarted && conversation) {
      switch (phase) {
        case "connecting":
          setSessionStatus("Connecting...")
          setIsCoachSpeaking(false)
          setIsUserSpeaking(false)
          break
        case "connected":
          setSessionStatus("Connected - Ready to start")
          setIsCoachSpeaking(false)
          setIsUserSpeaking(false)
          break
        case "agent_speaking":
          setSessionStatus("Coach is speaking")
          setIsCoachSpeaking(true)
          setIsUserSpeaking(false)
          break
        case "listening":
          setSessionStatus("Your turn to speak")
          setIsCoachSpeaking(false)
          setIsUserSpeaking(true)
          break
        case "ended":
          setSessionStatus("Session ended")
          setIsCoachSpeaking(false)
          setIsUserSpeaking(false)
          break
        case "error":
          setSessionStatus("Connection error")
          setIsCoachSpeaking(false)
          setIsUserSpeaking(false)
          break
        default:
          setSessionStatus("Ready to start")
          setIsCoachSpeaking(false)
          setIsUserSpeaking(false)
      }
    }
  }, [phase, sessionStarted, conversation])

  const handleStartSession = () => {
    setSessionStarted(true)
    onStartSession()
  }

  const handleEndSession = () => {
    setSessionStarted(false)
    setSessionStatus("Ready to start")
    setIsCoachSpeaking(false)
    setIsUserSpeaking(false)
    onEndSession() // Call the parent's onEndSession
  }

  const getLevelText = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return "Beginner"
      case 2:
        return "Intermediate"
      case 3:
        return "Advanced"
      default:
        return "Beginner"
    }
  }

  const getLevelColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return "text-green-700 bg-green-100 border-green-300"
      case 2:
        return "text-amber-700 bg-amber-100 border-amber-300"
      case 3:
        return "text-red-700 bg-red-100 border-red-300"
      default:
        return "text-green-700 bg-green-100 border-green-300"
    }
  }

  return (
    <div className="p-2 sm:p-3 pb-0 bg-background">
      <div className="mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-balance text-foreground">{scenario.name}</h1>
          <Badge className={cn("text-xs font-medium border w-fit", getLevelColor(scenario.difficulty))}>
            {getLevelText(scenario.difficulty)}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground text-pretty mb-2">{scenario.description}</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {scenario.estimatedDuration} minutes
          </div>
          <div className="flex flex-wrap gap-1">
            {scenario.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Left Column: What You Practice + Your AI Coach */}
        <div className="space-y-2 sm:space-y-3">
          <Card className="p-2 sm:p-3 bg-card shadow-sm border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">What You'll Practice</h2>
            </div>
            <p className="text-xs text-muted-foreground text-pretty mb-2">{scenario.detailedDescription}</p>
            <div className="space-y-1">
              <h3 className="font-medium text-xs">Key Skills:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {scenario.rubric.categories.map((category) => (
                  <div key={category.name} className="flex items-center gap-1 text-xs">
                    <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="truncate">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-2 sm:p-3 bg-card shadow-sm border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarImage src={agent.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">
                  {agent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">Your AI Coach</h2>
                <p className="text-xs text-muted-foreground truncate">{agent.name}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-pretty mb-2">
              {agent.name} will guide you through this practice session, providing realistic scenarios and constructive
              feedback to help you improve your skills.
            </p>
            <div className="bg-secondary/30 rounded-lg p-2 border border-secondary/20">
              <h3 className="font-medium text-xs mb-1">What to Expect:</h3>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Interactive voice conversation</li>
                <li>• Real-time feedback and guidance</li>
                <li>• Detailed performance analysis</li>
                <li>• Personalized improvement suggestions</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Right Column: Ready to Start / Session Controls */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card
            className={cn(
              "p-3 sm:p-4 transition-all duration-300 shadow-sm",
              sessionStarted ? "bg-secondary/20 border-secondary/40" : "bg-secondary/10 border-secondary/30",
            )}
          >
            <div className="text-center">
              <h3 className="font-semibold mb-1 text-sm sm:text-base">
                {sessionStarted ? "Session Active" : "Ready to Start?"}
              </h3>
              <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
                {sessionStarted ? `Status: ${sessionStatus}` : "Choose your AI coach and begin your practice session."}
              </p>

              {/* Error Display */}
              {conversationError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{conversationError}</p>
                </div>
              )}

              {!sessionStarted && (
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-xs font-medium mb-2 sm:mb-3">Choose Your Coach</h4>
                  <div className="flex gap-2 max-w-sm mx-auto">
                    <button
                      onClick={() => onGenderChange("female")}
                      disabled={disabled}
                      className={cn(
                        "flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 flex-1 bg-card min-w-0 shadow-sm",
                        selectedGender === "female"
                          ? "border-primary shadow-md shadow-primary/20 bg-primary/5"
                          : "border-border hover:border-primary/50 hover:shadow-sm",
                        disabled && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Avatar className="h-8 sm:h-10 w-8 sm:w-10 flex-shrink-0">
                        <AvatarImage src={scenario.agentConfig.female.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {scenario.agentConfig.female.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-center text-foreground truncate w-full">
                        {scenario.agentConfig.female.name}
                      </span>
                    </button>
                    <button
                      onClick={() => onGenderChange("male")}
                      disabled={disabled}
                      className={cn(
                        "flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 flex-1 bg-card min-w-0 shadow-sm",
                        selectedGender === "male"
                          ? "border-primary shadow-md shadow-primary/20 bg-primary/5"
                          : "border-border hover:border-primary/50 hover:shadow-sm",
                        disabled && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Avatar className="h-8 sm:h-10 w-8 sm:w-10 flex-shrink-0">
                        <AvatarImage src={scenario.agentConfig.male.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {scenario.agentConfig.male.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-center text-foreground truncate w-full">
                        {scenario.agentConfig.male.name}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {sessionStarted && (
                <div className="mb-3 sm:mb-4">
                  <div className="flex justify-center gap-2 max-w-sm mx-auto mb-3 sm:mb-4">
                    {/* Coach Card */}
                    <div
                      className={cn(
                        "flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all duration-300 flex-1 min-w-0 shadow-sm",
                        isCoachSpeaking
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                          : "border-border bg-card",
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 sm:h-12 w-10 sm:w-12">
                          <AvatarImage src={agent.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {agent.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {isCoachSpeaking && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Volume2 className="w-2 h-2 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="text-center min-w-0 w-full">
                        <span className="text-xs font-medium block truncate">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {isCoachSpeaking ? "Speaking..." : "Coach"}
                        </span>
                      </div>
                    </div>

                    {/* User Card */}
                    <div
                      className={cn(
                        "flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 transition-all duration-300 flex-1 min-w-0 shadow-sm",
                        isUserSpeaking
                          ? "border-green-500 bg-green-50 shadow-md shadow-green-500/20"
                          : "border-border bg-card",
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 sm:h-12 w-10 sm:w-12">
                          <AvatarFallback className="text-xs bg-muted">You</AvatarFallback>
                        </Avatar>
                        {isUserSpeaking && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Mic className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-center min-w-0 w-full">
                        <span className="text-xs font-medium block">You</span>
                        <span className="text-xs text-muted-foreground">{isUserSpeaking ? "Speaking..." : "User"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Session Controls */}
                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={() => {
                        if (conversation?.toggleMute) {
                          conversation.toggleMute()
                        } else {
                          setIsMuted(!isMuted)
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        (isMutedFromHook || isMuted) && "bg-red-50 border-red-200 text-red-600",
                      )}
                    >
                      {(isMutedFromHook || isMuted) ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      {(isMutedFromHook || isMuted) ? "Unmute" : "Mute"}
                    </Button>
                    <Button
                      onClick={handleEndSession}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 text-xs"
                    >
                      <PhoneOff className="w-3 h-3" />
                      End Session
                    </Button>
                  </div>
                </div>
              )}

              {!sessionStarted && (
                <Button
                  onClick={handleStartSession}
                  disabled={disabled}
                  className="font-semibold mb-2 sm:mb-3 w-full text-xs sm:text-sm"
                  size="lg"
                >
                  {disabled ? "Session in Progress..." : "Start Coaching Session"}
                </Button>
              )}

              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    sessionStarted ? "bg-primary" : "bg-green-500",
                  )}
                ></div>
                <span className="text-center">
                  {sessionStarted ? "Session active" : "Free demo session • No account required"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
