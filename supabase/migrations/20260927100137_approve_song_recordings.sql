-- An approval is tied to the exact recording bytes. Unapproved drafts stay private.
begin;
alter table public.song_catalog
  add column recording_status text not null default 'pending' check (recording_status in ('pending','approved','rejected')),
  add column recording_sha256 text check (recording_sha256 ~ '^[a-f0-9]{64}$'),
  add column recording_review_note text,
  add column audio_kind text check (audio_kind in ('sung','instrumental'));

-- Preserve the three original instrumental exercises. Any uploaded recording
-- requires its own review; do not infer approval from a rights flag.
update public.song_catalog set audio_kind='instrumental'
  where builtin_audio_id in ('garden-hello','rain-dance','color-parade') and audio_object_path is null;
update public.song_catalog set published=false
  where published and not (
    rights_status='cleared' and coalesce(length(trim(rights_note)),0)>0
    and duration_sec is not null
    and builtin_audio_id is not null and audio_object_path is null
  );

alter table public.song_catalog drop constraint published_audio_cleared;
alter table public.song_catalog add constraint published_audio_cleared check (
  not published or (
    rights_status='cleared' and coalesce(length(trim(rights_note)),0)>0
    and duration_sec is not null
    and (
      (builtin_audio_id is not null and audio_object_path is null)
      or (builtin_audio_id is null and audio_object_path is not null
        and recording_status='approved' and recording_sha256 is not null
        and coalesce(length(trim(recording_review_note)),0)>0
        and audio_kind is not null)
    )
  )
);

drop policy "Read published shared songs" on public.song_catalog;
create policy "Read published shared songs" on public.song_catalog
  for select to anon, authenticated using (
    published=true and rights_status='cleared'
    and (builtin_audio_id is not null or
      (recording_status='approved' and recording_sha256 is not null and audio_object_path is not null))
  );

drop policy "Read cleared published song audio" on storage.objects;
create policy "Read cleared published song audio" on storage.objects
  for select to anon, authenticated using (
    bucket_id='song-audio' and exists (
      select 1 from public.song_catalog song
      where song.audio_object_path=storage.objects.name
        and song.published=true and song.rights_status='cleared'
        and song.recording_status='approved' and song.recording_sha256 is not null
    )
  );
commit;
