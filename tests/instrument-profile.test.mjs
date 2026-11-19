import test from 'node:test'
import assert from 'node:assert/strict'
import {loadTs} from './load-ts.mjs'
const {parseProfile,matchProfile,mappingFor,learnPad,PAD_CUES}=await loadTs('../lib/instrumentProfile.ts')
const port={id:'software-fixture-1',name:'SOFTWARE FIXTURE',manufacturer:'TEST ONLY',state:'connected'}
test('all cue slots learn distinct actual channel/note messages and round-trip persistence',()=>{
 let p=null
 PAD_CUES.forEach((cue,i)=>{p=learnPad(p,port,cue.id,10,20+i)})
 const saved=parseProfile(JSON.stringify(p))
 assert.equal(saved.pads.length,9)
 assert.deepEqual(saved,p)
 assert.deepEqual(mappingFor(saved,matchProfile(saved,[port]),'blue'),{portId:port.id,channel:10,note:25})
})
test('same port identity reconnects, disconnected and metadata changes never match',()=>{
 const p=learnPad(null,port,'green',10,38)
 assert.equal(matchProfile(p,[]),null)
 assert.equal(matchProfile(p,[{...port,state:'disconnected'}]),null)
 assert.deepEqual(matchProfile(p,[{...port}]),port)
 assert.equal(matchProfile(p,[{...port,id:'new-browser-id'}]),null)
 assert.equal(matchProfile(p,[{...port,name:'another model'}]),null)
 assert.equal(matchProfile(p,[port,port]),null)
})
test('same model text cannot authorize a different physical port mapping',()=>{
 const p=learnPad(null,port,'green',10,38)
 assert.throws(()=>learnPad(p,{...port,id:'other-device'},'blue',10,39),/different-device/)
 assert.equal(mappingFor(p,null,'green'),null)
})
test('duplicate note assignments rejected but updating a pad preserves others',()=>{
 let p=learnPad(null,port,'green',10,38)
 assert.throws(()=>learnPad(p,port,'blue',10,38),/duplicate-pad/)
 p=learnPad(p,port,'blue',10,39);p=learnPad(p,port,'green',1,60)
 assert.equal(p.pads.length,2);assert.equal(p.pads.find(p=>p.id==='blue').note,39)
})
test('invalid and unknown profile versions are safely rejected',()=>{
 const p=learnPad(null,port,'green',10,38)
 for(const raw of ['{',null,JSON.stringify({...p,version:2}),JSON.stringify({...p,pads:[{id:'bogus',channel:1,note:1}]}),JSON.stringify({...p,pads:[{id:'green',channel:0,note:128}]}),JSON.stringify({...p,pads:[...p.pads,...p.pads]})]) assert.equal(parseProfile(raw),null)
})

test('four cyan zones retain distinct spatial identities without fabricated MIDI mapping',()=>{
 const blue=PAD_CUES.filter(p=>p.id.startsWith('blue'))
 assert.equal(PAD_CUES.length,9);assert.equal(blue.length,4)
 assert.equal(new Set(blue.map(p=>p.symbol)).size,4)
 assert.equal(new Set(blue.map(p=>p.column)).size,4)
 assert.ok(blue.every(p=>p.row===1 && !('note' in p)))
})
