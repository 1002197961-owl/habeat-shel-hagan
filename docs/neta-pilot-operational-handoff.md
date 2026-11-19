# Neta Pilot — operational handoff

Updated: 2026-10-01

## P0 — known-good, preserve
- Narration works well in the current Neta Pilot.
- Per-word highlighting during narration is user-verified and must not regress.
- Current pilot branch: `neta-pilot-release`.
- Preview candidate lineage includes `56a63e98841c0baf05515e999ab396e998ff2e1e`.

## P1 — song audio
User verification: the song itself is not audible yet.
Trace and fix the existing chain only: audio asset → playback → timings → highlight.
Do not claim produced song audio unless an actual verified asset exists. Preserve narration/highlight behavior.

## P2 — approved characters and icons
Integrate only assets classified Approved / Ready for Integration. Do not redesign approved Character DNA or Icon DNA.

## P3 — character motion
Prepare the implementation requirements/assets/scripts/frames for Rhythm R-A (Pulse), Guitar G-A (Resonance), Keys M-B (Flow/Sequence), Voice (Wave/Breath), and Band Sync (5–7 frames). Final video generation must stop before any credit/payment action.

## P4 — Gate 1 isolation
Gate candidate is immutable for this work:
- branch: `pilot-release-01`
- commit: `384d325b0e32a598cbd2a0afefb007dec716ad28`
Primary hardware proof path: SimplyWorks/Pretorian RECEIVE:2 + switch → real input → app response → matching log.
Do not merge Neta Pilot work into the Gate candidate.

## P5 — child QA
Prepare Neta Pilot for child testing only when it represents the real available experience without broken/placeholder/admin/diagnostic surfaces.

## Reporting
GitHub is the technical source of truth. Record commits and QA evidence here/in repository QA docs. Escalate to Ravit only for a product decision, physical action, login only she can perform, credits/payment approval, or irreversible action.
