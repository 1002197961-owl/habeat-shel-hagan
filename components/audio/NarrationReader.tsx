'use client'
import type { NarrationAsset } from '@/lib/narration'
import type { NarrationControls } from '@/hooks/useNarration'
import { BRAND } from '@/lib/constants'
import { PilotIcon } from '@/components/ui/PilotIcon'

export function NarrationReader({asset, player, beforePlay, label = 'הקראה', compact = false}: {
  asset: NarrationAsset; player: NarrationControls; beforePlay?: () => void; label?: string; compact?: boolean
}) {
  const active = player.state.id === asset.id
  const status = active ? player.state.status : 'idle'
  const running = status === 'playing' || status === 'loading'
  const play = () => { beforePlay?.(); void player.play(asset) }
  const controlClass = compact ? 'min-h-12 rounded-xl px-2 py-2 text-sm font-bold' : 'min-h-11 rounded-xl px-3 py-2 font-bold'
  return <section dir="rtl" lang="he" aria-label={label} className="mt-3 text-right" data-narration={asset.id}>
    <p className="text-base font-bold leading-loose whitespace-pre-wrap" style={{color:BRAND.navy}} data-transcript>
      {asset.words.map((cue,i) => <span key={i}>
        <span data-word-index={i} data-active-word={active && player.state.wordIndex === i ? 'true' : 'false'}
          aria-current={active && player.state.wordIndex === i ? 'true' : undefined}
          style={active && player.state.wordIndex === i ? {background:BRAND.yellow,color:BRAND.navy,borderRadius:4,outline:`2px solid ${BRAND.navy}`,textDecoration:'underline',textUnderlineOffset:4} : undefined}>
          {cue.word}
        </span>{i < asset.words.length - 1 ? ' ' : ''}
      </span>)}
    </p>
    <div className={compact ? 'mt-2 grid grid-cols-3 gap-2' : 'mt-3 flex flex-wrap gap-2'}>
      <button type="button" onClick={play} aria-label={`הקרא שוב: ${label}`} className={compact ? `${controlClass} text-white` : 'rounded-xl px-4 py-3 font-extrabold text-white min-h-11'} style={{background:BRAND.purple}}>
        <PilotIcon name="hear-again" /> {status === 'idle' ? (compact ? 'הקראה' : 'הקראו לי') : 'שמעו שוב'}
      </button>
      {status === 'paused' && <button type="button" onClick={() => {beforePlay?.(); void player.resume()}} aria-label="המשך הקראה" className={`${controlClass} border-2`} style={{borderColor:BRAND.purple,color:BRAND.navy}}><PilotIcon name="play" /> {compact ? 'המשך' : 'המשך הקראה'}</button>}
      {(!compact || status !== 'paused') && <button type="button" onClick={player.pause} disabled={!running} className={`${controlClass} border-2 disabled:opacity-40`} style={{borderColor:BRAND.navy,color:BRAND.navy}}><PilotIcon name="stop" /> עצירה</button>}
      <button type="button" onClick={player.reset} disabled={status === 'idle'} aria-label="חזרה להתחלה" className={`${controlClass} border-2 disabled:opacity-40`} style={{borderColor:BRAND.navy,color:BRAND.navy}}><PilotIcon name="try-again" /> {compact ? 'להתחלה' : 'חזרה להתחלה'}</button>
    </div>
    {active && player.state.error && <p role="status" className="mt-2 text-sm text-red-800">{player.state.error}</p>}
    <span className="sr-only" role="status">{running ? 'הקראה פעילה' : status === 'paused' ? 'ההקראה נעצרה' : status === 'ended' ? 'ההקראה הסתיימה' : ''}</span>
  </section>
}
