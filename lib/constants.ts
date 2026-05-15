export const BRAND = {
  pink:   '#FF4DA6',
  orange: '#FFA500',
  yellow: '#FFD600',
  green:  '#22C55E',
  cyan:   '#00B4E6',
  purple: '#8B5CF6',
  navy:   '#1E1B4B',
  rose:   '#f43f5e',
} as const

export type BrandColor = keyof typeof BRAND

export const NAV_SCREENS = [
  {
    id:       'beat-manager',
    href:     '/beat-manager',
    label:    'מנהל הביט',
    emoji:    '🎛️',
    gradient: 'linear-gradient(135deg, #00B4E6, #0096c7)',
    color:    '#00B4E6',
    bg:       '#f0f9ff',
  },
  {
    id:       'magic-song',
    href:     '/magic-song',
    label:    'שיר הקסם',
    emoji:    '⭐',
    gradient: 'linear-gradient(135deg, #FFD600, #FFA500)',
    color:    '#FFD600',
    bg:       '#fffbeb',
  },
  {
    id:       'stations',
    href:     '/stations',
    label:    'תחנות נגינה',
    emoji:    '🎸',
    gradient: 'linear-gradient(135deg, #FF4DA6, #cc0077)',
    color:    '#FF4DA6',
    bg:       '#fff0f8',
  },
  {
    id:       'recording',
    href:     '/recording',
    label:    'הקלטה',
    emoji:    '🎤',
    gradient: 'linear-gradient(135deg, #FFA500, #d45500)',
    color:    '#FFA500',
    bg:       '#fff8f0',
  },
  {
    id:       'library',
    href:     '/library',
    label:    'ספריית שירים',
    emoji:    '📂',
    gradient: 'linear-gradient(135deg, #22C55E, #15803d)',
    color:    '#22C55E',
    bg:       '#f0fdf4',
  },
  {
    id:       'behind-scenes',
    href:     '/behind-scenes',
    label:    'מאחורי הקלעים',
    emoji:    '🎬',
    gradient: 'linear-gradient(135deg, #8B5CF6, #5b21b6)',
    color:    '#8B5CF6',
    bg:       '#f5f3ff',
  },
  {
    id:       'dashboard',
    href:     '/dashboard',
    label:    'דאשבורד עירוני',
    emoji:    '📊',
    gradient: 'linear-gradient(135deg, #1E1B4B, #312e81)',
    color:    '#1E1B4B',
    bg:       '#eef2ff',
  },
  {
    id:       'teacher',
    href:     '/teacher',
    label:    'מצב גננת',
    emoji:    '👩‍🏫',
    gradient: 'linear-gradient(135deg, #f43f5e, #FF4DA6)',
    color:    '#f43f5e',
    bg:       '#fff1f5',
  },
] as const

export type NavScreen = (typeof NAV_SCREENS)[number]

// Waveform bar colours (cycles through brand palette)
export const WAVE_COLORS = [
  BRAND.pink, BRAND.orange, BRAND.yellow,
  BRAND.green, BRAND.cyan, BRAND.purple,
]
