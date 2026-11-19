// Software fixtures only: no physical drum, acoustic latency or child validation.
import {chromium} from 'playwright'
import assert from 'node:assert/strict'
export const base=process.env.PREVIEW_TEST_URL||'http://127.0.0.1:3010'
export const launch=()=>chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']})
export const button=(page,name)=>page.getByRole('button',{name,exact:true})
export async function fixture(page,pads=[]) {
 await page.addInitScript(pads=>{
  class Port extends EventTarget {
   id='TURN-SOFTWARE-FIXTURE';name='SOFTWARE FIXTURE';manufacturer='TEST';state='connected'
   open(){return Promise.resolve(this)}close(){return Promise.resolve(this)}
   send(note,stamp=performance.now(),velocity=90){const e=new Event('midimessage');Object.defineProperties(e,{data:{value:new Uint8Array([153,note,velocity])},timeStamp:{value:stamp}});this.dispatchEvent(e)}
  }
  const port=new Port(),access=new EventTarget();access.inputs=new Map([[port.id,port]])
  window.__fixture={port,access,requests:0,change(connected){port.state=connected?'connected':'disconnected';access.dispatchEvent(new Event('statechange'))}}
  Object.defineProperty(navigator,'requestMIDIAccess',{value:async options=>{window.__fixture.requests++;if(options.sysex!==false)throw Error('Unexpected sysex');return access},configurable:true})
  if(pads.length&&!localStorage.getItem('habeat.instrument-profile.v1'))localStorage.setItem('habeat.instrument-profile.v1',JSON.stringify({version:1,port:{id:port.id,name:port.name,manufacturer:port.manufacturer},pads}))
  window.__scheduled=[];window.__activeTones=new Set()
  const Native=window.AudioContext
  window.AudioContext=class extends Native {
   createOscillator(){const n=super.createOscillator(),start=n.start.bind(n);n.start=at=>{window.__scheduled.push(at);window.__activeTones.add(n);return start(at)};n.addEventListener('ended',()=>window.__activeTones.delete(n));return n}
  }
 },pads)
 await page.goto(base+'/turn-taking')
}
export async function connect(page) {
 await button(page,'הגדרות כלי למבוגר').click()
 await button(page,'חיבור התופים').click()
 await page.getByText('נמצא: SOFTWARE FIXTURE',{exact:true}).waitFor()
}
export async function noScroll(page) {
 const sizes=await page.evaluate(()=>{
  const d=document.querySelector('dialog[open]')
  return {page:document.documentElement.scrollHeight,viewport:innerHeight,width:document.documentElement.scrollWidth,viewportWidth:innerWidth,dialog:d?{height:d.clientHeight,scroll:d.scrollHeight}:null}
 })
 assert.ok(sizes.page<=sizes.viewport+1,JSON.stringify(sizes))
 assert.ok(sizes.width<=sizes.viewportWidth+1,JSON.stringify(sizes))
 if(sizes.dialog)assert.ok(sizes.dialog.scroll<=sizes.dialog.height+1,JSON.stringify(sizes))
}
export const send=(page,note)=>page.evaluate(note=>window.__fixture.port.send(note),note)
export async function calibrate(page,id,label,note) {
 await button(page,`כיוון ${label}`).click();await send(page,note)
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('habeat.instrument-profile.v1'))?.pads.some(p=>p.id===id),id)
}
export async function options(page) {
 await button(page,'הגדרות כלי למבוגר').click()
}
export async function close(page) {await button(page,'סיימנו לכוון, חוזרים למשחק').click()}
