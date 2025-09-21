"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, User, Building, Gift, Sparkles, ArrowRight, X } from "lucide-react"
import type { LeadData } from "@/lib/demo-types"
import { saveDemoLead } from "@/lib/demo-data"

interface LeadCaptureModalProps {
  open: boolean
  onSubmit: (data: LeadData) => void
  onSkip: () => void
  onClose: () => void
}

export function LeadCaptureModal({ open, onSubmit, onSkip, onClose }: LeadCaptureModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search)
      const leadData: LeadData = {
        ...formData,
        utmSource: urlParams.get("utm_source") || undefined,
        utmMedium: urlParams.get("utm_medium") || undefined,
        utmCampaign: urlParams.get("utm_campaign") || undefined,
      }

      await saveDemoLead(leadData)
      onSubmit(leadData)
    } catch (error) {
      console.error("Error saving lead:", error)
      // Still proceed with the session even if lead saving fails
      onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="relative">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 sm:p-6 pb-4">
            <button
              onClick={onClose}
              className="absolute right-3 sm:right-4 top-3 sm:top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            <DialogHeader className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                  Free Demo
                </Badge>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-balance">
                Get Your Personalized Report
              </DialogTitle>
              <DialogDescription className="text-sm text-pretty">
                We'll send your detailed coaching analysis and improvement recommendations to your email after the
                session.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Form */}
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Your Name *
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company (Optional)
                </Label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <input
                    id="company"
                    type="text"
                    placeholder="Your Company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-4 py-3.5 bg-background border border-border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      Starting Session...
                    </div>
                  ) : (
                    <>
                      Start Coaching Session
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Benefits */}
            <Card className="mt-6 p-4 bg-muted/30 border-muted">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm mb-1">What You'll Get:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Detailed performance analysis with scores</li>
                    <li>• Personalized improvement recommendations</li>
                    <li>• Conversation transcript and highlights</li>
                    <li>• Tips from professional communication coaches</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground text-center mt-4 text-pretty">
              We respect your privacy. No spam, unsubscribe anytime. Your data is secure and never shared.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
