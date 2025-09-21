"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Clock, Star, Users, Briefcase, Presentation, Phone, X, ChevronLeft, ChevronRight } from "lucide-react"
import type { DemoScenario } from "@/lib/demo-types"
import { cn } from "@/lib/utils"

interface ScenarioSidebarProps {
  scenarios: DemoScenario[]
  selectedScenario: DemoScenario | null
  onScenarioSelect: (scenario: DemoScenario) => void
  disabled?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const scenarioIcons = {
  "job-interview": Briefcase,
  "sales-pitch": Users,
  "presentation-skills": Presentation,
  "customer-service": Phone,
}

export function ScenarioSidebar({
  scenarios,
  selectedScenario,
  onScenarioSelect,
  disabled = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: ScenarioSidebarProps) {
  return (
    <div
      className={cn(
        "h-full border-r border-border bg-card/50 backdrop-blur-sm flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-80",
      )}
    >
      <div className="flex items-center justify-between p-2 border-b border-border">
        {!collapsed && <h2 className="text-base font-semibold">Choose Your Practice</h2>}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={cn("p-2", !collapsed && "p-4")}>
          {/* Mobile close button */}
          {onClose && !collapsed && (
            <div className="flex justify-end mb-3 lg:hidden">
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!collapsed && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground">Select a scenario to start your AI coaching session</p>
            </div>
          )}

          <div className={cn("space-y-2 mb-4", collapsed && "space-y-1")}>
            {scenarios.map((scenario) => {
              const IconComponent = scenarioIcons[scenario.id as keyof typeof scenarioIcons] || Briefcase
              const isSelected = selectedScenario?.id === scenario.id

              return (
                <Card
                  key={scenario.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md border",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 bg-background/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    collapsed ? "p-2" : "p-3",
                  )}
                  onClick={() => !disabled && onScenarioSelect(scenario)}
                  title={collapsed ? scenario.name : undefined}
                >
                  {collapsed ? (
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex">
                        {Array.from({ length: scenario.difficulty }).map((_, i) => (
                          <Star key={i} className="h-2 w-2 fill-current text-amber-400" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-xs mb-1 text-balance">{scenario.name}</h3>
                        <p className="text-xs text-muted-foreground mb-1 text-pretty">{scenario.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {scenario.estimatedDuration} min
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {Array.from({ length: scenario.difficulty }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-current text-amber-400" />
                              ))}
                              {Array.from({ length: 3 - scenario.difficulty }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 text-muted-foreground/30" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scenario.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {selectedScenario && !collapsed && (
        <div className="border-t border-border bg-background p-4 flex-shrink-0">
          <div className="text-xs text-muted-foreground text-center">
            <p>Select your coach and start session in the main area →</p>
          </div>
        </div>
      )}
    </div>
  )
}
