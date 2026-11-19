-- Shared, non-personal teaching catalog. No children, tenants or private recordings.
create table public.song_catalog (
  id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  title text not null check (length(title) between 1 and 200),
  artist text not null check (length(artist) between 1 and 200),
  category text not null check (category in ('folk', 'movement', 'nature', 'animals', 'holiday')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  age_level text not null check (age_level in ('3-4', '3-5', '4-5', '4-6', '5-6', '3-6')),
  bpm integer not null check (bpm between 40 and 220),
  duration_sec double precision check (duration_sec > 0 and duration_sec <= 1800),
  emoji text not null check (length(emoji) between 1 and 16),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  pattern text[] not null check (
    cardinality(pattern) between 1 and 32
    and array_position(pattern, null) is null
    and pattern <@ array['red', 'yellow', 'blue', 'green', 'purple', 'rest']::text[]
  ),
  description text not null check (length(description) between 1 and 1000),
  builtin_audio_id text check (builtin_audio_id in ('garden-hello', 'rain-dance', 'color-parade')),
  audio_object_path text unique check (
    audio_object_path ~ '^[a-zA-Z0-9_-][a-zA-Z0-9/_-]*\.(mp3|wav|m4a|ogg)$'
  ),
  rights_status text not null default 'pending' check (rights_status in ('pending', 'cleared')),
  rights_note text,
  published boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  constraint one_audio_source check (num_nonnulls(builtin_audio_id, audio_object_path) <= 1),
  constraint published_audio_cleared check (
    not published or num_nonnulls(builtin_audio_id, audio_object_path) = 0
    or (rights_status = 'cleared' and coalesce(length(trim(rights_note)), 0) > 0 and duration_sec is not null)
  )
);

alter table public.song_catalog enable row level security;
revoke all on public.song_catalog from anon, authenticated;
grant select on public.song_catalog to anon, authenticated;

create policy "Read published shared songs" on public.song_catalog
  for select to anon, authenticated using (published = true);

create index song_catalog_published_order_idx on public.song_catalog (sort_order, id) where published = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('song-audio', 'song-audio', false, 26214400,
  array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg']);

-- Bucket is private. Published shared audio is readable by catalog visitors via
-- expiring signed URLs. This is not storage for private/licensed-to-a-tenant audio.
create policy "Read cleared published song audio" on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'song-audio' and exists (
      select 1 from public.song_catalog song
      where song.audio_object_path = storage.objects.name
        and song.published = true and song.rights_status = 'cleared'
    )
  );

-- There are deliberately no client INSERT/UPDATE/DELETE policies.
-- Editors use the project dashboard until an authenticated editor role is built.
