import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, ShieldCheck, X } from 'lucide-react'
import { useEffect } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { GradeKey, PokemonCardPriceRecord } from '../types'

interface CardModalProps {
  card: PokemonCardPriceRecord | null
  onClose: () => void
}

type ChartPoint = PokemonCardPriceRecord['history'][number]

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const gradeMeta: Record<GradeKey, { label: string; color: string }> = {
  psa8: { label: 'PSA 8.0', color: '#fb923c' },
  psa9: { label: 'PSA 9.0', color: '#cbd5e1' },
  psa10: { label: 'PSA 10', color: '#fbbf24' },
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey?: string | number
    value?: number | string
    payload?: ChartPoint
  }>
  label?: string | number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload

  return (
    <div className="min-w-72 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">{label} · {point?.date}</p>
      <div className="mt-3 space-y-2">
        {payload.map((entry) => {
          const key = entry.dataKey as GradeKey
          const meta = gradeMeta[key]
          return (
            <div key={key} className="flex items-start justify-between gap-4 text-sm">
              <span className="font-bold" style={{ color: meta.color }}>{meta.label}</span>
              <span className="text-right">
                <strong className="block text-white">{money.format(Number(entry.value))}</strong>
                <span className="text-xs text-slate-400">Updated valuation point</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CardModal({ card, onClose }: CardModalProps) {
  useEffect(() => {
    if (!card) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [card, onClose])

  return (
    <AnimatePresence>
      {card ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.article
            role="dialog"
            aria-modal="true"
            aria-label={`${card.name} pricing deep dive`}
            className="premium-scrollbar relative max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-holo"
            initial={{ scale: 0.94, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-slate-950/80 p-3 text-slate-200 shadow-xl transition hover:bg-red-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-500/40"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
              <section className="relative border-b border-white/10 bg-slate-950/60 p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_18%,rgba(220,38,38,.18),transparent_36rem)]" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-full border border-red-400/30 bg-red-950/50 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-red-200">
                    Collector Deep Dive #{card.rank}
                  </div>

                  <div className="mx-auto max-w-sm rounded-[1.75rem] border border-slate-500/50 bg-slate-900 p-3 shadow-2xl">
                    <img
                      src={card.imageUrls.large}
                      alt={`${card.name} high resolution artwork`}
                      className="aspect-[3/4.15] w-full rounded-2xl object-contain bg-slate-950 p-3"
                    />
                  </div>

                  <h2 className="mt-6 text-3xl font-black tracking-tight text-white">{card.name}</h2>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <dt className="text-slate-500">Set</dt>
                      <dd className="mt-1 font-bold text-slate-100">{card.set}</dd>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <dt className="text-slate-500">Release</dt>
                      <dd className="mt-1 font-bold text-slate-100">{card.releaseYear}</dd>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <dt className="text-slate-500">Artist</dt>
                      <dd className="mt-1 font-bold text-slate-100">{card.artist}</dd>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <dt className="text-slate-500">Rarity</dt>
                      <dd className="mt-1 font-bold text-slate-100">{card.rarity}</dd>
                    </div>
                  </dl>

                  <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-glow transition hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/40" type="button">
                    Buy Now <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </section>

              <section className="p-6 lg:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">12-month grade model</p>
                    <h3 className="mt-2 text-3xl font-black text-white">PSA Valuation History</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      Current card pricing is paired with modeled PSA grade curves to present a consistent 12-month valuation view.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 px-4 py-3 text-sm font-bold text-emerald-200">
                    <ShieldCheck className="h-5 w-5" /> Current pricing + modeled grades
                  </div>
                </div>

                <div className="mt-8 h-[420px] rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={card.history} margin={{ top: 18, right: 26, left: 22, bottom: 8 }}>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.45} />
                      <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => money.format(Number(value)).replace('.00', '')} width={92} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#dc2626', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      {(Object.keys(gradeMeta) as GradeKey[]).map((grade) => (
                        <Line
                          key={grade}
                          type="monotone"
                          dataKey={grade}
                          name={gradeMeta[grade].label}
                          stroke={gradeMeta[grade].color}
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: '#020617' }}
                          activeDot={{ r: 7, strokeWidth: 2 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {(Object.keys(card.currentPrices) as GradeKey[]).map((grade) => {
                    const price = card.currentPrices[grade]
                    return (
                      <div key={grade} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: gradeMeta[grade].color }}>{gradeMeta[grade].label}</p>
                        <p className="mt-2 text-2xl font-black text-white">{money.format(price.value)}</p>
                        <p className={price.direction === 'up' ? 'mt-1 text-sm font-bold text-emerald-300' : 'mt-1 text-sm font-bold text-red-300'}>
                          {price.direction === 'up' ? '+' : ''}{price.trend30d}% last 30d
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </motion.article>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
