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

  useEffect(() => {
    // Load all votes from localStorage
    const allUsers = new Set<string>()
    const voteMap = new Map<string, { [key: string]: boolean }>()

    // Find all users by checking localStorage
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(`votes-${sessionCode}-`)) {
        const userIdMatch = key.replace(`votes-${sessionCode}-`, '')
        allUsers.add(userIdMatch)

        const votes = JSON.parse(localStorage.getItem(key) || '[]')
        voteMap.set(userIdMatch, {})

        votes.forEach((vote: { restaurantId: string; liked: boolean }) => {
          voteMap.get(userIdMatch)![vote.restaurantId] = vote.liked
        })
      }
    })

    // Calculate vote counts
    const counts: VoteCount[] = restaurants.map((restaurant) => {
      let yesCount = 0
      const votes: { [key: string]: boolean } = {}

      allUsers.forEach((user) => {
        const userVotes = voteMap.get(user) || {}
        if (restaurant.id in userVotes) {
          votes[user] = userVotes[restaurant.id]
          if (userVotes[restaurant.id]) {
            yesCount++
          }
        }
      })

      return {
        restaurantId: restaurant.id,
        restaurant,
        yesCount,
        noCount: allUsers.size - yesCount,
        votes,
      }
    })

    setVoteDetails(counts)

    // Determine winner based on the voting logic
    const userCount = allUsers.size

    // 1. Check for unanimous agreement
    const unanimous = counts.find(
      (count) =>
        count.yesCount === userCount &&
        Object.keys(count.votes).length === userCount
    )

    if (unanimous) {
      setWinner(unanimous.restaurant)
      setResultType('unanimous')
      return
    }

    // 2. Find highest voted restaurant
    const sorted = counts.filter((c) => c.yesCount > 0).sort((a, b) => b.yesCount - a.yesCount)

    if (sorted.length > 0) {
      setWinner(sorted[0].restaurant)
      setResultType(sorted[0].yesCount === userCount ? 'majority' : 'best-match')
    }
  }, [sessionCode, restaurants])

  const resultMessage =
    resultType === 'unanimous'
      ? "Everyone agrees! 🎉"
      : resultType === 'majority'
        ? "Majority match! 🥳"
        : "Best match found! 👌"

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
