import test from 'node:test'
import assert from 'node:assert/strict'
import {loadTs} from './load-ts.mjs'
const {decodeMIDI,InputRecorder,routeInput,MidiTransport}=await loadTs('../lib/instrumentInput.ts')
const port={id:'test-port',name:'TEST SOFTWARE INPUT',manufacturer:'test',state:'connected'}
const mapping={portId:port.id,channel:2,note:60}
test('note-on, velocity-zero release, all channels and malformed messages',()=>{
 assert.deepEqual(decodeMIDI([145,60,99]),{kind:'note-on',channel:2,note:60,velocity:99})
 assert.equal(decodeMIDI([145,60,0]).kind,'note-off')
 assert.equal(decodeMIDI([129,60,20]).kind,'note-off')
 assert.equal(decodeMIDI([159,60,1]).channel,16)
 for(const bytes of [[],[60],[144,60],[144,128,99],[144,-1,5],[144,60,NaN]]) assert.equal(decodeMIDI(bytes).kind,'invalid')
 assert.equal(decodeMIDI([176,64,127]).kind,'other')
})
test('only identical deliveries suppressed; two fast distinct actions survive',()=>{
 const recorder=new InputRecorder(), receive=(stamp)=>recorder.receive('web-midi',port,[145,60,99],stamp,100,new Date(0).toISOString())
 assert.equal(receive(80).duplicate,false);assert.equal(receive(80).duplicate,true)
 assert.equal(receive(80.01).duplicate,false)
 recorder.resetFingerprints();assert.equal(receive(80).duplicate,false)
 assert.equal(receive(null).duplicate,false);assert.equal(receive(null).duplicate,false)
})
test('only selected source, port, channel and note can complete a waiting turn',()=>{
 const e=new InputRecorder().receive('web-midi',port,[145,60,99],100,101,'now')
 assert.equal(routeInput(e,'web-midi',mapping,'waiting',90).accepted,true)
 for(const [event,mode,map,turn,since] of [
  [e,'simulation',mapping,'waiting',90],[e,'web-midi',null,'waiting',90],
  [e,'web-midi',{...mapping,note:61},'waiting',90],[e,'web-midi',{...mapping,channel:1},'waiting',90],
  [e,'web-midi',{...mapping,portId:'other'},'waiting',90],[e,'web-midi',mapping,'demonstrating',90],
  [e,'web-midi',mapping,'responded',90],[e,'web-midi',mapping,'paused',90],
  [e,'web-midi',mapping,'waiting',110],[{...e,kind:'note-off'},'web-midi',mapping,'waiting',90],
  [{...e,duplicate:true},'web-midi',mapping,'waiting',90]
 ]) assert.equal(routeInput(event,mode,map,turn,since).accepted,false)
})
test('two-action task records the first action without claiming task completion',()=>{
 const r=new InputRecorder(),one=r.receive('web-midi',port,[145,60,100],100,101,'now')
 assert.deepEqual(routeInput(one,'web-midi',mapping,'waiting',90,2),{accepted:true,reason:'turn-response',next:'waiting'})
 const duplicate=r.receive('web-midi',port,[145,60,100],100,102,'now')
 assert.equal(routeInput(duplicate,'web-midi',mapping,'waiting',90,1).accepted,false)
 const two=r.receive('web-midi',port,[145,60,100],100.01,103,'now')
 assert.equal(routeInput(two,'web-midi',mapping,'waiting',90,1).next,'responded')
})
class Port extends EventTarget {
 id='test-port';name='TEST SOFTWARE INPUT';manufacturer='test';state='connected';opens=0;closes=0
 open(){this.opens++;return Promise.resolve()}close(){this.closes++;return Promise.resolve()}
 send(){const e=new Event('midimessage');e.data=new Uint8Array([145,60,100]);this.dispatchEvent(e)}
}
class Access extends EventTarget {inputs=new Map();change(){this.dispatchEvent(new Event('statechange'))}}
test('transport avoids listener duplication and cleans disconnect/reconnect/unmount',async()=>{
 const p=new Port(),access=new Access();access.inputs.set(p.id,p)
 const messages=[],states=[],errors=[]
 const transport=new MidiTransport((...e)=>messages.push(e),p=>states.push(p),e=>errors.push(e))
 await transport.connect(async()=>access);access.change();access.change();p.send()
 assert.equal(messages.length,1);assert.equal(p.opens,1)
 p.state='disconnected';access.change();p.send();assert.equal(messages.length,1)
 assert.deepEqual(states.at(-1),[])
 p.state='connected';access.change();p.send();assert.equal(messages.length,2)
 transport.disconnect();p.send();access.change();assert.equal(messages.length,2);assert.equal(p.closes,1)
 assert.deepEqual(errors,[])
})
test('permission resolving after departure cannot install handlers',async()=>{
 let resolve;const p=new Port(),access=new Access();access.inputs.set(p.id,p)
 const messages=[];const transport=new MidiTransport(e=>messages.push(e),()=>{},()=>{})
 const pending=transport.connect(()=>new Promise(r=>{resolve=r}))
 transport.disconnect();resolve(access);await pending;p.send();assert.equal(p.opens,0);assert.equal(messages.length,0)
})
test('permission denial reports failure and a retry succeeds',async()=>{
 const errors=[],access=new Access(),p=new Port();access.inputs.set(p.id,p)
 const transport=new MidiTransport(()=>{},()=>{},e=>errors.push(e))
 await transport.connect(async()=>{throw new Error('denied')});assert.equal(errors.length,1)
 await transport.connect(async()=>access);assert.equal(p.opens,1);transport.disconnect()
})
