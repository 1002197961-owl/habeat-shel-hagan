import test from 'node:test'
import assert from 'node:assert/strict'
import {loadTs} from './load-ts.mjs'
const {TurnTone}=await loadTs('../lib/turnTone.ts')
function installAudioFixture({running=true}={}) {
 const contexts=[]
 globalThis.AudioContext=class {
  currentTime=1;destination={};state='suspended';baseLatency=0.01;nodes=[];closed=0
  constructor(){contexts.push(this)}
  async resume(){if(running)this.state='running'}
  createOscillator(){
   const node={type:null,frequency:{value:0},starts:[],stops:[],disconnected:false,onended:null,
    connect(target){return target},start(at){this.starts.push(at)},stop(at){this.stops.push(at)},disconnect(){this.disconnected=true}}
   this.nodes.push(node);return node
  }
  createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this},disconnect(){}}}
  async close(){this.closed++;this.state='closed'}
 }
 return contexts
}
test('turn tone only schedules after a running audio context is prepared',async()=>{
 const contexts=installAudioFixture(),tone=new TurnTone();assert.equal(tone.play(),null)
 await tone.prepare();const played=tone.play()
 assert.ok(played.scheduledAtMs>=0);assert.equal(played.contextTime,1);assert.equal(contexts[0].nodes.length,1)
 assert.deepEqual(contexts[0].nodes[0].starts,[1]);assert.deepEqual(contexts[0].nodes[0].stops,[1.24]);tone.dispose()
})
test('stop, repeated start and disposal leave no active tone behind',async()=>{
 const contexts=installAudioFixture(),tone=new TurnTone();await tone.prepare()
 tone.play();tone.play();const first=[...contexts[0].nodes]
 tone.stop();assert.ok(first.every(n=>n.stops.length===2));tone.stop();assert.ok(first.every(n=>n.stops.length===2))
 first.forEach(n=>n.onended());assert.ok(first.every(n=>n.disconnected))
 tone.play();const last=contexts[0].nodes.at(-1);tone.dispose()
 assert.equal(last.stops.length,2);assert.equal(contexts[0].closed,1);assert.equal(tone.play(),null)
})
test('suspended audio is rejected instead of claiming audible feedback',async()=>{
 const contexts=installAudioFixture({running:false}),tone=new TurnTone()
 await assert.rejects(tone.prepare(),/Audio unavailable/)
 assert.equal(tone.play(),null);assert.equal(contexts[0].nodes.length,0);tone.dispose()
})

test('tone activity ends on the final oscillator end, including overlapping inputs',async()=>{
 const contexts=installAudioFixture(),activity=[],tone=new TurnTone(active=>activity.push(active))
 await tone.prepare();tone.play();tone.play()
 assert.equal(activity.at(-1),true)
 contexts[0].nodes[0].onended();assert.equal(activity.at(-1),true)
 contexts[0].nodes[1].onended();assert.equal(activity.at(-1),false)
 tone.dispose()
})

test('stop resets tone activity immediately and late ended events cannot stop a newer tone',async()=>{
 const contexts=installAudioFixture(),activity=[],tone=new TurnTone(active=>activity.push(active))
 await tone.prepare();tone.play();const old=contexts[0].nodes[0]
 tone.stop();assert.equal(activity.at(-1),false)
 tone.play();assert.equal(activity.at(-1),true)
 old.onended();assert.equal(activity.at(-1),true)
 tone.dispose();assert.equal(activity.at(-1),false)
})
