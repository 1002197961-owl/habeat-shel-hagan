import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {loadTs} from './load-ts.mjs'
const {NarrationPlayer,wordAtTime,validateNarration}=await loadTs('../lib/narration.ts')
const {playableCatalogRow,safeAudioPath}=await loadTs('../lib/catalog.ts')
const data=JSON.parse(readFileSync(new URL('../data/narration.json',import.meta.url)))
const manifest=JSON.parse(readFileSync(new URL('../docs/recovery/manifest.json',import.meta.url)))

for(const [id,asset] of Object.entries(data))test(`recovered ${id}: exact recording and valid full transcript cues`,()=>{
 const bytes=readFileSync(new URL('../public'+asset.src,import.meta.url))
 const hash=createHash('sha256').update(bytes).digest('hex')
 assert.equal(hash,asset.sha256)
 assert.equal(hash,manifest.files.find(f=>f.path===asset.src.slice(1)).sha256)
 assert.ok(validateNarration(asset))
 for (let i=0;i<asset.words.length;i++) {
  const w=asset.words[i];assert.equal(wordAtTime(asset.words,(w.start+w.end)/2),i)
 }
 assert.equal(wordAtTime(asset.words,asset.duration),-1)
})
test('silence and invalid timestamps never activate the next word',()=>{
 assert.equal(wordAtTime([{word:'שלום',start:.5,end:1},{word:'גן',start:2,end:3}],1.5),-1)
 assert.equal(wordAtTime(data['question-1'].words,NaN),-1)
 assert.equal(validateNarration({...data['question-1'],text:'טקסט שונה'}),false)
})
class FakeAudio extends EventTarget {
 currentTime=0; paused=true; ended=false; src=''; removed=false
 constructor(src){super();this.src=src;this.playPromise=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject})}
 play(){this.paused=false;return this.playPromise}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'))}
 removeAttribute(){this.src='';this.removed=true}
 load(){}
 send(name){this.dispatchEvent(new Event(name))}
}
function setup(){
 const audios=[],frames=new Map(),states=[];let seq=0
 const player=new NarrationPlayer(s=>states.push(s),src=>{const a=new FakeAudio(src);audios.push(a);return a},fn=>{frames.set(++seq,fn);return seq},id=>frames.delete(id))
 return {player,audios,frames,states}
}
test('rapid replay ignores late play/ended/error from old recording',async()=>{
 const {player,audios}=setup()
 const p1=player.play(data['question-1']),p2=player.play(data['question-2'])
 audios[0].resolve();await p1
 audios[0].send('ended');audios[0].send('error')
 assert.equal(player.state.id,'question-2');assert.ok(audios[0].paused);assert.ok(audios[0].removed)
 audios[1].resolve();await p2
 assert.equal(player.state.status,'playing');player.dispose()
})
test('pause, resume, reset retain media position then clear all work',async()=>{
 const {player,audios,frames}=setup()
 const p=player.play(data['question-1']);audios[0].resolve();await p
 audios[0].currentTime=2.5;audios[0].send('timeupdate');assert.equal(player.state.wordIndex,5)
 player.pause();assert.equal(player.state.status,'paused');assert.equal(player.state.currentTime,2.5);assert.equal(frames.size,0)
 const resume=player.resume();assert.equal(audios[1].currentTime,2.5);audios[1].resolve();await resume
 player.reset();assert.equal(player.state.id,null);assert.equal(player.state.currentTime,0);assert.equal(player.state.wordIndex,-1);assert.equal(frames.size,0)
})
test('reset during pending play cannot resurrect sound or highlight',async()=>{
 const {player,audios}=setup();const p=player.play(data['question-3']);player.reset();audios[0].resolve();await p
 assert.equal(player.state.status,'idle');assert.ok(audios[0].paused);assert.ok(audios[0].removed)
})
test('highlight reads actual media clock and stops in buffering, end, and cleanup',async()=>{
 const {player,audios,frames}=setup();const p=player.play(data['question-1']);audios[0].resolve();await p
 audios[0].currentTime=4.2;audios[0].send('timeupdate');assert.equal(player.state.wordIndex,7)
 audios[0].send('waiting');assert.equal(player.state.wordIndex,-1);assert.equal(frames.size,0)
 audios[0].send('playing');assert.equal(player.state.wordIndex,7)
 audios[0].ended=true;audios[0].send('ended');assert.equal(player.state.wordIndex,-1)
 player.dispose();assert.equal(frames.size,0)
})
test('playback rejection presents an error and releases media',async()=>{
 const {player,audios}=setup();const p=player.play(data['question-1']);audios[0].reject(new Error('NotAllowedError'));await p
 assert.equal(player.state.status,'error');assert.ok(player.state.error);assert.ok(audios[0].removed)
})
const approved={id:'approved-example',title:'רשומת בדיקה',description:'בדיקה',emoji:'🎵',color:'#00B4E6',published:true,rights_status:'cleared',rights_note:'documented permission',recording_status:'approved',recording_review_note:'reviewed actual recording',recording_sha256:'a'.repeat(64),audio_object_path:'approved/example-v1.mp3',audio_kind:'sung',duration_sec:10,builtin_audio_id:null}
test('recording requires BOTH approvals, provenance, hash, duration and publication',()=>{
 assert.ok(playableCatalogRow(approved))
 for (const patch of [{published:false},{rights_status:'pending'},{recording_status:'pending'},{recording_status:undefined},{recording_sha256:''},{rights_note:''},{recording_review_note:''},{duration_sec:null},{audio_kind:'speech'},{audio_object_path:'../private.mp3'},{audio_object_path:'https://bad.example/a.mp3'}]) assert.equal(playableCatalogRow({...approved,...patch}),null,JSON.stringify(patch))
 assert.equal(playableCatalogRow({...approved,builtin_audio_id:'garden-hello'}),null)
 assert.equal(safeAudioPath('a//b.mp3'),false)
})
test('existing originals retain exact identity; empty/unapproved catalog is not published',()=>{
 const original=playableCatalogRow({id:'garden-hello',builtin_audio_id:'garden-hello',published:true,rights_status:'cleared',title:'changed remote title'})
 assert.equal(original.title,'בוקר של צלילים')
 assert.equal(playableCatalogRow({id:'foreign-song',builtin_audio_id:'garden-hello',published:true,rights_status:'cleared'}),null)
 assert.equal(playableCatalogRow(null),null)
})
test('stop cancels a music start waiting for AudioContext.resume',async()=>{
 let release,created=0
 globalThis.AudioContext=class {currentTime=0;destination={};resume(){return new Promise(r=>release=r)}createOscillator(){created++;throw Error('must not schedule')}}
 const {playMusic,stopMusic}=await loadTs('../lib/audio.ts')
 const pending=playMusic('garden-hello',()=>assert.fail('cancelled callback'))
 stopMusic();release();await pending;assert.equal(created,0)
})
