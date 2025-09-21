"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowRight,
  MessageSquare,
  BarChart3,
  Lightbulb,
  BookOpen,
  ExternalLink,
  Play,
  FileText,
  GraduationCap,
} from "lucide-react"
import type { SessionData } from "@/lib/demo-types"
import { cn } from "@/lib/utils"

interface PerformanceReportProps {
  sessionData: SessionData
  onNewSession: () => void
}

const mockFeedbackData = {
  performanceScores: [
    {
      name: "Empathy",
      score: 3,
      maxScore: 5,
      chatReferences: ["t2", "t4", "t6"],
      description:
        "The user acknowledged the employee's feelings and recognized the hardship but did not label emotions explicitly or validate the experience fully.",
      details: {
        whatWentWell:
          "The user acknowledged the difficulty and tried to recognize the employee's dedication, e.g., mentioning compensation and the harsh reality.",
        whatToDoDifferently:
          "Next time, explicitly label the employee's feelings, validate their experience more deeply, and soften the delivery to build trust and rapport.",
        transcriptReferences: "t2, t4, t6",
      },
    },
    {
      name: "Open-Ended Questions",
      score: 1,
      maxScore: 5,
      chatReferences: ["t8", "t10"],
      description: "The user did not ask any open-ended questions to explore the employee's feelings or concerns.",
      details: {
        whatWentWell: "The user delivered the news clearly and directly.",
        whatToDoDifferently:
          "Ask open-ended questions like 'How are you feeling about this?' or 'What questions do you have?' to encourage dialogue.",
        transcriptReferences: "t8, t10",
      },
    },
    {
      name: "Objection Handling",
      score: 2,
      maxScore: 5,
      chatReferences: ["c6", "t7"],
      description: "The user addressed some concerns but lacked detailed confirmation or reframing.",
      details: {
        whatWentWell: "The user tried to address the employee's confusion about the layoff.",
        whatToDoDifferently: "Provide more detailed explanations and confirm understanding before moving forward.",
        transcriptReferences: "c6, t7",
      },
    },
    {
      name: "Decisiveness",
      score: 3,
      maxScore: 5,
      chatReferences: ["t9", "t11"],
      description: "The user was clear about the decision but could have been more decisive in next steps.",
      details: {
        whatWentWell: "Clear communication about the layoff decision.",
        whatToDoDifferently: "Be more specific about timeline and next steps to provide clarity.",
        transcriptReferences: "t9, t11",
      },
    },
  ],
  keyInsights: [
    {
      title: "Lack of Explicit Emotional Labeling",
      impact: "medium",
      chatReferences: ["t2", "t4"],
      description:
        "The user informed about the layoff but did not explicitly acknowledge or label the employee's emotional response, missing an opportunity to build trust.",
      coachSays:
        "Label the employee's feelings explicitly to show understanding, for example, 'I can imagine this is very upsetting for you.'",
      userSaid:
        "[USER] No, not exactly. Everything is not fine. Your job has been made redundant from tomorrow. This was the news.",
      betterVersion:
        "I know this news is very difficult to hear, and I want to be transparent that your position is being eliminated starting tomorrow.",
      references: "t2, t4, t5",
    },
    {
      title: "Missed Opportunity for Open-Ended Questioning",
      impact: "high",
      chatReferences: ["t6", "t8"],
      description:
        "The user did not ask any open-ended questions to explore the employee's feelings or concerns about the layoff.",
      coachSays: "Use open-ended questions to encourage dialogue and show you care about their perspective.",
      userSaid:
        "[USER] Yeah, you are hearing it correct... The company is facing a hard time so it was a higher management call so your name",
      betterVersion:
        "Yes, this is correct. The company is facing challenges, and this was a difficult decision from leadership. How are you feeling about this news?",
      references: "t6, t8",
    },
  ],
  resources: [
    { title: "Empathy Video 1", type: "video", url: "https://example.com/empathy-video-1" },
    { title: "Questioning Techniques Article 1", type: "article", url: "https://example.com/questioning-article-1" },
    { title: "Objection Handling Course", type: "course", url: "https://example.com/objection-course" },
    { title: "Difficult Conversations Guide", type: "article", url: "https://example.com/difficult-conversations" },
    { title: "Leadership Communication Workshop", type: "course", url: "https://example.com/leadership-workshop" },
  ],
}

export function PerformanceReport({ sessionData, onNewSession }: PerformanceReportProps) {
  const [selectedChatItem, setSelectedChatItem] = useState<string | null>(null)
  const [hoveredFeedback, setHoveredFeedback] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number, maxScore = 100) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-amber-600"
    if (percentage >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-500 bg-red-100"
      case "medium":
        return "text-amber-500 bg-amber-100"
      case "low":
        return "text-green-500 bg-green-100"
      default:
        return "text-gray-500 bg-gray-100"
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-4 w-4" />
      case "article":
        return <FileText className="h-4 w-4" />
      case "course":
        return <GraduationCap className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getResourceBadgeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-100 text-red-700"
      case "article":
        return "bg-blue-100 text-blue-700"
      case "course":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const scrollToAndHighlightChat = (chatId: string) => {
    setSelectedChatItem(chatId)
    const chatElement = document.getElementById(`chat-${chatId}`)
    if (chatElement && chatContainerRef.current) {
      chatElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }

  const { scenario, gender, transcript = [], duration = 0, overallScore = 45 } = sessionData || {}

  const agent = scenario?.agentConfig?.[gender] || {
    name: "AI Coach",
    avatar: "/placeholder.svg",
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onNewSession}>
              <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Inform Employee of Unexpected Layoff</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              Hard
            </Badge>
            <Badge variant="secondary">Empathy</Badge>
            <Badge variant="secondary">People leadership</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground max-w-3xl">
            The user clearly communicated difficult news and acknowledged the employee's emotions but missed deeper
            empathy and open-ended questioning to explore feelings. Objections were somewhat addressed but lacked
            detailed confirmation or reframing. Decisiveness was clear but abrupt without softer transition or future
            orientation.
          </p>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Overall Score</div>
            <div className="text-3xl font-bold text-amber-600">{overallScore}%</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat History - Left Side */}
        <div className="w-1/2 border-r bg-background flex flex-col max-h-full">
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">Say Hi to begin the roleplay</span>
            </div>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {/* Coach AI Initial Message */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={agent.avatar || "/placeholder.svg"} />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Coach AI</span>
                  <Badge variant="secondary" className="text-xs">
                    AI
                  </Badge>
                  <span className="text-xs text-muted-foreground">08:43 PM #c1</span>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm">Say Hi to begin the roleplay</div>
              </div>
            </div>

            {/* User Message 1 */}
            <div
              id="chat-t1"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t1" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:43 PM #t1</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">Hi Ravi!</div>
              </div>
            </div>

            {/* Coach AI Response */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={agent.avatar || "/placeholder.svg"} />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Coach AI</span>
                  <Badge variant="secondary" className="text-xs">
                    AI
                  </Badge>
                  <span className="text-xs text-muted-foreground">08:43 PM #c2</span>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  Hi, I... I wasn't expecting you. Is everything okay?
                </div>
              </div>
            </div>

            {/* User Message 2 - Referenced in feedback */}
            <div
              id="chat-t2"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t2" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:43 PM #t2</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">
                  No, not exactly. Everything is not fine. Your job has been made redundant from tomorrow. This was the
                  news.
                </div>
              </div>
            </div>

            {/* Coach AI Response */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={agent.avatar || "/placeholder.svg"} />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Coach AI</span>
                  <Badge variant="secondary" className="text-xs">
                    AI
                  </Badge>
                  <span className="text-xs text-muted-foreground">08:43 PM #c3</span>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  Redundant? What... what are you talking about? I... I don't understand.
                </div>
              </div>
            </div>

            {/* User Message 3 */}
            <div
              id="chat-t4"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t4" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:44 PM #t4</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">
                  Yeah, you are hearing it correct... The company is facing a hard time so it was a higher management
                  call so your name came up.
                </div>
              </div>
            </div>

            {/* Coach AI Response */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={agent.avatar || "/placeholder.svg"} />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Coach AI</span>
                  <Badge variant="secondary" className="text-xs">
                    AI
                  </Badge>
                  <span className="text-xs text-muted-foreground">08:44 PM #c4</span>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  I can't believe this is happening. I've been working here for five years. What about my projects?
                </div>
              </div>
            </div>

            {/* User Message 4 */}
            <div
              id="chat-t6"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t6" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:44 PM #t6</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">
                  Your projects will be redistributed to other team members. We'll make sure everything is handled
                  properly.
                </div>
              </div>
            </div>

            {/* Coach AI Response */}
            <div
              id="chat-c6"
              className={cn(
                "flex gap-3 p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "c6" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Coach AI</span>
                  <Badge variant="secondary" className="text-xs">
                    AI
                  </Badge>
                  <span className="text-xs text-muted-foreground">08:44 PM #c6</span>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  But what about my severance? My benefits? When is my last day exactly?
                </div>
              </div>
            </div>

            {/* User Message 5 */}
            <div
              id="chat-t7"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t7" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:45 PM #t7</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">
                  HR will contact you about the severance package and benefits. Your last day is tomorrow.
                </div>
              </div>
            </div>

            {/* User Message 6 */}
            <div
              id="chat-t8"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t8" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:45 PM #t8</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">
                  I know this is difficult, but we need to move forward with this decision.
                </div>
              </div>
            </div>

            {/* User Message 7 */}
            <div
              id="chat-t9"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t9" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:45 PM #t9</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">
                  Please clean out your desk and return your company equipment by end of day tomorrow.
                </div>
              </div>
            </div>

            {/* User Message 8 */}
            <div
              id="chat-t10"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t10" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:46 PM #t10</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">
                  Is there anything else you need to know about this process?
                </div>
              </div>
            </div>

            {/* User Message 9 */}
            <div
              id="chat-t11"
              className={cn(
                "flex gap-3 justify-end p-3 rounded-lg transition-all duration-300",
                selectedChatItem === "t11" ? "bg-amber-100 border-2 border-amber-400 shadow-lg scale-[1.02]" : "",
              )}
            >
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">08:46 PM #t11</span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">You</AvatarFallback>
                  </Avatar>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-lg text-sm">
                  Thank you for your understanding. We appreciate your contributions to the company.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Feedback Section - Right Side */}
        <div className="w-1/2 bg-background flex flex-col max-h-full">
          <Tabs defaultValue="feedback" className="flex-1 flex flex-col min-h-0">
            <div className="border-b flex-shrink-0">
              <TabsList className="w-full justify-start rounded-none h-12 bg-transparent p-0">
                <TabsTrigger
                  value="feedback"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white px-6"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Feedback
                </TabsTrigger>
                <TabsTrigger
                  value="insights"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white px-6"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Key Insights
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white px-6"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Resources
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              <TabsContent
                value="feedback"
                className="h-full overflow-y-auto p-6 m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Performance Scores</h3>
                </div>

                <div className="space-y-6">
                  {mockFeedbackData.performanceScores.map((item, index) => (
                    <div
                      key={item.name}
                      className="relative"
                      onMouseEnter={() => {
                        setHoveredFeedback(item.name)
                        if (item.chatReferences.length > 0) {
                          scrollToAndHighlightChat(item.chatReferences[0])
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredFeedback(null)
                        setSelectedChatItem(null)
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.name}</span>
                        <span className={cn("text-sm font-bold", getScoreColor(item.score, item.maxScore))}>
                          {item.score}%
                        </span>
                      </div>
                      <Progress value={(item.score / item.maxScore) * 100} className="h-2 mb-2" />

                      {hoveredFeedback === item.name && (
                        <Card className="absolute top-full left-0 right-0 z-10 p-4 mt-2 shadow-lg border">
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>

                          <div className="space-y-3">
                            <div>
                              <h5 className="font-medium text-sm mb-1">What went well?</h5>
                              <p className="text-sm text-muted-foreground">{item.details.whatWentWell}</p>
                            </div>

                            <div>
                              <h5 className="font-medium text-sm mb-1">What to do differently next time?</h5>
                              <p className="text-sm text-muted-foreground">{item.details.whatToDoDifferently}</p>
                            </div>

                            <div>
                              <h5 className="font-medium text-sm mb-1">Transcript References</h5>
                              <p className="text-sm text-amber-600">{item.details.transcriptReferences}</p>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent
                value="insights"
                className="h-full overflow-y-auto p-6 m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Lightbulb className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Key Insights</h3>
                </div>

                <div className="space-y-4">
                  {mockFeedbackData.keyInsights.map((insight, index) => (
                    <Card
                      key={index}
                      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onMouseEnter={() => {
                        if (insight.chatReferences.length > 0) {
                          scrollToAndHighlightChat(insight.chatReferences[0])
                        }
                      }}
                      onMouseLeave={() => setSelectedChatItem(null)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <Badge className={cn("text-xs", getImpactColor(insight.impact))}>
                              {insight.impact} impact
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>

                      <div className="text-xs">
                        <div className="bg-amber-50 p-2 rounded-md">
                          <div className="font-medium text-amber-900 mb-1">Coach says:</div>
                          <p className="text-amber-800">{insight.coachSays}</p>
                        </div>

                        <div className="bg-gray-50 p-2 rounded-md">
                          <div className="font-medium text-gray-900 mb-1">You said:</div>
                          <p className="text-gray-700">{insight.userSaid}</p>
                        </div>

                        <div className="bg-amber-50 p-2 rounded-md">
                          <div className="font-medium text-amber-900 mb-1">Better version:</div>
                          <p className="text-amber-800">{insight.betterVersion}</p>
                        </div>

                        <div className="text-xs text-muted-foreground pt-1">
                          <span className="font-medium">References:</span> {insight.references}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent
                value="resources"
                className="h-full overflow-y-auto p-6 m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <div className="space-y-4">
                  {mockFeedbackData.resources.map((resource, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">{getResourceIcon(resource.type)}</div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{resource.title}</h4>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1"
                          >
                            Open Resource
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <Badge className={cn("text-xs", getResourceBadgeColor(resource.type))}>{resource.type}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
