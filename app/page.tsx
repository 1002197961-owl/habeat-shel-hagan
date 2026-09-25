import { LogoHero }   from '@/components/home/LogoHero'
import { StatsStrip } from '@/components/home/StatsStrip'
import Link from 'next/link'
import { NavGrid }    from '@/components/home/NavGrid'

export default function HomePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-home">
      <LogoHero />
      <StatsStrip />
      <div className="px-5 pb-4"><Link href="/guide" className="block rounded-2xl bg-white/95 px-4 py-3 text-center font-black text-indigo-950 shadow-md">🎬 איך משחקים? הדרכה לילדים ולגננות</Link></div>
      <NavGrid />
      <footer className="text-center pb-10 pt-2 text-white/20 text-xs tracking-widest">
        MVP · גרסת פיילוט 2026
      </footer>
    </main>
  )
}
