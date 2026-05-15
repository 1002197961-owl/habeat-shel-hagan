import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
})

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
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-heebo antialiased bg-gray-100 min-h-screen">
        <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl bg-white overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
