# Multi-pad input correction

## Confirmed code defects
- The former turn-taking page held one channel/note mapping in React state only. Learning another pad replaced it, and reconnecting cleared it.
- No target color or distinct non-color cue was shown to the child.
- Static FRONT characters did not show event-linked feedback; the separate small BeatCore followed turn state alone.

## Local implementation
- Nine adult-confirmed color/shape/position slots from the pictured pad layout, including four separately numbered cyan zones, each learned from a real incoming channel/note; no predefined SENOSEN note map or fabricated device identity.
- Version-1 validated local-storage profile. Exact port ID, name and manufacturer must match for automatic restoration. Different identities never match from model names alone.
- Automatic connection only when the browser reports MIDI permission is already granted; otherwise a connect button remains available. Disconnect pauses the task; reconnect never completes or restarts a round by itself.
- Export/import for transferring calibration. A different port requires explicit adult confirmation, followed by physical checking of every pad. A matching software identity does not establish a physical unit's identity.
- Large target color plus distinct shape/text, event-linked outline around approved FRONT assets, and existing approved BeatCore playing state. No new artwork, voice, motion generation or replacement character assets.
- Every learned pad gives feedback during the game; only the requested pad advances the turn. Unknown messages, note-off, identical duplicate delivery and stale input do not count.
- Reports include profile, expected pad, recognized pad and event IDs. Timing remains browser DOM/audio-scheduling timing, never claimed as physical-to-visible latency.

## Verification
- 56 unit tests pass: 50 existing plus six profile tests covering all nine slots, persistence, reconnect, changed/ambiguous identity rejection, duplicate-note rejection, updates and malformed/unsupported versions.
- Typecheck and static production build pass locally.
- Added multi-pad browser fixture to the standard browser-check command. Local browser execution is blocked by the execution environment's Chromium socket restriction; this is NOT a browser pass. CI must execute these fixtures before release.
- No physical hardware verification. Cable data capability, actual MIDI messages, pad labels and perceived character/audio response still require a connected-instrument observation.
- No publication or deployment performed.

## Storage limits
Profiles belong to this browser and site origin. New devices, browser-data clearing and different origins may require importing the exported profile. Device model/name does not imply universal MIDI note assignments.
