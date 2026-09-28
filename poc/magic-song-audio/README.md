# Magic Song POC — שיר הקסם

**Status:** TEMPORARY POC — not for production

| Field | Value |
|---|---|
| Duration | 36s |
| Tempo | 120 BPM |
| Key | C Major |
| TTS | eSpeak-NG v1.51 (local, `he` voice) |
| Backing | Procedural Python (ukulele strum / kick / clap / glock) |

## Vocal offsets
| Line | Offset | Text | Duration |
|---|---|---|---|
| 1 | 4.0s | שָׁם בַּיַּעַר הַיָּרֹק | 1.65s |
| 2 | 8.0s | אֲרִי חָבִיב אוֹהֵב לִצְחוֹק | 2.09s |
| 3 | 14.0s | קֶשֶׁת קֶסֶם בָּאֲוִיר | 1.38s |
| 4 | 18.0s | כָּל חַיָּה פּוֹצַחַת שִׁיר | 1.88s |
| 5 | 24.0s | אֵיזֶה כֵּיף בַּיַּעַר | 1.70s |

## Structure
- 0–4s: instrumental intro
- 4–27.5s: vocal sections (5 lines)
- 27.5–30s: instrumental tail
- 30–36s: fade out

## Files
- `magic-song-poc.mp3` — playable mix
- `magic-song-poc.wav` — lossless mix

## Next step
Replace eSpeak-NG with a production-quality Hebrew TTS
(e.g. Google Cloud TTS `he-IL-Wavenet-A` or Azure `he-IL-HilaNeural`)
for child-friendly voice quality.
