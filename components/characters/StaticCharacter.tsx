import { staticCharacterViewport, type StaticCharacterId } from '@/lib/staticCharacters'

/** A static FRONT panel only. No new art, alternate pose, animation, or instrument is introduced. */
export function StaticCharacter({ character, height = 104, decorative = false }: {
  character: StaticCharacterId; height?: number; decorative?: boolean
}) {
  const view = staticCharacterViewport(character)
  if (!view) return null
  return <span data-static-character={character} data-character-pose="FRONT"
    role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : view.name} aria-hidden={decorative || undefined}
    style={{ display: 'inline-block', position: 'relative', overflow: 'hidden', width: height * view.width / view.height,
      maxWidth: '100%', aspectRatio: `${view.width} / ${view.height}`, flexShrink: 1, verticalAlign: 'bottom' }}>
    <img src={view.src} alt="" aria-hidden="true" draggable={false} width={view.width} height={view.height}
      style={{ display: 'block', width: '100%', height: 'auto' }} />
  </span>
}
