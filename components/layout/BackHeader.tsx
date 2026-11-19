'use client'

import Link from 'next/link'
import { PilotIcon } from '@/components/ui/PilotIcon'

interface BackHeaderProps {
  title: string
  bg?: string
  backHref?: string
  onBack?: () => void
}

export function BackHeader({
  title,
  bg = '#1E1B4B',
  backHref = '/',
  onBack,
}: BackHeaderProps) {
  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 flex items-center gap-2.5 px-4"
      style={{ background: bg, height: 56 }}
    >
      <Link
        href={backHref}
        onClick={onBack}
        aria-label="חזרה"
        className="flex items-center justify-center w-12 h-12 rounded-[10px] text-white text-lg flex-shrink-0 no-underline"
        style={{ background: 'rgba(255,255,255,0.25)' }}
      >
        <PilotIcon name="back" size={28} />
      </Link>
      <span className="text-white text-xl font-extrabold leading-none">
        {title}
      </span>
    </header>
  )
}
