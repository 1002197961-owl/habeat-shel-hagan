import { pilotIconPath, type PilotIconName } from '@/lib/pilotIcons'

/** Decorative companion to an existing text label; never changes the control's behavior. */
export function PilotIcon({ name, size = 28 }: { name: PilotIconName; size?: number }) {
  const src = pilotIconPath(name)
  if (!src) return null
  return <img src={src} alt="" aria-hidden="true" width={size} height={size}
    data-pilot-icon={name} draggable={false}
    style={{ display: 'inline-block', width: size, height: size, objectFit: 'contain', verticalAlign: 'middle', flexShrink: 0 }} />
}
