import { AppShell }   from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'

export default function Page() {
  return (
    <AppShell bg="#f0fdf4">
      <BackHeader title="ספריית שירים וקליפים 📂" bg="#22C55E" />
      <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center px-6">
        <p className="text-5xl">🚧</p>
        <p className="text-lg font-bold text-gray-700">ספריית שירים וקליפים 📂</p>
        <p className="text-sm text-gray-400">המסך הזה בפיתוח — בקרוב!</p>
      </div>
    </AppShell>
  )
}
