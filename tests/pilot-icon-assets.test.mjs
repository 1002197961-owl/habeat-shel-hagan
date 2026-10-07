import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { loadTs } from './load-ts.mjs'

const { PILOT_ICONS_APPROVED, PILOT_ICON_FILES, pilotIconPath } = await loadTs('../lib/pilotIcons.ts')
const root = new URL('../public/assets/icons/pilot/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('../data/pilot-icon-manifest.json', import.meta.url), 'utf8'))

test('the bounded pilot mapping contains exactly 11 source-hashed static PNGs', () => {
  assert.equal(Object.keys(PILOT_ICON_FILES).length, 11)
  assert.equal(manifest.files.length, 11)
  if (PILOT_ICONS_APPROVED) assert.deepEqual(readdirSync(root).sort(), manifest.files.map(file => file.file).sort())
  for (const file of manifest.files) {
    assert.ok(Object.values(PILOT_ICON_FILES).includes(file.file))
    assert.match(file.sha256, /^[a-f0-9]{64}$/)
    if (PILOT_ICONS_APPROVED) {
      const bytes = readFileSync(new URL(file.file, root))
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.file)
    } else {
      assert.equal(existsSync(new URL(file.file, root)), false, 'Unapproved image must not be exported')
    }
  }
})

test('icon activation matches the bounded public manifest', () => {
  assert.equal(PILOT_ICONS_APPROVED, true)
  assert.equal(manifest.variants.length, 11)
  assert.equal(manifest.files.length, 11)
  for (const [name, file] of Object.entries(PILOT_ICON_FILES)) assert.equal(pilotIconPath(name), `/assets/icons/pilot/${file}`)
  assert.equal(pilotIconPath('__proto__'), null)
})
