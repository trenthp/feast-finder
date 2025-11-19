import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '@/lib/sessionStore'
import { Filters } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/session/create called')
    const { code, userId, filters, location } = await request.json()
    console.log('[API] Request data:', { code, userId, filters, location })

    // Validate inputs
    if (!code || !userId || !filters || !location) {
      console.error('[API] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if session already exists
    const existingSession = sessionStore.getSession(code)
    if (existingSession) {
      console.log('[API] Session already exists:', code)
      return NextResponse.json(
        { error: 'Session already exists' },
        { status: 409 }
      )
    }

    console.log('[API] Fetching restaurants...')

    // Fetch restaurants with filters
    const response = await fetch(
      `${request.nextUrl.origin}/api/restaurants/nearby`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          radius: filters.distance * 1000, // Convert km to meters
          limit: 10,
          filters,
        }),
      }
    )

    if (!response.ok) {
      console.error('[API] Failed to fetch restaurants, status:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const restaurants = data.restaurants || []
    console.log('[API] Fetched', restaurants.length, 'restaurants')

    // Create session with restaurants
    console.log('[API] Creating session in store...')
    const session = sessionStore.createSession(
      code,
      userId,
      filters,
      restaurants,
      location
    )
    console.log('[API] Session created successfully:', code)

    return NextResponse.json({
      success: true,
      session: {
        code: session.code,
        createdAt: session.createdAt,
        users: session.users,
        filters: session.filters,
        restaurantCount: session.restaurants.length,
      },
    })
  } catch (error) {
    console.error('[API] Error creating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
