import { StaticCharacter } from './StaticCharacter'
import type { StaticCharacterId } from '@/lib/staticCharacters'

/** Quiet, in-flow companions: never cover controls or imply a character action. */
export function CharacterCompanions({ characters = ['G', 'R', 'M'], height = 88 }: {
  characters?: readonly StaticCharacterId[]; height?: number
}) {
  return <div data-character-companions className="flex items-end justify-center gap-3 pointer-events-none select-none" aria-hidden="true">
    {characters.map(character => <StaticCharacter key={character} character={character} height={height} decorative />)}
  </div>
}

export function CharacterIntro({ character, children }: {
  character: StaticCharacterId; children: React.ReactNode
}) {
  return <div className="flex items-center gap-3 rounded-2xl bg-white p-3" data-character-intro>
    <div className="shrink-0"><CharacterCompanions characters={[character]} height={80} /></div>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
}
