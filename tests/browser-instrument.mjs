// Software fixtures only. This suite MUST NOT be reported as a hardware connection.
import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
const base=process.env.PREVIEW_TEST_URL||'http://127.0.0.1:3010'
mkdirSync('test-results',{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']})
const results=[]
for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
 const ctx=await browser.newContext({viewport,hasTouch:viewport.width<500,isMobile:viewport.width<500,acceptDownloads:true})
 const page=await ctx.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{
  window.__activeTurnTones=new Set()
  const NativeContext=window.AudioContext
  window.AudioContext=class extends NativeContext {
   createOscillator(){
    const node=super.createOscillator(),start=node.start.bind(node)
    node.start=(...args)=>{window.__activeTurnTones.add(node);return start(...args)}
    node.addEventListener('ended',()=>window.__activeTurnTones.delete(node))
    return node
   }
  }
  class Port extends EventTarget {
   id='test-software-port';name='TEST SOFTWARE PORT';manufacturer='AUTOMATED FIXTURE';state='connected'
   open(){return Promise.resolve(this)}close(){return Promise.resolve(this)}
   send(bytes,stamp=performance.now()) {const e=new Event('midimessage');Object.defineProperties(e,{data:{value:new Uint8Array(bytes)},timeStamp:{value:stamp}});this.dispatchEvent(e)}
  }
  const port=new Port(),access=new EventTarget();access.inputs=new Map([[port.id,port]])
  window.__fixture={port,access,requests:0,change(connected){port.state=connected?'connected':'disconnected';access.dispatchEvent(new Event('statechange'))}}
  Object.defineProperty(navigator,'requestMIDIAccess',{value:async options=>{window.__fixture.requests++;if(options.sysex!==false)throw Error('sysex not allowed');return access},configurable:true})
 })
 await page.goto(base+'/turn-taking')
 await page.waitForFunction(()=>{const images=[...document.querySelectorAll('[data-static-character] img')];return images.length===3&&images.every(image=>image.complete&&image.naturalWidth>0)})
 assert.deepEqual(await page.locator('[data-static-character]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-static-character')).sort()),['G','M','R'])
 await page.waitForFunction(()=>{const images=[...document.querySelectorAll('[data-pilot-icon]')];return images.length>=4&&images.every(image=>image.complete&&image.naturalWidth>0)})
 assert.equal(await page.getByRole('button',{name:'בדקו כניסות קלט',exact:true}).count(),0)
 await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
 await page.getByText('Web MIDI זמין לבקשת הרשאה',{exact:true}).waitFor()
 assert.equal(await page.evaluate(()=>window.__fixture.requests),0)
 await page.getByRole('button',{name:'בדקו כניסות קלט',exact:true}).click()
 await page.getByText(/כניסות שנמצאו: TEST SOFTWARE PORT/).waitFor()
 await page.evaluate(()=>window.__fixture.port.send([153,38,100]))
 await page.getByRole('button',{name:'מפו את התו האחרון למשחק'}).click()
 await page.getByText('מיפוי: ערוץ 10, תו 38',{exact:true}).waitFor()
 await page.getByText('אבחון ושמירת דוח למבוגר',{exact:true}).click()
 await page.getByRole('button',{name:'התחילו מדידה חדשה',exact:true}).click()
 await page.getByRole('button',{name:'סיימנו לכוון, חוזרים למשחק',exact:true}).click()
 assert.equal(await page.locator('#instrument-setup').count(),0)
 await page.getByRole('button',{name:'התחילו',exact:true}).click()
 await page.locator('[data-turn="waiting"]').waitFor()
 await page.screenshot({path:`test-results/senosen-child-game-${viewport.width}.png`,fullPage:true})
 await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
 await page.getByText('אבחון ושמירת דוח למבוגר',{exact:true}).click()
 await page.evaluate(()=>{const p=window.__fixture.port,t=performance.now();p.send([153,39,100],t);p.send([153,38,0],t+0.1)})
 assert.equal(await page.locator('[data-turn="waiting"]').count(),1)
 await page.evaluate(()=>{const p=window.__fixture.port,t=performance.now();p.send([153,38,100],t);p.send([153,38,100],t);p.send([153,38,100],t+0.01)})
 await page.locator('[data-turn="responded"]').waitFor()
 await page.getByText(/תגובות במשחק: 1 · מסירות זהות שסוננו: 1/).waitFor()
 await page.getByRole('button',{name:'שמעו שוב והתחילו',exact:true}).click()
 await page.locator('[data-turn="waiting"]').waitFor()
 await page.evaluate(()=>window.__fixture.change(false))
 await page.locator('[data-turn="paused"]').waitFor()
 await page.evaluate(()=>{window.__fixture.port.send([153,38,100]);window.__fixture.change(true)})
 assert.equal(await page.locator('[data-turn="paused"]').count(),1)
 await page.getByRole('button',{name:'שמעו שוב והתחילו',exact:true}).click()
 await page.locator('[data-turn="waiting"]').waitFor()
 await page.evaluate(()=>window.__fixture.port.send([153,38,100]))
 await page.getByText(/תגובות במשחק: 2 · מסירות זהות שסוננו: 1/).waitFor()
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 assert.equal(await page.locator('html').getAttribute('dir'),'rtl')
 await page.screenshot({path:`test-results/instrument-software-fixture-${viewport.width}.png`,fullPage:true})
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'הורידו דוח JSON'}).click()
 const download=await downloadPromise;const report=JSON.parse(readFileSync(await download.path(),'utf8'))
 assert.equal(report.physicalProof,'NOT_AUTOMATICALLY_VERIFIED');assert.equal(report.totals.gameResponses,2)
 assert.equal(report.events.filter(e=>e.accepted).at(-1).id,Number(await page.locator('[data-action-progress]').getAttribute('data-game-response-id')))
 assert.equal(report.events.filter(e=>e.accepted).length,2);assert.ok(report.events.filter(e=>e.accepted).every(e=>e.uiCommitMs>=0&&e.audioScheduledMs>=0))
 // Preserve the fixture's origin alongside the exported diagnostic data.
 writeFileSync(`test-results/instrument-fixture-report-${viewport.width}.json`,JSON.stringify({testType:'AUTOMATED SOFTWARE FIXTURE — NO PHYSICAL DEVICE',report},null,2))
 await page.getByLabel('מקור קלט').selectOption('simulation')
 await page.getByText('מצב הדמיה לפיתוח — אינו הוכחת חיבור לכלי.',{exact:true}).waitFor()
 await page.getByRole('button',{name:'התחילו',exact:true}).click();await page.locator('[data-turn="waiting"]').waitFor()
 await page.evaluate(()=>window.__fixture.port.send([153,38,100]));assert.equal(await page.locator('[data-turn="waiting"]').count(),1)
 await page.getByRole('button',{name:'פעולת הדמיה',exact:true}).click();await page.locator('[data-turn="responded"]').waitFor()
 await page.getByLabel('רמת הסבב').selectOption('2')
 await page.getByRole('button',{name:'התחילו',exact:true}).click();await page.locator('[data-turn="waiting"]').waitFor()
 await page.getByRole('button',{name:'פעולת הדמיה',exact:true}).click()
 assert.equal(await page.locator('[data-turn="waiting"]').count(),1)
 assert.equal(await page.locator('[data-action-progress]').innerText(),'1 מתוך 2 פעולות בסבב')
 await page.getByRole('button',{name:'פעולת הדמיה',exact:true}).click();await page.locator('[data-turn="responded"]').waitFor()
 assert.equal(await page.locator('[data-action-progress]').innerText(),'2 מתוך 2 פעולות בסבב')
 await page.getByRole('button',{name:'שמעו שוב והתחילו',exact:true}).click()
 await page.getByRole('button',{name:'עצירה',exact:true}).click()
 await page.waitForTimeout(1400);assert.equal(await page.locator('[data-turn="paused"]').count(),1)
 assert.equal(await page.evaluate(()=>window.__activeTurnTones.size),0)
 await page.getByRole('link',{name:'חזרה למצב גננת',exact:true}).click();await page.waitForURL('**/teacher')
 assert.deepEqual(errors,[])
 results.push({viewport,status:'PASS',type:'SOFTWARE FIXTURE ONLY',physicalHardwareTest:false,checks:['approved R/G/M FRONT files load','approved control icons load','adult setup separate from child view','explicit permission gesture','raw data log','learned channel-10/note-38 software-fixture mapping','velocity-zero ignored','wrong note ignored','duplicate delivery','fast distinct event retained','one-action turn','two-action turn progresses only on second event','stop cancels second demo tone and turn timer','no active tones after stopping','game response ID matches exported event','disconnect pauses','reconnect needs restart','JSON timing labels','simulation separation','RTL/mobile','navigation']})
 await ctx.close()
}
// Unsupported browser and permission rejection remain honest; never auto-fallback to simulation.
for(const scenario of ['unsupported','denied']) {
 const page=await browser.newPage()
 await page.addInitScript(s=>Object.defineProperty(navigator,'requestMIDIAccess',{value:s==='unsupported'?undefined:async()=>{throw new Error('denied')},configurable:true}),scenario)
 await page.goto(base+'/turn-taking');await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click();await page.getByRole('button',{name:'בדקו כניסות קלט',exact:true}).click()
 await page.locator('main [role="alert"]').waitFor();assert.equal(await page.getByLabel('מקור קלט').inputValue(),'web-midi')
 await page.close()
}
await browser.close();writeFileSync('test-results/instrument-browser.json',JSON.stringify(results,null,2));console.log('instrument SOFTWARE FIXTURE desktop/mobile PASS; no hardware tested')
