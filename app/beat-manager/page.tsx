import { AppShell }   from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'

export default function Page() {
  return (
    <AppShell bg="#f0f9ff">
      <BackHeader title="מנהל הביט 🎛️" bg="#00B4E6" />
      <div className="flex flex-col items-center justify-center gap-3 pt-20 text-center px-6">
        <p className="text-5xl">🚧</p>
        <p className="text-lg font-bold text-gray-700">מנהל הביט 🎛️</p>
        <p className="text-sm text-gray-400">המסך הזה בפיתוח — בקרוב!</p>
      </div>
    </AppShell>
  )
}
