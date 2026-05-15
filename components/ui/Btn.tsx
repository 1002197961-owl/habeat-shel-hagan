import { cn } from '@/lib/utils'

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bg?: string
  children: React.ReactNode
  full?: boolean
}

export function Btn({ bg, children, full, className, style, ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={cn(
        'font-extrabold text-white border-none rounded-btn',
        'transition-transform duration-150 active:scale-[0.97]',
        'cursor-pointer px-5 py-2.5 text-base',
        full && 'w-full',
        className
      )}
      style={{ background: bg, fontFamily: 'inherit', ...style }}
    >
      {children}
    </button>
  )
}
