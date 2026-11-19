# HaBeat sequence-game candidate — 7 October 2026

## Status

Local review candidate only. Nothing has been pushed, deployed or published by this work.
Base: all 166 files from `neta-pilot-release` commit `5a1aeaaed061d8d0ebd7186b06731ab7243b6fc5`, independently matched to their remote Git blob hashes.
Local build: `hb-219143519672`, generated at 2026-10-07 17:05 UTC.
The local baseline commit in build-info identifies the reconstructed working copy, not a new remote release.

## Playable loop

- The home entry opens “מנגנים עם הלהקה” at `/turn-taking`.
- Three predictable levels demonstrate one, two, then three pad actions with the existing approved characters, pad colors, shapes and positions.
- Only calibrated pads selected by the adult enter the sequence, up to three choices. With one or two choices, a longer sequence repeats those choices.
- A child reproduces the ordered sequence. Only the next correct pad advances. A recognized wrong pad gives a gentle retry and preserves completed steps.
- Completing a level unlocks the next level; replay remains available. There is no response deadline or rhythmic-accuracy score.
- Adults can select starting level, demonstration tempo and calibrated pads. Stop, disconnect, source changes and page departure cancel pending demonstration/response work.
- Simple one/two-action turns remain available under adult settings. Software simulation stays explicitly labelled and cannot establish hardware readiness.

## Evidence and limits

- 65 unit tests passed, including six sequence-state/source-normalization tests.
- Typecheck and static build passed; 14 pages generated.
- Independent source review and 26 focused reviewer tests passed.
- Browser regression scripts are prepared and syntax-checked, but were not executed for this candidate. No new visual, actual-audio, tablet or physical-instrument pass is claimed.
- All 46 checked asset, recording, manifest and MIDI transport/calibration files remain identical to the remote base.
- The earlier three fixes remain: bounded BeatCore audio indication, larger child navigation/help targets, and compact question choices with preserved narration/highlighting.

The new browser fixture covers ordered levels, wrong-pad retry, duplicate/note-off filtering, demo/input separation, stop/disconnect, simulation-to-simple-turn targeting and return from simulation to a single-pad MIDI profile.

## Diagnostics

Actual input rows retain event IDs and add sequence round/step identifiers. Demonstration events are stored separately; they are never counted as physical input. `physicalProof` remains `NOT_AUTOMATICALLY_VERIFIED`; timing scores remain `NOT_IMPLEMENTED`.

## Before the child test

1. Obtain authorization before any quota-consuming CI, Preview deployment or other publication.
2. Verify the exact Preview build and run browser acceptance, including all three question choices while narration is playing/paused and the game’s full stop/replay/disconnect flow.
3. Confirm the actual tablet OS/browser and its input support. Test the SENOSEN instrument, cable and headphones on that tablet.
4. Calibrate each pad intended for play and compare observed physical actions, displayed pad/character response and matching exported event IDs. Do not treat a software fixture as this proof.
5. Check safe audible volume and ensure instrument or demonstration sound is actually heard. The existing demonstration uses the same original tone for every pad.

Music creation remains alongside the game. It still offers draft lyrics, narration and existing instrumental accompaniment; this patch does not create sung recordings, new voices, new artwork or a song-synchronized rhythm engine.

The locked `pilot-release-01` / `384d325b0e32a598cbd2a0afefb007dec716ad28` candidate and remote branches are untouched.
