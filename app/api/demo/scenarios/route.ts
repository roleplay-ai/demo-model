import { NextResponse } from 'next/server'
import { getDemoSystemScenarios } from '@/lib/database'

export async function GET() {
    try {
        const scenarios = await getDemoSystemScenarios()

        return NextResponse.json({
            scenarios,
            count: scenarios.length
        })

    } catch (error) {
        console.error('Error fetching demo system scenarios:', error)
        return NextResponse.json(
            { error: 'Failed to fetch scenarios' },
            { status: 500 }
        )
    }
}
