export type SaleSource = 'eBay' | 'Goldin' | 'Fanatics Collect' | 'TCGPlayer' | 'Cardmarket' | 'Modeled'
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
  sources: Record<GradeKey, SaleSource>
}

export interface PokemonCardPriceRecord {
  cardId: string
  name: string
  set: string
  releaseYear: number
  artist: string
  rank: number
  rarity: string
  imageUrls: {
    small: string
    large: string
  }
  currentPrices: Record<GradeKey, GradePrice>
  history: HistoricalPricePoint[]
}
