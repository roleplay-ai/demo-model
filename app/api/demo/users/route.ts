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

        // Check practice limit
        const canPractice = await canSessionPracticeDemo(sessionId)
        let session = await getDemoSystemSession(sessionId)

        // Create session if it doesn't exist
        if (!session) {
            session = await createDemoSystemSession(sessionId)
        }

        return NextResponse.json({
            session: {
                id: session.id,
                practice_count: session.practice_count,
                max_practices: session.max_practices,
                last_practice_at: session.last_practice_at
            },
            can_practice: canPractice
        })

    } catch (error) {
        console.error('Error fetching demo session info:', error)
        return NextResponse.json(
            { error: 'Failed to fetch demo session info' },
            { status: 500 }
        )
    }
}
