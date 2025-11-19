'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Restaurant } from '@/lib/types'
import RestaurantCard from '@/components/RestaurantCard'
import ResultsPage from '@/components/ResultsPage'
import ShareCode from '@/components/ShareCode'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionCode = params.code as string

  const [userId, setUserId] = useState<string>('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showingResults, setShowingResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize user and fetch session
  useEffect(() => {
    const initSession = async () => {
      try {
        // Get or create user ID
        const storedUserId = localStorage.getItem(`user-${sessionCode}`)
        const newUserId = storedUserId || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        if (!storedUserId) {
          localStorage.setItem(`user-${sessionCode}`, newUserId)
        }

        setUserId(newUserId)

        // Fetch session data from API
        console.log('Fetching session:', sessionCode, 'for user:', newUserId)

        const response = await fetch(`/api/session/${sessionCode}?userId=${newUserId}`)

        console.log('Fetch session response status:', response.status)

        if (!response.ok) {
          if (response.status === 404) {
            console.error('Session not found:', sessionCode)
            setError('Session not found. The host needs to complete the setup first.')
            setLoading(false)
            return
          }
          throw new Error('Failed to fetch session')
        }

        const data = await response.json()
        console.log('Session data loaded:', data)
        setRestaurants(data.session.restaurants)
        setLoading(false)
      } catch (err) {
        console.error('Error initializing session:', err)
        setError('Failed to load session. Please try again.')
        setLoading(false)
      }
    }

    initSession()
  }, [sessionCode])

  // Poll for session status when showing results
  useEffect(() => {
    if (!showingResults || !userId) return

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/session/${sessionCode}/status?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          // Keep polling - results page will handle showing matches
          console.log('Session status:', data)
        }
      } catch (err) {
        console.error('Error polling status:', err)
      }
    }

    // Poll immediately
    pollStatus()

    // Poll every 3 seconds
    const interval = setInterval(pollStatus, 3000)

    return () => clearInterval(interval)
  }, [showingResults, sessionCode, userId])

  const handleVote = useCallback(
    async (restaurantId: string, liked: boolean) => {
      try {
        // Send vote to API
        const response = await fetch(`/api/session/${sessionCode}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, restaurantId, liked }),
        })

        if (!response.ok) {
          throw new Error('Failed to save vote')
        }

        const data = await response.json()

        // Move to next restaurant or show results
        if (currentIndex < restaurants.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          // User finished voting
          setShowingResults(true)
        }
      } catch (err) {
        console.error('Error saving vote:', err)
        // Still move to next restaurant even if vote fails
        if (currentIndex < restaurants.length - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          setShowingResults(true)
        }
      }
    },
    [currentIndex, restaurants.length, sessionCode, userId]
  )

  const handleYes = () => {
    if (currentIndex < restaurants.length) {
      handleVote(restaurants[currentIndex].id, true)
    }
  }

  const handleNo = () => {
    if (currentIndex < restaurants.length) {
      handleVote(restaurants[currentIndex].id, false)
    }
  }

  const handleNewSession = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    window.location.href = `/session/${newCode}/setup`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <p className="text-white text-lg">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-white text-orange-600 font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (showingResults) {
    return (
      <ResultsPage
        sessionCode={sessionCode}
        restaurants={restaurants}
        onNewSession={handleNewSession}
      />
    )
  }

  const currentRestaurant = restaurants[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-4">
        <ShareCode code={sessionCode} />
      </div>

      {currentRestaurant ? (
        <div className="w-full max-w-md">
          <RestaurantCard
            restaurant={currentRestaurant}
            onYes={handleYes}
            onNo={handleNo}
            progress={`${currentIndex + 1} / ${restaurants.length}`}
          />
        </div>
      ) : (
        <div className="text-white text-center">
          <p>No restaurants available</p>
        </div>
      )}
    </div>
  )
}
