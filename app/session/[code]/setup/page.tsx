'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import RestaurantFilters from '@/components/RestaurantFilters'
import { getUserLocation } from '@/lib/googleMaps'

export default function SessionSetupPage() {
  console.log('🎯 SETUP PAGE IS RENDERING')

  const params = useParams()
  const router = useRouter()
  const sessionCode = params.code as string

  console.log('📍 Session code:', sessionCode)

  const [filters, setFilters] = useState<{
    minRating: number
    openNow: boolean
    maxReviews: number
    distance: number
  }>({
    minRating: 0,
    openNow: false,
    maxReviews: 0,
    distance: 5,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartSession = async () => {
    console.log('🔥 START SESSION BUTTON CLICKED!')
    setLoading(true)
    setError(null)

    try {
      // Get user ID or create one
      const storedUserId = localStorage.getItem(`user-${sessionCode}`)
      const userId = storedUserId || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      if (!storedUserId) {
        localStorage.setItem(`user-${sessionCode}`, userId)
      }

      // Get location
      const location = await getUserLocation()
      const defaultLocation = location || { lat: 40.7128, lng: -74.006 } // Default to NYC

      // Create session via API
      console.log('Creating session:', { code: sessionCode, userId, filters, location: defaultLocation })

      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sessionCode,
          userId,
          filters,
          location: defaultLocation,
        }),
      })

      console.log('Create session response status:', response.status)

      if (!response.ok) {
        const data = await response.json()
        console.error('Create session error:', data)
        throw new Error(data.error || 'Failed to create session')
      }

      const result = await response.json()
      console.log('Session created successfully:', result)

      // Navigate to the actual session
      router.push(`/session/${sessionCode}`)
    } catch (err) {
      console.error('Error starting session:', err)
      setError(err instanceof Error ? err.message : 'Failed to start session')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Configure Session</h1>
          <p className="text-orange-100 mb-4">Set your restaurant preferences</p>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg py-3 px-6 inline-block">
            <p className="text-white text-sm font-semibold">Session Code</p>
            <p className="text-white text-2xl font-bold tracking-widest">{sessionCode}</p>
          </div>
        </div>

        <RestaurantFilters filters={filters} onFiltersChange={setFilters} />

        {error && (
          <div className="mt-4 bg-red-500 text-white p-4 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleStartSession}
          disabled={loading}
          className="w-full bg-white text-orange-600 font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Creating Session...' : 'Start Session'}
        </button>

        <div className="mt-6 text-center text-orange-100 text-sm">
          <p>These filters will apply to all participants in this session.</p>
        </div>
      </div>
    </div>
  )
}
