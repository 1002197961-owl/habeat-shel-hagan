// All messages and identities below are SOFTWARE FIXTURES, never hardware evidence.
import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']})
const page=await browser.newPage({viewport:{width:390,height:844}})
await page.addInitScript(()=>{
 class Port extends EventTarget {
  id='MULTIPAD-SOFTWARE-FIXTURE';name='SOFTWARE FIXTURE';manufacturer='TEST';state='connected'
  open(){return Promise.resolve(this)} close(){return Promise.resolve(this)}
  send(note){const e=new Event('midimessage');Object.defineProperties(e,{data:{value:new Uint8Array([153,note,90])},timeStamp:{value:performance.now()}});this.dispatchEvent(e)}
 }
 const port=new Port(),access=new EventTarget();access.inputs=new Map([[port.id,port]])
 window.__fixture={port,access};Object.defineProperty(navigator,'requestMIDIAccess',{value:async()=>access})
})
const base=process.env.PREVIEW_TEST_URL||'http://127.0.0.1:3010'
await page.goto(base+'/turn-taking')
await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
await page.getByRole('button',{name:'בדקו כניסות קלט',exact:true}).click()
await page.getByText(/כניסות שנמצאו/).waitFor()
await page.evaluate(()=>window.__fixture.port.send(38))
await page.getByRole('button',{name:'מפו את התו האחרון למשחק'}).click()
await page.getByLabel('הפד שמכוונים').selectOption('blue')
await page.evaluate(()=>window.__fixture.port.send(43))
await page.getByRole('button',{name:'מפו את התו האחרון למשחק'}).click()
assert.equal(await page.locator('[data-target-pad="blue"]').count(),1)
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('habeat.instrument-profile.v1')).pads.length),2)
await page.getByRole('button',{name:'סיימנו לכוון, חוזרים למשחק',exact:true}).click()
await page.getByRole('button',{name:'התחילו',exact:true}).click()
await page.locator('[data-turn="waiting"]').waitFor()
await page.evaluate(()=>window.__fixture.port.send(38))
await page.locator('[data-character-response="playing"]').waitFor()
assert.equal(await page.locator('[data-turn="waiting"]').count(),1)
await page.evaluate(()=>window.__fixture.port.send(43))
await page.locator('[data-turn="responded"]').waitFor()
assert.equal(await page.locator('[data-character-response]').getAttribute('data-response-event-id'),await page.locator('[data-action-progress]').getAttribute('data-game-response-id'))
await page.reload()
await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
await page.getByRole('button',{name:'בדקו כניסות קלט',exact:true}).click()
await page.getByText(/הכלי המוכר זוהה/).waitFor()
assert.equal(await page.getByLabel('הפד למשחק').locator('option').count(),2)
assert.equal(await page.getByRole('button',{name:'התחילו',exact:true}).isEnabled(),true)
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true)
await browser.close()
console.log('PASS multi-pad software fixture: learned pads, visible target, wrong-pad feedback without completion, accepted input character event, persistence/reconnect, mobile width; NOT a hardware test')
