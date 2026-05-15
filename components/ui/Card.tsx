import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function Card({ children, className, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'card',
        onClick && 'cursor-pointer transition-transform duration-150 active:scale-[0.98]',
        className
      )}
    >
      {children}
    </div>
  )
}
