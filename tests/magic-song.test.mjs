import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { loadTs } from './load-ts.mjs'

const { findMagicSongRecording, magicSongAnswerKey, magicSongText, loadMagicSongBytes } = await loadTs('../lib/magicSong.ts')
const answers = { 0:'חיות', 1:'ילדה קטנה', 2:'שמחה', 3:'ביער', 4:'שר', 5:'גיטרה', 6:'מהיר', 7:'חגיגה', 8:'להיות חברים', 9:'ניצוץ' }
const lines = ['שלום ניצוץ 🌟', 'שרים ביחד 🎉']
// Synthetic test bytes are never shipped as a song or accepted as listening QA.
const bytes = new TextEncoder().encode('AUTOMATED FIXTURE ONLY, NOT SONG AUDIO')
const approved = {
  id:'magic-song-fixture', src:'/audio/magic-song/fixture.mp3', text:'שלום ניצוץ שרים ביחד',
  duration:4, sha256:createHash('sha256').update(bytes).digest('hex'),
  kind:'sung', language:'he-IL', answers:magicSongAnswerKey(answers),
  rightsStatus:'cleared', rightsNote:'Fixture approval metadata for testing only',
  recordingStatus:'approved', recordingReview:'Fixture review, not human audio approval',
  alignment:{ method:'recorded-word-boundaries', model:'manual', review:'approved' },
  words:[{word:'שלום',start:.2,end:.6},{word:'ניצוץ',start:.8,end:1.4},{word:'שרים',start:2,end:2.5},{word:'ביחד',start:2.7,end:3.2}],
}

test('no singing is offered until an approved exact-answer recording exists', () => {
  assert.deepEqual(JSON.parse(readFileSync(new URL('../data/magic-song-recordings.json', import.meta.url))), [])
  assert.equal(findMagicSongRecording([], answers, lines), null)
  assert.equal(findMagicSongRecording(null, answers, lines), null)
  assert.equal(findMagicSongRecording([approved], answers, lines)?.id, approved.id)
})

test('all ten answers are matched; a static sample cannot impersonate personalization', () => {
  for (let index=0;index<10;index++) {
    assert.equal(findMagicSongRecording([approved], {...answers,[index]:'בחירה אחרת'},lines),null,`answer ${index}`)
  }
  assert.equal(findMagicSongRecording([approved],answers,['שלום קסם','שרים ביחד']),null)
  assert.equal(findMagicSongRecording([approved],{...answers,9:''},lines),null)
  assert.equal(magicSongText(lines),'שלום ניצוץ שרים ביחד')
  assert.equal(findMagicSongRecording([approved],{...answers,9:' ניצוץ '},lines)?.id,approved.id)
})

test('spoken, instrumental, unapproved, unreviewed, unsafe, or incomplete entries stay unavailable', () => {
  const invalid = [
    {kind:'speech'}, {kind:'instrumental'}, {language:'en-US'}, {rightsStatus:'pending'},
    {rightsNote:''}, {recordingStatus:'pending'}, {recordingReview:' '}, {sha256:''},
    {id:'poc'}, {src:'/audio/question-1.mp3'}, {src:'/audio/magic-song/../poc.mp3'},
    {src:'https://example.test/final.mp3'}, {src:'/audio/magic-song/final.mp3?unreviewed=1'},
    {duration:NaN}, {duration:0}, {duration:601}, {answers:[]}, {answers:[...approved.answers,'extra']},
    {alignment:{...approved.alignment,review:'pending'}}, {alignment:null}, {alignment:{...approved.alignment,method:''}},
    {words:[]}, {words:[{word:'wrong',start:0,end:1}]}, {words:[null]},
    {words:approved.words.map((word,index)=>index===1?{...word,start:.4}:word)},
    {words:approved.words.map((word,index)=>index===3?{...word,end:5}:word)},
    {words:approved.words.map((word,index)=>index===0?{...word,start:-1}:word)},
  ]
  for (const patch of invalid) assert.equal(findMagicSongRecording([{...approved,...patch}],answers,lines),null,JSON.stringify(patch))
  assert.equal(findMagicSongRecording([null,'wrong',{},approved],answers,lines)?.id,approved.id)
})

test('approved bytes are downloaded locally and hash-checked before playback', async () => {
  const signal = new AbortController().signal
  let calls=0
  const blob=await loadMagicSongBytes(approved,signal,async (url,options)=>{
    calls++;assert.equal(url,approved.src);assert.equal(options.signal,signal)
    assert.equal(options.credentials,'same-origin')
    return new Response(bytes,{status:200,headers:{'content-type':'audio/mpeg'}})
  })
  assert.equal(calls,1);assert.equal(blob.type,'audio/mpeg');assert.equal(blob.size,bytes.length)
})

test('changed, missing, oversized, or empty recording never reaches playback', async () => {
  const signal=new AbortController().signal
  for(const response of [new Response('changed',{status:200}),new Response('missing',{status:404}),new Response(bytes,{status:200,headers:{'content-length':String(26*1024*1024)}}),new Response(null,{status:200})]) {
    await assert.rejects(loadMagicSongBytes(approved,signal,async()=>response))
  }
})

test('cancelled verification cannot return late audio bytes', async () => {
  const alreadyCancelled=new AbortController();alreadyCancelled.abort()
  await assert.rejects(loadMagicSongBytes(approved,alreadyCancelled.signal,async()=>assert.fail('must not fetch')))
  const abort=new AbortController()
  let release
  const pending=loadMagicSongBytes(approved,abort.signal,()=>new Promise(resolve=>{release=resolve}))
  abort.abort();release(new Response(bytes,{status:200}))
  await assert.rejects(pending)
})

test('instrumental rehearsal uses existing cleared originals without touching narration bytes', () => {
  const component=readFileSync(new URL('../components/audio/MagicSongPlayer.tsx',import.meta.url),'utf8')
  assert.match(component,/playMusic\(backingId/)
  assert.match(component,/ליווי לניסיון/)
  assert.match(component,/ללא קול שר/)
  assert.match(component,/הליווי אינו מותאם למילים/)
  assert.doesNotMatch(component,/poc|eSpeak|speechSynthesis/)
})
