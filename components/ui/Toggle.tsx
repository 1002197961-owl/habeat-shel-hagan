'use client'

interface ToggleProps {
  on: boolean
  onChange: () => void
  color?: string
}

export function Toggle({ on, onChange, color = '#22C55E' }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className="relative flex-shrink-0 cursor-pointer border-none outline-none"
      style={{
        width: 46, height: 26, borderRadius: 13,
        background: on ? color : '#d1d5db',
        transition: 'background 0.2s',
        padding: 0,
      }}
    >
      <span
        className="absolute"
        style={{
          width: 20, height: 20, borderRadius: 10,
          background: '#fff',
          top: 3,
          left: on ? 23 : 3,
          transition: 'left 0.2s',
          boxShadow: '0 2px 5px rgba(0,0,0,0.22)',
        }}
      />
    </button>
  )
}
