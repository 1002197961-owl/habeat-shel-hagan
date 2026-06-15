import { BRAND } from '@/lib/constants'

type Difficulty = 'easy' | 'medium' | 'hard'

const CONFIG: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy:   { label: 'קל',     color: BRAND.green,  bg: '#f0fdf4' },
  medium: { label: 'בינוני', color: BRAND.orange, bg: '#fff8f0' },
  hard:   { label: 'מאתגר', color: BRAND.rose,   bg: '#fff1f5' },
}

interface DifficultyBadgeProps {
  difficulty: Difficulty
  size?: 'sm' | 'md'
}

export function DifficultyBadge({ difficulty, size = 'sm' }: DifficultyBadgeProps) {
  const { label, color, bg } = CONFIG[difficulty]
  const pad  = size === 'sm' ? '3px 9px' : '5px 14px'
  const font = size === 'sm' ? 11 : 13
  return (
    <span style={{
      display: 'inline-block', background: bg, color,
      border: '1.5px solid ' + color + '55',
      borderRadius: 999, padding: pad, fontSize: font,
      fontWeight: 800, lineHeight: 1.4, userSelect: 'none',
    }}>
      {label}
    </span>
  )
}
