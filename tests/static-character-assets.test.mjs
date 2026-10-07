import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { loadTs } from './load-ts.mjs'

const { STATIC_CHARACTERS, staticCharacterViewport } = await loadTs('../lib/staticCharacters.ts')
const manifest = JSON.parse(readFileSync(new URL('../data/static-character-manifest.json', import.meta.url), 'utf8'))
const root = new URL('../public/assets/characters/front/', import.meta.url)

test('only the three approved FRONT rectangles are shipped, with verified lossless extraction hashes', () => {
  assert.deepEqual(Object.keys(STATIC_CHARACTERS).sort(), ['G', 'M', 'R'])
  assert.equal(manifest.length, 3)
  assert.deepEqual(readdirSync(root).sort(), manifest.map(item => item.outputFile).sort())
  for (const item of manifest) {
    const bytes = readFileSync(new URL(item.outputFile, root))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.outputSHA256)
    assert.equal(bytes.readUInt32BE(16), item.viewportPx.width)
    assert.equal(bytes.readUInt32BE(20), item.viewportPx.height)
    assert.equal(item.pixelVerification.allPixelsEqualSourceRectangle, true)
    assert.equal(item.pixelVerification.comparedPixelCount, item.viewportPx.width * item.viewportPx.height)
    assert.match(item.pixelVerification.rowMajorPixelSHA256, /^[a-f0-9]{64}$/)
  }
})

test('runtime images use FRONT-only files derived from exactly the approved coordinates', () => {
  for (const item of manifest) {
    const viewport = staticCharacterViewport(item.character)
    const expected = item.viewportPx
    for (const key of ['x', 'y', 'width', 'height']) assert.equal(viewport[key], expected[key])
    assert.equal(viewport.src, `/assets/characters/front/${item.outputFile}`)
    assert.equal(viewport.file.startsWith('Master_'), false)
    assert.ok(expected.x >= 0 && expected.x + expected.width <= 1536)
    assert.ok(expected.y >= 0 && expected.y + expected.height <= 1024)
  }
  assert.equal(staticCharacterViewport('V'), null)
  assert.equal(staticCharacterViewport('__proto__'), null)
})
