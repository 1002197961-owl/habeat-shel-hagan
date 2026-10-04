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
