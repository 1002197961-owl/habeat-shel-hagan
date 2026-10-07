import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { loadTs } from './load-ts.mjs'

const sources = await loadTs('../lib/beatCoreSources.ts')
const rawModule = readFileSync(new URL('../lib/beatCore.ts', import.meta.url), 'utf8')
const withoutImport = rawModule.replace(/import .* from '\.\/beatCoreSources'\n/, '')
const { outputText } = ts.transpileModule(withoutImport, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
})
const injected = `const LOCKED_CORE_CSS = ${JSON.stringify(sources.LOCKED_CORE_CSS)};\nconst LOCKED_CORE_SVG = ${JSON.stringify(sources.LOCKED_CORE_SVG)};\n${outputText}`
const { beatCoreSvg, beatCoreStateForTurn } = await import(`data:text/javascript;base64,${Buffer.from(injected).toString('base64')}`)
const root = new URL('../public/assets/characters/beat-core/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'))

test('locked BeatCore public assets retain the source SHA-256 values', () => {
  for (const file of manifest.files) {
    const bytes = readFileSync(new URL(file.file, root))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.file)
  }
})

test('rendered sources exactly match the approved originals', () => {
  assert.equal(sources.LOCKED_CORE_CSS, readFileSync(new URL('BeatCore_LOCKED.css', root), 'utf8'))
  for (const role of ['R', 'G', 'V', 'M']) {
    const original = readFileSync(new URL(`BeatCore_${role}.svg`, root), 'utf8')
    assert.equal(sources.LOCKED_CORE_SVG[role], original)
    assert.equal(beatCoreSvg(role, 'idle'), original)
  }
})

test('all core states change only semantic SVG attributes, never geometry', () => {
  const geometry = svg => svg.replace(/data-state="[^"]*"/, '').replace(/aria-label="[^"]*"/, '')
  for (const role of ['R', 'G', 'V', 'M']) {
    for (const state of ['idle', 'listening', 'playing', 'success', 'band_sync']) {
      const rendered = beatCoreSvg(role, state)
      assert.ok(rendered.includes(`data-state="${state}"`))
      assert.equal(geometry(rendered), geometry(sources.LOCKED_CORE_SVG[role]))
    }
  }
})

test('turn feedback never invents success or Band Sync', () => {
  assert.equal(beatCoreStateForTurn('waiting'), 'listening')
  assert.equal(beatCoreStateForTurn('demonstrating', true), 'playing')
  assert.equal(beatCoreStateForTurn('responded', true), 'playing')
  assert.equal(beatCoreStateForTurn('demonstrating', false), 'listening')
  assert.equal(beatCoreStateForTurn('responded', false), 'idle')
  assert.equal(beatCoreStateForTurn('waiting', true), 'playing')
  for (const state of ['ready', 'paused', 'unknown']) assert.equal(beatCoreStateForTurn(state), 'idle')
})

test('completed turns cannot keep BeatCore playing after the tone ends', () => {
  assert.equal(beatCoreStateForTurn('responded'), 'idle')
  assert.equal(beatCoreStateForTurn('paused', true), 'idle')
  assert.equal(beatCoreStateForTurn('ready', true), 'idle')
})

test('unrecognized runtime values cannot enter inline SVG markup', () => {
  assert.equal(beatCoreSvg('<script>', '<script>'), sources.LOCKED_CORE_SVG.R)
  assert.equal(beatCoreSvg('__proto__', 'constructor'), sources.LOCKED_CORE_SVG.R)
})
