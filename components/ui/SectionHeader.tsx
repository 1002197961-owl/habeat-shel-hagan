import { BRAND } from '@/lib/constants'

interface SectionHeaderProps {
  title:     string
  subtitle?: string
  emoji?:    string
  action?:   React.ReactNode
}

export function SectionHeader({ title, subtitle, emoji, action }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 900, color: BRAND.navy, lineHeight: 1.2 }}>
          {emoji && <span style={{ marginLeft: 6 }}>{emoji}</span>}
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, marginTop: 3 }}>
            {subtitle}
          </div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
