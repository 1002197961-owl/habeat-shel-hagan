import { AppShell } from './AppShell'
import { BackHeader } from './BackHeader'
interface ScreenWrapperProps {
  title: string; bg?: string; headerBg?: string
  backHref?: string; children: React.ReactNode; className?: string
}
export function ScreenWrapper({ title, bg, headerBg, backHref = '/', children, className = '' }: ScreenWrapperProps) {
  return (
    <AppShell bg={bg}>
      <BackHeader title={title} bg={headerBg} backHref={backHref} />
      <div className={`p-4 space-y-3 ${className}`.trim()}>{children}</div>
    </AppShell>
  )
}
