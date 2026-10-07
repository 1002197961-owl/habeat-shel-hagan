import type { NarrationAsset } from './narration'

export type MagicSongAnswers = Record<number, string>

// A recording belongs to one exact set of answers and one exact rendition.
// In particular, a recording of a sample cannot stand in for a new free word.
export interface MagicSongRecording extends NarrationAsset {
  kind: 'sung'
  language: 'he-IL'
  answers: string[]
  rightsStatus: 'cleared'
  rightsNote: string
  recordingStatus: 'approved'
  recordingReview: string
}

export function magicSongAnswerKey(answers: MagicSongAnswers): string[] {
  return Array.from({ length: 10 }, (_, index) => (answers[index] ?? '').trim())
}

export function magicSongText(lines: string[]): string {
  // Decoration is not part of sung lyrics. Preserve all words and punctuation.
  return lines.join(' ').replace(/\p{Extended_Pictographic}|\uFE0F/gu, '').replace(/\s+/gu, ' ').trim()
}

export function findMagicSongRecording(
  candidates: unknown,
  answers: MagicSongAnswers,
  lines: string[],
): MagicSongRecording | null {
  if (!Array.isArray(candidates)) return null
  const key = magicSongAnswerKey(answers)
  const text = magicSongText(lines)
  if (!text) return null
  for (const value of candidates) {
    if (!value || typeof value !== 'object') continue
    const row = value as Record<string, unknown>
    if (row.kind !== 'sung' || row.language !== 'he-IL') continue
    if (row.rightsStatus !== 'cleared' || row.recordingStatus !== 'approved') continue
    if (typeof row.rightsNote !== 'string' || !row.rightsNote.trim()) continue
    if (typeof row.recordingReview !== 'string' || !row.recordingReview.trim()) continue
    if (typeof row.id !== 'string' || !/^magic-song-[a-z0-9-]{1,80}$/.test(row.id)) continue
    if (typeof row.src !== 'string' || !/^\/audio\/magic-song\/[a-z0-9][a-z0-9_-]*\.(mp3|wav|m4a|ogg)$/.test(row.src)) continue
    if (typeof row.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(row.sha256)) continue
    if (!Array.isArray(row.answers) || row.answers.length !== 10 || !row.answers.every((answer, i) => answer === key[i])) continue
    if (row.text !== text) continue
    if (typeof row.duration !== 'number' || !Number.isFinite(row.duration) || row.duration <= 0 || row.duration > 600) continue
    if (!row.alignment || typeof row.alignment !== 'object') continue
    const alignment = row.alignment as Record<string, unknown>
    if (alignment.review !== 'approved' || typeof alignment.method !== 'string' || !alignment.method.trim()
      || typeof alignment.model !== 'string' || !alignment.model.trim()) continue
    if (!Array.isArray(row.words) || row.words.length === 0 || row.words.length > 2000) continue
    let previousEnd = 0
    const valid = row.words.every((cue: unknown) => {
      if (!cue || typeof cue !== 'object') return false
      const word = cue as Record<string, unknown>
      const ok = typeof word.word === 'string' && Boolean(word.word.trim())
        && typeof word.start === 'number' && Number.isFinite(word.start)
        && typeof word.end === 'number' && Number.isFinite(word.end)
        && word.start >= previousEnd && word.end > word.start && word.end <= (row.duration as number)
      if (ok) previousEnd = word.end as number
      return ok
    })
    if (!valid || row.words.map((word: {word: string}) => word.word).join(' ') !== text) continue
    return row as unknown as MagicSongRecording
  }
  return null
}

// Read and verify the bytes before an Audio element can be created. This is
// same-origin local audio only; this function never generates or uploads audio.
export async function loadMagicSongBytes(
  recording: MagicSongRecording,
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<Blob> {
  if (signal.aborted) throw new Error('cancelled')
  const response = await request(recording.src, { signal, credentials: 'same-origin' })
  if (!response.ok) throw new Error('recording unavailable')
  const contentLength = Number(response.headers.get('content-length'))
  if (contentLength > 25 * 1024 * 1024) throw new Error('recording too large')
  const bytes = await response.arrayBuffer()
  if (signal.aborted) throw new Error('cancelled')
  if (!bytes.byteLength || bytes.byteLength > 25 * 1024 * 1024) throw new Error('invalid recording size')
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  if (signal.aborted) throw new Error('cancelled')
  if (actual !== recording.sha256) throw new Error('recording changed since approval')
  const extension = recording.src.split('.').pop()
  const mime = extension === 'wav' ? 'audio/wav' : extension === 'ogg' ? 'audio/ogg' : extension === 'm4a' ? 'audio/mp4' : 'audio/mpeg'
  return new Blob([bytes], { type: mime })
}
