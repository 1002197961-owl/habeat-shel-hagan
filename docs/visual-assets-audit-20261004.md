# Pilot visual assets

## Included scope

Exactly eleven static idle/default control icons and three static R/G/M FRONT character panels are included. Voice, alternate poses, new artwork, V-D, celebrations, Band Sync and other character motion are excluded.

Locked BeatCore SVG geometry and CSS are unchanged. Original control-icon PNG bytes are unchanged. Complete character reference sheets are not included in the checkout or website export.

## FRONT-only output

Only `Front_R_v1.png` (335×333), `Front_G_v1.png` (255×420), and `Front_M_v1.png` (244×415) are shipped. Each was extracted from an exact integer source rectangle without resizing, recoloring, transparency changes, background removal or redrawing. All 319,915 pixels were checked against the source rectangles after PNG save/reload.

Public manifests retain output hashes, coordinates, dimensions and pixel-comparison results. Reference materials and release authorization records are maintained separately.

## Runtime behavior

`StaticCharacter` exposes only R/G/M FRONT identities. The locked BeatCore is separate from static body art. Turn mapping is ready/paused → idle, demonstration/response → playing, waiting → listening. Input receipt does not establish rhythmic accuracy, celebration success or Band Sync.

`PilotIcon` adds decorative static companions to existing labeled controls. Only play, stop, hear-again, hint, home, back, next, previous, close, confirm and try-again are enabled. No alternate drawn states are released. Audio handlers and highlighted narration remain unchanged.

## Verification boundary

Portable tests cover immutable core sources, semantic-only state changes, safe runtime values, exactly eleven source-hashed icons, exactly three FRONT-only files and exact source coordinates. Software tests do not establish physical hardware compatibility or listening quality.

## Child-facing placements

The existing FRONT images also appear in the home welcome area (G/R/M), the library introduction (G), the magic-song questions and waiting state (M), the magic-song result (G/R/M), the child guide (G/R/M), and the recording introduction (M). They are small, static, decorative companions in normal document flow, with no click targets, poses, state mapping, audio, or activity claims. White containers retain the images’ original white backgrounds without editing the PNGs.

The original turn-taking layout and behavior are unchanged. Teacher, station management, beat management, dashboard, and behind-the-scenes screens receive no added companions. Existing text, controls, narration, recording permissions, and song behavior are preserved.

Local presentation regression: `CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test-browser.mjs --characters-only` after a successful build. This checks the placements at 320, 390, 768, and 1280 pixels, question-to-result/reset transitions, recording mode selection without device permission, image loading, RTL, and horizontal bounds. All non-local requests are blocked in that test.
