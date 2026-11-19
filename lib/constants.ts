export const BRAND = {
  pink:'#FF4DA6', orange:'#FFA500', yellow:'#FFD600', green:'#22C55E', cyan:'#00B4E6', purple:'#8B5CF6', navy:'#1E1B4B', rose:'#f43f5e',
} as const
export type BrandColor = keyof typeof BRAND
export const NAV_SCREENS = [
 {id:'turn-taking',href:'/turn-taking',label:'מנגנים עם הלהקה',emoji:'🥁',gradient:'linear-gradient(135deg,#00B4E6,#0096c7)',color:'#00B4E6',bg:'#f0f9ff'},
 {id:'magic-song',href:'/magic-song',label:'שיר הקסם',emoji:'⭐',gradient:'linear-gradient(135deg,#FFD600,#FFA500)',color:'#FFD600',bg:'#fffbeb'},
 {id:'library',href:'/library',label:'ספריית שירים',emoji:'📂',gradient:'linear-gradient(135deg,#22C55E,#15803d)',color:'#22C55E',bg:'#f0fdf4'},
 {id:'recording',href:'/recording',label:'הקלטה',emoji:'🎤',gradient:'linear-gradient(135deg,#FFA500,#d45500)',color:'#FFA500',bg:'#fff8f0'},
] as const
export type NavScreen=(typeof NAV_SCREENS)[number]
export const WAVE_COLORS=[BRAND.pink,BRAND.orange,BRAND.yellow,BRAND.green,BRAND.cyan,BRAND.purple]
