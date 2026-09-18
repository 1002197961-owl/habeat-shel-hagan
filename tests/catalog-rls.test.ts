import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { BUILTIN_CATALOG, catalogSongFromRow } from '../lib/musicCatalog'

// Real Postgres RLS in WASM; a minimal storage schema stands in for hosted Storage.
// This verifies SQL/permissions, not a live Supabase API or a Storage upload.
const db = new PGlite()
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id serial primary key, bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema public, storage to anon, authenticated;
    grant select, insert, update, delete on storage.objects to anon, authenticated;`)
  for (const file of readdirSync('supabase/migrations').filter(name => name.endsWith('.sql')).sort()) await db.exec(readFileSync(join('supabase/migrations', file), 'utf8'))
  await db.exec(readFileSync('supabase/seed.sql', 'utf8'))
  await db.exec(`insert into public.song_catalog
      (id,title,artist,category,difficulty,age_level,bpm,emoji,color,pattern,description,published)
    values ('private-draft','Draft','Editor','nature','easy','3-6',80,'🎵','#22c55e',array['red'],'Draft',false);
    update public.song_catalog set audio_object_path = 'approved/track.mp3', rights_status = 'cleared', rights_note = 'Test owned recording', duration_sec = 30 where id = 'yonatan-hakatan';
    insert into storage.objects (bucket_id,name) values ('song-audio','approved/track.mp3'), ('song-audio','unpublished.mp3'), ('another-bucket','approved/track.mp3');`)
}, 20000)
afterAll(async () => { await db.close() })

async function asRole<T>(role: 'anon' | 'authenticated', query: string) {
  await db.exec(`set role ${role}`)
  try { return await db.query<T>(query) } finally { await db.exec('reset role') }
}

describe('shared catalog database access', () => {
  it.each(['anon', 'authenticated'] as const)('%s sees only published rows and the matching approved audio object', async role => {
    const catalog = await asRole<{ id: string }>(role, 'select * from public.song_catalog order by sort_order')
    expect(catalog.rows).toHaveLength(BUILTIN_CATALOG.length)
    expect(catalog.rows.some(row => row.id === 'private-draft')).toBe(false)
    expect(catalog.rows.every(row => catalogSongFromRow(row) !== null)).toBe(true)
    const objects = await asRole<{ name: string }>(role, 'select name from storage.objects')
    expect(objects.rows).toEqual([{ name: 'approved/track.mp3' }])
  })

  it.each(['anon', 'authenticated'] as const)('%s cannot edit/delete songs or upload audio', async role => {
    await expect(asRole(role, "update public.song_catalog set title = 'Changed' where id = 'garden-hello'")).rejects.toThrow(/permission denied/)
    await expect(asRole(role, "delete from public.song_catalog where id = 'garden-hello'")).rejects.toThrow(/permission denied/)
    await expect(asRole(role, "insert into storage.objects (id,bucket_id,name) values (999,'song-audio','hijack.mp3')")).rejects.toThrow(/row-level security/)
  })

  it('hides audio after unpublishing its catalog entry', async () => {
    await db.exec("update public.song_catalog set published = false where id = 'yonatan-hakatan'")
    expect((await asRole('anon', 'select * from storage.objects')).rows).toHaveLength(0)
    await db.exec("update public.song_catalog set published = true where id = 'yonatan-hakatan'")
  })

  it('rejects publishing an unapproved recording and keeps the bucket private', async () => {
    await expect(db.exec("update public.song_catalog set rights_status = 'pending' where id = 'yonatan-hakatan'")).rejects.toThrow(/published_audio_cleared/)
    expect((await db.query<{ public: boolean }>("select public from storage.buckets where id = 'song-audio'")).rows[0].public).toBe(false)
  })
})
