import { Session, Restaurant } from './types'

// In-memory store - in production, this would be a database
const sessions: Map<string, Session> = new Map()
const sessionRestaurants: Map<string, Restaurant[]> = new Map()

export const sessionStore = {
  createSession: (code: string, userId: string): Session => {
    const session: Session = {
      code,
      createdAt: Date.now(),
      users: [userId],
      votes: [],
      finished: false,
    }
    sessions.set(code, session)
    return session
  },

  getSession: (code: string): Session | undefined => {
    return sessions.get(code)
  },

  addUserToSession: (code: string, userId: string): boolean => {
    const session = sessions.get(code)
    if (!session) return false
    if (!session.users.includes(userId)) {
      session.users.push(userId)
    }
    return true
  },

  addVote: (code: string, userId: string, restaurantId: string, liked: boolean): void => {
    const session = sessions.get(code)
    if (!session) return

    // Remove existing vote for this user/restaurant combination
    session.votes = session.votes.filter(
      (v) => !(v.userId === userId && v.restaurantId === restaurantId)
    )

    // Add new vote
    session.votes.push({ userId, restaurantId, liked })
  },

  setSessionRestaurants: (code: string, restaurants: Restaurant[]): void => {
    sessionRestaurants.set(code, restaurants)
  },

  getSessionRestaurants: (code: string): Restaurant[] => {
    return sessionRestaurants.get(code) || []
  },

  finishSession: (code: string): void => {
    const session = sessions.get(code)
    if (session) {
      session.finished = true
    }
  },

  calculateResults: (code: string, restaurants: Restaurant[]) => {
    const session = sessions.get(code)
    if (!session) return null

    const aggregated = new Map<
      string,
      {
        restaurant: Restaurant
        yesCount: number
        userVotes: { [userId: string]: boolean }
      }
    >()

    restaurants.forEach((restaurant) => {
      aggregated.set(restaurant.id, {
        restaurant,
        yesCount: 0,
        userVotes: {},
      })
    })

    session.votes.forEach((vote) => {
      const data = aggregated.get(vote.restaurantId)
      if (data) {
        data.userVotes[vote.userId] = vote.liked
        if (vote.liked) {
          data.yesCount++
        }
      }
    })

    // Convert to array and sort
    const results = Array.from(aggregated.values())
      .filter((item) => item.restaurant)
      .sort((a, b) => b.yesCount - a.yesCount)

    // Find winning match
    // 1. All users agree
    const fullAgreement = results.find(
      (item) =>
        item.yesCount === session.users.length &&
        Object.keys(item.userVotes).length === session.users.length
    )

    if (fullAgreement) {
      return {
        type: 'full-agreement',
        restaurant: fullAgreement.restaurant,
        allVotes: results,
      }
    }

    // 2. No full agreement - return highest
    if (results.length > 0 && results[0].yesCount > 0) {
      return {
        type: 'best-match',
        restaurant: results[0].restaurant,
        yesCount: results[0].yesCount,
        userCount: session.users.length,
        allVotes: results,
      }
    }

    return null
  },
}
