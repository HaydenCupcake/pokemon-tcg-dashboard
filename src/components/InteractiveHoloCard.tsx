import { ArrowDownRight, ArrowUpRight, BadgeDollarSign, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import type { GradeKey, PokemonCardPriceRecord } from '../types'

interface InteractiveHoloCardProps {
  card: PokemonCardPriceRecord
  onSelect: (card: PokemonCardPriceRecord) => void
}

const gradeLabels: Record<GradeKey, string> = {
  psa8: 'PSA 8.0',
  psa9: 'PSA 9.0',
  psa10: 'PSA 10',
}

const gradeStyles: Record<GradeKey, string> = {
  psa8: 'border-orange-400/30 bg-orange-500/10 text-orange-200',
  psa9: 'border-slate-300/30 bg-slate-200/10 text-slate-100',
  psa10: 'border-yellow-300/40 bg-yellow-400/10 text-yellow-200',
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function InteractiveHoloCard({ card, onSelect }: InteractiveHoloCardProps) {
  const slabRef = useRef<HTMLButtonElement>(null)

  function handleMouseMove(event: MouseEvent<HTMLButtonElement>) {
    const element = slabRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    element.style.setProperty('--mouse-x', `${x}%`)
    element.style.setProperty('--mouse-y', `${y}%`)
    element.style.setProperty('--rotate-x', `${(50 - y) * 0.08}deg`)
    element.style.setProperty('--rotate-y', `${(x - 50) * 0.08}deg`)
  }

  function handleMouseLeave() {
    const element = slabRef.current
    if (!element) return
    element.style.setProperty('--mouse-x', '50%')
    element.style.setProperty('--mouse-y', '35%')
    element.style.setProperty('--rotate-x', '0deg')
    element.style.setProperty('--rotate-y', '0deg')
  }

  return (
    <motion.button
      ref={slabRef}
      type="button"
      onClick={() => onSelect(card)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '35%',
        '--rotate-x': '0deg',
        '--rotate-y': '0deg',
        transform: 'perspective(900px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y))',
      } as CSSProperties}
      className="group relative overflow-hidden rounded-[2rem] border border-slate-600/60 bg-gradient-to-br from-slate-800 via-slate-950 to-black p-3 text-left shadow-holo outline-none transition-transform duration-150 focus-visible:ring-4 focus-visible:ring-red-500/50"
      aria-label={`Open pricing details for ${card.name}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,.26),rgba(244,114,182,.18)_18%,rgba(34,211,238,.16)_32%,transparent_56%)] opacity-70 mix-blend-color-dodge pointer-events-none transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,.08)_28%,transparent_46%,rgba(255,255,255,.06)_62%,transparent_100%)] pointer-events-none" />

      <div className="relative rounded-[1.45rem] border border-slate-500/60 bg-slate-900/95 p-2 shadow-inner">
        <div className="mb-2 flex items-center justify-between rounded-xl border border-slate-600/70 bg-slate-950/80 px-3 py-2">
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Premium Slab</span>
          <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white">#{card.rank}</span>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
          <img
            src={card.imageUrls.large}
            alt={`${card.name} Pokémon card artwork`}
            loading="lazy"
            className="aspect-[3/4.15] w-full object-contain p-3 drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.025]"
          />
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-950/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-100 backdrop-blur-md">
            <Sparkles className="h-3 w-3" /> Holo Indexed
          </div>
        </div>

        <div className="space-y-3 px-1 pt-4">
          <div>
            <h2 className="line-clamp-2 text-lg font-black tracking-tight text-white">{card.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{card.set} · {card.releaseYear}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(card.currentPrices) as GradeKey[]).map((grade) => {
              const price = card.currentPrices[grade]
              const isUp = price.direction === 'up'
              return (
                <div key={grade} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${gradeStyles[grade]}`}>
                  <span className="text-xs font-black uppercase tracking-wider">{gradeLabels[grade]}</span>
                  <span className="flex items-center gap-2">
                    <strong className="text-sm font-black">{money.format(price.value)}</strong>
                    <span className={isUp ? 'text-emerald-300' : 'text-red-300'}>
                      {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-[11px] font-bold leading-snug text-red-100">
            <BadgeDollarSign className="h-4 w-4 shrink-0 text-red-300" />
            Data aggregated from eBay, Goldin & Fanatics Collect.
          </div>
        </div>
      </div>
    </motion.button>
  )
}
