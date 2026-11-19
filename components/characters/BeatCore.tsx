import { beatCoreSvg, LOCKED_CORE_CSS, type BeatCoreCharacter, type BeatCoreState } from '@/lib/beatCore'

type BeatCoreProps = {
  character?: BeatCoreCharacter
  state?: BeatCoreState
  size?: number
  decorative?: boolean
}

/** Approved BeatCore only. This does not stand in for an approved character body or animation. */
export function BeatCore({ character = 'R', state = 'idle', size = 84, decorative = false }: BeatCoreProps) {
  return (
    <span
      data-beat-core={character}
      data-core-state={state}
      aria-hidden={decorative || undefined}
      style={{ display: 'inline-block', width: size, height: size * 1.2, flexShrink: 0, verticalAlign: 'middle' }}
    >
      <style>{LOCKED_CORE_CSS}</style>
      <span style={{ display: 'block', width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: beatCoreSvg(character, state) }} />
    </span>
  )
}
