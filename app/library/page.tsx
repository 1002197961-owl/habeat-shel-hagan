import { loadSongCatalog } from '@/lib/server/songCatalog'
import { SongLibrary } from '@/components/library/SongLibrary'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const catalog = await loadSongCatalog()
  return <SongLibrary songs={catalog.songs} source={catalog.source} />
}
