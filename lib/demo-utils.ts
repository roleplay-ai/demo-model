import {
    canSessionPracticeDemo,
    getDemoSystemSession,
    createDemoSystemSession,
    incrementDemoPracticeCount,
    getDemoSystemScenarios,
    createDemoSystemRun,
    updateDemoSystemRun,
    createDemoSystemReport,
    createDemoSystemTranscript,
    getSessionDemoSystemRuns
} from './database'
import type {
    DemoSystemScenario,
    DemoSystemRun,
    DemoSystemReport,
    DemoSystemRunWithDetails,
    DemoSystemSession
} from './types'

// Demo system utility functions (Updated for anonymous sessions)
export class DemoSystemManager {
    private sessionId: string | null = null

    constructor(sessionId?: string) {
        this.sessionId = sessionId || null
    }

    // Set session ID (from browser storage or generated)
    setSessionId(sessionId: string) {
        this.sessionId = sessionId
    }

    // Get current session ID
    getSessionId(): string | null {
        return this.sessionId
    }

    // Generate a new session ID
    generateSessionId(): string {
        return `demo_${Date.now()}_${Math.random().toString(36).substring(2)}`
    }

    // Check if current session can practice
    async canPractice(): Promise<boolean> {
        if (!this.sessionId) {
            throw new Error('No session ID set')
        }
        return canSessionPracticeDemo(this.sessionId)
    }

    // Get practice status
    async getPracticeStatus(): Promise<{
        canPractice: boolean
        practiceCount: number
        maxPractices: number
        remainingPractices: number
        lastPracticeAt?: string
    }> {
        if (!this.sessionId) {
            throw new Error('No session ID set')
        }

        const canPractice = await canSessionPracticeDemo(this.sessionId)
        let session = await getDemoSystemSession(this.sessionId)

        // Create session if it doesn't exist
        if (!session) {
            session = await createDemoSystemSession(this.sessionId)
        }

        return {
            canPractice,
            practiceCount: session.practice_count,
            maxPractices: session.max_practices,
            remainingPractices: Math.max(0, session.max_practices - session.practice_count),
            lastPracticeAt: session.last_practice_at
        }
    }

    // Start a new practice session
    async startPracticeSession(scenarioId: number, selectedGender?: "male" | "female"): Promise<DemoSystemRun> {
        if (!this.sessionId) {
            throw new Error('No session ID set')
        }

        // Check if session can practice
        const canPractice = await this.canPractice()
        if (!canPractice) {
            throw new Error('Practice limit reached')
        }

        // Create demo run
        const demoRun = await createDemoSystemRun({
            session_id: this.sessionId,
            scenario_id: scenarioId,
            status: 'created',
            selected_gender: selectedGender
        })

        // Increment practice count
        await incrementDemoPracticeCount(this.sessionId)

        return demoRun
    }

    // Complete a practice session
    async completePracticeSession(
        runId: number,
        reportData: any,
        transcriptData?: any
    ): Promise<{ run: DemoSystemRun; report: DemoSystemReport }> {
        try {
            // Update run status
            const updatedRun = await updateDemoSystemRun(runId, {
                status: 'completed',
                ended_at: new Date().toISOString()
            })

            // Create report
            const report = await createDemoSystemReport({
                run_id: runId,
                schema_version: '1.0',
                payload: reportData,
                score_overall: reportData.overall_score,
                model_used: 'gpt-4'
            })

            // Create transcript if provided
            if (transcriptData) {
                await createDemoSystemTranscript({
                    run_id: runId,
                    language: 'en',
                    finalized: true,
                    content: transcriptData
                })
            }

            return { run: updatedRun, report }
        } catch (error) {
            console.error('Error completing practice session:', error)
            throw error
        }
    }

    // Get available scenarios
    async getAvailableScenarios(): Promise<DemoSystemScenario[]> {
        return getDemoSystemScenarios()
    }

    // Get session's demo runs
    async getSessionRuns(): Promise<DemoSystemRunWithDetails[]> {
        if (!this.sessionId) {
            throw new Error('No session ID set')
        }
        return getSessionDemoSystemRuns(this.sessionId)
    }

    // Check if user should see upgrade prompt
    async shouldShowUpgradePrompt(): Promise<boolean> {
        const status = await this.getPracticeStatus()
        return !status.canPractice
    }
}

// Utility functions for session management (updated for anonymous system)
export const DemoStorage = {
    // Store session ID in localStorage
    setSessionId(sessionId: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('demo_session_id', sessionId)
        }
    },

    // Get session ID from localStorage
    getSessionId(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('demo_session_id')
        }
        return null
    },

    // Store practice limit data in localStorage (for UI state)
    setPracticeLimitData(limitData: DemoSystemSession): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('demo_practice_limit', JSON.stringify(limitData))
        }
    },

    // Get practice limit data from localStorage
    getPracticeLimitData(): DemoSystemSession | null {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem('demo_practice_limit')
            return data ? JSON.parse(data) : null
        }
        return null
    },

    // Store last demo run ID in localStorage
    setLastDemoRunId(runId: number): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('last_demo_run_id', runId.toString())
        }
    },

    // Get last demo run ID from localStorage
    getLastDemoRunId(): number | null {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem('last_demo_run_id')
            return data ? parseInt(data) : null
        }
        return null
    },

    // Clear all demo data
    clearDemoData(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('demo_session_id')
            localStorage.removeItem('demo_practice_limit')
            localStorage.removeItem('last_demo_run_id')
        }
    }
}

// React hook for demo system (if using React)
export const useDemoSystem = () => {
    const sessionId = DemoStorage.getSessionId() || new DemoSystemManager().generateSessionId()
    const demoManager = new DemoSystemManager(sessionId)

    return {
        demoManager,
        sessionId,
        clearDemoData: DemoStorage.clearDemoData
    }
}
