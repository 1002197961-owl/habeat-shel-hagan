import { AppShell }   from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'

export default function Page() {
  return (
    <AppShell bg="#eef2ff">
      <BackHeader title="דאשבורד עירוני 📊" bg="#1E1B4B" />
      <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center px-6">
        <p className="text-5xl">🚧</p>
        <p className="text-lg font-bold text-gray-700">דאשבורד עירוני 📊</p>
        <p className="text-sm text-gray-400">המסך הזה בפיתוח — בקרוב!</p>
      </div>
    </AppShell>
  )
}
