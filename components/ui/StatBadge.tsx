interface StatBadgeProps {
  value:   string | number
  label:   string
  emoji:   string
  color:   string
}

export function StatBadge({ value, label, emoji, color }: StatBadgeProps) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '10px 6px',
        borderRadius: 14,
        background: `${color}18`,
        border: `1.5px solid ${color}33`,
      }}
    >
      <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 3 }}>{emoji}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginTop: 3 }}>{label}</div>
    </div>
  )
}
