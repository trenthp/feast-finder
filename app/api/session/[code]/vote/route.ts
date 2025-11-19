import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '@/lib/sessionStore'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { userId, restaurantId, liked } = await request.json()

    if (!userId || !restaurantId || liked === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const session = sessionStore.getSession(code)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Add vote
    sessionStore.addVote(code, userId, restaurantId, liked)

    // Check if user finished voting
    const userFinished = sessionStore.hasUserFinishedVoting(code, userId)
    const allFinished = sessionStore.allUsersFinished(code)

    return NextResponse.json({
      success: true,
      userFinished,
      allFinished,
    })
  } catch (error) {
    console.error('Error adding vote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
