import { NextRequest, NextResponse } from 'next/server'
import { getRandomRestaurants } from '@/lib/googleMaps'

export async function POST(request: NextRequest) {
  try {
    const { lat: _lat, lng: _lng, radius: _radius, limit } = await request.json()

    // TODO: Integrate with Google Maps Places API
    // For now, return mock restaurants

    const restaurants = getRandomRestaurants(limit)

    return NextResponse.json({
      success: true,
      restaurants,
    })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}
