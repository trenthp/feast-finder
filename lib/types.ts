export interface Restaurant {
  id: string
  name: string
  address: string
  rating: number
  reviewCount: number
  cuisines: string[]
  imageUrl?: string
  lat: number
  lng: number
  priceLevel?: string
  phone?: string
  website?: string
}

export interface Vote {
  userId: string
  restaurantId: string
  liked: boolean
}

export interface Session {
  code: string
  createdAt: number
  users: string[]
  votes: Vote[]
  finished: boolean
}

export interface AggregatedVote {
  restaurantId: string
  restaurant: Restaurant
  yesCount: number
  noCount: number
  totalVotes: number
  userIds: { [userId: string]: boolean } // userId -> liked
}
