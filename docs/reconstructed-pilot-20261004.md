# Reconstructed Neta Pilot — 2026-10-04

This is a new local reconstruction from verified remote baseline `0f2caad9e049511c07d11c2998784470ad38115b`. The separate Gate candidate `384d325b0e32a598cbd2a0afefb007dec716ad28` is unchanged.

## Restored scope

- SENOSEN Web MIDI setup, actual-pad calibration, one-/two-action turns, failed-open protection, reconnect/restart handling, separate adult diagnostics and matching game/log event IDs
- Clearly labelled development simulation; no physical hardware proof claimed
- Approved unchanged 11 control icons, locked BeatCore, and FRONT-only R/G/M extracts; all crop hashes and all 319,915 pixels match the recorded approved outputs/source rectangles
- Existing local instrumental rehearsal and a same-origin, approval/hash-gated sung-audio player. No approved personalized sung recording exists; no new audio is generated
- Original narration MP3s, cue JSON, narration controller and instrumental audio implementation are unchanged from the remote baseline
- Branch-local Next.js static export configuration; no global deployment setting changed

## Fresh verification

- 50 of 50 unit tests passed in this reconstructed checkout
- TypeScript and optimized static build passed
- Browser/capture scripts passed syntax checks; whitespace/diff check passed
- Static export inspected: five key HTML routes, 11 icon PNGs and exactly three FRONT PNGs; no complete master-sheet PNG exported
- Chromium browser tests could not start because the executor denied its process socket. No browser assertion passed in that run; WebKit and physical SENOSEN were not tested
- Standalone lint remains unconfigured in the baseline repository and is not claimed as passed
- Browser/capture tests intercept this Supabase project's requests with a controlled offline response; no live backend request was made during verification

Build fingerprint: `hb-18f8f1c72887`. The clean-commit build-info file identifies the new source commit. See `docs/backend-dependency-audit-20261004.md` for the limited backend impact.

## Boundaries

This document records reconstruction checks. Publication and deployment are separate release steps.

Physical acceptance still requires the actual SENOSEN model, MIDI cable/adapter and Android/Chrome device: learn the real pad, compare an observed hit with the game and its matching event ID, verify sound, release, two quick hits and disconnect/reconnect. A software fixture is not a substitute.
