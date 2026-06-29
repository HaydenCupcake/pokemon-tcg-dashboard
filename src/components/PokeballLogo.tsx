export function PokeballLogo() {
  return (
    <div className="relative h-11 w-11 rounded-full border-4 border-slate-950 bg-white shadow-lg shadow-red-950/50" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-red-600" />
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-slate-950" />
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-950 bg-white" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/45 via-transparent to-black/20" />
    </div>
  )
}
