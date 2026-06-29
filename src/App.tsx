import { AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import realCardsData from './data/realPricingData.json'
import fallbackCardsData from './data/mockPricingData.json'
import { CardModal } from './components/CardModal'
import { InteractiveHoloCard } from './components/InteractiveHoloCard'
import { PokeballLogo } from './components/PokeballLogo'
import type { PokemonCardPriceRecord } from './types'

const cards = ((realCardsData as PokemonCardPriceRecord[])?.length
  ? (realCardsData as PokemonCardPriceRecord[])
  : (fallbackCardsData as PokemonCardPriceRecord[]))

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState<PokemonCardPriceRecord | null>(null)

  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return cards

    return cards.filter((card) => {
      return [card.name, card.set, card.artist, card.rarity]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    })
  }, [query])

  return (
    <div className="min-h-screen bg-premium-grid bg-[length:48px_48px] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
          <div className="flex items-center gap-4">
            <PokeballLogo />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">Pokédex Premium</p>
              <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">TCG Market Dashboard</h1>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 md:max-w-xl">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <span className="sr-only">Search by card name or set</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, set, artist..."
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-3 pl-12 pr-4 text-sm font-semibold text-white placeholder:text-slate-500 shadow-inner outline-none transition focus:border-red-400/70 focus:ring-4 focus:ring-red-500/20"
              />
            </label>
            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-slate-200 transition hover:border-red-400/60 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-500/20"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-950/50 via-slate-950/80 to-slate-900/90 p-6 shadow-glow md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.28em] text-red-200">
                Live card data via Apify · pokemontcg.io · TCGPlayer
              </div>
              <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
                Premium PSA pricing intelligence for iconic Pokémon cards.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                A static-ready React dashboard with high-resolution artwork, dynamic holographic slabs, live card metadata, real public market pricing, and modeled PSA-grade trend curves.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-3xl font-black text-white">50</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Cards</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-3xl font-black text-white">3</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">PSA Grades</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-3xl font-black text-white">12M</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">History</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">Interactive gallery</p>
            <h2 className="text-2xl font-black text-white">Showing {filteredCards.length} premium cards</h2>
          </div>
          <p className="hidden rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-bold text-slate-300 sm:block">
            Move your cursor across a slab to refract the holo foil.
          </p>
        </div>

        {filteredCards.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredCards.map((card) => (
              <InteractiveHoloCard key={card.cardId} card={card} onSelect={setSelectedCard} />
            ))}
          </section>
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-center">
            <p className="text-2xl font-black text-white">No cards found</p>
            <p className="mt-2 text-slate-400">Try searching for Charizard, Evolving Skies, Pikachu, or an artist name.</p>
          </section>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Live pricing powered by Apify actors and public Pokémon TCG market feeds. PSA grade spreads and 12-month history are modeled from the live baseline.
      </footer>

      <AnimatePresence>
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      </AnimatePresence>
    </div>
  )
}
