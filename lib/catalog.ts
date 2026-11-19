import type { DemoTrack } from './audio'

export const CATALOG_URL = 'https://oqwzjhqzjfhdlploezad.supabase.co'
export const CATALOG_KEY = 'sb_publishable_fDE7XnJ7POVT_UkylwNDcA_Eh3jdPVG'
export type LibraryTrack = {
  id: string; title: string; emoji: string; duration: string; color: string; prompt: string
  audio: {kind:'builtin';id:DemoTrack} | {kind:'recording';path:string;sha256:string;format:'sung'|'instrumental'}
  narrationId?: string
}
export const DEMO_TRACKS: LibraryTrack[] = [
  {id:'garden-hello',title:'בוקר של צלילים',emoji:'☀️',duration:'כ־19 שניות',color:'#FFD600',prompt:'בואו נקשיב, נמחא כפיים ונצטרף לקצב!',audio:{kind:'builtin',id:'garden-hello'},narrationId:'garden-hello-voice'},
  {id:'rain-dance',title:'טיפות רוקדות',emoji:'🌧️',duration:'כ־24 שניות',color:'#00B4E6',prompt:'איך נשמעות טיפות של גשם? בואו ננסה!',audio:{kind:'builtin',id:'rain-dance'},narrationId:'rain-dance-voice'},
  {id:'color-parade',title:'מצעד הצבעים',emoji:'🎨',duration:'כ־16 שניות',color:'#FF4DA6',prompt:'כל צבע מקבל צליל. בחרו צבע והצטרפו!',audio:{kind:'builtin',id:'color-parade'},narrationId:'color-parade-voice'},
]
export function safeAudioPath(path: unknown): path is string {
  return typeof path === 'string' && path.length <= 240 && /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.(mp3|wav|m4a|ogg)$/.test(path)
}
export function playableCatalogRow(value: unknown): LibraryTrack | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (row.published !== true || row.rights_status !== 'cleared') return null
  if (typeof row.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(row.id)) return null
  // Built-in scores are existing original exercises, not recordings of a familiar song.
  const demo = DEMO_TRACKS.find(t => t.id === row.id && row.builtin_audio_id === t.id)
  if (demo && !row.audio_object_path) return demo
  if (row.builtin_audio_id || row.recording_status !== 'approved' || !safeAudioPath(row.audio_object_path)) return null
  if (typeof row.rights_note !== 'string' || !row.rights_note.trim()) return null
  if (typeof row.recording_review_note !== 'string' || !row.recording_review_note.trim()) return null
  if (typeof row.recording_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(row.recording_sha256)) return null
  if (row.audio_kind !== 'sung' && row.audio_kind !== 'instrumental') return null
  if (typeof row.duration_sec !== 'number' || !Number.isFinite(row.duration_sec) || row.duration_sec <= 0 || row.duration_sec > 1800) return null
  for (const [key,max] of [['title',200],['description',1000],['emoji',16]] as const) {
    if (typeof row[key] !== 'string' || !(row[key] as string).trim() || (row[key] as string).length > max) return null
  }
  if (typeof row.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(row.color)) return null
  return {id:row.id,title:row.title as string,emoji:row.emoji as string,color:row.color,prompt:row.description as string,
    duration:`${Math.ceil(row.duration_sec)} שניות`,audio:{kind:'recording',path:row.audio_object_path,sha256:row.recording_sha256,format:row.audio_kind}}
}

export async function getApprovedRecording(track: LibraryTrack, signal: AbortSignal): Promise<string> {
  if (track.audio.kind !== 'recording') throw new Error('recording required')
  const response = await fetch(`${CATALOG_URL}/storage/v1/object/authenticated/song-audio/${track.audio.path}`, {
    headers:{apikey:CATALOG_KEY}, signal,
  })
  if (!response.ok) throw new Error('recording unavailable')
  const bytes = await response.arrayBuffer()
  if (signal.aborted || bytes.byteLength > 26214400) throw new Error('cancelled or oversized')
  const digest = await crypto.subtle.digest('SHA-256',bytes)
  const sha = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('')
  // Approval belongs to these exact bytes, not just a replaceable object path.
  if (sha !== track.audio.sha256) throw new Error('recording changed since approval')
  if (signal.aborted) throw new Error('cancelled')
  return URL.createObjectURL(new Blob([bytes],{type:response.headers.get('content-type') || 'audio/mpeg'}))
}
