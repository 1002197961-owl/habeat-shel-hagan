import test from 'node:test'
import assert from 'node:assert/strict'
import {loadTs} from './load-ts.mjs'
const {createSequenceRound,beginSequenceResponse,receiveSequencePad,pauseSequence,nextSequenceLevel,sequenceDemoSchedule,padForInputSource}=await loadTs('../lib/sequenceGame.ts')
const {PAD_CUES}=await loadTs('../lib/instrumentProfile.ts')

test('three levels use only selected calibrated pad identities, without repeated single-pad sequences',()=>{
 assert.deepEqual(createSequenceRound(1,['green','orange','blue'],3).pads,['green','orange','blue'])
 assert.throws(()=>createSequenceRound(1,['green'],3), /Calibrate/)
 assert.throws(()=>createSequenceRound(1,['blue-left-inner','blue-right-inner'],3), /Calibrate/)
 assert.throws(()=>createSequenceRound(1,[],1))
 for(const level of [0,4,1.5])assert.throws(()=>createSequenceRound(1,['green'],level))
})

test('wrong pads receive another chance without advancing or erasing progress',()=>{
 let round=beginSequenceResponse(createSequenceRound(1,['green','orange','yellow'],3))
 round=receiveSequencePad(round,'green',1).round
 const wrong=receiveSequencePad(round,'yellow',2)
 assert.equal(wrong.accepted,false);assert.equal(wrong.round.index,1);assert.equal(wrong.round.mistakes,1)
 round=receiveSequencePad(wrong.round,'orange',3).round
 const last=receiveSequencePad(round,'yellow',4)
 assert.equal(last.accepted,true);assert.equal(last.round.phase,'completed');assert.equal(last.round.index,3)
})

test('demo, paused, completed and repeated event IDs never advance a sequence',()=>{
 const demo=createSequenceRound(1,['green'],1)
 assert.equal(receiveSequencePad(demo,'green',1).accepted,false)
 let round=beginSequenceResponse(createSequenceRound(1,['green','blue'],2))
 round=receiveSequencePad(round,'green',2).round
 assert.equal(receiveSequencePad(round,'green',2).accepted,false)
 assert.equal(receiveSequencePad(round,'green',1).accepted,false)
 assert.equal(receiveSequencePad(pauseSequence(round),'green',3).accepted,false)
 const complete=receiveSequencePad(round,'blue',3).round
 assert.equal(receiveSequencePad(complete,'green',4).accepted,false)
})

test('progression requires completion and finishes at level three; replay starts clean',()=>{
 for(let level=1;level<=3;level++){
  let round=createSequenceRound(level,['green','orange','blue'],level)
  assert.equal(nextSequenceLevel(round),null)
  round=beginSequenceResponse(round)
  for(let i=0;i<level;i++)round=receiveSequencePad(round,round.pads[i],i+1).round
  assert.equal(nextSequenceLevel(round),level===3?null:level+1)
  const replay=createSequenceRound(10+level,round.pads,level)
  assert.equal(replay.index,0);assert.equal(replay.phase,'demonstrating')
 }
})

test('adult tempo changes demonstration only; response has no countdown or timing score',()=>{
 for(const tempo of [650,900,1200]){
  const schedule=sequenceDemoSchedule(3,tempo)
  assert.deepEqual(schedule.steps.map(x=>x.atMs),[0,tempo,tempo*1.5])
  assert.equal(schedule.responseAtMs,tempo*4)
 }
 assert.throws(()=>sequenceDemoSchedule(3,100))
 assert.throws(()=>sequenceDemoSchedule(4,900))
})

test('source switches never retain a synthetic target absent from the real saved profile',()=>{
 assert.equal(padForInputSource('simulation','orange',['blue']),'green')
 assert.equal(padForInputSource('web-midi','orange',['blue']),'blue')
 assert.equal(padForInputSource('web-midi','yellow',['blue-left-inner']),'blue-left-inner')
 assert.equal(padForInputSource('web-midi','orange',['green','orange']),'orange')
 assert.equal(padForInputSource('web-midi','yellow',[]),'green')
})

test('all nine calibrated pad identities preserve order, retry and progress through every level',()=>{
 const pads=PAD_CUES.map(pad=>pad.id)
 assert.equal(pads.length,9)
 let checked=0,eventId=0
 for(let first=0;first<pads.length;first++) for(let count=1;count<=3;count++) for(let level=1;level<=3;level++) {
  if (count<level) continue
  const choices=Array.from({length:count},(_,i)=>pads[(first+i)%pads.length])
  let round=beginSequenceResponse(createSequenceRound(++checked,choices,level))
  for(let step=0;step<level;step++){
   const expected=round.pads[step],wrong=pads.find(pad=>pad!==expected)
   const snapshot=structuredClone(round)
   const retry=receiveSequencePad(round,wrong,++eventId)
   assert.equal(retry.accepted,false);assert.equal(retry.round.index,step)
   assert.equal(retry.round.mistakes,step+1);assert.equal(nextSequenceLevel(retry.round),null)
   assert.deepEqual(round,snapshot,'state transitions must not mutate the previous round')
   const correct=receiveSequencePad(retry.round,expected,++eventId)
   assert.equal(correct.accepted,true);assert.equal(correct.round.index,step+1)
   assert.equal(receiveSequencePad(correct.round,expected,eventId).accepted,false)
   round=correct.round
  }
  assert.equal(round.phase,'completed');assert.equal(round.index,level)
  assert.equal(nextSequenceLevel(round),level<3?level+1:null)
 }
 assert.equal(checked,54)
})

test('pausing at every step prevents late completion and replay starts with a fresh demonstration',()=>{
 for(let level=1;level<=3;level++) for(let completed=0;completed<level;completed++){
  let round=beginSequenceResponse(createSequenceRound(1,['green','orange','yellow'],level))
  for(let step=0;step<completed;step++)round=receiveSequencePad(round,round.pads[step],step+1).round
  const paused=pauseSequence(round)
  assert.equal(paused.index,0);assert.equal(paused.phase,'paused')
  assert.equal(nextSequenceLevel(paused),null)
  assert.equal(receiveSequencePad(paused,round.pads[completed],100).accepted,false)
  const replay=createSequenceRound(2,round.pads,level)
  assert.equal(replay.phase,'demonstrating');assert.equal(replay.index,0);assert.equal(replay.mistakes,0)
  assert.equal(receiveSequencePad(replay,replay.pads[0],101).accepted,false)
 }
})

test('new rounds rotate through all calibrated pads and never duplicate a pad in a bar',()=>{
 const choices=PAD_CUES.map(p=>p.id),seen=new Set()
 for(let id=1;id<=9;id++){
  const round=createSequenceRound(id,choices,3)
  assert.equal(new Set(round.pads).size,3)
  seen.add(round.pads[0])
 }
 assert.equal(seen.size,9)
 for(const level of [1,2,3]) {
  const slow=sequenceDemoSchedule(level,1200),fast=sequenceDemoSchedule(level,650)
  assert.equal(slow.responseAtMs,4800)
  assert.ok(slow.steps.every((step,i)=>step.atMs/1200===fast.steps[i].atMs/650))
  assert.ok(slow.steps.at(-1).atMs<slow.responseAtMs)
 }
})
