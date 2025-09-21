import { NextRequest, NextResponse } from 'next/server'
import { canSessionPracticeDemo, getDemoSystemSession, createDemoSystemSession } from '@/lib/database'

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

        const canPractice = await canSessionPracticeDemo(sessionId)
        let session = await getDemoSystemSession(sessionId)

        // Create session if it doesn't exist
        if (!session) {
            session = await createDemoSystemSession(sessionId)
        }

        return NextResponse.json({
            can_practice: canPractice,
            practice_count: session.practice_count,
            max_practices: session.max_practices,
            remaining_practices: Math.max(0, session.max_practices - session.practice_count),
            last_practice_at: session.last_practice_at
        })

    } catch (error) {
        console.error('Error checking practice limit:', error)
        return NextResponse.json(
            { error: 'Failed to check practice limit' },
            { status: 500 }
        )
    }
}
