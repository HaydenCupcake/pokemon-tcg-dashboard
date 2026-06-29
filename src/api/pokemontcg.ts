export interface PokemonTCGCardDTO {
  id: string
  name: string
  rarity?: string
  artist?: string
  images?: {
    small?: string
    large?: string
  }
  set: {
    name: string
    releaseDate?: string
  }
}

export interface PokemonTCGSearchResponse {
  data: PokemonTCGCardDTO[]
  totalCount: number
  pageSize: number
  page: number
}

export async function searchCards(params: {
  q?: string
  name?: string
  set?: string
  orderBy?: string
  pageSize?: number
  page?: number
} = {}): Promise<PokemonTCGSearchResponse> {
  const {
    q,
    name,
    set,
    orderBy = '-set.releaseDate',
    pageSize = 24,
    page = 1,
  } = params

  const query = [q, name, set].filter(Boolean).join(' ')
  const url = new URL('https://api.pokemontcg.io/v2/cards')
  url.searchParams.set('q', query || '*')
  url.searchParams.set('orderBy', orderBy)
  url.searchParams.set('pageSize', String(pageSize))
  url.searchParams.set('page', String(page))

  const response = await fetch(url.toString())

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`TCG lookup failed: ${response.status} ${text.slice(0, 200)}`)
  }

  return response.json()
}
