import { ORIGINAL_SCORES } from './musicCatalog'

export const SAMPLE_RATE = 22050

/** Render a bounded, deterministic original score as mono 16-bit PCM WAV. */
export function renderOriginalWav(scoreId: string): Uint8Array | null {
  if (!Object.hasOwn(ORIGINAL_SCORES, scoreId)) return null
  const score = ORIGINAL_SCORES[scoreId]
  const beatSeconds = 60 / score.bpm
  const sampleCount = Math.round(score.notes.length * beatSeconds * SAMPLE_RATE)
  const buffer = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(buffer)
  const label = (offset: number, value: string) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)))
  label(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); label(8, 'WAVE'); label(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true); view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); label(36, 'data'); view.setUint32(40, sampleCount * 2, true)
  for (let index = 0; index < sampleCount; index++) {
    const t = index / SAMPLE_RATE
    const beat = Math.min(score.notes.length - 1, Math.floor(t / beatSeconds))
    const local = t - beat * beatSeconds
    const note = score.notes[beat]
    const frequency = 440 * 2 ** ((note - 69) / 12)
    const envelope = Math.min(1, local / 0.008) * Math.exp(-local * 5) * Math.min(1, (beatSeconds - local) / 0.025)
    const melody = note ? (Math.sin(2 * Math.PI * frequency * local) + 0.22 * Math.sin(4 * Math.PI * frequency * local)) * envelope * 0.30 : 0
    const click = Math.sin(2 * Math.PI * (beat % 4 === 0 ? 95 : 160) * local) * Math.exp(-local * 45) * Math.min(1, local / 0.003) * 0.17
    view.setInt16(44 + index * 2, Math.round((melody + click) * 32767), true)
  }
  return new Uint8Array(buffer)
}

/** Native media controls use single byte ranges to seek without fetching the whole file. */
export function audioResponse(bytes: Uint8Array, range: string | null): Response {
  const headers = new Headers({ 'Content-Type': 'audio/wav', 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' })
  if (!range) {
    headers.set('Content-Length', String(bytes.length))
    return new Response(bytes.slice().buffer, { headers })
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range)
  let start = 0
  let end = bytes.length - 1
  if (match && (match[1] || match[2])) {
    if (!match[1]) start = Math.max(0, bytes.length - Number(match[2]))
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])) }
  } else start = bytes.length
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.length || start < 0) {
    headers.set('Content-Range', `bytes */${bytes.length}`)
    return new Response(null, { status: 416, headers })
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.length}`)
  headers.set('Content-Length', String(end - start + 1))
  return new Response(bytes.slice(start, end + 1).buffer, { status: 206, headers })
}
