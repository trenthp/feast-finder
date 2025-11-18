'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Restaurant, Session } from '@/lib/types'
import { fetchNearbyRestaurants, getUserLocation } from '@/lib/googleMaps'
import RestaurantCard from '@/components/RestaurantCard'
import ResultsPage from '@/components/ResultsPage'
import ShareCode from '@/components/ShareCode'

export default function SessionPage() {
  const params = useParams()
  const sessionCode = params.code as string

  const [userId, setUserId] = useState<string>('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [_session, _setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [showingResults, setShowingResults] = useState(false)
  const [votes, setVotes] = useState<{ restaurantId: string; liked: boolean }[]>([])

  // Initialize user and session
  useEffect(() => {
    const storedUserId = localStorage.getItem(`user-${sessionCode}`)
    const newUserId = storedUserId || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (!storedUserId) {
      localStorage.setItem(`user-${sessionCode}`, newUserId)
    }

    setUserId(newUserId)

    // Load session data
    const sessionKey = `session-${sessionCode}`
    const storedSession = localStorage.getItem(sessionKey)

    if (storedSession) {
      _setSession(JSON.parse(storedSession))
    } else {
      const newSession: Session = {
        code: sessionCode,
        createdAt: Date.now(),
        users: [newUserId],
        votes: [],
        finished: false,
      }
      _setSession(newSession)
      localStorage.setItem(sessionKey, JSON.stringify(newSession))
    }

    // Load restaurants for this session
    const restaurantsKey = `restaurants-${sessionCode}`
    const storedRestaurants = localStorage.getItem(restaurantsKey)

    if (storedRestaurants) {
      setRestaurants(JSON.parse(storedRestaurants))
      setLoading(false)
    } else {
      // Fetch nearby restaurants
      initializeRestaurants()
    }
  }, [sessionCode])

  const initializeRestaurants = async () => {
    try {
      // Load filters from localStorage (set during session setup)
      const storedFilters = localStorage.getItem(`filters-${sessionCode}`)
      const filters = storedFilters
        ? JSON.parse(storedFilters)
        : { minRating: 0, openNow: false, maxReviews: 0, distance: 5 }

      const location = await getUserLocation()
      const defaultLocation = location || { lat: 40.7128, lng: -74.006 } // Default to NYC

      if (location) {
        console.log('Using user location:', location)
      } else {
        console.log('User location not available, using default NYC location')
      }

      console.log('Fetching restaurants with filters:', filters)

      const nearby = await fetchNearbyRestaurants(
        defaultLocation.lat,
        defaultLocation.lng,
        filters.distance * 1000, // Convert km to meters
        6,
        filters
      )

      setRestaurants(nearby)
      localStorage.setItem(`restaurants-${sessionCode}`, JSON.stringify(nearby))
    } catch (error) {
      console.error('Error initializing restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = useCallback(
    (restaurantId: string, liked: boolean) => {
      const newVotes = [...votes]
      const existingIndex = newVotes.findIndex((v) => v.restaurantId === restaurantId)

      if (existingIndex >= 0) {
        newVotes[existingIndex] = { restaurantId, liked }
      } else {
        newVotes.push({ restaurantId, liked })
      }

      setVotes(newVotes)

      // Save votes to localStorage
      localStorage.setItem(`votes-${sessionCode}-${userId}`, JSON.stringify(newVotes))

      // Move to next restaurant
      if (currentIndex < restaurants.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setShowingResults(true)
      }
    },
    [currentIndex, restaurants.length, sessionCode, userId, votes]
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
          <p className="text-white text-lg">Finding restaurants near you...</p>
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
