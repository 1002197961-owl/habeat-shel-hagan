// Exactly 11 original static variants are enabled for this pilot.
// Public file hashes and variant mapping are recorded in data/pilot-icon-manifest.json.
export const PILOT_ICONS_APPROVED = true

export const PILOT_ICON_FILES = {
  play: 'play_standard_idle.png',
  stop: 'stop_standard_idle.png',
  'hear-again': 'hear-again_standard_idle.png',
  hint: 'hint_standard_idle.png',
  home: 'home_standard_idle.png',
  back: 'back_standard_idle.png',
  next: 'next_standard_idle.png',
  previous: 'previous_standard_idle.png',
  close: 'close_standard_idle.png',
  confirm: 'confirm_standard_idle.png',
  'try-again': 'try-again_standard_default.png',
} as const

export type PilotIconName = keyof typeof PILOT_ICON_FILES

export function pilotIconPath(name: PilotIconName): string | null {
  if (!PILOT_ICONS_APPROVED || !Object.hasOwn(PILOT_ICON_FILES, name)) return null
  return `/assets/icons/pilot/${PILOT_ICON_FILES[name]}`
}
