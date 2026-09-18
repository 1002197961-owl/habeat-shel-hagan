import { ORIGINAL_SCORES, catalogSongFromRow } from '@/lib/musicCatalog'
import { AUDIO_BUCKET, getCatalogClient } from '@/lib/server/songCatalog'
import { audioResponse, renderOriginalWav } from '@/lib/wavAudio'

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return new Response('Not found', { status: 404 })
  if (Object.hasOwn(ORIGINAL_SCORES, id)) {
    return audioResponse(renderOriginalWav(id)!, request.headers.get('range'))
  }
  try {
    const client = getCatalogClient()
    if (!client) return new Response('Audio not available', { status: 404 })
    const { data, error } = await client.from('song_catalog').select('*').eq('id', id).eq('published', true).maybeSingle()
    if (error) return new Response('Catalog temporarily unavailable', { status: 503 })
    const song = catalogSongFromRow(data)
    if (!song?.audio) return new Response('Audio not available', { status: 404 })
    if (song.audio.kind === 'builtin') return audioResponse(renderOriginalWav(song.audio.scoreId)!, request.headers.get('range'))
    const signed = await client.storage.from(AUDIO_BUCKET).createSignedUrl(song.audio.path, 3600)
    if (signed.error || !signed.data) return new Response('Audio temporarily unavailable', { status: 503 })
    return new Response(null, { status: 307, headers: { Location: signed.data.signedUrl, 'Cache-Control': 'no-store' } })
  } catch {
    return new Response('Audio temporarily unavailable', { status: 503 })
  }
}
