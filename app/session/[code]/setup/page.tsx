'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import RestaurantFilters from '@/components/RestaurantFilters'

export default function SessionSetupPage() {
  const params = useParams()
  const router = useRouter()
  const sessionCode = params.code as string

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

  const handleStartSession = () => {
    // Store filters in localStorage for this session
    localStorage.setItem(`filters-${sessionCode}`, JSON.stringify(filters))

    // Navigate to the actual session
    router.push(`/session/${sessionCode}`)
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

        <button
          onClick={handleStartSession}
          className="w-full bg-white text-orange-600 font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition mt-6"
        >
          Start Session
        </button>

        <div className="mt-6 text-center text-orange-100 text-sm">
          <p>These filters will apply to all participants in this session.</p>
        </div>
      </div>
    </div>
  )
}
