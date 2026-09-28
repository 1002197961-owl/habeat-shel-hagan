import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'הביט של הגן',
  description: 'קצב. יצירה. דמיון. אפליקציה למוסיקה ויצירה בגן הילדים.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1E1B4B',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-heebo antialiased bg-gray-100 min-h-screen">
        <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl bg-white overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
