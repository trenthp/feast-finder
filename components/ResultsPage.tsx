'use client'

import { useEffect, useState } from 'react'
import { Restaurant } from '@/lib/types'

interface ResultsPageProps {
  sessionCode: string
  restaurants: Restaurant[]
  onNewSession: () => void
}

interface VoteCount {
  restaurantId: string
  restaurant: Restaurant
  yesCount: number
  noCount: number
  votes: { [key: string]: boolean }
}

export default function ResultsPage({
  sessionCode,
  restaurants,
  onNewSession,
}: ResultsPageProps) {
  const [winner, setWinner] = useState<Restaurant | null>(null)
  const [voteDetails, setVoteDetails] = useState<VoteCount[]>([])
  const [resultType, setResultType] = useState<string>('')
  const [allFinished, setAllFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch results from API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/session/${sessionCode}/results`)

        if (!response.ok) {
          console.error('Failed to fetch results')
          setLoading(false)
          return
        }

        const data = await response.json()

        if (data.results) {
          const { type, restaurant, allVotes, yesCount, userCount } = data.results

          // Set winner
          setWinner(restaurant)

          // Set result type
          if (type === 'full-agreement') {
            setResultType('unanimous')
          } else if (type === 'best-match') {
            setResultType(yesCount === userCount ? 'majority' : 'best-match')
          }

          // Transform allVotes to VoteCount format
          if (allVotes) {
            const voteCounts: VoteCount[] = allVotes.map((vote: any) => ({
              restaurantId: vote.restaurant.id,
              restaurant: vote.restaurant,
              yesCount: vote.yesCount,
              noCount: userCount - vote.yesCount,
              votes: vote.userVotes,
            }))
            setVoteDetails(voteCounts)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching results:', err)
        setLoading(false)
      }
    }

    fetchResults()
  }, [sessionCode])

  // Poll to check if all users finished
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/session/${sessionCode}/status`)
        if (response.ok) {
          const data = await response.json()
          setAllFinished(data.allFinished)
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
  }, [sessionCode])

  const resultMessage =
    resultType === 'unanimous'
      ? "Everyone agrees! 🎉"
      : resultType === 'majority'
        ? "Majority match! 🥳"
        : "Best match found! 👌"

  // Show waiting state if not everyone finished
  if (!allFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-2xl p-8">
            <div className="text-6xl mb-6 animate-bounce">⏳</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Waiting for others...
            </h2>
            <p className="text-orange-100 text-lg">
              You've finished voting! Waiting for the rest of your group to complete their selections.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-100"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading || !winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <p className="text-white text-lg">Calculating results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Winner Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8 transform scale-100 animate-bounce">
          {/* Image */}
          <div className="h-64 bg-gradient-to-br from-green-300 to-blue-400 flex items-center justify-center">
            <div className="text-8xl">🎊</div>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              {winner?.name}
            </h2>

            <p className="text-gray-600 mb-4">{winner?.address}</p>

            <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg mb-6 font-bold">
              {resultMessage}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Rating</span>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⭐</span>
                  <span className="font-bold text-gray-800">{winner?.rating}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700">Cuisines</span>
                <span className="font-semibold text-gray-800">
                  {winner?.cuisines.join(', ')}
                </span>
              </div>
            </div>

            {winner?.phone && (
              <a
                href={`tel:${winner.phone}`}
                className="block w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition mb-3"
              >
                📞 Call Now
              </a>
            )}

            {winner?.website && (
              <a
                href={winner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition mb-3"
              >
                🌐 Visit Website
              </a>
            )}
          </div>
        </div>

        {/* Vote Breakdown */}
        <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-6 mb-6 text-white">
          <h3 className="font-bold text-lg mb-4">Vote Breakdown</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {voteDetails
              .filter((v) => Object.keys(v.votes).length > 0)
              .sort((a, b) => b.yesCount - a.yesCount)
              .map((detail) => (
                <div
                  key={detail.restaurantId}
                  className="bg-white bg-opacity-10 p-3 rounded-lg"
                >
                  <p className="font-semibold text-sm mb-1">{detail.restaurant.name}</p>
                  <div className="w-full bg-black bg-opacity-30 rounded-full h-2">
                    <div
                      className="bg-green-400 h-2 rounded-full"
                      style={{
                        width: `${(detail.yesCount / (detail.yesCount + detail.noCount)) * 100 || 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1 opacity-90">
                    {detail.yesCount} yes, {detail.noCount} no
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={onNewSession}
          className="w-full bg-white text-orange-600 font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition"
        >
          🍽️ Start New Session
        </button>
      </div>
    </div>
  )
}
