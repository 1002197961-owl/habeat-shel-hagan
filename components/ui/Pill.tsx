import { cn } from '@/lib/utils'

interface PillProps {
  children: React.ReactNode
  color: string
  className?: string
}

export function Pill({ children, color, className }: PillProps) {
  return (
    <span
      className={cn('pill text-xs font-bold', className)}
      style={{
        background:  `${color}22`,
        color,
        borderColor: `${color}44`,
      }}
    >
      {children}
    </span>
  )
}
