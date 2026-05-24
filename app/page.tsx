import { LogoHero }   from '@/components/home/LogoHero'
import { StatsStrip } from '@/components/home/StatsStrip'
import { NavGrid }    from '@/components/home/NavGrid'

export default function HomePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-home">
      <LogoHero />
      <StatsStrip />
      <NavGrid />
      <footer className="text-center pb-10 pt-2 text-white/20 text-xs tracking-widest">
        MVP · גרסת פיילוט 2026
      </footer>
    </main>
  )
}
