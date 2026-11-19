# Magic Song audio audit and local reconstruction

Original audit: 2026-10-03 against `neta-pilot-release` at
`0f2caad9e049511c07d11c2998784470ad38115b`.

Reconstructed locally on 2026-10-04 from recorded source patches and tool output
after loss of the unpublished checkout. This is **reconstruction**, not exact
artifact recovery. It requires a new commit and fresh
verification. No backend query, audio generation, upload, push, or deployment
was performed during reconstruction.

## Result

**A personalized sung recording remains unavailable in this candidate.** The
remote baseline contains generated text and browser speech only. The reconstructed
local changes add real instrumental accompaniment and an asset-gated sung-audio
player. No suitable approved sung asset was found during the original audit.
Do not describe the sung result as completed or silently replace it with narration
or a demonstration voice.

## Sources checked in the original 2026-10-03 audit

- `app/magic-song/page.tsx`: `buildSong` assembles four lines from answers;
  the original result calls `speakHebrew`. No song audio URL, singing service,
  or timed lyrics recording was connected.
- `public/audio`: thirteen MP3 assets, comprising ten question narrations and
  three library instructions. These recovered files must remain unchanged.
- `lib/audio.ts`: three original instrumental oscillator scores, separate from
  sung recordings. They are not Magic Song stems.
- No approved personalized sung recording is included in this candidate.

## Minimum unblock

One of the following is needed before the promised personalized song can play:

1. An approved existing natural-Hebrew sung audio file, its exact lyrics, and
   permission to use that recording in this application; or
2. Explicit approval of a named generation/recording service, the intended
   information sent to it, and its credit or payment limit before generation.

Decide whether the first release is one explicitly labeled fixed sample or a
song that truly incorporates the child's chosen answers and free word. A fixed
sample must not masquerade as that child's generated song.

## Local implementation

- `components/audio/MagicSongPlayer.tsx` provides a clearly labeled instrumental
  rehearsal option using the existing original scores. Fast/medium/slow selects
  `color-parade`/`garden-hello`/`rain-dance` (120/100/80 BPM). The UI says there is
  no sung voice and the accompaniment is not fitted to the words. No word
  highlighting is invented for an instrumental score.
- Instrumental playback calls local `playMusic`/`stopMusic` in `lib/audio.ts`
  and reads static `DEMO_TRACKS` constants. It does not call Supabase or a backend.
- `data/magic-song-recordings.json` is deliberately empty. Missing matching
  singing is explicit; no pretend sung-playback button appears. Accompaniment
  remains independently playable.
- `lib/magicSong.ts` requires all ten exact answers, exact transcript/cues,
  Hebrew sung format, rights and recording approval, an alignment review, a
  safe bundled path, and an approved SHA-256. Local bytes are verified before
  an audio element is created. The empty manifest triggers no audio fetch.
- `hooks/useMagicSong.ts` reuses the existing media-clock player for word
  highlighting, play/replay, pause/resume, buffering, and reset. Stale fetches
  and pending starts are cancelled; object URLs are revoked; audio clears on
  navigation, unmount, and hidden tab. Starting narration stops accompaniment
  and singing.
- Approved static `PilotIcon` companions are restored through coordination with
  the asset reconstruction worker. Icons are decorative; Hebrew labels and all
  playback handlers remain the source of behavior.

## Personalization scope

There are nine three-way questions: **19,683 combinations**, followed by an
unbounded free-text word. The existing four-line template uses theme, hero,
feeling, place, action, and the free word. Instrument/tempo/ending/message are
not all incorporated by that template; rehearsal uses tempo only. This is not
a complete generative singing pipeline. Matching every answer in the gate
prevents a fixed recording from impersonating an arbitrary child's result.

## POC source inspection, 2026-10-03

The locked `pilot-release-01` commit `384d325b0e32a598cbd2a0afefb007dec716ad28`
was inspected read-only. It held only combined WAV/MP3 audio and a README, with
no isolated instrumental stems or procedural Python source. The README specified
36 seconds, 120 BPM, C major, vocal offsets 4/8/14/18/24 seconds, and eSpeakNG.
That mix was not copied into the app, source-separated, or substituted for final
singing. The three reusable original scores are distinct from the POC and retain
their existing timings. The Gate branch is outside this reconstruction.

## Acceptance criteria

1. Attach actual approved bytes with a SHA-256 and source/recording review.
2. Match displayed lyrics to that exact rendition, including repetitions.
3. Derive cues from the recording and review them; never estimate timings for
   arbitrary text.
4. Use audio `currentTime` for highlighting, preserving existing narration.
5. Verify play/replay, pause/resume, buffering, rejection, repeated clicks,
   reset, navigation, hidden tab, and stale asynchronous playback.
6. Check audible singing, words, and synchronization on the pilot device.
   Automated media-state checks do not establish listening quality.
7. Preserve all thirteen narration MP3s and all narration cue data.

## Verification provenance

Historical 2026-10-03 focused run: 29 tests passed, 0 failed; TypeScript passed.
Those historical passes do not certify this reconstructed tree. Fresh checks
must be recorded for the new candidate. Synthetic unit-test bytes are never
shipped as audio and do not establish final voice approval or real singing.

Fresh reconstruction check on 2026-10-04:

- `node --test tests/magic-song.test.mjs tests/audio-integration.test.mjs`:
  **29 passed, 0 failed**.
- `npm run typecheck`: **passed**.
- `git diff --check`: **passed**.
- Final aggregate build and browser checks belong to the combined candidate;
  this focused run does not claim either stage or physical listening approval.
