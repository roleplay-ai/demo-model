import { NextRequest, NextResponse } from 'next/server'
import {
    canSessionPracticeDemo,
    createDemoSystemRun,
    incrementDemoPracticeCount,
    getSessionDemoSystemRuns
} from '@/lib/database'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { session_id, scenario_id, selected_gender } = body

        // Validate required fields
        if (!session_id || !scenario_id) {
            return NextResponse.json(
                { error: 'Session ID and Scenario ID are required' },
                { status: 400 }
            )
        }

        // Check if session can practice
        const canPractice = await canSessionPracticeDemo(session_id)
        if (!canPractice) {
            return NextResponse.json(
                { error: 'Practice limit reached' },
                { status: 403 }
            )
        }

        // Create demo run
        const demoRun = await createDemoSystemRun({
            session_id: session_id,
            scenario_id: parseInt(scenario_id),
            status: 'created',
            selected_gender: selected_gender || undefined
        })

        // Increment practice count
        await incrementDemoPracticeCount(session_id)

        return NextResponse.json({
            run: demoRun,
            message: 'Demo run created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating demo run:', error)
        return NextResponse.json(
            { error: 'Failed to create demo run' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('session_id')

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            )
        }

        // Get session's demo runs
        const runs = await getSessionDemoSystemRuns(sessionId)

        return NextResponse.json({
            runs,
            count: runs.length
        })

    } catch (error) {
        console.error('Error fetching demo runs:', error)
        return NextResponse.json(
            { error: 'Failed to fetch demo runs' },
            { status: 500 }
        )
    }
}
