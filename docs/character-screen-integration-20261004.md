# Static character screen integration

## Scope

The existing three FRONT PNGs are reused unchanged. No new drawings, poses, motion, voice, audio, dependencies, or interaction logic are introduced. This is a local working-tree change, not a published release.

| Route | Placement |
| --- | --- |
| `/` | G/R/M below the existing logo area |
| `/library` | G beside the existing introduction |
| `/magic-song` | M above questions and during waiting; G/R/M above the result |
| `/guide` | G/R/M below the child-guide introduction |
| `/recording` | M beside the existing recording instructions |

Companions remain in normal document flow, preserve image aspect ratios, are decorative for assistive technology, and cannot intercept clicks. Original white backgrounds are retained. Existing text and buttons remain intact.

The turn-taking game, locked BeatCore, original eleven control icons, teacher screens, station management, beat management, dashboard, and behind-the-scenes screen are unchanged.

## Verification

- Existing unit/asset tests: **50 passed**
- TypeScript: **passed**
- Production build/static export: **passed**, version `hb-a985fdc72065`
- Exported initial HTML: expected character identities verified on all five changed routes; original trio verified on turn-taking; no added characters on five management/administrative routes
- Image files, existing turn-taking source, core source, and dependency files: unchanged in the diff
- Whitespace check: passed
- Standalone ESLint: not run; the project has no ESLint setup. Next completed its build-time verification stage.

## Rendering verification limit

Responsive and interaction browser checks were prepared in `tests/browser-characters.mjs` for widths 320, 390, 768, and 1280, including magic-song waiting/result/reset and recording-mode selection without requesting devices. They **did not execute**: local Chromium could not create a required socket in this environment, and the supported cloud browser blocked the localhost preview. No screenshots are available, and rendered appearance/overflow must not be described as visually verified.

To run in a browser-capable environment after building:

```sh
CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test-browser.mjs --characters-only
```

That test blocks non-local page requests. Existing broader browser regression is unchanged and was not rerun because the browser could not start.
