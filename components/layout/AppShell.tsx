import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  bg?: string
  className?: string
}

export function AppShell({
  children,
  bg = '#f9fafb',
  className,
}: AppShellProps) {
  return (
    <div
      dir="rtl"
      className={cn('min-h-screen', className)}
      style={{ background: bg }}
    >
      {children}
    </div>
  )
}
