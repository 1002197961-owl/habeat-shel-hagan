import { createClient } from '@supabase/supabase-js'
import catalogProject from './catalogProject.json'
import { BUILTIN_CATALOG, catalogSongFromRow, type CatalogSong } from '../musicCatalog'

export type CatalogSource = 'builtin' | 'supabase' | 'unavailable'
export const AUDIO_BUCKET = 'song-audio'

function catalogConfig() {
  // Public shared catalog configuration, never a privileged credential.
  // Explicit environment configuration overrides the entire pair; two empty
  // values opt into the offline demo without accidentally mixing projects.
  if (process.env.SUPABASE_URL !== undefined || process.env.SUPABASE_PUBLISHABLE_KEY !== undefined) {
    return { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_PUBLISHABLE_KEY }
  }
  return { url: catalogProject.url, key: catalogProject.publishableKey }
}

export function getCatalogClient() {
  const { url, key } = catalogConfig()
  if (!url || !key) return null
  if (!key.startsWith('sb_publishable_')) throw new Error('Only a publishable key is allowed for the shared catalog')
  // A publishable key only. Never use a service-role key to serve the shared catalog.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000), cache: 'no-store' }) } })
}

export async function loadSongCatalog(): Promise<{ songs: CatalogSong[]; source: CatalogSource }> {
  const { url, key } = catalogConfig()
  if (!url && !key) return { songs: BUILTIN_CATALOG, source: 'builtin' }
  try {
    const client = getCatalogClient()
    if (!client) throw new Error('Incomplete catalog configuration')
    const { data, error } = await client.from('song_catalog').select('*').eq('published', true).order('sort_order').limit(200)
    if (error || !data) throw new Error('Catalog unavailable')
    const songs = data.map(catalogSongFromRow)
    if (songs.some(song => song === null)) throw new Error('Invalid catalog row')
    return { songs: songs as CatalogSong[], source: 'supabase' }
  } catch {
    return { songs: BUILTIN_CATALOG, source: 'unavailable' }
  }
}
