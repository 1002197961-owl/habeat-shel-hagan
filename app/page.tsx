import { LogoHero } from '@/components/home/LogoHero'
import { NavGrid }   from '@/components/home/NavGrid'

export default function HomePage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-home"
    >
      <LogoHero />
      <NavGrid />
      <footer className="text-center pb-6 text-white/30 text-xs">
        MVP · גרסת פיילוט 2026
      </footer>
    </main>
  )
}
