export type GradeKey = 'psa8' | 'psa9' | 'psa10'
export type TrendDirection = 'up' | 'down'

export interface GradePrice {
  value: number
  trend30d: number
  direction: TrendDirection
}

export interface HistoricalPricePoint {
  month: string
  date: string
  psa8: number
  psa9: number
  psa10: number
}

export interface PokemonCardPriceRecord {
  cardId: string
  name: string
  set: string
  releaseYear: number
  artist: string
  rank: number
  rarity: string
  theme?: string
  imageUrls: {
    small: string
    large: string
  }
  currentPrices: Record<GradeKey, GradePrice>
  history: HistoricalPricePoint[]
}
